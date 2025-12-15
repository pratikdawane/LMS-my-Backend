const { body } = require('express-validator');

exports.studentSignupValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobileNo')
    .matches(/^\d{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Please select a valid gender'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one digit'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required'),
];

exports.loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body()
    .custom((value, { req }) => {
      if (!req.body.password && !req.body.otp) {
        throw new Error('Password or OTP is required')
      }
      return true
    }),
];

exports.passwordValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one digit'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required'),
];

exports.resetPasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one digit'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required'),
];
