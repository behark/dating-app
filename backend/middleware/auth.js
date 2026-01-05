const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ERROR_MESSAGES } = require('../constants/messages');
const { getRedis } = require('../config/redis');

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
      const logger = require('../services/LoggingService').logger;
      logger.error('JWT_SECRET is not configured', {
        ip: req.ip,
        path: req.path,
      });
      return res.status(500).json({
        success: false,
        message: 'Authentication system is not properly configured',
      });
    }

    // Check if token is blacklisted (for logout functionality)
    try {
      const redisClient = await getRedis();
      if (redisClient) {
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            message: 'Token has been revoked. Please login again.',
          });
        }
      }
    } catch (redisError) {
      // If Redis is unavailable, continue without blacklist check
      // This allows the app to work even if Redis is down
      console.warn('Redis unavailable for blacklist check, continuing without it');
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
    // Don't expose error details in production
    const logger = require('../services/LoggingService').logger;
    logger.warn('Invalid token', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
      path: req.path,
    });
    
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
      // Only expose error details in development
      ...(process.env.NODE_ENV !== 'production' && {
        error: error instanceof Error ? error.message : String(error),
      }),
    });
  }
};

// Middleware to verify optional JWT token
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = typeof decoded === 'string' ? decoded : (decoded && typeof decoded === 'object' ? decoded.userId : null);
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          req.user = user;
        }
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
exports.authorizeOwner = (options = { allowAdmin: false, paramName: 'userId' }) => {
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
      const logger = require('../services/LoggingService').logger;
      logger.warn('IDOR attempt blocked', {
        requestingUserId,
        targetUserId,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
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
    // Log error without sensitive data
    const safeError = error instanceof Error ? error.message : String(error);
    console.error('[SECURITY] Error checking match authorization:', safeError);
    return res.status(500).json({
      success: false,
      message: 'Error verifying access permissions',
    });
  }
};
