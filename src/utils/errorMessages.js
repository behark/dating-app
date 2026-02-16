/* eslint-disable sonarjs/cognitive-complexity */
/**
 * Standardized Error Message Utility
 * Provides consistent, user-friendly error messages across the app
 * Never exposes technical details in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Standard error messages for common scenarios
 */
export const STANDARD_ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection and try again.',
  NETWORK_TIMEOUT: 'Request timed out. Please check your connection and try again.',
  OFFLINE: 'You appear to be offline. Please check your internet connection.',

  // Authentication errors
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "You don't have permission to perform this action.",
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',

  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_INPUT: 'The information you provided is invalid. Please check and try again.',
  REQUIRED_FIELD: 'Please fill in all required fields.',

  // Server errors
  SERVER_ERROR: 'Something went wrong on our end. Please try again in a moment.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',

  // Rate limiting
  RATE_LIMIT: "You're making requests too quickly. Please wait a moment and try again.",
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment before trying again.',

  // Not found
  NOT_FOUND: 'The requested item could not be found.',
  USER_NOT_FOUND: 'User not found.',
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',

  // Conflict
  DUPLICATE: 'This already exists. Please try a different option.',
  CONFLICT: 'This action conflicts with existing data. Please try again.',

  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  OPERATION_FAILED: 'The operation failed. Please try again.',
  LOAD_FAILED: 'Unable to load. Please try again.',
  SAVE_FAILED: 'Unable to save. Please try again.',
  DELETE_FAILED: 'Unable to delete. Please try again.',
  UPLOAD_FAILED: 'Unable to upload. Please try again.',
};

/**
 * Map HTTP status codes to user-friendly messages
 */
export const getHttpErrorMessage = (
  status,
  defaultMessage = STANDARD_ERROR_MESSAGES.UNKNOWN_ERROR
) => {
  const statusMessages = {
    400: STANDARD_ERROR_MESSAGES.VALIDATION_ERROR,
    401: STANDARD_ERROR_MESSAGES.UNAUTHORIZED,
    403: STANDARD_ERROR_MESSAGES.FORBIDDEN,
    404: STANDARD_ERROR_MESSAGES.NOT_FOUND,
    409: STANDARD_ERROR_MESSAGES.CONFLICT,
    422: STANDARD_ERROR_MESSAGES.INVALID_INPUT,
    429: STANDARD_ERROR_MESSAGES.RATE_LIMIT,
    500: STANDARD_ERROR_MESSAGES.SERVER_ERROR,
    502: STANDARD_ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    503: STANDARD_ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    504: STANDARD_ERROR_MESSAGES.NETWORK_TIMEOUT,
  };

  return statusMessages[status] || defaultMessage;
};

/**
 * Get user-friendly error message from any error format
 * Never exposes technical details in production
 * @param {Error|string|object} error - Error object, string, or response
 * @param {string} context - Optional context (e.g., 'login', 'signup')
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error, context = '') => {
  // Handle null/undefined
  if (!error) {
    return STANDARD_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Extract error message
  let errorMessage = '';
  let statusCode = null;

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.error) {
    errorMessage = typeof error.error === 'string' ? error.error : String(error.error);
  } else if (error.data?.message) {
    errorMessage = error.data.message;
  } else if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
    statusCode = error.response.status;
  } else if (error.status) {
    statusCode = error.status;
  }

  // Use status code if available
  if (statusCode) {
    return getHttpErrorMessage(statusCode);
  }

  // Normalize error message
  const lowerError = errorMessage.toLowerCase().trim();

  // Network-related errors
  if (
    lowerError.includes('network') ||
    lowerError.includes('fetch failed') ||
    lowerError.includes('networkerror') ||
    lowerError.includes('failed to fetch') ||
    lowerError.includes('err_network') ||
    lowerError.includes('connection')
  ) {
    return STANDARD_ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return STANDARD_ERROR_MESSAGES.NETWORK_TIMEOUT;
  }

  // Authentication errors
  if (
    lowerError.includes('unauthorized') ||
    lowerError.includes('token') ||
    lowerError.includes('session expired') ||
    lowerError.includes('authentication') ||
    lowerError.includes('login')
  ) {
    return STANDARD_ERROR_MESSAGES.UNAUTHORIZED;
  }

  // Rate limiting
  if (
    lowerError.includes('rate limit') ||
    lowerError.includes('too many requests') ||
    lowerError.includes('429')
  ) {
    return STANDARD_ERROR_MESSAGES.RATE_LIMIT;
  }

  // Validation errors
  if (
    lowerError.includes('validation') ||
    lowerError.includes('invalid') ||
    lowerError.includes('required') ||
    lowerError.includes('missing')
  ) {
    return STANDARD_ERROR_MESSAGES.VALIDATION_ERROR;
  }

  // Not found
  if (lowerError.includes('not found') || lowerError.includes('404')) {
    return STANDARD_ERROR_MESSAGES.NOT_FOUND;
  }

  // Server errors
  if (
    lowerError.includes('server error') ||
    lowerError.includes('internal error') ||
    lowerError.includes('500') ||
    lowerError.includes('502') ||
    lowerError.includes('503')
  ) {
    return STANDARD_ERROR_MESSAGES.SERVER_ERROR;
  }

  // Context-specific messages
  if (context) {
    const contextMessages = {
      login: 'Unable to sign in. Please check your credentials and try again.',
      signup: 'Unable to create account. Please try again.',
      profile: 'Unable to update profile. Please try again.',
      message: 'Unable to send message. Please try again.',
      match: 'Unable to process match. Please try again.',
      upload: 'Unable to upload. Please try again.',
      delete: 'Unable to delete. Please try again.',
      load: 'Unable to load. Please try again.',
    };

    if (contextMessages[context.toLowerCase()]) {
      return contextMessages[context.toLowerCase()];
    }
  }

  // In development, show more details (but still sanitized)
  if (isDevelopment && errorMessage) {
    // Remove technical prefixes but keep some context
    const sanitized = errorMessage
      .replace(/^Error:\s*/i, '')
      .replace(/^HTTP \d+:\s*/i, '')
      .replace(/^Failed to\s*/i, '')
      .trim();

    if (sanitized.length > 0 && sanitized.length < 100) {
      return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
    }
  }

  // Default fallback
  return STANDARD_ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Extract error message from various error formats
 * @param {Error|string|object} error - Error in any format
 * @returns {string} Error message
 */
export const extractErrorMessage = (error) => {
  if (!error) {
    return STANDARD_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error) {
    return typeof error.error === 'string' ? error.error : String(error.error);
  }

  if (error.data?.message) {
    return error.data.message;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  return STANDARD_ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Show standardized error alert
 * @param {string} title - Alert title
 * @param {Error|string} error - Error object or message
 * @param {string} context - Optional context
 * @param {Function} Alert - Alert function from react-native
 */
export const showErrorAlert = (title, error, context = '', Alert) => {
  if (!Alert) {
    console.error('Alert function not provided to showErrorAlert');
    return;
  }

  const message = getUserFriendlyMessage(error, context);
  Alert.alert(title || 'Error', message, [{ text: 'OK', style: 'cancel' }]);
};

export default {
  STANDARD_ERROR_MESSAGES,
  getHttpErrorMessage,
  getUserFriendlyMessage,
  extractErrorMessage,
  showErrorAlert,
};
