/**
 * User-Friendly Error Messages
 * Maps technical errors to user-friendly messages
 */

/**
 * Map HTTP status codes to user-friendly messages
 */
export const getHttpErrorMessage = (status, defaultMessage = 'An error occurred') => {
  const statusMessages = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Please sign in to continue.',
    403: "You don't have permission to perform this action.",
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data. Please try again.',
    422: 'The information you provided is invalid. Please check and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Our servers are experiencing issues. Please try again later.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service is currently unavailable. Please try again later.',
    504: 'Request timed out. Please try again.',
  };

  return statusMessages[status] || defaultMessage;
};

/**
 * Map API error messages to user-friendly messages
 */
export const getUserFriendlyMessage = (error, context = '') => {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorMessage = typeof error === 'string' ? error : error.message || '';

  // Common error patterns and their friendly messages
  const errorMappings = {
    network: 'Network connection failed. Please check your internet connection.',
    timeout: 'Request timed out. Please try again.',
    unauthorized: 'Please sign in to continue.',
    forbidden: "You don't have permission to perform this action.",
    'not found': 'The requested item was not found.',
    validation: 'Please check your input and try again.',
    'server error': 'Our servers are experiencing issues. Please try again later.',
    'rate limit': 'Too many requests. Please wait a moment and try again.',
  };

  // Check for common patterns
  const lowerError = errorMessage.toLowerCase();
  for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
    if (lowerError.includes(pattern)) {
      return friendlyMessage;
    }
  }

  // If it's an HTTP status code, use status message
  if (errorMessage.includes('HTTP')) {
    const statusMatch = errorMessage.match(/HTTP (\d+)/);
    if (statusMatch) {
      return getHttpErrorMessage(parseInt(statusMatch[1]), errorMessage);
    }
  }

  // Return original message if no mapping found, but make it more user-friendly
  if (errorMessage.length > 0) {
    // Remove technical details
    let friendly = errorMessage
      .replace(/HTTP \d+:/g, '')
      .replace(/Error:/g, '')
      .replace(/Failed to/g, 'Unable to')
      .trim();

    // Capitalize first letter
    if (friendly.length > 0) {
      friendly = friendly.charAt(0).toUpperCase() + friendly.slice(1);
    }

    return friendly || 'An error occurred. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extract error message from various error formats
 */
export const extractErrorMessage = (error) => {
  if (!error) {
    return 'An unexpected error occurred.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error) {
    return typeof error.error === 'string' ? error.error : error.error || 'An error occurred';
  }

  if (error.data?.message) {
    return error.data.message;
  }

  return 'An unexpected error occurred.';
};

export default {
  getHttpErrorMessage,
  getUserFriendlyMessage,
  extractErrorMessage,
};
