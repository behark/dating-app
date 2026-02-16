/**
 * Service Utilities
 * Common patterns for API service calls with offline support and error handling
 *
 * WHY: Multiple services repeat the same patterns for:
 * - Offline detection and cache fallback
 * - Error logging with context
 * - API response handling
 *
 * HOW TO USE:
 * import { withOfflineCache, withErrorHandling } from '../utils/serviceUtils';
 *
 * // Wrap API call with offline cache fallback
 * const data = await withOfflineCache(
 *   () => api.get('/profile/me'),
 *   () => OfflineService.getCachedUserProfile(),
 *   'profile'
 * );
 *
 * // Wrap any async operation with standardized error handling
 * const result = await withErrorHandling(
 *   () => someApiCall(),
 *   'Operation Name',
 *   { userId, extra: 'context' }
 * );
 */

import OfflineService from '../services/OfflineService';
import logger from './logger';
import { handleApiResponse } from './apiResponseHandler';

/**
 * Execute an API call with automatic offline cache fallback
 *
 * @param {Function} apiFn - Async function that makes the API call
 * @param {Function} cacheFn - Async function that retrieves cached data
 * @param {string} operationName - Name for logging
 * @param {Object} options - Additional options
 * @param {boolean} options.preferCache - If true, try cache first even when online (default: false)
 * @param {Function} options.onCacheUsed - Callback when cache is used
 * @param {Function} options.cacheResult - Function to cache the API result
 * @returns {Promise<any>} API response data or cached data
 */
export const withOfflineCache = async (apiFn, cacheFn, operationName, options = {}) => {
  const { preferCache = false, onCacheUsed, cacheResult } = options;
  const isOnline = OfflineService.getNetworkStatus();

  // If offline or preferCache, try cache first
  if (!isOnline || preferCache) {
    try {
      const cached = await cacheFn();
      if (cached) {
        logger.info(`[${operationName}] Using cached data (${isOnline ? 'preferred' : 'offline'})`);
        if (onCacheUsed) onCacheUsed(cached);

        // If online and preferCache, still try to fetch fresh data in background
        if (isOnline && preferCache) {
          apiFn()
            .then((result) => {
              if (cacheResult) cacheResult(result);
              return result;
            })
            .catch((err) => logger.debug(`[${operationName}] Background refresh failed:`, err));
        }

        return cached;
      }
    } catch (cacheError) {
      logger.debug(`[${operationName}] Cache retrieval failed:`, cacheError);
    }

    // If offline and no cache, throw
    if (!isOnline) {
      throw new Error(
        `No cached data available for ${operationName}. Please check your connection.`
      );
    }
  }

  // Online: make API call
  try {
    const response = await apiFn();
    const result = handleApiResponse(response, operationName);

    // Cache successful result
    if (cacheResult && result) {
      try {
        await cacheResult(result.data || result);
      } catch (cacheError) {
        logger.debug(`[${operationName}] Failed to cache result:`, cacheError);
      }
    }

    return result.data || result;
  } catch (apiError) {
    // On API error, try cache fallback
    logger.error(`[${operationName}] API error, trying cache fallback:`, apiError);

    try {
      const cached = await cacheFn();
      if (cached) {
        logger.info(`[${operationName}] Using cached data (error fallback)`);
        if (onCacheUsed) onCacheUsed(cached);
        return cached;
      }
    } catch (cacheError) {
      logger.debug(`[${operationName}] Cache fallback failed:`, cacheError);
    }

    throw apiError;
  }
};

/**
 * Wrap an async operation with standardized error handling and logging
 *
 * @param {Function} fn - Async function to execute
 * @param {string} operationName - Name for logging
 * @param {Object} context - Additional context to include in logs
 * @returns {Promise<any>} Result of the function
 */
export const withErrorHandling = async (fn, operationName, context = {}) => {
  try {
    return await fn();
  } catch (error) {
    logger.error(`[${operationName}] Error:`, {
      message: error.message,
      code: error.code,
      ...context,
    });
    throw error;
  }
};

/**
 * Create a service method with built-in offline support
 * Returns a function that handles the common pattern of:
 * 1. Check offline status
 * 2. Try cache if offline
 * 3. Make API call
 * 4. Cache result
 * 5. Fallback to cache on error
 *
 * @param {Object} config
 * @param {Function} config.apiCall - Function that returns the API call promise
 * @param {Function} config.getCache - Function to get cached data
 * @param {Function} config.setCache - Function to cache the result
 * @param {string} config.name - Operation name for logging
 * @returns {Function} Wrapped service method
 */
export const createServiceMethod = (config) => {
  const { apiCall, getCache, setCache, name } = config;

  return async (...args) => {
    return withOfflineCache(
      () => apiCall(...args),
      () => getCache?.(...args),
      name,
      {
        cacheResult: setCache ? (result) => setCache(result, ...args) : undefined,
      }
    );
  };
};

/**
 * Validate required parameters before making an API call
 *
 * @param {Object} params - Parameters to validate
 * @param {string[]} required - Array of required parameter names
 * @param {string} operationName - Name for error messages
 * @throws {Error} If any required parameter is missing
 */
export const validateRequired = (params, required, operationName) => {
  const missing = required.filter((key) => {
    const value = params[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(`${operationName}: Missing required parameters: ${missing.join(', ')}`);
  }
};

export default {
  withOfflineCache,
  withErrorHandling,
  createServiceMethod,
  validateRequired,
};
