// IMPORTANT: Import Sentry instrumentation at the very top, before everything else
const Sentry = require('./instrument.js');

// Load environment variables from .env file in the backend directory
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

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

// Validate environment variables using central config
const { config } = require('./src/config/env');

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

// Import centralized routes
const apiRoutes = require('./src/api/routes');

// Analytics metrics middleware
const {
  responseTimeMiddleware: metricsResponseTimeMiddleware,
  requestCountingMiddleware,
  photoUploadMetricsMiddleware,
  userActivityMiddleware,
  errorRateMiddleware,
} = require('./src/api/middleware/metricsMiddleware');

const app = express();
const PORT = config.port;

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
if (config.isProduction) {
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

// Import and configure all centralized middleware
const { configureMiddleware, isOriginAllowed } = require('./src/config/express');
configureMiddleware(app);

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
app.use('/api', apiRoutes);

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
const { initializeSocket } = require('./src/config/sockets');
const io = initializeSocket(server, isOriginAllowed);

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

    // Keep-alive self-ping to prevent Render free-tier from sleeping
    // Pings /health every 10 minutes to keep the service warm
    if (process.env.NODE_ENV === 'production' && process.env.RENDER) {
      const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
      setInterval(() => {
        const http = require('http');
        http
          .get(`http://localhost:${PORT}/health`, (res) => {
            logger.debug('Keep-alive ping', { status: res.statusCode });
          })
          .on('error', (err) => {
            logger.warn('Keep-alive ping failed', { error: err.message });
          });
      }, KEEP_ALIVE_INTERVAL);
      logger.info('Keep-alive self-ping enabled (every 10 minutes)');
    }

    // Setup graceful shutdown
    gracefulShutdown(server, async () => {
      // Close Redis connections
      try {
        const { closeRedis } = require('./src/config/redis');
        logger.info('Closing Redis connection...');
        await closeRedis();
        logger.info('Redis connection closed');
      } catch (/** @type {any} */ redisErr) {
        logger.error('Error closing Redis connection', {
          error: redisErr instanceof Error ? redisErr.message : String(redisErr),
        });
      }

      // Close MongoDB connections
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
      try {
        const { closeRedis } = require('./src/config/redis');
        await closeRedis();
      } catch (/** @type {any} */ e) { /* ignore */ }
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
      try {
        const { closeRedis } = require('./src/config/redis');
        await closeRedis();
      } catch (/** @type {any} */ e) { /* ignore */ }
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
