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
        err.status >= 500 ||
        !err.status ||
        (err.status === 400 && !err.isValidationError);

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
// Datadog APM Integration
// =============================================

class DatadogService {
  constructor() {
    this.tracer = null;
    this.StatsD = null;
  }

  /**
   * Initialize Datadog APM
   */
  init() {
    if (!process.env.DATADOG_API_KEY && !process.env.DD_API_KEY) {
      console.log('⚠️  Datadog API key not configured, skipping Datadog initialization');
      return;
    }

    try {
      // Initialize tracer
      // Note: DD_SITE should be set via environment variable for regional endpoints
      this.tracer = require('dd-trace').init({
        service: 'dating-app-api',
        env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
        version: process.env.RELEASE_VERSION || '1.0.0',
        logInjection: true,
        runtimeMetrics: true,
        profiling: true,
        appsec: true,
      });

      // Initialize StatsD for custom metrics
      const { StatsD } = require('hot-shots');
      this.StatsD = new StatsD({
        host: process.env.DD_AGENT_HOST || 'localhost',
        port: 8125,
        prefix: 'dating_app.',
        globalTags: {
          env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
          service: 'dating-app-api',
          site: process.env.DD_SITE || 'datadoghq.com',
        },
      });

      console.log('✅ Datadog APM initialized');
    } catch (error) {
      console.log(
        '⚠️  Failed to initialize Datadog:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Send custom metric
   */
  gauge(metric, value, tags = []) {
    if (this.StatsD) {
      this.StatsD.gauge(metric, value, tags);
    }
  }

  /**
   * Increment a counter
   */
  increment(metric, value = 1, tags = []) {
    if (this.StatsD) {
      this.StatsD.increment(metric, value, tags);
    }
  }

  /**
   * Record timing
   */
  timing(metric, value, tags = []) {
    if (this.StatsD) {
      this.StatsD.timing(metric, value, tags);
    }
  }

  /**
   * Record histogram
   */
  histogram(metric, value, tags = []) {
    if (this.StatsD) {
      this.StatsD.histogram(metric, value, tags);
    }
  }

  /**
   * Create a custom span
   */
  trace(operationName, options, callback) {
    if (this.tracer) {
      return this.tracer.trace(operationName, options, callback);
    }
    return callback();
  }

  /**
   * Close Datadog connections
   */
  close() {
    if (this.StatsD) {
      this.StatsD.close();
    }
  }
}

// =============================================
// Custom Metrics Helper
// =============================================

class MetricsCollector {
  constructor(datadogService) {
    this.datadog = datadogService;
    this.counters = new Map();
    this.startTime = Date.now();
  }

  /**
   * Track API request metrics
   */
  trackRequest(req, res, duration) {
    const tags = [
      `method:${req.method}`,
      `route:${req.route?.path || 'unknown'}`,
      `status:${res.statusCode}`,
      `status_class:${Math.floor(res.statusCode / 100)}xx`,
    ];

    this.datadog.increment('http.requests', 1, tags);
    this.datadog.timing('http.request.duration', duration, tags);

    if (res.statusCode >= 400) {
      this.datadog.increment('http.errors', 1, tags);
    }
  }

  /**
   * Track database query metrics
   */
  trackDatabaseQuery(operation, collection, duration, success = true) {
    const tags = [`operation:${operation}`, `collection:${collection}`, `success:${success}`];

    this.datadog.increment('db.queries', 1, tags);
    this.datadog.timing('db.query.duration', duration, tags);
  }

  /**
   * Track cache metrics
   */
  trackCache(operation, hit = false) {
    const tags = [`operation:${operation}`, `hit:${hit}`];
    this.datadog.increment('cache.operations', 1, tags);

    if (operation === 'get') {
      this.datadog.increment(hit ? 'cache.hits' : 'cache.misses', 1);
    }
  }

  /**
   * Track user activity
   */
  trackUserActivity(activity, userId) {
    this.datadog.increment('user.activity', 1, [`activity:${activity}`]);
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(metric, value, tags = []) {
    this.datadog.gauge(`business.${metric}`, value, tags);
  }

  /**
   * Get Express middleware for request tracking
   */
  getMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.trackRequest(req, res, duration);
      });

      next();
    };
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
      const results = await this.runChecks();
      if (results.status === 'healthy') {
        res.json({ ready: true });
      } else {
        res.status(503).json({ ready: false, checks: results.checks });
      }
    });

    // Liveness probe
    router.get('/live', (req, res) => {
      if (res.headersSent) {
        return;
      }
      res.json({ alive: true, uptime: process.uptime() });
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
