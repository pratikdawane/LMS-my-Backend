/**
 * Authentication Constants
 * Centralized constants for authentication module
 */

// Token expiration times
const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN: '30d',
  OTP_EXPIRATION_MINUTES: 10,
  TOKEN_DOC_EXPIRATION_DAYS: 7
};

// Cookie options
// For cross-origin requests (different domains), sameSite must be 'none' when secure is true
const COOKIE_OPTIONS = {
  HTTP_ONLY: true,
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-origin in production
  ACCESS_TOKEN_MAX_AGE: Number(process.env.ACCESS_TOKEN_MAX_AGE_MS || 15 * 60 * 1000),
  REFRESH_TOKEN_MAX_AGE: 30 * 24 * 60 * 60 * 1000
};

// User roles
const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
};

// User statuses
const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Password requirements
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 6,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: false
};

// OTP settings
const OTP_SETTINGS = {
  LENGTH: 6,
  MAX_ATTEMPTS: 5,
  EXPIRATION_MINUTES: 10
};

// Temporary password settings
const TEMP_PASSWORD_SETTINGS = {
  LENGTH: 12,
  CHARSET: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
};

// Error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Not authorized to access this route',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_REVOKED: 'Token has been revoked or is invalid',
  USER_NOT_FOUND: 'User not found',
  USER_DEACTIVATED: 'Your account has been deactivated',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  PASSWORDS_NOT_MATCH: 'Passwords do not match',
  INVALID_OTP: 'Invalid OTP',
  OTP_EXPIRED: 'OTP expired',
  OTP_USED: 'OTP already used',
  MAX_ATTEMPTS_EXCEEDED: 'Maximum attempts exceeded',
  INVALID_PASSWORD: 'Current password is incorrect',
  SAME_PASSWORD: 'New password must be different from current password'
};

// Success messages
const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: 'Account created successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  PASSWORD_RESET: 'Password reset successfully',
  PASSWORD_SET: 'Password set successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  OTP_SENT: 'If your email is registered with us, you will receive an OTP shortly'
};

module.exports = {
  TOKEN_EXPIRATION,
  COOKIE_OPTIONS,
  USER_ROLES,
  USER_STATUS,
  PASSWORD_REQUIREMENTS,
  OTP_SETTINGS,
  TEMP_PASSWORD_SETTINGS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};

