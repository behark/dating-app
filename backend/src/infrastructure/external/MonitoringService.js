/**
 * Monitoring Service
 * Integrates Sentry for error tracking and Datadog for APM
 */

const Sentry = require('@sentry/node');

class MonitoringService {
  constructor() {
    this.initialized = false;
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Initialize Sentry for error tracking
   * Note: Sentry is now initialized in instrument.js at the very top of server.js
   * This method just marks Sentry as initialized since it's already set up
   */
  initSentry(app) {
    if (!process.env.SENTRY_DSN) {
      console.log('⚠️  Sentry DSN not configured, skipping Sentry initialization');
      return;
    }

    // Sentry is already initialized in instrument.js
    // Express integration is handled via middleware in server.js
    if (Sentry.getCurrentHub().getClient()) {
      this.initialized = true;
      console.log(
        '✅ Sentry already initialized (from instrument.js), ready for Express middleware'
      );
    } else {
      console.log('⚠️  Sentry not initialized yet');
    }
  }

  /**
   * Get Sentry request handler middleware
   * Note: In Sentry v8+, expressIntegration handles this automatically
   */
  getRequestHandler() {
    // For Sentry v8+, expressIntegration in instrument.js handles request tracking
    // Return a no-op middleware since expressIntegration does the work
    return (req, res, next) => next();
  }

  /**
   * Get Sentry tracing middleware
   * Note: In Sentry v8+, tracing is handled by expressIntegration
   */
  getTracingHandler() {
    // For Sentry v8+, tracing is handled by expressIntegration
    return (req, res, next) => next();
  }

  /**
   * Get Sentry error handler middleware (must be first error handler)
   * Note: In Sentry v8+, use Sentry.setupExpressErrorHandler(app) instead
   */
  getErrorHandler() {
    // For Sentry v8+, return an error handler that captures exceptions
    // For full integration, use Sentry.setupExpressErrorHandler(app) in server.js
    return (err, req, res, next) => {
      // Only capture 500+ errors or errors without status
      const shouldCapture =
        err.status >= 500 || !err.status || (err.status === 400 && !err.isValidationError);

      if (this.initialized && shouldCapture) {
        Sentry.captureException(err);
      }
      next(err);
    };
  }

  /**
   * Capture an exception manually
   */
  captureException(error, context = {}) {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser(context.user);
      }
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      if (context.level) {
        scope.setLevel(context.level);
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Capture a message manually
   * @param {string} message - The message to capture
   * @param {'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'} level - Severity level
   * @param {object} context - Additional context
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      // Cast to SeverityLevel type
      scope.setLevel(/** @type {import('@sentry/node').SeverityLevel} */ (level));
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      Sentry.captureMessage(message);
    });
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb) {
    if (!this.initialized) return;
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Set user context
   */
  setUser(user) {
    if (!this.initialized) return;
    Sentry.setUser(
      user
        ? {
            id: user._id?.toString() || user.id,
            email: user.email,
            username: user.displayName,
          }
        : null
    );
  }

  /**
   * Start a span for performance monitoring (Sentry v8+ API)
   * @param {string} name - The name of the span
   * @param {string} op - The operation type
   * @param {(span: import('@sentry/node').Span) => any} callback - Function to execute within the span
   * @returns {any} Result of the callback
   */
  startSpan(name, op = 'function', callback) {
    if (!this.initialized) {
      return callback ? callback(/** @type {any} */ (null)) : null;
    }
    return Sentry.startSpan({ name, op }, (span) => callback(span));
  }

  /**
   * @deprecated Use startSpan instead. This is kept for backward compatibility.
   */
  startTransaction(name, op = 'function') {
    console.warn('startTransaction is deprecated in Sentry v8+. Use startSpan instead.');
    // Return a mock transaction object for backward compatibility
    return {
      name,
      op,
      finish: () => {},
      setStatus: () => {},
    };
  }

  /**
   * Flush pending events before shutdown
   */
  async close(timeout = 2000) {
    if (!this.initialized) return;
    await Sentry.close(timeout);
  }
}

// =============================================
// Datadog APM - Removed (stub for compatibility)
// =============================================

class DatadogService {
  init() {}
  gauge() {}
  increment() {}
  timing() {}
  histogram() {}
  trace(operationName, options, callback) {
    return callback();
  }
  close() {}
}

// =============================================
// Custom Metrics Helper (stub)
// =============================================

class MetricsCollector {
  constructor() {}
  trackRequest() {}
  trackDatabaseQuery() {}
  trackCache() {}
  trackUserActivity() {}
  trackBusinessMetric() {}
  getMiddleware() {
    return (req, res, next) => next();
  }
}

// =============================================
// Health Check Service
// =============================================

class HealthCheckService {
  constructor() {
    this.checks = new Map();
  }

  /**
   * Register a health check
   */
  registerCheck(name, checkFn) {
    this.checks.set(name, checkFn);
  }

  /**
   * Run all health checks
   */
  async runChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {},
    };

    for (const [name, checkFn] of this.checks) {
      try {
        const start = Date.now();
        const result = await checkFn();
        results.checks[name] = {
          status: 'healthy',
          responseTime: Date.now() - start,
          ...result,
        };
      } catch (error) {
        results.status = 'unhealthy';
        results.checks[name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return results;
  }

  /**
   * Get Express router for health endpoints
   */
  getRouter() {
    const router = require('express').Router();

    const getReadinessPayload = async () => {
      const results = await this.runChecks();
      if (results.status === 'healthy') {
        return { statusCode: 200, payload: { ready: true, timestamp: results.timestamp } };
      }
      return {
        statusCode: 503,
        payload: { ready: false, timestamp: results.timestamp, checks: results.checks },
      };
    };

    const getLivenessPayload = () => ({
      alive: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });

    // Basic health check
    router.get('/health', (req, res) => {
      // Don't send response if headers already sent
      if (res.headersSent) {
        return;
      }
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Detailed health check
    router.get('/health/detailed', async (req, res) => {
      if (res.headersSent) {
        return;
      }
      const results = await this.runChecks();
      const statusCode = results.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(results);
    });

    // Readiness probe
    router.get('/ready', async (req, res) => {
      if (res.headersSent) {
        return;
      }
      const { statusCode, payload } = await getReadinessPayload();
      res.status(statusCode).json(payload);
    });

    // Liveness probe
    router.get('/live', (req, res) => {
      if (res.headersSent) {
        return;
      }
      res.json(getLivenessPayload());
    });

    // Kubernetes-friendly aliases
    router.get('/health/ready', async (req, res) => {
      if (res.headersSent) {
        return;
      }
      const { statusCode, payload } = await getReadinessPayload();
      res.status(statusCode).json(payload);
    });

    router.get('/health/readiness', async (req, res) => {
      if (res.headersSent) {
        return;
      }
      const { statusCode, payload } = await getReadinessPayload();
      res.status(statusCode).json(payload);
    });

    router.get('/health/live', (req, res) => {
      if (res.headersSent) {
        return;
      }
      res.json(getLivenessPayload());
    });

    router.get('/health/liveness', (req, res) => {
      if (res.headersSent) {
        return;
      }
      res.json(getLivenessPayload());
    });

    return router;
  }
}

// Export singleton instances
const monitoringService = new MonitoringService();
const datadogService = new DatadogService();
const metricsCollector = new MetricsCollector(datadogService);
const healthCheckService = new HealthCheckService();

module.exports = {
  MonitoringService,
  DatadogService,
  MetricsCollector,
  HealthCheckService,
  monitoringService,
  datadogService,
  metricsCollector,
  healthCheckService,
};
