/**
 * Custom Application Error Classes
 * 
 * Provides standardized error handling with:
 * - HTTP status codes
 * - Error codes for client identification
 * - Optional error details
 * - Operational vs programming error distinction
 */

/**
 * Base Application Error
 * 
 * All custom errors should extend this class
 */
class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - User-friendly error message
   * @param {string} code - Error code for client identification
   * @param {any} [details=null] - Additional error details
   * @param {boolean} [isOperational=true] - Whether this is an expected operational error
   */
  constructor(statusCode, message, code, details = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 * Used for invalid input, missing fields, etc.
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Unauthorized Error (401)
 * Used for authentication failures
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(401, message, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error (403)
 * Used for authorization failures (authenticated but not allowed)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message, 'FORBIDDEN');
  }
}

/**
 * Not Found Error (404)
 * Used when a requested resource doesn't exist
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

/**
 * Conflict Error (409)
 * Used for duplicate resources, race conditions, etc.
 */
class ConflictError extends AppError {
  constructor(message, details = null) {
    super(409, message, 'CONFLICT', details);
  }
}

/**
 * Rate Limit Error (429)
 * Used when user exceeds rate limits
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please try again later.', details = null) {
    super(429, message, 'RATE_LIMIT_EXCEEDED', details);
  }
}

/**
 * Internal Server Error (500)
 * Used for unexpected server errors
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error', isOperational = false) {
    super(500, message, 'INTERNAL_SERVER_ERROR', null, isOperational);
  }
}

/**
 * Service Unavailable Error (503)
 * Used when a service or database is temporarily unavailable
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(503, message, 'SERVICE_UNAVAILABLE');
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
};
