const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, isAdmin, isInstructor } = require('../middlewares/auth');
const { studentSignupValidation, loginValidation, passwordValidation, resetPasswordValidation } = require('../middlewares/validation');

/**
 * @swagger
 * /auth/signup/student:
 *   post:
 *     tags: [Auth]
 *     summary: Student signup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               mobileNo: { type: string }
 *               gender: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       201:
 *         description: Signed up
 */
router.post('/signup/student', studentSignupValidation, authController.studentSignup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login (student, instructor, admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Logged in
 */
router.post('/login', loginValidation, authController.login);

// Admin login (backward compatibility - redirects to main login)
router.post('/admin/login', loginValidation, authController.adminLogin);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/forgot-password', 
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  authController.forgotPassword
);

router.post('/verify-otp-login', authController.verifyOTPAndLogin);

router.post('/set-password', protect, isInstructor, passwordValidation, authController.setInstructorPassword);

// Reset password endpoint for authenticated users (admin, instructor, student)
router.post('/reset-password', protect, resetPasswordValidation, authController.resetPassword);

// Reset password after forgot password flow (no current password required)
router.post('/reset-password-forgot', protect, passwordValidation, authController.resetPasswordForgot);

router.post('/refresh-token', authController.refreshToken);

router.post('/logout', protect, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 */
router.get('/me', protect, authController.getCurrentUser);

router.put('/complete-profile', protect, authController.completeProfile);

router.post('/admin/create-instructor', protect, isAdmin, authController.createInstructor);

module.exports = router;
