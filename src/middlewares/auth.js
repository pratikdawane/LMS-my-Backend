const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Token = require('../models/Token');

exports.protect = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is revoked in database
    const tokenDoc = await Token.findOne({ accessToken: token, user: decoded.id, isRevoked: false });
    
    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Token has been revoked or is invalid',
      });
    }

    // Verify user exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'User no longer exists',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Your account has been deactivated',
      });
    }

    // Attach user info to request
    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Token has expired',
      });
    }
    
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Not authorized to access this route',
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Not authorized to access this route',
      });
    }
    next();
  };
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Admin access required',
    });
  }
  next();
};

exports.isInstructor = (req, res, next) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Instructor access required',
    });
  }
  next();
};

exports.isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Student access required',
    });
  }
  next();
};
