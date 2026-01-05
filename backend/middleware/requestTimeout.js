/**
 * Request Timeout Middleware
 * Prevents 504 Gateway Timeout errors by handling long-running requests gracefully
 * 
 * This middleware sets timeouts that are SHORTER than Nginx's proxy_read_timeout
 * to ensure the application can respond before the load balancer kills the connection.
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds (Nginx default is 60s)
const DISCOVERY_TIMEOUT = 45000; // 45 seconds for discovery/matching routes
const UPLOAD_TIMEOUT = 120000; // 2 minutes for file uploads

/**
 * Route-specific timeout configurations
 */
const ROUTE_TIMEOUTS = {
  // Discovery and matching routes - these can be slow due to geospatial queries
  '/api/discover': DISCOVERY_TIMEOUT,
  '/api/discovery': DISCOVERY_TIMEOUT,
  '/api/matches': DISCOVERY_TIMEOUT,
  '/api/swipe': DISCOVERY_TIMEOUT,
  '/api/ai': DISCOVERY_TIMEOUT,
  
  // Upload routes need more time
  '/api/upload': UPLOAD_TIMEOUT,
  '/api/profile/photo': UPLOAD_TIMEOUT,
  '/api/media': UPLOAD_TIMEOUT,
  
  // Auth routes should be fast
  '/api/auth': 15000,
  
  // Default for other routes
  default: DEFAULT_TIMEOUT,
};

/**
 * Get timeout value based on route
 */
const getTimeoutForRoute = (path) => {
  for (const [route, timeout] of Object.entries(ROUTE_TIMEOUTS)) {
    if (route !== 'default' && path.startsWith(route)) {
      return timeout;
    }
  }
  return ROUTE_TIMEOUTS.default;
};

/**
 * Request timeout middleware
 * Sets a timeout on the request and sends a 503 response if exceeded
 * This prevents the load balancer from returning a 504 Gateway Timeout
 */
const requestTimeout = (options = {}) => {
  const { 
    onTimeout = null,
    logTimeouts = true 
  } = options;

  return (req, res, next) => {
    const timeout = getTimeoutForRoute(req.path);
    let timedOut = false;

    // Create timeout handler
    const timeoutId = setTimeout(() => {
      timedOut = true;

      if (logTimeouts) {
        console.error(`[TIMEOUT] Request timeout after ${timeout}ms: ${req.method} ${req.originalUrl}`);
        console.error(`[TIMEOUT] Request ID: ${req.requestId || 'unknown'}`);
        console.error(`[TIMEOUT] User ID: ${req.user?.id || 'unauthenticated'}`);
      }

      // Call custom timeout handler if provided
      if (onTimeout) {
        onTimeout(req, res);
      }

      // Don't send response if headers already sent
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'Request timeout - please try again with more specific filters',
          error: 'SERVICE_UNAVAILABLE',
          retryAfter: 5,
          suggestions: [
            'Try reducing the search radius',
            'Apply more filters to narrow results',
            'Check your internet connection',
          ],
        });
      }
    }, timeout);

    // Store timeout info on request for debugging
    req.timeoutInfo = {
      timeout,
      startedAt: Date.now(),
      timeoutId,
    };

    // Clear timeout when response finishes
    const cleanup = () => {
      clearTimeout(timeoutId);
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);

    // Override res.json to check for timeout
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (timedOut) {
        console.warn('[TIMEOUT] Response attempted after timeout, ignoring');
        return res;
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Async timeout wrapper for controller functions
 * Wraps an async function with a timeout that rejects if exceeded
 */
const withTimeout = (fn, timeout = DEFAULT_TIMEOUT) => {
  return async (req, res, next) => {
    const timeoutPromise = new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });

    try {
      await Promise.race([fn(req, res, next), timeoutPromise]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (error.message.includes('timed out')) {
        console.error(`[TIMEOUT] Controller timeout: ${req.method} ${req.originalUrl}`);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: 'Operation timed out',
            error: 'OPERATION_TIMEOUT',
          });
        }
      } else {
        next(error);
      }
    }
  };
};

/**
 * Query timeout helper for MongoDB operations
 * Adds maxTimeMS to query options to prevent hanging queries
 */
const withQueryTimeout = (query, timeout = 30000) => {
  return query.maxTimeMS(timeout);
};

/**
 * Streaming response helper for large result sets
 * Sends data in chunks to avoid timeout on large responses
 */
const streamResponse = (res, dataGenerator, options = {}) => {
  const { 
    batchSize = 50,
    delayBetweenBatches = 10 
  } = options;

  // Use an async IIFE wrapped in Promise to handle async iteration
  const processStream = async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    res.write('{"success":true,"data":[');
    
    let first = true;
    let count = 0;
    
    for await (const item of dataGenerator) {
      if (!first) {
        res.write(',');
      }
      first = false;
      res.write(JSON.stringify(item));
      count++;
      
      // Small delay between batches to prevent memory pressure
      if (count % batchSize === 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    res.write(`],"count":${count}}`);
    res.end();
    return count;
  };

  return processStream();
};

module.exports = {
  requestTimeout,
  withTimeout,
  withQueryTimeout,
  streamResponse,
  getTimeoutForRoute,
  ROUTE_TIMEOUTS,
  DEFAULT_TIMEOUT,
  DISCOVERY_TIMEOUT,
  UPLOAD_TIMEOUT,
};
