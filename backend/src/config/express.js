const express = require('express');
const cors = require('cors');
const helmet = require('helmet').default || require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const { config } = require('./env');
const { logger, morganFormat } = require('../infrastructure/external/LoggingService');
const { ForbiddenError } = require('../shared/utils/AppError');
const { cdnCacheMiddleware } = require('../core/services/cdnService');
const {
  performanceHeaders,
  requestIdMiddleware,
  preflightCache,
} = require('../api/middleware/loadTimeOptimization');
const { requestTimeout } = require('../api/middleware/requestTimeout');
const { dynamicRateLimiter } = require('../api/middleware/rateLimiter');
const { csrfProtection, getCsrfToken } = require('../api/middleware/csrf');
const {
  responseTimeMiddleware: metricsResponseTimeMiddleware,
  requestCountingMiddleware,
  photoUploadMetricsMiddleware,
  userActivityMiddleware,
} = require('../api/middleware/metricsMiddleware');

// CORS configuration - Enhanced security
const corsOrigins = config.frontend.corsOrigins
  ? config.frontend.corsOrigins.split(',').map((o) => o.trim())
  : [];

const allowedOrigins = [
  config.frontend.url,
  ...corsOrigins,
  'https://dating-app-seven-peach.vercel.app',
  /^https:\/\/dating-app-.*\.vercel\.app$/,
  /^https:\/\/dating-.*-beharks-projects\.vercel\.app$/,
].filter(Boolean);

if (!config.isProduction) {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://localhost:8081');
  allowedOrigins.push('http://localhost:19006');
  allowedOrigins.push('http://localhost:19000');
  allowedOrigins.push(/\.vercel\.app$/);
  allowedOrigins.push(/\.onrender\.com$/);
}

const isOriginAllowed = (origin) => {
  return allowedOrigins.some((allowed) => {
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return allowed === origin;
  });
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Blocked unauthorized origin', { origin });
      callback(new ForbiddenError('Origin is not allowed by CORS policy.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Request-ID', 'X-API-Key'],
  credentials: true,
  maxAge: 86400,
};

const SAFE_NO_ORIGIN_PATHS = [
  '/',
  '/health',
  '/health/detailed',
  '/health/ready',
  '/health/readiness',
  '/health/live',
  '/health/liveness',
  '/ready',
  '/live',
  '/favicon.ico',
  '/metrics',
  '/api/metrics/health',
];

const configureMiddleware = (app) => {
  // Analytics metrics middleware
  app.use(metricsResponseTimeMiddleware);
  app.use(requestCountingMiddleware);
  app.use(userActivityMiddleware);
  app.use(photoUploadMetricsMiddleware);

  // Performance & Security
  app.use(requestIdMiddleware);
  app.use(requestTimeout({ logTimeouts: true }));
  app.use(performanceHeaders);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'blob:'],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: config.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        const contentType = res.getHeader('Content-Type');
        if (typeof contentType === 'string' && ['image/', 'video/', 'audio/'].some((t) => contentType.includes(t))) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

  app.use(cdnCacheMiddleware);
  app.use(preflightCache(86400));
  app.use(morgan(morganFormat, { stream: logger.getStream() }));

  // Static files
  app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

  app.use((req, res, next) => {
    if (config.isProduction && config.security.apiKey && !req.headers.origin && req.headers['x-api-key'] === config.security.apiKey) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-Request-ID, X-API-Key');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      return next();
    }

    const isSafePath = SAFE_NO_ORIGIN_PATHS.some((path) => req.path === path || req.path.startsWith(path + '/'));

    if (isSafePath && !req.headers.origin && config.isProduction) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-Request-ID, X-API-Key');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      return next();
    }

    cors(corsOptions)(req, res, next);
  });

  app.use('/api', dynamicRateLimiter());

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  app.use(
    csrfProtection({
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
      ignorePaths: ['/api/auth', '/api/webhook', '/health'],
    })
  );

  app.get('/api/csrf-token', getCsrfToken);
};

module.exports = {
  configureMiddleware,
  isOriginAllowed,
};
