/**
 * API Helper Utilities
 * Provides consistent error handling for API requests
 */

import { getUserFriendlyMessage, extractErrorMessage } from './errorMessages';
import { validateApiResponse } from './validators';
import logger from './logger';

/**
 * Extract error message from failed API response
 */
async function extractErrorFromResponse(response) {
  let errorMessage = `Request failed with status ${response.status}`;

  try {
    const errorData = await response.json();
    errorMessage = extractErrorMessage(errorData);
  } catch {
    // If response is not JSON, use status text
    errorMessage = response.statusText || errorMessage;
  }

  return errorMessage;
}

/**
 * Handle non-OK API response
 */
async function handleErrorResponse(response, userFriendly) {
  const errorMessage = await extractErrorFromResponse(response);

  // Log API error
  logger.apiError(response.url, 'FETCH', response.status, errorMessage);

  // Return user-friendly message if requested
  const finalMessage = userFriendly ? getUserFriendlyMessage(errorMessage) : errorMessage;
  throw new Error(finalMessage);
}

/**
 * Parse JSON response with error handling
 */
async function parseJsonResponse(response, userFriendly) {
  try {
    return await response.json();
  } catch (error) {
    logger.error('Invalid JSON response from server', error);
    const message = userFriendly
      ? 'Invalid response from server. Please try again.'
      : 'Invalid JSON response from server';
    throw new Error(message);
  }
}

/**
 * Validate and extract data from API response
 */
function extractResponseData(data, requireData, userFriendly) {
  // Validate response structure
  const validation = validateApiResponse(data, { requireSuccess: true, requireData });
  if (!validation.valid) {
    logger.warn('API response validation failed', validation.error);
    throw new Error(userFriendly ? 'Invalid response format. Please try again.' : validation.error);
  }

  // Check if response indicates success (if using standard format)
  if (data.success === false) {
    const errorMsg = data.message || 'Request failed';
    logger.warn('API request failed', errorMsg);
    throw new Error(userFriendly ? getUserFriendlyMessage(errorMsg) : errorMsg);
  }

  // Return data (or data.data if using nested structure)
  const result = data.data !== undefined ? data.data : data;

  // Additional null check
  if (requireData && (result === null || result === undefined)) {
    throw new Error(
      userFriendly ? 'No data received. Please try again.' : 'Response data is null or undefined'
    );
  }

  return result;
}

/**
 * Handle API response with consistent error checking
 * @param {Response} response - Fetch response object
 * @param {Object} options - Options
 * @param {boolean} options.requireData - Require data property in response
 * @param {boolean} options.userFriendly - Return user-friendly error messages
 * @returns {Promise<Object>} Parsed response data
 * @throws {Error} If response is not ok or request failed
 */
export async function handleApiResponse(response, options = {}) {
  const { requireData = false, userFriendly = true } = options;

  // Check if response is ok before parsing JSON
  if (!response.ok) {
    await handleErrorResponse(response, userFriendly);
  }

  // Parse JSON response
  const data = await parseJsonResponse(response, userFriendly);

  // Validate and extract data
  return extractResponseData(data, requireData, userFriendly);
}

/**
 * Create fetch options with authentication
 * @param {string} authToken - JWT authentication token
 * @param {Object} [options={}] - Additional fetch options
 * @returns {Object} Fetch options object
 */
export function createAuthHeaders(authToken, options = {}) {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...options.headers,
    },
  };
}

/**
 * Make authenticated API request
 * @param {string} url - API endpoint URL
 * @param {string} authToken - JWT authentication token
 * @param {Object} [options={}] - Fetch options
 * @param {Object} [responseOptions={}] - Response handling options
 * @returns {Promise<Object>} Response data
 */
export async function authenticatedFetch(url, authToken, options = {}, responseOptions = {}) {
  logger.apiRequest(url, options.method || 'GET');
  const response = await fetch(url, createAuthHeaders(authToken, options));
  return handleApiResponse(response, responseOptions);
}

export default {
  handleApiResponse,
  createAuthHeaders,
  authenticatedFetch,
};
