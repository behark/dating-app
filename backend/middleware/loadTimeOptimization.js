/**
 * Load Time Optimization Middleware
 * Express middleware for performance optimization
 */

const compression = require('compression');
const { COMPRESSION_CONFIG, HTTP_CONFIG } = require('../config/performance');

/**
 * Response compression middleware
 */
const compressionMiddleware = compression({
  ...COMPRESSION_CONFIG,
  // Enable BR compression for browsers that support it
  brotli: {
    enabled: true,
    zlib: {
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 4,
      },
    },
  },
});

/**
 * Security and performance headers middleware
 */
const performanceHeaders = (req, res, next) => {
  // Performance hints
  res.set({
    // Enable HTTP/2 Server Push hints
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'on',
    // Connection hints
    'Connection': 'keep-alive',
  });

  // Timing headers for performance monitoring
  res.set('Server-Timing', `start;dur=0`);
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms
    res.set('Server-Timing', `total;dur=${duration.toFixed(2)}`);
  });

  next();
};

/**
 * ETag generation for caching validation
 */
const etagMiddleware = (req, res, next) => {
  // Use weak ETags for generated content
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Check if headers already sent
    if (res.headersSent) {
      return originalJson(data);
    }

    if (req.method === 'GET' && res.statusCode === 200) {
      try {
        const crypto = require('crypto');
        const hash = crypto
          .createHash('md5')
          .update(JSON.stringify(data))
          .digest('hex')
          .substring(0, 12);
        
        const etag = `W/"${hash}"`;
        
        // Only set header if not already sent
        if (!res.headersSent) {
          res.set('ETag', etag);
        }
        
        // Check If-None-Match header
        const ifNoneMatch = req.get('If-None-Match');
        if (ifNoneMatch === etag && !res.headersSent) {
          return res.status(304).end();
        }
      } catch (error) {
        // If ETag generation fails, just continue with normal response
        console.error('ETag generation error:', error);
      }
    }
    
    return originalJson(data);
  };
  
  next();
};

/**
 * Response time logging middleware
 * NOTE: This is a simplified version - detailed metrics are handled by metricsMiddleware
 */
const responseTimeMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    // Only log if headers haven't been sent (safety check)
    if (res.headersSent) {
      return;
    }

    const duration = Date.now() - startTime;
    const route = req.route?.path || req.path;
    const method = req.method;
    
    // Log slow requests (>500ms) - async to avoid blocking
    if (duration > 500) {
      setImmediate(() => {
        console.warn(`[SLOW] ${method} ${route} - ${duration}ms`);
      });
    }
    
    // Don't set header here - metricsMiddleware handles it
    // This prevents duplicate header setting
  });
  
  next();
};

/**
 * Request ID middleware for tracing
 */
const requestIdMiddleware = (req, res, next) => {
  const crypto = require('crypto');
  const requestId = req.get('X-Request-ID') || crypto.randomUUID();
  
  req.requestId = requestId;
  res.set('X-Request-ID', requestId);
  
  next();
};

/**
 * Body size limit checker
 */
const bodySizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request body too large',
        maxSize,
      });
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 */
const parseSize = (size) => {
  if (typeof size === 'number') return size;
  
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const num = parseInt(match[1]);
  const unit = match[2] || 'b';
  
  return num * units[unit];
};

/**
 * JSON response optimization
 * Strips null values and optimizes payload size
 */
const optimizeJsonResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Only optimize if response is large
    const stringified = JSON.stringify(data);
    if (stringified.length > 10000) {
      // Remove null values to reduce payload size
      const optimized = JSON.parse(stringified, (key, value) => {
        if (value === null) return undefined;
        return value;
      });
      return originalJson(optimized);
    }
    return originalJson(data);
  };
  
  next();
};

/**
 * Keep-alive configuration
 */
const configureKeepAlive = (server) => {
  server.keepAliveTimeout = HTTP_CONFIG.keepAliveTimeout;
  server.headersTimeout = HTTP_CONFIG.headersTimeout;
  server.maxHeadersCount = HTTP_CONFIG.maxHeadersCount;
  
  return server;
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (server, cleanupFn) => {
  let isShuttingDown = false;
  
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`\n${signal} received. Graceful shutdown starting...`);
    
    // Stop accepting new connections
    server.close(async () => {
      console.log('HTTP server closed');
      
      // Run cleanup (close DB connections, etc.)
      if (cleanupFn) {
        await cleanupFn();
      }
      
      console.log('Graceful shutdown complete');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Preflight caching for CORS
 */
const preflightCache = (maxAge = 86400) => {
  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Max-Age', maxAge.toString());
    }
    next();
  };
};

module.exports = {
  compressionMiddleware,
  performanceHeaders,
  etagMiddleware,
  responseTimeMiddleware,
  requestIdMiddleware,
  bodySizeLimit,
  optimizeJsonResponse,
  configureKeepAlive,
  gracefulShutdown,
  preflightCache,
};
