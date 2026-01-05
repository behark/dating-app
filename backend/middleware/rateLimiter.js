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
    windowMs = 60000, // 1 minute window
    maxRequests = 100, // 100 requests per window
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

/**
 * Profile view rate limiter - prevent profile scraping
 */
const profileViewLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 60,
  keyGenerator: (req) => `profile-view:${req.userId || req.ip}`,
  message: 'Too many profile views. Please slow down.',
});

/**
 * Discovery/matching rate limiter
 */
const discoveryLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30,
  keyGenerator: (req) => `discovery:${req.userId || req.ip}`,
  message: 'Too many discovery requests. Please slow down.',
});

/**
 * Payment/Premium rate limiter - extra strict for financial endpoints
 */
const paymentLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  keyGenerator: (req) => `payment:${req.userId || req.ip}`,
  message: 'Too many payment requests. Please try again shortly.',
});

/**
 * Notification rate limiter
 */
const notificationLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 50,
  keyGenerator: (req) => `notification:${req.userId || req.ip}`,
  message: 'Too many notification requests.',
});

/**
 * AI/OpenAI endpoint rate limiter - expensive operations
 */
const aiLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  keyGenerator: (req) => `ai:${req.userId || req.ip}`,
  message: 'AI feature rate limit reached. Please try again later.',
});

/**
 * Password reset rate limiter - prevent email enumeration
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 3600000, // 1 hour
  maxRequests: 3,
  keyGenerator: (req) => `pwd-reset:${req.ip}`,
  message: 'Too many password reset requests. Please try again later.',
});

/**
 * Verification code rate limiter
 */
const verificationLimiter = createRateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 5,
  keyGenerator: (req) => `verify:${req.body?.email || req.body?.phone || req.ip}`,
  message: 'Too many verification attempts. Please try again later.',
});

/**
 * Social/connection rate limiter
 */
const socialLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30,
  keyGenerator: (req) => `social:${req.userId || req.ip}`,
  message: 'Too many social requests. Please slow down.',
});

/**
 * Endpoint-specific rate limit configuration
 * Maps route patterns to specific rate limiters
 */
const endpointRateLimits = {
  // Auth endpoints
  'POST /api/auth/register': authLimiter,
  'POST /api/auth/login': authLimiter,
  'POST /api/auth/forgot-password': passwordResetLimiter,
  'POST /api/auth/reset-password': passwordResetLimiter,
  'POST /api/auth/verify-email': verificationLimiter,
  'POST /api/auth/verify-phone': verificationLimiter,
  'POST /api/auth/resend-verification': verificationLimiter,

  // Profile endpoints
  'GET /api/profile': profileViewLimiter,
  'PUT /api/profile': apiLimiter,
  'POST /api/profile/photos': uploadLimiter,

  // Discovery endpoints
  'GET /api/discovery': discoveryLimiter,
  'GET /api/discovery/nearby': discoveryLimiter,
  'GET /api/discovery/recommended': discoveryLimiter,

  // Swipe endpoints
  'POST /api/swipe': swipeLimiter,
  'GET /api/swipe/matches': apiLimiter,

  // Chat endpoints
  'POST /api/chat/messages': messageLimiter,
  'GET /api/chat/conversations': apiLimiter,
  'GET /api/chat/messages': apiLimiter,

  // Payment endpoints
  'POST /api/payment': paymentLimiter,
  'POST /api/premium/subscribe': paymentLimiter,
  'POST /api/premium/cancel': paymentLimiter,

  // AI endpoints
  'POST /api/ai': aiLimiter,
  'GET /api/ai/suggestions': aiLimiter,

  // Social/Safety endpoints
  'POST /api/safety/report': reportLimiter,
  'POST /api/social': socialLimiter,

  // Notification endpoints
  'GET /api/notifications': notificationLimiter,
  'PUT /api/notifications': notificationLimiter,

  // Search endpoints
  'GET /api/search': searchLimiter,
};

/**
 * Dynamic rate limiter middleware that applies endpoint-specific limits
 * @param {Object} customLimits - Custom endpoint limits to override defaults
 * @returns {Function} Express middleware
 */
const dynamicRateLimiter = (customLimits = {}) => {
  const limits = { ...endpointRateLimits, ...customLimits };

  return async (req, res, next) => {
    const routeKey = `${req.method} ${req.baseUrl}${req.path}`.replace(/\/[a-f0-9]{24}/gi, '/:id');

    // Find matching rate limiter
    let limiter = null;

    // Try exact match first
    if (limits[routeKey]) {
      limiter = limits[routeKey];
    } else {
      // Try pattern match (e.g., GET /api/profile matches GET /api/profile/:id)
      for (const [pattern, rateLimiter] of Object.entries(limits)) {
        const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(routeKey)) {
          limiter = rateLimiter;
          break;
        }
      }
    }

    // Fall back to API limiter
    if (!limiter) {
      limiter = apiLimiter;
    }

    return limiter(req, res, next);
  };
};

/**
 * Apply rate limiter to specific routes
 * @param {Express.Router} router - Express router
 * @param {Object} routeLimits - Object mapping route patterns to limiters
 */
const applyRouteLimits = (router, routeLimits) => {
  for (const [route, limiter] of Object.entries(routeLimits)) {
    const [method, path] = route.split(' ');
    if (method && path && router[method.toLowerCase()]) {
      router.use(path, limiter);
    }
  }
};

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  swipeLimiter,
  messageLimiter,
  uploadLimiter,
  searchLimiter,
  reportLimiter,
  profileViewLimiter,
  discoveryLimiter,
  paymentLimiter,
  notificationLimiter,
  aiLimiter,
  passwordResetLimiter,
  verificationLimiter,
  socialLimiter,
  endpointRateLimits,
  dynamicRateLimiter,
  applyRouteLimits,
};
