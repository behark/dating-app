/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 * TD-006: API Response Standardization
 */

/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {number} [statusCode=200] - HTTP status code (200, 201, etc.)
 * @param {Object} [options={}] - Response options
 * @param {string} [options.message] - Success message
 * @param {*} [options.data] - Response data
 * @param {Object} [options.pagination] - Pagination info (optional)
 * @param {Object} [options.meta] - Additional metadata (optional)
 * @returns {Object} Express response
 */
const sendSuccess = (res, statusCode = 200, options = {}) => {
  const response = {
    success: true,
    message: options.message || 'Operation completed successfully',
    data: options.data || null,
  };

  // Add pagination if provided
  if (options.pagination) {
    response.pagination = {
      page: options.pagination.page || 1,
      limit: options.pagination.limit || 10,
      total: options.pagination.total || 0,
      pages:
        options.pagination.pages ||
        Math.ceil((options.pagination.total || 0) / (options.pagination.limit || 10)),
      hasNext: options.pagination.hasNext || false,
      hasPrev: options.pagination.hasPrev || false,
    };
  }

  // Add metadata if provided
  if (options.meta) {
    response.meta = options.meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {number} [statusCode=500] - HTTP status code (400, 401, 404, 500, etc.)
 * @param {Object} [options={}] - Error options
 * @param {string} [options.message] - Error message
 * @param {string} [options.error] - Error code/type
 * @param {Array} [options.errors] - Validation errors array
 * @param {*} [options.details] - Additional error details
 * @param {string[]} [options.suggestions] - Suggested actions
 * @returns {Object} Express response
 */
const sendError = (res, statusCode = 500, options = {}) => {
  const response = {
    success: false,
    message: options.message || 'An error occurred',
  };

  // Add error code/type if provided
  if (options.error) {
    response.error = options.error;
  }

  // Add validation errors if provided
  if (options.errors && Array.isArray(options.errors)) {
    response.errors = options.errors;
  }

  // Add error details if provided
  if (options.details) {
    response.details = options.details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 * @param {string} message - Custom validation message
 * @returns {Object} Express response
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
  let formattedErrors = [];

  if (Array.isArray(errors)) {
    formattedErrors = errors;
  } else if (typeof errors === 'object' && errors.errors) {
    // Mongoose validation errors
    formattedErrors = Object.values(errors.errors).map((err) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
  } else if (typeof errors === 'object') {
    // Custom error object
    formattedErrors = Object.entries(errors).map(([field, error]) => ({
      field,
      message: typeof error === 'string' ? error : error.message,
      value: error.value || null,
    }));
  }

  return sendError(res, 400, {
    message,
    error: 'VALIDATION_ERROR',
    errors: formattedErrors,
    details: null,
  });
};

/**
 * Not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name (e.g., 'User', 'Match')
 * @param {string} identifier - Resource identifier
 * @returns {Object} Express response
 */
const sendNotFound = (res, resource = 'Resource', identifier = '') => {
  const message = identifier
    ? `${resource} with ID '${identifier}' not found`
    : `${resource} not found`;

  return sendError(res, 404, {
    message,
    error: 'NOT_FOUND',
    errors: [],
    details: null,
  });
};

/**
 * Unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 * @returns {Object} Express response
 */
const sendUnauthorized = (res, message = 'Authentication required') => {
  return sendError(res, 401, {
    message,
    error: 'UNAUTHORIZED',
    errors: [],
    details: null,
  });
};

/**
 * Forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 * @returns {Object} Express response
 */
const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(res, 403, {
    message,
    error: 'FORBIDDEN',
    errors: [],
    details: null,
  });
};

/**
 * Rate limit error response
 * @param {Object} res - Express response object
 * @param {Object} [options={}] - Rate limit options
 * @param {string} [options.message] - Rate limit message
 * @param {number} [options.limit] - Rate limit
 * @param {number} [options.remaining] - Remaining requests
 * @param {Date|string} [options.resetTime] - Reset time
 * @returns {Object} Express response
 */
const sendRateLimit = (res, options = {}) => {
  return sendError(res, 429, {
    message: options.message || 'Rate limit exceeded',
    error: 'RATE_LIMIT_EXCEEDED',
    errors: [],
    details: {
      limit: options.limit,
      remaining: options.remaining || 0,
      resetTime: options.resetTime,
    },
  });
};

/**
 * Paginated response helper
 * @param {Array} data - Array of data items
 * @param {Object} [options={}] - Pagination options
 * @param {number|string} [options.page] - Current page
 * @param {number|string} [options.limit] - Items per page
 * @param {number|string} [options.total] - Total items count
 * @param {string} [options.message] - Success message
 * @param {Object} [options.meta] - Additional metadata
 * @returns {Object} Pagination response options
 */
const createPaginatedResponse = (data, options = {}) => {
  const page = parseInt(String(options.page || 1)) || 1;
  const limit = parseInt(String(options.limit || 10)) || 10;
  const total = parseInt(String(options.total || data.length)) || data.length;
  const pages = Math.ceil(total / limit);

  return {
    message: options.message || 'Data retrieved successfully',
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
    meta: options.meta,
  };
};

/**
 * Handle async controller errors
 * @param {Function} fn - Async controller function
 * @returns {import('express').RequestHandler} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Controller error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return sendValidationError(res, error);
    }

    if (error.name === 'CastError') {
      return sendError(res, 400, {
        message: 'Invalid ID format',
        error: 'INVALID_ID',
        errors: [],
        details: null,
      });
    }

    if (error.code === 11000) {
      return sendError(res, 400, {
        message: 'Duplicate entry found',
        error: 'DUPLICATE_ENTRY',
        errors: [],
        details: error.keyValue,
      });
    }

    // Default server error
    return sendError(res, 500, {
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      error: 'INTERNAL_SERVER_ERROR',
      errors: [],
      details: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  createPaginatedResponse,
  asyncHandler,
};
