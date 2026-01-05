/**
 * API Response Handler
 * Helper functions for handling standardized API responses
 */

import logger from '../utils/logger';

/**
 * Handle a standardized API response
 * @param {Object} response - API response
 * @param {string} operation - Operation name for logging
 * @returns {Object} The response data
 * @throws {Error} If response indicates failure
 */
export const handleApiResponse = (response, operation = 'API call') => {
  try {
    // All responses now follow format: { success: true/false, message: '...', data?: {...}, error?: 'CODE' }
    if (response.success === false) {
      // Handle error response
      const error = new Error(response.message || 'API request failed');
      error.code = response.error;
      error.validationErrors = response.errors;

      logger.apiError(operation, 'RESPONSE', null, response.message);
      throw error;
    }

    if (response.success === true) {
      // Handle success response
      logger.debug(`[${operation}] Success:`, response.message);
      return response;
    }

    // Fallback for unexpected response format
    logger.warn(`[${operation}] Unexpected response format:`, response);
    return response;
  } catch (error) {
    logger.error(`[${operation}] Error handling response:`, error);
    throw error;
  }
};

/**
 * Handle paginated API response
 * @param {Object} response - API response with pagination
 * @returns {Object} { data: [], pagination: {...}, hasMore: boolean }
 */
export const handlePaginatedResponse = (response) => {
  const handled = handleApiResponse(response, 'Paginated API call');

  return {
    data: handled.data || [],
    pagination: handled.pagination || {},
    hasMore: handled.pagination?.hasNext || false,
    total: handled.pagination?.total || 0,
  };
};

/**
 * Extract validation errors from error response
 * @param {Error} error - Error object from failed API call
 * @returns {Object} Formatted validation errors { field: message }
 */
export const extractValidationErrors = (error) => {
  if (!error.validationErrors || !Array.isArray(error.validationErrors)) {
    return {};
  }

  return error.validationErrors.reduce((acc, validationError) => {
    acc[validationError.field] = validationError.message;
    return acc;
  }, {});
};

/**
 * Check if error is a specific type
 * @param {Error} error - Error object
 * @param {string} errorCode - Error code to check
 * @returns {boolean}
 */
export const isErrorType = (error, errorCode) => {
  return error.code === errorCode;
};

/**
 * Check if error is a validation error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  return (
    error.code === 'VALIDATION_ERROR' ||
    (error.validationErrors && error.validationErrors.length > 0)
  );
};

/**
 * Check if error is unauthorized
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isUnauthorizedError = (error) => {
  return error.code === 'UNAUTHORIZED' || error.statusCode === 401;
};

/**
 * Check if error is rate limited
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isRateLimitError = (error) => {
  return error.code === 'RATE_LIMIT_EXCEEDED' || error.statusCode === 429;
};

/**
 * Wrapper for API calls with standardized error handling
 * @param {Function} apiCall - Function that makes the API call
 * @param {string} operation - Operation name for logging
 * @returns {Promise} Promise that resolves with handled response
 */
export const withErrorHandling = async (apiCall, operation = 'API call') => {
  try {
    const response = await apiCall();
    return handleApiResponse(response, operation);
  } catch (error) {
    logger.error(`[${operation}] Failed:`, error);
    throw error;
  }
};

export default {
  handleApiResponse,
  handlePaginatedResponse,
  extractValidationErrors,
  isErrorType,
  isValidationError,
  isUnauthorizedError,
  isRateLimitError,
  withErrorHandling,
};
