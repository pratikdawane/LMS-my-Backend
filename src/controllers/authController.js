const { validationResult } = require('express-validator');
const User = require('../models/User');
const Token = require('../models/Token');
const OTP = require('../models/OTP');
const {
  generateAccessToken,
  generateRefreshToken,
  generateOTP,
  generateTemporaryPassword,
  verifyRefreshToken,
} = require('../utils/generators');
const { sendWelcomeEmail, sendInstructorPasswordEmail, sendOTPEmail } = require('../services/emailService');
const {
  COOKIE_OPTIONS,
  TOKEN_EXPIRATION,
  USER_ROLES,
  USER_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} = require('../constants/authConstants');

// Cookie configuration
const accessCookieOptions = {
  httpOnly: COOKIE_OPTIONS.HTTP_ONLY,
  secure: COOKIE_OPTIONS.SECURE,
  sameSite: COOKIE_OPTIONS.SAME_SITE,
  maxAge: COOKIE_OPTIONS.ACCESS_TOKEN_MAX_AGE,
};

const refreshCookieOptions = {
  httpOnly: COOKIE_OPTIONS.HTTP_ONLY,
  secure: COOKIE_OPTIONS.SECURE,
  sameSite: COOKIE_OPTIONS.SAME_SITE,
  maxAge: COOKIE_OPTIONS.REFRESH_TOKEN_MAX_AGE,
};

/**
 * Helper function to create and save tokens
 * @param {Object} user - User object
 * @returns {Object} Tokens object with accessToken and refreshToken
 */
const createTokens = async (user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  await Token.create({
    user: user._id,
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRATION.TOKEN_DOC_EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};

/**
 * Helper function to set cookies and return response
 * @param {Object} res - Express response object
 * @param {Object} tokens - Tokens object
 * @param {Object} user - User object
 * @param {Object} additionalData - Additional data to include in response
 * @param {number} statusCode - HTTP status code
 */
const sendAuthResponse = (res, tokens, user, additionalData = {}, statusCode = 200) => {
  res.cookie('accessToken', tokens.accessToken, accessCookieOptions);
  res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions);

  res.status(statusCode).json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user.toJSON(),
      ...additionalData,
    },
    error: null,
  });
};

/**
 * Student signup
 * @route POST /api/auth/signup/student
 * @access Public
 */
exports.studentSignup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: errors.array()[0].msg 
      });
    }

    const { firstName, lastName, email, mobileNo, gender, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.PASSWORDS_NOT_MATCH 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.EMAIL_EXISTS 
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      mobileNo,
      gender,
      password,
      role: USER_ROLES.STUDENT,
      status: USER_STATUS.APPROVED,
      isFirstLogin: false,
      requiresPasswordChange: false,
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, firstName, lastName).catch(err => {
      console.error('Error sending welcome email:', err);
    });

    const tokens = await createTokens(user);
    sendAuthResponse(res, tokens, user, {}, 201);
  } catch (error) {
    console.error('Student signup error:', error);
    res.status(500).json({ 
      success: false, 
      data: null, 
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, data: null, error: errors.array()[0].msg });
    }

    const { email, password, otp } = req.body;

    // Check user in User table (supports all roles: student, instructor, admin)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.INVALID_CREDENTIALS 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.USER_DEACTIVATED 
      });
    }

    // For instructors, check approval status
    if (user.role === USER_ROLES.INSTRUCTOR && user.status !== USER_STATUS.APPROVED) {
      return res.status(401).json({
        success: false,
        data: null,
        error: `Your account is ${user.status}. Please wait for admin approval.`,
      });
    }

    if (otp) {
      const otpDoc = await OTP.findOne({ email, otp });
      if (!otpDoc) {
        return res.status(401).json({ success: false, data: null, error: 'Invalid OTP' });
      }
      if (otpDoc.isUsed) {
        return res.status(401).json({ success: false, data: null, error: 'OTP already used' });
      }
      if (new Date() > otpDoc.expiresAt) {
        return res.status(401).json({ success: false, data: null, error: 'OTP expired' });
      }
      if (otpDoc.attempts >= otpDoc.maxAttempts) {
        return res.status(429).json({ success: false, data: null, error: 'Maximum attempts exceeded' });
      }
      otpDoc.isUsed = true;
      await otpDoc.save();
    } else {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          data: null, 
          error: ERROR_MESSAGES.INVALID_CREDENTIALS 
        });
      }
    }

    // Handle first login for instructors requiring password change
    if (!otp && user.isFirstLogin && user.requiresPasswordChange && user.role === USER_ROLES.INSTRUCTOR) {
      const tokens = await createTokens(user);
      return sendAuthResponse(res, tokens, user, {
        requiresPasswordChange: true,
        isFirstLogin: true,
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens for normal login
    const tokens = await createTokens(user);
    sendAuthResponse(res, tokens, user, {
      requiresPasswordChange: false,
      isFirstLogin: false,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.setInstructorPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, data: null, error: errors.array()[0].msg });
    }

    const { newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, data: null, error: 'Passwords do not match' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    if (user.role !== USER_ROLES.INSTRUCTOR) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        error: 'Only instructors can use this endpoint' 
      });
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    user.requiresPasswordChange = false;
    await user.save();

    res.status(200).json({
      success: true,
      data: { message: SUCCESS_MESSAGES.PASSWORD_SET },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        data: null,
        error: errors.array()[0].msg
      });
    }

    const { email } = req.body;
    console.log('Forgot password request for email:', email);

    // Find user
    const user = await User.findOne({ email });
    console.log('User found:', !!user);

    // Generate and save OTP
    const otp = generateOTP();
    console.log('Generated OTP for email:', email);
    
    // Delete existing OTPs for this email
    await OTP.deleteMany({ email });

    // Create new OTP
    await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    console.log('OTP saved to database');

    // Send OTP email (only if user exists, but don't reveal if user doesn't exist for security)
    if (user) {
      try {
        console.log('Attempting to send OTP email to:', email);
        await sendOTPEmail(email, otp);
        console.log('OTP email sent successfully');
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError);
        console.error('Email error details:', {
          message: emailError.message,
          code: emailError.code,
          response: emailError.response
        });
        // Still return success to user (security best practice - don't reveal if email exists)
        // But log the error for debugging
      }
    } else {
      console.log('User not found, skipping email send (security)');
    }

    // Always return success message (security best practice - don't reveal if email exists)
    console.log('Returning success response');
    res.status(200).json({
      success: true,
      data: { message: SUCCESS_MESSAGES.OTP_SENT },
      error: null,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to process password reset request'
    });
  }
};

exports.verifyOTPAndLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpDoc = await OTP.findOne({ email, otp });

    if (!otpDoc) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.INVALID_OTP 
      });
    }

    if (otpDoc.isUsed) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.OTP_USED 
      });
    }

    if (new Date() > otpDoc.expiresAt) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.OTP_EXPIRED 
      });
    }

    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      return res.status(429).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.MAX_ATTEMPTS_EXCEEDED 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.USER_DEACTIVATED 
      });
    }

    otpDoc.isUsed = true;
    await otpDoc.save();

    user.lastLogin = new Date();
    await user.save();

    const tokens = await createTokens(user);
    // Add flag to indicate this is from forgot password flow
    sendAuthResponse(res, tokens, user, {
      requiresPasswordReset: true, // Flag to indicate user needs to reset password
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshTokenBody = req.body ? req.body.refreshToken : undefined;
    const refreshToken = req.cookies?.refreshToken || refreshTokenBody;

    if (!refreshToken) {
      return res.status(401).json({ success: false, data: null, error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ success: false, data: null, error: 'Invalid refresh token' });
    }

    const tokenDoc = await Token.findOne({ refreshToken, isRevoked: false });
    if (!tokenDoc) {
      return res.status(401).json({ success: false, data: null, error: 'Refresh token not found or revoked' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.role);

    tokenDoc.accessToken = newAccessToken;
    tokenDoc.refreshToken = newRefreshToken;
    await tokenDoc.save();

    res.cookie('accessToken', newAccessToken, accessCookieOptions);
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.completeProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, data: null, error: errors.array()[0].msg });
    }

    const userId = req.user.id;
    const { address, education, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        address: address || {},
        education: education || {},
        bio: bio || '',
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user,
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.createInstructor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, data: null, error: errors.array()[0].msg });
    }

    const { firstName, lastName, email } = req.body;

    let instructor = await User.findOne({ email });
    if (instructor) {
      return res.status(400).json({ success: false, data: null, error: 'Email already registered' });
    }

    const tempPassword = generateTemporaryPassword();

    instructor = await User.create({
      firstName,
      lastName,
      email,
      password: tempPassword,
      role: USER_ROLES.INSTRUCTOR,
      status: USER_STATUS.APPROVED,
      isFirstLogin: true,
      requiresPasswordChange: true,
    });

    await sendInstructorPasswordEmail(email, firstName, tempPassword);

    res.status(201).json({
      success: true,
      data: {
        message: 'Instructor created successfully. Password email sent to instructor.',
        user: instructor.toJSON(),
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

// Admin login is now handled by the main login endpoint using User model with role='admin'
// This endpoint is kept for backward compatibility but redirects to main login
exports.adminLogin = async (req, res) => {
  try {
    // Redirect admin login to main login endpoint
    // The main login endpoint now supports admin role
    return exports.login(req, res);
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, data: null, error: errors.array()[0].msg });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.PASSWORDS_NOT_MATCH 
      });
    }

    // Validate new password is different from current
    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.SAME_PASSWORD 
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.USER_NOT_FOUND 
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.INVALID_PASSWORD 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.USER_DEACTIVATED 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      data: { message: SUCCESS_MESSAGES.PASSWORD_RESET },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

/**
 * Reset password after forgot password flow (no current password required)
 * @route POST /api/auth/reset-password-forgot
 * @access Protected
 */
exports.resetPasswordForgot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, data: null, error: errors.array()[0].msg });
    }

    const { newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.PASSWORDS_NOT_MATCH 
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.USER_NOT_FOUND 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        error: ERROR_MESSAGES.USER_DEACTIVATED 
      });
    }

    // Update password (no current password verification needed - user verified via OTP)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      data: { message: SUCCESS_MESSAGES.PASSWORD_RESET },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshTokenBody = req.body ? req.body.refreshToken : undefined;
    const refreshToken = req.cookies?.refreshToken || refreshTokenBody;

    if (refreshToken) {
      await Token.updateOne(
        { refreshToken },
        { isRevoked: true }
      );
    }

    // Clear cookies with same options used to set them
    res.clearCookie('accessToken', {
      httpOnly: COOKIE_OPTIONS.HTTP_ONLY,
      secure: COOKIE_OPTIONS.SECURE,
      sameSite: COOKIE_OPTIONS.SAME_SITE,
    });
    res.clearCookie('refreshToken', {
      httpOnly: COOKIE_OPTIONS.HTTP_ONLY,
      secure: COOKIE_OPTIONS.SECURE,
      sameSite: COOKIE_OPTIONS.SAME_SITE,
    });
    
    res.status(200).json({
      success: true,
      data: { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};
