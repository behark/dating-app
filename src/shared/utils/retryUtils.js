/**
 * Retry Utility with Exponential Backoff
 * Handles retry logic for failed API calls
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry (must return a Promise)
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {number} options.backoffMultiplier - Backoff multiplier (default: 2)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried (default: retry on network errors)
 * @returns {Promise} Result of the function
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = (error) => {
      // Default: retry on network errors, timeouts, and 5xx errors
      if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
        return true;
      }
      if (error.statusCode >= 500 && error.statusCode < 600) {
        return true;
      }
      if (error.message?.includes('Network') || error.message?.includes('timeout')) {
        return true;
      }
      return false;
    },
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted retries
      if (attempt >= maxRetries) {
        break;
      }

      // Don't retry if shouldRetry returns false
      if (!shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Retry with fixed delay
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retries (default: 3)
 * @param {number} delay - Fixed delay in ms (default: 1000)
 * @returns {Promise} Result of the function
 */
export const retryWithFixedDelay = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export default {
  retryWithBackoff,
  retryWithFixedDelay,
};
