/**
 * Request Timeout Middleware for Queued Requests
 * Prevents queued requests from hanging indefinitely with proper timeout handling
 */

const { logger } = require('../../infrastructure/external/LoggingService');

// Default timeout values
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const QUEUED_REQUEST_TIMEOUT = 60000; // 60 seconds for queued requests
const MAX_TIMEOUT = 120000; // 2 minutes maximum

/**
 * Get timeout for specific request types
 */
const getTimeoutForRequest = (req) => {
  // Higher timeout for known slow endpoints
  const slowEndpoints = [
    '/api/discover',
    '/api/discovery',
    '/api/matches',
    '/api/ai',
    '/api/analytics',
  ];

  // Check if this is a queued request
  const isQueuedRequest = req.headers['x-queued-request'] === 'true';

  if (isQueuedRequest) {
    return QUEUED_REQUEST_TIMEOUT;
  }

  // Check for slow endpoints
  for (const endpoint of slowEndpoints) {
    if (req.path.startsWith(endpoint)) {
      return QUEUED_REQUEST_TIMEOUT;
    }
  }

  return DEFAULT_TIMEOUT;
};

/**
 * Create timeout promise that rejects after specified time
 */
const createTimeoutPromise = (timeout, operationName) => {
  return new Promise((_resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeout}ms`));
    }, timeout);

    // Allow cleanup when promise resolves
    return () => clearTimeout(timeoutId);
  });
};

/**
 * Wrapper function to add timeout to any async function
 */
const withTimeout = (fn, timeout = DEFAULT_TIMEOUT, operationName = 'Operation') => {
  return async (...args) => {
    const timeoutPromise = createTimeoutPromise(timeout, operationName);
    const operationPromise = fn(...args);

    const result = await Promise.race([operationPromise, timeoutPromise]);
    return result;
  };
};

/**
 * Middleware to track request queue time and enforce timeouts
 */
const queuedRequestTimeout = (options = {}) => {
  const {
    defaultTimeout = DEFAULT_TIMEOUT,
    maxTimeout = MAX_TIMEOUT,
    logTimeouts = true,
    rejectAfterMax = true,
  } = options;

  return (req, res, next) => {
    // Calculate timeout for this request
    const timeout = Math.min(getTimeoutForRequest(req), maxTimeout);

    // Store timeout info on request
    req.timeoutInfo = {
      timeout,
      startTime: Date.now(),
      queued: req.headers['x-queued-request'] === 'true',
    };

    // Set timeout on response
    res.setTimeout(timeout, () => {
      if (!res.headersSent) {
        logger.warn(`[TIMEOUT] Request timeout: ${req.method} ${req.path}`, {
          timeout: req.timeoutInfo.timeout,
          queued: req.timeoutInfo.queued,
          duration: Date.now() - req.timeoutInfo.startTime,
        });

        res.status(503).json({
          success: false,
          error: 'REQUEST_TIMEOUT',
          message: 'Request timed out. Please try again.',
          retryAfter: 5,
          queued: req.timeoutInfo.queued,
        });
      }
    });

    // Handle case where response takes too long
    const checkTimeout = setInterval(() => {
      if (res.headersSent) {
        clearInterval(checkTimeout);
        return;
      }

      if (Date.now() - req.timeoutInfo.startTime > req.timeoutInfo.timeout) {
        clearInterval(checkTimeout);

        if (!res.headersSent) {
          logger.warn(`[TIMEOUT] Force closing connection: ${req.method} ${req.path}`);
          res.status(503).json({
            success: false,
            error: 'CONNECTION_TIMEOUT',
            message: 'Connection timeout.',
          });
        }
      }
    }, 1000);

    // Clear timeout on response finish
    res.on('finish', () => {
      clearInterval(checkTimeout);

      // Log long-running requests even if they don't timeout
      const duration = Date.now() - req.timeoutInfo.startTime;
      if (duration > req.timeoutInfo.timeout * 0.8) {
        logger.warn(`[SLOW_REQUEST] Slow request: ${req.method} ${req.path}`, {
          duration,
          timeout: req.timeoutInfo.timeout,
          queued: req.timeoutInfo.queued,
        });
      }
    });

    next();
  };
};

/**
 * Controller wrapper for async operations with timeout
 */
const controllerWithTimeout = (controllerFn, timeout = DEFAULT_TIMEOUT) => {
  return async (req, res, next) => {
    try {
      const timeoutPromise = new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Controller timeout after ${timeout}ms`));
        }, timeout);
      });

      const controllerPromise = controllerFn(req, res, next);
      await Promise.race([controllerPromise, timeoutPromise]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('timeout')) {
        logger.warn(`[CONTROLLER_TIMEOUT] ${req.method} ${req.path}: ${errorMessage}`);

        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            error: 'TIMEOUT',
            message: 'Request timed out. Please try again.',
            retryAfter: 5,
          });
        }
      } else {
        next(error);
      }
    }
  };
};

/**
 * Queue service wrapper with timeout
 */
const queueWithTimeout = async (queueFn, timeout = QUEUED_REQUEST_TIMEOUT) => {
  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Queue operation timed out after ${timeout}ms`));
    }, timeout);
  });

  const queuePromise = queueFn();
  return Promise.race([queuePromise, timeoutPromise]);
};

/**
 * Health check endpoint for timeout configuration
 */
const timeoutHealthCheck = () => {
  return {
    status: 'ok',
    timeouts: {
      default: DEFAULT_TIMEOUT,
      queued: QUEUED_REQUEST_TIMEOUT,
      max: MAX_TIMEOUT,
    },
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  DEFAULT_TIMEOUT,
  QUEUED_REQUEST_TIMEOUT,
  MAX_TIMEOUT,
  getTimeoutForRequest,
  withTimeout,
  queuedRequestTimeout,
  controllerWithTimeout,
  queueWithTimeout,
  timeoutHealthCheck,
};
