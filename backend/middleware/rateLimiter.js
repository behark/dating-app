/**
 * Rate Limiting Middleware
 * Uses Redis for distributed rate limiting
 */

const { rateLimiter, cache, CACHE_KEYS } = require('../config/redis');

/**
 * Create rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60000,        // 1 minute window
    maxRequests = 100,       // 100 requests per window
    keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
    message = 'Too many requests, please try again later.',
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    onLimitReached = null,
  } = options;

  const windowSeconds = Math.floor(windowMs / 1000);

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const result = await rateLimiter.checkLimit(key, maxRequests, windowSeconds);

      // Set rate limit headers
      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + windowSeconds);

      if (!result.allowed) {
        res.set('Retry-After', windowSeconds);
        
        if (onLimitReached) {
          onLimitReached(req, res);
        }

        return res.status(429).json({
          success: false,
          message,
          retryAfter: windowSeconds,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request (fail open)
      next();
    }
  };
};

/**
 * API rate limiter - general endpoints
 */
const apiLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  message: 'Too many API requests. Please slow down.',
});

/**
 * Auth rate limiter - stricter for auth endpoints
 */
const authLimiter = createRateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 10,
  keyGenerator: (req) => `auth:${req.ip}`,
  message: 'Too many authentication attempts. Please try again later.',
  onLimitReached: (req, res) => {
    console.warn(`Auth rate limit reached for IP: ${req.ip}`);
  },
});

/**
 * Swipe rate limiter - based on user subscription
 */
const swipeLimiter = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get user subscription tier
    const User = require('../models/User');
    const user = await User.findById(userId).select('subscription').lean();
    
    const tier = user?.subscription?.tier || 'free';
    const limits = {
      free: parseInt(process.env.FREE_DAILY_SWIPE_LIMIT) || 100,
      gold: parseInt(process.env.PREMIUM_DAILY_SWIPE_LIMIT) || 500,
      platinum: parseInt(process.env.PREMIUM_DAILY_SWIPE_LIMIT) || 500,
      unlimited: Infinity,
    };
    
    const dailyLimit = limits[tier] || limits.free;
    
    if (dailyLimit === Infinity) {
      return next();
    }

    const key = `swipe:${userId}`;
    const today = new Date().toISOString().split('T')[0];
    const fullKey = `${key}:${today}`;
    
    const count = await cache.incr(fullKey, 86400); // 24 hours

    res.set('X-Swipe-Limit', dailyLimit);
    res.set('X-Swipe-Remaining', Math.max(0, dailyLimit - count));
    res.set('X-Swipe-Reset', new Date(Date.now() + 86400000).toISOString());

    if (count > dailyLimit) {
      return res.status(429).json({
        success: false,
        message: 'Daily swipe limit reached. Upgrade to premium for more swipes!',
        limit: dailyLimit,
        remaining: 0,
        upgradeUrl: '/premium',
      });
    }

    next();
  } catch (error) {
    console.error('Swipe limiter error:', error);
    next();
  }
};

/**
 * Message rate limiter
 */
const messageLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 30,
  keyGenerator: (req) => `msg:${req.userId || req.ip}`,
  message: 'Sending messages too quickly. Please slow down.',
});

/**
 * Upload rate limiter
 */
const uploadLimiter = createRateLimiter({
  windowMs: 3600000, // 1 hour
  maxRequests: 20,
  keyGenerator: (req) => `upload:${req.userId || req.ip}`,
  message: 'Upload limit reached. Please try again later.',
});

/**
 * Search rate limiter
 */
const searchLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 30,
  keyGenerator: (req) => `search:${req.userId || req.ip}`,
  message: 'Too many search requests. Please slow down.',
});

/**
 * Report rate limiter
 */
const reportLimiter = createRateLimiter({
  windowMs: 3600000, // 1 hour
  maxRequests: 10,
  keyGenerator: (req) => `report:${req.userId || req.ip}`,
  message: 'Too many reports submitted. Please contact support if this is urgent.',
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  swipeLimiter,
  messageLimiter,
  uploadLimiter,
  searchLimiter,
  reportLimiter,
};
