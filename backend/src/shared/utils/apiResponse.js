/**
 * Standardized API Response Utility
 * Ensures consistent response format across all API endpoints
 * @module utils/apiResponse
 */

/**
 * Standard API Response Format
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} [message] - Human-readable message
 * @property {*} [data] - Response data
 * @property {string} [error] - Error message (only if success is false)
 * @property {Array<Object>} [errors] - Array of validation errors
 * @property {Object} [pagination] - Pagination metadata (for paginated responses)
 */

/**
 * Create a successful API response
 * @param {Object} options - Response options
 * @param {*} [options.data] - Response data
 * @param {string} [options.message] - Success message
 * @param {Object} [options.pagination] - Pagination metadata
 * @returns {ApiResponse} Standardized success response
 */
function success({ data = null, message = 'Success', pagination = null } = {}) {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
}

/**
 * Create an error API response
 * @param {Object} options - Error response options
 * @param {string} [options.message] - Error message
 * @param {string} [options.errorCode] - Error code or identifier
 * @param {Array<Object>} [options.errors] - Array of validation errors
 * @param {*} [options.data] - Additional error data
 * @returns {ApiResponse} Standardized error response
 */
function error({
  message = 'An error occurred',
  errorCode = undefined,
  errors = undefined,
  data = null,
} = {}) {
  // Validate input types
  if (message !== null && typeof message !== 'string') {
    throw new TypeError('message must be a string');
  }
  if (errorCode !== null && errorCode !== undefined && typeof errorCode !== 'string') {
    throw new TypeError('errorCode must be a string or null');
  }
  if (errors !== null && errors !== undefined && !Array.isArray(errors)) {
    throw new TypeError('errors must be an array or null');
  }

  const response = {
    success: false,
    message: message || 'An error occurred',
  };

  if (errorCode !== null && errorCode !== undefined && errorCode !== '') {
    response.error = errorCode;
  }

  if (errors !== null && errors !== undefined && Array.isArray(errors) && errors.length > 0) {
    response.errors = errors;
  }

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return response;
}

/**
 * Create a validation error response
 * @param {Array<Object>} validationErrors - Array of validation errors
 * @param {string} [message] - Custom error message
 * @returns {ApiResponse} Standardized validation error response
 */
function validationError(validationErrors, message = 'Validation failed') {
  return error({
    message,
    errorCode: 'VALIDATION_ERROR',
    errors: validationErrors,
  });
}

/**
 * Create a not found error response
 * @param {string} [resource] - Name of the resource that was not found
 * @returns {ApiResponse} Standardized not found response
 */
function notFound(resource = 'Resource') {
  return error({
    message: `${resource} not found`,
    errorCode: 'NOT_FOUND',
  });
}

/**
 * Create an unauthorized error response
 * @param {string} [message] - Custom error message
 * @returns {ApiResponse} Standardized unauthorized response
 */
function unauthorized(message = 'Unauthorized') {
  return error({
    message,
    errorCode: 'UNAUTHORIZED',
  });
}

/**
 * Create a forbidden error response
 * @param {string} [message] - Custom error message
 * @returns {ApiResponse} Standardized forbidden response
 */
function forbidden(message = 'Forbidden') {
  return error({
    message,
    errorCode: 'FORBIDDEN',
  });
}

/**
 * Create a paginated response
 * @param {Object} [options] - Paginated response options
 * @param {Array} [options.data=[]] - Array of items
 * @param {number} [options.page=1] - Current page number
 * @param {number} [options.limit=10] - Items per page
 * @param {number} [options.total=0] - Total number of items
 * @param {string} [options.message='Success'] - Success message
 * @returns {ApiResponse} Standardized paginated response
 */
function paginated(options = {}) {
  const { data = [], page = 1, limit = 10, total = 0, message = 'Success' } = options;
  const pages = Math.ceil(total / limit);

  return success({
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  });
}

/**
 * Express middleware to send standardized success response
 * @param {Object} res - Express response object
 * @param {number} [statusCode=200] - HTTP status code
 * @param {Object} options - Response options
 */
function sendSuccess(res, statusCode = 200, options = {}) {
  return res.status(statusCode).json(success(options));
}

/**
 * Express middleware to send standardized error response
 * @param {Object} res - Express response object
 * @param {number} [statusCode=400] - HTTP status code
 * @param {Object} options - Error response options
 */
function sendError(res, statusCode = 400, options = {}) {
  return res.status(statusCode).json(error(options));
}

module.exports = {
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  paginated,
  sendSuccess,
  sendError,
};
