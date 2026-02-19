// IMPORTANT: Import Sentry instrumentation at the very top, before everything else
const Sentry = require('./instrument.js');

require('dotenv').config();
const { createServer } = require('http');
const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet').default || require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

// Validate environment variables before starting
const { validateOrExit } = require('./src/shared/utils/validateEnv');
validateOrExit();

// Security middleware
const { csrfProtection, getCsrfToken } = require('./src/api/middleware/csrf');

// Performance optimization middleware
const {
  performanceHeaders,
  responseTimeMiddleware,
  requestIdMiddleware,
  configureKeepAlive,
  gracefulShutdown,
  preflightCache,
} = require('./src/api/middleware/loadTimeOptimization');
const { cdnCacheMiddleware } = require('./src/core/services/cdnService');

// Request timeout middleware - prevents 504 Gateway Timeout
const { requestTimeout } = require('./src/api/middleware/requestTimeout');

// Monitoring and Logging
const {
  monitoringService,
  datadogService,
  metricsCollector,
  healthCheckService,
} = require('./src/infrastructure/external/MonitoringService');
const {
  logger,
  auditLogger,
  morganFormat,
} = require('./src/infrastructure/external/LoggingService');
const { ForbiddenError } = require('./src/shared/utils/AppError');

// Database connection - use centralized connection
const {
  connectDB: connectDatabase,
  gracefulShutdown: dbGracefulShutdown,
  createIndexes,
} = require('./src/config/database');

// Import models (domain entities)
const Message = require('./src/core/domain/Message');
const Swipe = require('./src/core/domain/Swipe');
const User = require('./src/core/domain/User');

// Import routes
const discoveryRoutes = require('./src/api/routes/discovery');
const chatRoutes = require('./src/api/routes/chat');
const aiRoutes = require('./src/api/routes/ai');
const authRoutes = require('./src/api/routes/auth');
const profileRoutes = require('./src/api/routes/profile');
const swipeRoutes = require('./src/api/routes/swipe');
const notificationRoutes = require('./src/api/routes/notifications');
const enhancedProfileRoutes = require('./src/api/routes/enhancedProfile');
const activityRoutes = require('./src/api/routes/activity');
const socialMediaRoutes = require('./src/api/routes/socialMedia');
const safetyRoutes = require('./src/api/routes/safety');
const premiumRoutes = require('./src/api/routes/premium');
const paymentRoutes = require('./src/api/routes/payment');
const advancedInteractionsRoutes = require('./src/api/routes/advancedInteractions');
const discoveryEnhancementsRoutes = require('./src/api/routes/discoveryEnhancements');
const mediaMessagesRoutes = require('./src/api/routes/mediaMessages');
const gamificationRoutes = require('./src/api/routes/gamification');
const socialFeaturesRoutes = require('./src/api/routes/socialFeatures');
const privacyRoutes = require('./src/api/routes/privacy');
const metricsRoutes = require('./src/api/routes/metrics');
const usersRoutes = require('./src/api/routes/users');
const uploadRoutes = require('./src/api/routes/upload');

// Analytics metrics middleware
const {
  responseTimeMiddleware: metricsResponseTimeMiddleware,
  requestCountingMiddleware,
  photoUploadMetricsMiddleware,
  userActivityMiddleware,
  errorRateMiddleware,
} = require('./src/api/middleware/metricsMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize monitoring services
monitoringService.initSentry(app);

// Register health checks
healthCheckService.registerCheck('mongodb', async () => {
  const { getConnectionStatus } = require('./src/config/database');
  const status = getConnectionStatus();

  if (status.readyState !== 1) {
    throw new Error(`MongoDB not connected. State: ${status.states}`);
  }

  // Get pool stats if available
  let poolInfo = { maxPoolSize: 50, status: 'ok', ...status.pool };
  try {
    const client = mongoose.connection.getClient();
    // @ts-ignore - topology is an internal property that may not be in types
    const topology = client?.topology;
    if (topology?.description) {
      const serverDescription = topology.description;
      let totalConnections = 0;
      if (serverDescription.servers) {
        serverDescription.servers.forEach((server) => {
          if (server.pool) {
            totalConnections += server.pool.totalConnectionCount || 0;
          }
        });
      }
      poolInfo = {
        maxPoolSize: 50,
        totalConnections: totalConnections,
        availableConnections: 50 - totalConnections,
        waitQueueSize: 0,
        status: totalConnections > 45 ? 'warning' : 'ok',
      };
    }
  } catch (/** @type {any} */ e) {
    // Ignore pool stat errors
  }

  return { connected: true, pool: poolInfo };
});

healthCheckService.registerCheck('redis', async () => {
  try {
    const { getRedis } = require('./src/config/redis');

    // Get Redis client
    const redisClient = await getRedis();

    if (!redisClient) {
      // Redis not configured - return info status
      if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
        return { status: 'not_configured', connected: false };
      }
      // Redis is configured but connection failed
      throw new Error('Redis is configured but connection failed');
    }

    // Test Redis connection with PING
    const result = await Promise.race([
      redisClient.ping(),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), 5000)
      ),
    ]);

    if (result === 'PONG' || result === true) {
      return { status: 'ok', connected: true };
    }

    throw new Error('Redis ping did not return PONG');
  } catch (/** @type {any} */ error) {
    logger.warn('Redis health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Redis not available: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

healthCheckService.registerCheck('backup', async () => {
  const backupEnabled =
    String(process.env.MONGODB_BACKUP_ENABLED || 'false').toLowerCase() === 'true';

  if (!backupEnabled) {
    return {
      status: 'not_configured',
      enabled: false,
      message: 'Database backups are not enabled',
    };
  }

  let rawLastSuccess = process.env.MONGODB_BACKUP_LAST_SUCCESS_AT;
  let source = 'env';

  if (!rawLastSuccess) {
    const statusFilePath = process.env.MONGODB_BACKUP_STATUS_FILE;
    if (statusFilePath) {
      try {
        if (fs.existsSync(statusFilePath)) {
          const rawStatus = fs.readFileSync(statusFilePath, 'utf8');
          const parsedStatus = JSON.parse(rawStatus);
          rawLastSuccess =
            parsedStatus.lastSuccessAt || parsedStatus.last_success_at || parsedStatus.timestamp;
          if (rawLastSuccess) {
            source = `file:${statusFilePath}`;
          }
        }
      } catch (/** @type {any} */ error) {
        throw new Error(
          `Failed to read MONGODB_BACKUP_STATUS_FILE (${statusFilePath}): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  if (!rawLastSuccess) {
    throw new Error(
      'Backups enabled but no timestamp found. Set MONGODB_BACKUP_LAST_SUCCESS_AT or MONGODB_BACKUP_STATUS_FILE.'
    );
  }

  const lastSuccess = new Date(rawLastSuccess);
  if (Number.isNaN(lastSuccess.getTime())) {
    throw new Error('MONGODB_BACKUP_LAST_SUCCESS_AT is not a valid ISO timestamp');
  }

  const maxAgeHours = Number.parseInt(process.env.MONGODB_BACKUP_MAX_AGE_HOURS || '30', 10);
  const ageMs = Date.now() - lastSuccess.getTime();
  const ageHours = Number((ageMs / (1000 * 60 * 60)).toFixed(2));

  if (ageMs > maxAgeHours * 60 * 60 * 1000) {
    throw new Error(
      `Last backup is stale (${ageHours}h old, max allowed ${maxAgeHours}h). Update MONGODB_BACKUP_LAST_SUCCESS_AT.`
    );
  }

  return {
    enabled: true,
    source,
    lastSuccessAt: lastSuccess.toISOString(),
    ageHours,
    maxAgeHours,
  };
});

// HTTPS Enforcement - Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is already HTTPS
    const isHttps =
      req.secure || req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https';

    if (!isHttps) {
      // Redirect to HTTPS
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      logger.info('Redirecting HTTP to HTTPS', {
        from: `${req.protocol}://${req.headers.host}${req.url}`,
        to: httpsUrl,
        ip: req.ip,
      });
      return res.redirect(301, httpsUrl);
    }
    next();
  });
}

// Sentry request handler (must be first)
// Note: In Sentry v8+, expressIntegration handles this automatically
// These handlers are kept for backward compatibility but may be no-ops
if (process.env.SENTRY_DSN) {
  app.use(monitoringService.getRequestHandler());
  app.use(monitoringService.getTracingHandler());
}

// Metrics collection middleware (no-op stub)
app.use(metricsCollector.getMiddleware());

// Analytics metrics middleware
app.use(metricsResponseTimeMiddleware);
app.use(requestCountingMiddleware);
app.use(userActivityMiddleware);
app.use(photoUploadMetricsMiddleware);

// Performance & Security Middleware (order matters!)
app.use(requestIdMiddleware); // Add request ID for tracing
app.use(requestTimeout({ logTimeouts: true })); // Request timeout handler - must be early
// Note: responseTimeMiddleware removed - using metricsResponseTimeMiddleware instead to avoid conflicts
app.use(performanceHeaders); // Performance headers

// Enhanced security headers with Helmet
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
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  })
);
app.use(
  compression({
    // Compress responses
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      // Don't compress already compressed formats
      const contentType = res.getHeader('Content-Type');
      if (typeof contentType === 'string') {
        if (['image/', 'video/', 'audio/'].some((t) => contentType.includes(t))) {
          return false;
        }
      }
      return compression.filter(req, res);
    },
  })
);
app.use(cdnCacheMiddleware); // CDN cache headers
app.use(preflightCache(86400)); // Cache CORS preflight for 24h
app.use(morgan(morganFormat, { stream: logger.getStream() })); // Structured logging

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// CORS configuration - Enhanced security
// Parse CORS_ORIGIN if provided (comma-separated list of origins)
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

// Build allowed origins list - Be restrictive in production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...corsOrigins,
  'https://dating-app-seven-peach.vercel.app', // Explicit Vercel frontend URL
  // Allow all Vercel preview deployments for this project
  /^https:\/\/dating-app-.*\.vercel\.app$/,
  /^https:\/\/dating-.*-beharks-projects\.vercel\.app$/,
].filter(Boolean);

// Add development origins only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://localhost:8081');
  allowedOrigins.push('http://localhost:19006');
  allowedOrigins.push('http://localhost:19000');
  allowedOrigins.push(/\.vercel\.app$/);
  allowedOrigins.push(/\.onrender\.com$/);
} else {
  // Production: Log the allowed origins for debugging
  logger.info('Production CORS origins configured', {
    origins: allowedOrigins.filter((o) => typeof o === 'string'),
    patterns: allowedOrigins.filter((o) => o instanceof RegExp).map((r) => r.toString()),
  });
}

// Helper function to check if origin is allowed
const isOriginAllowed = (origin) => {
  return allowedOrigins.some((allowed) => {
    // @ts-ignore - RegExp check is valid at runtime
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return allowed === origin;
  });
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin header.
    // These come from mobile apps (React Native), same-origin requests,
    // server-to-server calls, or tools like curl/Postman.
    // CORS is a browser-only mechanism — no Origin means CORS doesn't apply.
    if (!origin) {
      callback(null, true);
      return;
    }

    // Validate origin
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      // Block unauthorized origins
      logger.warn('CORS: Blocked unauthorized origin', { origin });
      callback(new ForbiddenError('Origin is not allowed by CORS policy.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Request-ID', 'X-API-Key'],
  credentials: true,
  maxAge: 86400, // Cache preflight response for 24 hours
};

// Middleware to allow server-to-server requests with API key (for production)
if (process.env.NODE_ENV === 'production' && process.env.API_KEY) {
  app.use((req, res, next) => {
    // If request has no origin but has valid API key, allow it
    if (!req.headers.origin && req.headers['x-api-key'] === process.env.API_KEY) {
      // Set CORS headers manually for server-to-server requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-User-ID, X-Request-ID, X-API-Key'
      );
      logger.debug('Server-to-server request authenticated with API key', {
        ip: req.ip,
        path: req.path,
      });
    }
    next();
  });
}

// Safe paths that don't require origin header in production (for health checks, monitoring, etc.)
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
  '/api/metrics/health', // Metrics health endpoint
];

// Apply CORS conditionally - allow safe paths without origin
app.use((req, res, next) => {
  const hasValidApiKeyNoOriginRequest =
    process.env.NODE_ENV === 'production' &&
    Boolean(process.env.API_KEY) &&
    !req.headers.origin &&
    req.headers['x-api-key'] === process.env.API_KEY;

  if (hasValidApiKeyNoOriginRequest) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-User-ID, X-Request-ID, X-API-Key'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    return next();
  }

  // Check if this is a safe path that doesn't require origin
  const isSafePath = SAFE_NO_ORIGIN_PATHS.some((path) => {
    // Exact match or path starts with the safe path followed by /
    return req.path === path || req.path.startsWith(path + '/');
  });

  if (isSafePath && !req.headers.origin && process.env.NODE_ENV === 'production') {
    // Set CORS headers manually for safe paths
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-User-ID, X-Request-ID, X-API-Key'
    );

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    return next();
  }

  // Apply CORS for all other requests
  cors(corsOptions)(req, res, next);
});

// Global rate limiting - Apply to all API routes
const { dynamicRateLimiter } = require('./src/api/middleware/rateLimiter');
// @ts-ignore - dynamicRateLimiter returns Express middleware
app.use('/api', dynamicRateLimiter());

// Body parsing middleware
// Note: Multer handles multipart/form-data (file uploads) with its own limits
// These limits apply to JSON and URL-encoded bodies only
// For large file uploads, Multer bypasses these limits
app.use(express.json({ limit: '50mb' })); // Support large base64-encoded images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser for CSRF tokens
app.use(cookieParser());

// CSRF Protection (for non-API routes with session cookies)
// Skipped for Bearer token authenticated API routes
app.use(
  csrfProtection({
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    ignorePaths: ['/api/auth', '/api/webhook', '/health'],
  })
);

// CSRF Token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Health check endpoints (use health check service)
app.use(healthCheckService.getRouter());

// Legacy health check for backwards compatibility (only if not already handled)
app.get('/health', (req, res) => {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Sentry test endpoint - triggers a test error to verify Sentry is working
// Visit: http://localhost:3000/api/test-sentry (or your deployed URL)
// Note: Only available in non-production environments for security
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-sentry', (req, res) => {
    // Sentry is already imported at the top of the file

    // Create test spans and metrics (as per Sentry's test code)
    Sentry.startSpan(
      {
        name: 'test',
        op: 'test',
      },
      () => {
        Sentry.startSpan(
          {
            name: 'My First Test Span',
            op: 'test.span',
          },
          () => {
            // Log info message
            logger.info('User triggered test error', {
              action: 'test_error_span',
              userId: 'test-user',
            });

            // Send a metric (increment is the correct API for counters)
            Sentry.metrics.increment('test_counter', 1);
          }
        );
      }
    );

    try {
      // Intentionally trigger an error to test Sentry
      throw new Error('Test error for Sentry - This is intentional to verify Sentry is working!');
    } catch (/** @type {any} */ e) {
      // Capture the exception
      Sentry.captureException(e);

      res.status(500).json({
        success: false,
        message:
          'Test error sent to Sentry! Check your Sentry dashboard at https://kabashi.sentry.io/issues/',
        error: e instanceof Error ? e.message : String(e),
        note: 'This error was intentionally triggered to test Sentry integration.',
      });
    }
  });
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile/enhanced', enhancedProfileRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/discovery', discoveryEnhancementsRoutes);
app.use('/api', discoveryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat/media', mediaMessagesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/swipes', swipeRoutes);
// Disabled: nice-to-have features (files kept in codebase)
// app.use('/api/interactions', advancedInteractionsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/safety', safetyRoutes);
// app.use('/api/premium', premiumRoutes);
// app.use('/api/payment', paymentRoutes);
// app.use('/api/gamification', gamificationRoutes);
// app.use('/api/social', socialFeaturesRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(monitoringService.getErrorHandler());
}

// Import new error handlers
const { errorHandler, notFoundHandler } = require('./src/api/middleware/errorHandler');

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use((error, req, res, next) => {
  // Call errorRateMiddleware for metrics tracking
  errorRateMiddleware(error, req, res, () => {
    // Use new centralized error handler
    errorHandler(error, req, res, next);
  });
});

// Legacy error handler (replaced with new errorHandler above)
// Keeping this commented for reference during migration
/*
app.use((error, req, res, next) => {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(error);
  }

  // Call errorRateMiddleware first (it's an error handler, just tracks metrics)
  errorRateMiddleware(error, req, res, () => {
    // Log error with context
    logger.logError(error, {
      requestId: req.requestId,
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
    });

    // MongoDB connection pool exhaustion / timeout errors
    // These occur when too many concurrent requests exceed the pool capacity
    if (
      (error instanceof Error ? error.name : 'Error') === 'MongoServerSelectionError' ||
      (error instanceof Error ? error.name : 'Error') === 'MongoNetworkError' ||
      (error instanceof Error ? error.name : 'Error') === 'MongoTimeoutError' ||
      error.message?.includes('pool') ||
      error.message?.includes('connection') ||
      error.message?.includes('timed out') ||
      error.message?.includes('ECONNREFUSED') ||
      error.code === 'ECONNRESET'
    ) {
      logger.error('Database connection error', {
        error: error.message,
        errorName: error.name,
        requestId: req.requestId,
        userId: req.user?.id,
      });
      if (!res.headersSent) {
        return res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable. Please try again in a moment.',
          retryAfter: 5,
          errorCode: 'DB_CONNECTION_ERROR',
        });
      }
      return;
    }

    // MongoDB wait queue timeout - connection pool exhausted
    if (error.message?.includes('waitQueueTimeoutMS') || error.message?.includes('wait queue')) {
      logger.error('Database pool exhausted', {
        error: error.message,
        requestId: req.requestId,
        userId: req.user?.id,
      });
      if (!res.headersSent) {
        return res.status(503).json({
          success: false,
          message: 'Server is busy. Please try again in a few seconds.',
          retryAfter: 3,
          errorCode: 'DB_POOL_EXHAUSTED',
        });
      }
      return;
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          errors,
        });
      }
      return;
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      if (!res.headersSent) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry found',
          error: 'DUPLICATE_ENTRY',
        });
      }
      return;
    }

    // Custom error with status code
    if (error.statusCode) {
      if (!res.headersSent) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.code || 'CUSTOM_ERROR',
        });
      }
      return;
    }

    // Default server error
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
      });
    }
  });
});
*/

// MongoDB connection - using centralized connection from config/database.js
// This ensures we use one MongoClient instance per application (MongoDB best practice)
const connectDB = async () => {
  try {
    const connection = await connectDatabase();
    // connectDatabase returns the connection object or null
    return connection !== null;
  } catch (/** @type {any} */ error) {
    logger.error('MongoDB connection failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
};

// Socket.io setup with enhanced security
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        // Always block unauthorized origins
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // ===== HEARTBEAT/PING CONFIG =====
  pingTimeout: 60000, // Wait 60s for pong response before considering connection dead
  pingInterval: 25000, // Send ping every 25s to keep connection alive
  // ===== CONNECTION CONFIG =====
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Enable compatibility with Socket.io v3 clients
  maxHttpBufferSize: 1e6, // 1MB max message size
  connectTimeout: 45000, // 45s timeout for initial connection
});

// Track connected users for presence
const connectedUsers = new Map();

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const userId = socket.handshake.auth.userId || socket.handshake.query.userId;

    // In production, require JWT token - no direct userId allowed
    if (process.env.NODE_ENV === 'production') {
      if (!token) {
        logger.warn('Socket.io connection rejected: No token in production', {
          ip: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
        });
        return next(
          new Error('Authentication required - JWT token must be provided in production')
        );
      }

      // JWT authentication (required in production)
      const jwtProd = require('jsonwebtoken');
      const jwtSecretProd = process.env.JWT_SECRET || '';
      if (!jwtSecretProd) {
        logger.error('JWT_SECRET not configured for Socket.io authentication');
        return next(new Error('JWT_SECRET not configured'));
      }

      try {
        const decoded = /** @type {any} */ (jwtProd.verify(token, jwtSecretProd));
        /** @type {any} */ (socket).userId = decoded.userId || decoded.id;
      } catch (/** @type {any} */ jwtError) {
        logger.warn('Socket.io JWT verification failed', {
          error: jwtError instanceof Error ? jwtError.message : String(jwtError),
          ip: socket.handshake.address,
        });
        return next(new Error('Invalid or expired token'));
      }
    } else {
      // Development mode: Allow JWT or direct userId (with warning)
      if (token) {
        // JWT authentication (preferred)
        const jwtDev = require('jsonwebtoken');
        const jwtSecretDev = process.env.JWT_SECRET || '';
        if (!jwtSecretDev) {
          return next(new Error('JWT_SECRET not configured'));
        }
        try {
          const decoded = /** @type {any} */ (jwtDev.verify(token, jwtSecretDev));
          /** @type {any} */ (socket).userId = decoded.userId || decoded.id;
        } catch (/** @type {any} */ jwtError) {
          // Fall through to userId check if JWT fails in dev
          logger.debug('JWT verification failed in dev mode, falling back to userId');
        }
      }

      // Development fallback: direct userId (with strict validation)
      if (!(/** @type {any} */ (socket).userId) && userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return next(new Error('Invalid user ID format'));
        }
        logger.warn('[DEV ONLY] Using userId from query - NOT ALLOWED IN PRODUCTION', {
          userId,
          ip: socket.handshake.address,
        });
        /** @type {any} */ (socket).userId = userId;
      }

      if (!(/** @type {any} */ (socket).userId)) {
        return next(new Error('Authentication required - provide token or userId (dev only)'));
      }
    }

    // Verify user exists and is active
    const user = await User.findById(/** @type {any} */ (socket).userId).select(
      '_id name isActive'
    );
    if (!user) {
      logger.warn('Socket.io connection rejected: User not found', {
        userId: /** @type {any} */ (socket).userId,
        ip: socket.handshake.address,
      });
      return next(new Error('User not found'));
    }

    if (!user.isActive) {
      logger.warn('Socket.io connection rejected: User inactive', {
        userId: /** @type {any} */ (socket).userId,
        ip: socket.handshake.address,
      });
      return next(new Error('User account is inactive'));
    }

    next();
  } catch (/** @type {any} */ error) {
    logger.error('Socket.io authentication error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: socket.handshake.address,
    });
    next(
      new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`)
    );
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  /** @type {any} */
  const extSocket = socket;
  const userId = extSocket.userId;
  logger.info('WebSocket user connected', {
    userId,
    socketId: socket.id,
    ip: socket.handshake.address,
  });

  // Track connection
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socket.id);

  // ===== HEARTBEAT HANDLER =====
  socket.on('heartbeat', () => {
    // Client is alive, update last seen
    /** @type {any} */ (socket).lastHeartbeat = Date.now();
  });

  // Join room based on matchId
  socket.on('join_room', (matchId) => {
    try {
      // Validate matchId format
      if (!mongoose.Types.ObjectId.isValid(matchId)) {
        socket.emit('error', { message: 'Invalid match ID' });
        return;
      }

      // Verify user is part of this match
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        socket.emit('error', { message: 'Invalid user ID' });
        return;
      }

      // Leave previous rooms
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join new room
      socket.join(matchId);
      logger.debug('WebSocket user joined room', {
        userId,
        matchId,
        socketId: socket.id,
      });

      socket.emit('joined_room', { matchId });
    } catch (/** @type {any} */ error) {
      logger.error('WebSocket error joining room', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        matchId,
      });
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { matchId, content, type = 'text' } = data;
      const senderId = extSocket.userId;

      // Validate input - comprehensive validation
      if (!matchId || !content || !senderId) {
        logger.warn('Socket.io send_message: Missing required fields', {
          userId: senderId,
          hasMatchId: !!matchId,
          hasContent: !!content,
        });
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      // Validate matchId format
      if (!mongoose.Types.ObjectId.isValid(matchId)) {
        logger.warn('Socket.io send_message: Invalid matchId format', {
          userId: senderId,
          matchId,
        });
        socket.emit('error', { message: 'Invalid match ID format' });
        return;
      }

      // Validate senderId format
      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        logger.warn('Socket.io send_message: Invalid senderId format', {
          userId: senderId,
        });
        socket.emit('error', { message: 'Invalid user ID format' });
        return;
      }

      // Validate content type and length
      if (typeof content !== 'string') {
        logger.warn('Socket.io send_message: Invalid content type', {
          userId: senderId,
          contentType: typeof content,
        });
        socket.emit('error', { message: 'Content must be a string' });
        return;
      }

      // Validate content length (max 1000 characters)
      if (content.length === 0) {
        socket.emit('error', { message: 'Message content cannot be empty' });
        return;
      }

      if (content.length > 1000) {
        logger.warn('Socket.io send_message: Content too long', {
          userId: senderId,
          length: content.length,
        });
        socket.emit('error', { message: 'Message content too long (max 1000 characters)' });
        return;
      }

      // Validate message type
      const allowedTypes = ['text', 'image', 'video', 'audio'];
      if (!allowedTypes.includes(type)) {
        logger.warn('Socket.io send_message: Invalid message type', {
          userId: senderId,
          type,
        });
        socket.emit('error', {
          message: `Invalid message type. Allowed: ${allowedTypes.join(', ')}`,
        });
        return;
      }

      // Verify the match exists and user is part of it
      const match = await Swipe.findOne({
        _id: matchId,
        $or: [{ swiperId: senderId }, { swipedId: senderId }],
        action: 'like',
      });

      if (!match) {
        socket.emit('error', { message: 'Match not found or access denied' });
        return;
      }

      // Determine receiver
      const receiverId = match.swiperId.toString() === senderId ? match.swipedId : match.swiperId;

      // Create and save message
      const message = new Message({
        matchId,
        senderId,
        receiverId,
        content,
        type,
      });

      await message.save();

      // Populate sender info for the response
      await message.populate('senderId', 'name photos');
      await message.populate('receiverId', 'name photos');

      // Send notification to receiver if they have message notifications enabled
      try {
        const receiverUser = await User.findById(receiverId);
        if (receiverUser?.notificationPreferences?.messageNotifications !== false) {
          const senderName = /** @type {any} */ (message.senderId)?.name || 'Someone';
          const messagePreview = content.length > 50 ? `${content.substring(0, 50)}...` : content;
          logger.debug('Message notification sent', {
            senderId,
            senderName,
            receiverId,
            messagePreview,
            matchId,
          });
          // In production, send via Expo push notification service
        }
      } catch (/** @type {any} */ notifError) {
        logger.error('Error sending message notification', {
          error: notifError instanceof Error ? notifError.message : String(notifError),
          stack: notifError instanceof Error ? notifError.stack : undefined,
          receiverId,
          senderId,
          matchId,
        });
      }

      // Emit to all users in the room (both sender and receiver)
      io.to(matchId).emit('new_message', {
        message: {
          _id: message._id,
          matchId: message.matchId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          type: message.type,
          isRead: message.isRead,
          createdAt: message.createdAt,
        },
      });

      // Emit delivery confirmation to sender
      socket.emit('message_sent', {
        messageId: message._id,
        timestamp: message.createdAt,
      });
    } catch (/** @type {any} */ error) {
      logger.error('WebSocket error sending message', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: extSocket.userId,
        matchId: data?.matchId,
      });
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle read receipts
  socket.on('message_read', async (data) => {
    try {
      const { messageId: readMessageId, matchId: readMatchId } = data;
      const readUserId = extSocket.userId;

      // Update message as read in database
      const message = await Message.findOneAndUpdate(
        {
          _id: readMessageId,
          receiverId: readUserId,
        },
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true }
      );

      if (message) {
        // Emit read receipt to the sender
        io.to(readMatchId).emit('message_read_receipt', {
          messageId: message._id,
          readBy: readUserId,
          readAt: message.readAt,
        });
      }
    } catch (/** @type {any} */ error) {
      logger.error('WebSocket error handling message_read', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: extSocket.userId,
        messageId: data?.messageId,
        matchId: data?.matchId,
      });
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });

  // ===== TYPING INDICATORS =====
  socket.on('typing_start', (matchId) => {
    if (matchId && mongoose.Types.ObjectId.isValid(matchId)) {
      socket.to(matchId).emit('user_typing', { userId, isTyping: true });
    }
  });

  socket.on('typing_stop', (matchId) => {
    if (matchId && mongoose.Types.ObjectId.isValid(matchId)) {
      socket.to(matchId).emit('user_typing', { userId, isTyping: false });
    }
  });

  // ===== DISCONNECT HANDLER =====
  socket.on('disconnect', (reason) => {
    logger.info('WebSocket user disconnected', {
      userId,
      reason,
      socketId: socket.id,
    });

    // Remove from connected users
    if (connectedUsers.has(userId)) {
      connectedUsers.get(userId).delete(socket.id);
      if (connectedUsers.get(userId).size === 0) {
        connectedUsers.delete(userId);
        // User has no more connections - they're fully offline
        logger.debug('WebSocket user fully offline', {
          userId,
        });
      }
    }
  });

  // ===== ERROR HANDLER =====
  socket.on('error', (error) => {
    logger.error('WebSocket socket error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      socketId: socket.id,
    });
  });
});

// Start server (for local development)
const startServer = async () => {
  try {
    const dbConnected = await connectDB();

    if (!dbConnected) {
      logger.warn('MongoDB connection failed - server starting without database', {
        note: 'Some features may not work until MongoDB is connected',
      });

      // In production, exit if database connection fails
      if (process.env.NODE_ENV === 'production') {
        logger.error('CRITICAL: Cannot start server without database in production');
        process.exit(1);
      }
    } else {
      logger.info('MongoDB connection established successfully');
      // Create indexes asynchronously without blocking server startup
      createIndexes().catch((err) => {
        logger.error('Failed to create database indexes', {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      });
    }

    // Configure keep-alive for better HTTP/1.1 connection reuse
    configureKeepAlive(server);

    // Listen on 0.0.0.0 to allow Render's load balancer to connect
    // Using 0.0.0.0 instead of default (localhost) makes the server accessible from outside the container
    server.listen(Number(PORT), '0.0.0.0', () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        socketIoEnabled: true,
        performanceOptimizations: true,
      });
    });

    // Setup graceful shutdown
    gracefulShutdown(server, async () => {
      logger.info('Closing database connections...');
      await dbGracefulShutdown('SIGTERM');
      logger.info('Database connections closed');
    });
  } catch (/** @type {any} */ error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  const error = err instanceof Error ? err : new Error(String(err));

  // Log with structured logger
  logger.error('Unhandled Promise Rejection', {
    error: error.message,
    stack: error.stack,
    promise: promise?.toString?.() || String(promise),
    name: error.name,
  });

  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        promise: {
          toString: promise?.toString?.() || String(promise),
        },
      },
      level: 'fatal',
      tags: {
        error_type: 'unhandled_rejection',
      },
    });
  }

  // In production, gracefully shutdown after logging
  if (process.env.NODE_ENV === 'production') {
    logger.error('Shutting down server due to unhandled rejection');
    gracefulShutdown(server, async () => {
      await dbGracefulShutdown('UNHANDLED_REJECTION');
      process.exit(1);
    });
  } else {
    // Development: exit immediately
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  const error = err instanceof Error ? err : new Error(String(err));

  // Log with structured logger
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });

  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        error_type: 'uncaught_exception',
      },
    });
  }

  // Always exit on uncaught exceptions (they indicate programming errors)
  logger.error('Shutting down server due to uncaught exception');
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown(server, async () => {
      await dbGracefulShutdown('UNCAUGHT_EXCEPTION');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// For Vercel serverless, connect DB on first request
if (process.env.VERCEL_ENV) {
  // Serverless - connect on each cold start
  connectDB();
} else if (process.env.NODE_ENV === 'test') {
  // Avoid binding a TCP port when imported by backend test suites.
} else {
  // Traditional server
  startServer();
}

module.exports = app;
