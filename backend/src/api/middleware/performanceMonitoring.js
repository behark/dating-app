/**
 * Performance Monitoring Middleware
 * Comprehensive tracking of API response times, slow queries, and performance bottlenecks
 */

const { logger } = require('../../infrastructure/external/LoggingService');
const { datadogService, metricsCollector } = require('../../infrastructure/external/MonitoringService');
const PerformanceMetric = require('../../core/domain/PerformanceMetric');

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  SLOW_REQUEST: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000', 10), // 1 second
  VERY_SLOW_REQUEST: parseInt(process.env.VERY_SLOW_REQUEST_THRESHOLD || '3000', 10), // 3 seconds
  SLOW_QUERY: parseInt(process.env.SLOW_QUERY_THRESHOLD || '500', 10), // 500ms
  VERY_SLOW_QUERY: parseInt(process.env.VERY_SLOW_QUERY_THRESHOLD || '2000', 10), // 2 seconds
};

// In-memory metrics for real-time monitoring
const performanceMetrics = {
  requests: {
    total: 0,
    slow: 0,
    verySlow: 0,
    errors: 0,
    byRoute: new Map(),
    byMethod: new Map(),
  },
  queries: {
    total: 0,
    slow: 0,
    verySlow: 0,
    byCollection: new Map(),
    byOperation: new Map(),
  },
  lastReset: Date.now(),
};

// Reset metrics every hour
setInterval(() => {
  performanceMetrics.requests.byRoute.clear();
  performanceMetrics.requests.byMethod.clear();
  performanceMetrics.queries.byCollection.clear();
  performanceMetrics.queries.byOperation.clear();
  performanceMetrics.lastReset = Date.now();
}, 3600000); // 1 hour

/**
 * Main performance monitoring middleware
 * Tracks API response times and identifies slow requests
 */
const performanceMonitoringMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startTimestamp = Date.now();

  // Get route identifier
  const route = normalizeRoute(req.route?.path || req.path, req.baseUrl);
  const method = req.method;

  // Track request start
  performanceMetrics.requests.total++;

  // Increment route counter
  const routeKey = `${method} ${route}`;
  const routeCount = performanceMetrics.requests.byRoute.get(routeKey) || 0;
  performanceMetrics.requests.byRoute.set(routeKey, routeCount + 1);

  // Increment method counter
  const methodCount = performanceMetrics.requests.byMethod.get(method) || 0;
  performanceMetrics.requests.byMethod.set(method, methodCount + 1);

  // Capture original end function
  const originalEnd = res.end;

  res.end = function (...args) {
    // Only process if response hasn't been sent yet
    if (res.headersSent) {
      return originalEnd.apply(this, args);
    }

    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationMs = durationNs / 1000000;
    const durationSec = durationMs / 1000;

    // Set response time header
    if (!res.headersSent) {
      try {
        res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
        res.setHeader('X-Request-ID', req.requestId || 'unknown');
      } catch (error) {
        // Headers already sent, ignore
      }
    }

    // Track metrics
    const isError = res.statusCode >= 400;
    const isSlow = durationMs > THRESHOLDS.SLOW_REQUEST;
    const isVerySlow = durationMs > THRESHOLDS.VERY_SLOW_REQUEST;

    if (isError) {
      performanceMetrics.requests.errors++;
    }

    if (isSlow) {
      performanceMetrics.requests.slow++;
    }

    if (isVerySlow) {
      performanceMetrics.requests.verySlow++;
    }

    // Send to Datadog
    const tags = [
      `method:${method}`,
      `route:${route}`,
      `status:${res.statusCode}`,
      `status_class:${Math.floor(res.statusCode / 100)}xx`,
      `slow:${isSlow}`,
      `very_slow:${isVerySlow}`,
    ];

    datadogService.timing('api.response_time', durationMs, tags);
    datadogService.histogram('api.response_time.histogram', durationMs, tags);

    if (isError) {
      datadogService.increment('api.errors', 1, tags);
    }

    if (isSlow) {
      datadogService.increment('api.slow_requests', 1, tags);
    }

    if (isVerySlow) {
      datadogService.increment('api.very_slow_requests', 1, tags);
    }

    // Log slow requests
    if (isSlow) {
      const logData = {
        type: 'slow_request',
        method,
        route,
        duration: `${durationMs.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id || req.user?._id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      };

      if (isVerySlow) {
        logger.warn('Very slow request detected', logData);
        // Alert for very slow requests
        triggerPerformanceAlert('very_slow_request', {
          route,
          method,
          duration: durationMs,
          threshold: THRESHOLDS.VERY_SLOW_REQUEST,
        });
      } else {
        logger.warn('Slow request detected', logData);
      }
    }

    // Store performance metric in database (async, non-blocking)
    if (isSlow || isError || durationMs > 500) {
      setImmediate(async () => {
        try {
          await PerformanceMetric.create({
            type: 'api_request',
            endpoint: route,
            method,
            duration: durationMs,
            statusCode: res.statusCode,
            userId: req.user?.id || req.user?._id || null,
            isSlow,
            isVerySlow,
            isError,
            timestamp: new Date(startTimestamp),
            metadata: {
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'],
              requestId: req.requestId,
            },
          });
        } catch (error) {
          // Don't let metric storage failures break the request
          logger.debug('Failed to store performance metric', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    }

    // Call original end
    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Track database query performance
 */
const trackDatabaseQuery = async (
  operation,
  collection,
  duration,
  success = true,
  details = {}
) => {
  const durationMs = duration;
  const isSlow = durationMs > THRESHOLDS.SLOW_QUERY;
  const isVerySlow = durationMs > THRESHOLDS.VERY_SLOW_QUERY;

  // Update in-memory metrics
  performanceMetrics.queries.total++;
  if (isSlow) {
    performanceMetrics.queries.slow++;
  }
  if (isVerySlow) {
    performanceMetrics.queries.verySlow++;
  }

  // Update collection counter
  const collectionCount = performanceMetrics.queries.byCollection.get(collection) || 0;
  performanceMetrics.queries.byCollection.set(collection, collectionCount + 1);

  // Update operation counter
  const operationCount = performanceMetrics.queries.byOperation.get(operation) || 0;
  performanceMetrics.queries.byOperation.set(operation, operationCount + 1);

  // Send to Datadog
  const tags = [
    `operation:${operation}`,
    `collection:${collection}`,
    `success:${success}`,
    `slow:${isSlow}`,
    `very_slow:${isVerySlow}`,
  ];

  datadogService.timing('db.query.duration', durationMs, tags);
  datadogService.histogram('db.query.duration.histogram', durationMs, tags);

  if (isSlow) {
    datadogService.increment('db.slow_queries', 1, tags);
  }

  if (isVerySlow) {
    datadogService.increment('db.very_slow_queries', 1, tags);
  }

  // Log slow queries
  if (isSlow) {
    const logData = {
      type: 'slow_query',
      operation,
      collection,
      duration: `${durationMs.toFixed(2)}ms`,
      success,
      ...details,
    };

    if (isVerySlow) {
      logger.warn('Very slow database query detected', logData);
      // Alert for very slow queries
      triggerPerformanceAlert('very_slow_query', {
        operation,
        collection,
        duration: durationMs,
        threshold: THRESHOLDS.VERY_SLOW_QUERY,
        details,
      });
    } else {
      logger.warn('Slow database query detected', logData);
    }
  }

  // Store performance metric in database (async, non-blocking)
  if (isSlow || !success) {
    setImmediate(async () => {
      try {
        await PerformanceMetric.create({
          type: 'database_query',
          endpoint: `${operation} ${collection}`,
          method: operation,
          duration: durationMs,
          statusCode: success ? 200 : 500,
          isSlow,
          isVerySlow,
          isError: !success,
          timestamp: new Date(),
          metadata: {
            collection,
            operation,
            ...details,
          },
        });
      } catch (error) {
        // Don't let metric storage failures break the query
        logger.debug('Failed to store query performance metric', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  // Use existing logger method
  logger.logDatabaseOperation(operation, collection, durationMs, success, details);
};

/**
 * Trigger performance alert
 */
const triggerPerformanceAlert = (alertType, data) => {
  const alertData = {
    type: alertType,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Log alert
  logger.warn('Performance alert triggered', alertData);

  // Send to Datadog
  datadogService.increment('performance.alerts', 1, [`alert_type:${alertType}`]);

  // Send to Sentry if configured
  try {
    const { monitoringService } = require('../../infrastructure/external/MonitoringService');
    monitoringService.captureMessage(`Performance Alert: ${alertType}`, 'warning', {
      tags: { alertType },
      extra: data,
    });
  } catch (error) {
    // Sentry not configured or failed, continue
  }
};

/**
 * Get current performance metrics
 */
const getPerformanceMetrics = () => {
  return {
    requests: {
      total: performanceMetrics.requests.total,
      slow: performanceMetrics.requests.slow,
      verySlow: performanceMetrics.requests.verySlow,
      errors: performanceMetrics.requests.errors,
      slowPercentage:
        performanceMetrics.requests.total > 0
          ? ((performanceMetrics.requests.slow / performanceMetrics.requests.total) * 100).toFixed(
              2
            )
          : '0.00',
      byRoute: Object.fromEntries(performanceMetrics.requests.byRoute),
      byMethod: Object.fromEntries(performanceMetrics.requests.byMethod),
    },
    queries: {
      total: performanceMetrics.queries.total,
      slow: performanceMetrics.queries.slow,
      verySlow: performanceMetrics.queries.verySlow,
      slowPercentage:
        performanceMetrics.queries.total > 0
          ? ((performanceMetrics.queries.slow / performanceMetrics.queries.total) * 100).toFixed(2)
          : '0.00',
      byCollection: Object.fromEntries(performanceMetrics.queries.byCollection),
      byOperation: Object.fromEntries(performanceMetrics.queries.byOperation),
    },
    thresholds: THRESHOLDS,
    lastReset: performanceMetrics.lastReset,
    uptime: process.uptime(),
  };
};

/**
 * Normalize route path for consistent metric tagging
 */
function normalizeRoute(path, baseUrl = '') {
  const fullPath = `${baseUrl}${path}`.replace(/\/+/g, '/');

  // Replace dynamic segments with placeholders
  return fullPath
    .replace(/\/[a-f0-9]{24}/g, '/:id') // MongoDB ObjectIds
    .replace(/\/\d+/g, '/:id') // Numeric IDs
    .replace(/\/:[\w]+/g, '/:param'); // Named params
}

module.exports = {
  performanceMonitoringMiddleware,
  trackDatabaseQuery,
  getPerformanceMetrics,
  THRESHOLDS,
};
