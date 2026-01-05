/**
 * Error handling utilities for TypeScript type safety
 */

/**
 * Type guard to check if an error is an instance of Error
 * @param {unknown} error - The error to check
 * @returns {error is Error} - True if error is an Error instance
 */
function isError(error) {
  return error instanceof Error;
}

/**
 * Safely get error message from unknown error type
 * @param {unknown} error - The error object
 * @returns {string} - The error message
 */
function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Convert unknown error to Error instance
 * @param {unknown} error - The error to convert
 * @returns {Error} - An Error instance
 */
function toError(error) {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  return new Error('An unknown error occurred');
}

module.exports = {
  isError,
  getErrorMessage,
  toError
};
