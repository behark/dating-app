/**
 * Metrics Middleware
 * Tracks API response times and request metrics for all endpoints
 */

const { analyticsMetricsService } = require('../services/AnalyticsMetricsService');
const { datadogService } = require('../services/MonitoringService');

/**
 * Response time tracking middleware
 * Measures and records API response times
 */
const responseTimeMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  // Capture original end function
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationMs = durationNs / 1000000;

    // Get route path (normalized)
    const route = req.route?.path || req.path || 'unknown';
    const baseRoute = normalizeRoute(route, req.baseUrl);

    // Track the metric
    analyticsMetricsService.trackApiResponseTime(
      baseRoute,
      req.method,
      res.statusCode,
      durationMs
    );

    // Add timing header for debugging (only if headers haven't been sent)
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
    }

    // Log slow requests (> 1000ms)
    if (durationMs > 1000) {
      console.warn(`Slow request: ${req.method} ${baseRoute} - ${durationMs.toFixed(2)}ms`);
    }

    // Call original end
    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Request counting middleware
 * Tracks total requests, errors, and status code distribution
 */
const requestCountingMiddleware = (req, res, next) => {
  res.on('finish', () => {
    const route = normalizeRoute(req.route?.path || req.path, req.baseUrl);
    const tags = [
      `route:${route}`,
      `method:${req.method}`,
      `status:${res.statusCode}`
    ];

    datadogService.increment('http.requests.total', 1, tags);

    // Track by status class
    const statusClass = Math.floor(res.statusCode / 100);
    datadogService.increment(`http.requests.${statusClass}xx`, 1, [`route:${route}`]);

    // Track authenticated vs unauthenticated
    const authTag = req.user ? 'authenticated:true' : 'authenticated:false';
    datadogService.increment('http.requests.by_auth', 1, [authTag, `route:${route}`]);
  });

  next();
};

/**
 * Photo upload tracking middleware
 * Specifically tracks photo upload success/failure metrics
 */
const photoUploadMetricsMiddleware = (req, res, next) => {
  // Only apply to photo upload routes
  if (!req.path.includes('/photos/upload') && !req.path.includes('/profile/photo')) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 300;
    
    // Calculate total size of uploaded files
    let totalSize = 0;
    if (req.files) {
      totalSize = req.files.reduce((sum, file) => sum + (file.size || 0), 0);
    } else if (req.file) {
      totalSize = req.file.size || 0;
    }

    // Determine error type if failed
    let errorType = null;
    if (!success) {
      if (res.statusCode === 413) errorType = 'file_too_large';
      else if (res.statusCode === 415) errorType = 'invalid_format';
      else if (res.statusCode === 400) errorType = 'bad_request';
      else if (res.statusCode >= 500) errorType = 'server_error';
      else errorType = 'unknown';
    }

    analyticsMetricsService.trackPhotoUpload(success, totalSize, durationMs, errorType);
  });

  next();
};

/**
 * User activity tracking middleware
 * Records user activities for DAU/retention calculations
 */
const userActivityMiddleware = (req, res, next) => {
  res.on('finish', () => {
    // Only track successful requests from authenticated users
    if (!req.user || res.statusCode >= 400) {
      return;
    }

    // Determine activity type based on route
    const activityType = getActivityType(req);
    if (activityType) {
      datadogService.increment('user.activity', 1, [
        `activity:${activityType}`,
        `user_id:${req.user.id || req.user._id}`
      ]);
    }
  });

  next();
};

/**
 * Error rate tracking middleware
 */
const errorRateMiddleware = (err, req, res, next) => {
  const route = normalizeRoute(req.route?.path || req.path, req.baseUrl);
  const statusCode = err.statusCode || err.status || 500;
  
  const tags = [
    `route:${route}`,
    `method:${req.method}`,
    `error_type:${err.name || 'UnknownError'}`,
    `status:${statusCode}`
  ];

  datadogService.increment('http.errors', 1, tags);
  
  // Track crash if it's a 500 error
  if (statusCode >= 500) {
    datadogService.increment('app.server_errors', 1, [`route:${route}`]);
  }

  next(err);
};

// =============================================
// Helper Functions
// =============================================

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

/**
 * Determine activity type from request
 */
function getActivityType(req) {
  const path = req.path.toLowerCase();
  const method = req.method;

  // Swipe activity
  if (path.includes('/swipe')) return 'swipe';
  
  // Message activity
  if (path.includes('/message') || path.includes('/chat')) return 'message';
  
  // Profile view
  if (path.includes('/profile') && method === 'GET') return 'profile_view';
  
  // Profile update
  if (path.includes('/profile') && ['PUT', 'PATCH', 'POST'].includes(method)) return 'profile_update';
  
  // Match related
  if (path.includes('/match')) return 'match';
  
  // Login/auth
  if (path.includes('/auth') || path.includes('/login')) return 'login';
  
  // Discovery/browse
  if (path.includes('/discover') || path.includes('/nearby')) return 'browse';

  return null;
}

module.exports = {
  responseTimeMiddleware,
  requestCountingMiddleware,
  photoUploadMetricsMiddleware,
  userActivityMiddleware,
  errorRateMiddleware
};
