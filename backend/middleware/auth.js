const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ERROR_MESSAGES } = require('../constants/messages');

// Middleware to verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    // Ensure JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Authentication system is not properly configured',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure decoded is an object with userId property
    if (typeof decoded === 'string' || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN_FORMAT,
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if ((error instanceof Error ? error.name : 'Error') === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Middleware to verify optional JWT token
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Continue even if token is invalid
  }
  next();
};

// Middleware to verify admin role (must be used after authenticate)
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.AUTH_REQUIRED,
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

// Alias for backwards compatibility
exports.authenticateToken = exports.authenticate;

/**
 * Middleware to ensure user can only access their own data (IDOR protection)
 * Must be used AFTER authenticate middleware
 * Checks if req.params.userId matches the authenticated user's ID
 * @param {Object} options - Configuration options
 * @param {boolean} options.allowAdmin - Allow admins to bypass the check (default: true)
 * @param {string} options.paramName - The name of the URL param containing user ID (default: 'userId')
 */
exports.authorizeOwner = (options = {}) => {
  const { allowAdmin = true, paramName = 'userId' } = options;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH_REQUIRED,
      });
    }

    const targetUserId = req.params[paramName];

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: `Missing ${paramName} parameter`,
      });
    }

    const requestingUserId = req.user._id?.toString() || req.user.id?.toString();
    const isOwner = requestingUserId === targetUserId;
    const isAdmin = allowAdmin && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      // Log potential IDOR attempt for security monitoring
      console.warn(
        `[SECURITY] IDOR attempt blocked: User ${requestingUserId} tried to access data for user ${targetUserId}`
      );
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.ACCESS_DENIED_OWN_DATA,
      });
    }

    next();
  };
};

/**
 * Middleware to check if two users are matched (for accessing each other's data)
 * Must be used AFTER authenticate middleware
 */
exports.authorizeMatchedUsers = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH_REQUIRED,
      });
    }

    const targetUserId = req.params.userId || req.params.targetUserId;
    const requestingUserId = req.user._id?.toString() || req.user.id?.toString();

    // Allow access to own data
    if (requestingUserId === targetUserId) {
      return next();
    }

    // Check if users are matched
    const Match = require('../models/Match');
    const isMatched = await Match.findOne({
      users: { $all: [requestingUserId, targetUserId] },
      status: 'active',
    });

    if (!isMatched && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.ACCESS_DENIED_MATCHES_ONLY,
      });
    }

    next();
  } catch (error) {
    console.error('[SECURITY] Error checking match authorization:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying access permissions',
    });
  }
};
