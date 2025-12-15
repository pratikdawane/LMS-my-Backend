const jwt = require('jsonwebtoken');
const OTPGenerator = require('otp-generator');
const { TOKEN_EXPIRATION, OTP_SETTINGS, TEMP_PASSWORD_SETTINGS } = require('../constants/authConstants');

/**
 * Generate JWT access token
 * @param {string} id - User ID
 * @param {string} role - User role
 * @returns {string} JWT access token
 */
const generateAccessToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION.ACCESS_TOKEN,
  });
};

/**
 * Generate JWT refresh token
 * @param {string} id - User ID
 * @param {string} role - User role
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET + '_refresh', {
    expiresIn: TOKEN_EXPIRATION.REFRESH_TOKEN,
  });
};

/**
 * Generate OTP for password reset
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return OTPGenerator.generate(OTP_SETTINGS.LENGTH, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

/**
 * Generate temporary password for instructors
 * @returns {string} Random secure password
 */
const generateTemporaryPassword = () => {
  const { LENGTH, CHARSET } = TEMP_PASSWORD_SETTINGS;
  let password = '';
  for (let i = 0; i < LENGTH; i++) {
    password += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return password;
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET + '_refresh');
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateOTP,
  generateTemporaryPassword,
  verifyAccessToken,
  verifyRefreshToken,
};
