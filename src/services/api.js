import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { getUserFriendlyMessage, STANDARD_ERROR_MESSAGES } from '../utils/errorMessages';
import rateLimiter from '../utils/rateLimiter';
import logger from '../utils/logger';

// Token storage keys
const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const api = {
  // Auth token (cached in memory for performance)
  _authToken: null,
  // Refresh token (cached in memory)
  _refreshToken: null,
  // Flag to prevent multiple simultaneous refresh attempts
  _isRefreshing: false,
  // Queue of requests waiting for token refresh
  _refreshQueue: [],

  /**
   * Set the auth token for API requests
   * @param {string} token - JWT auth token
   */
  setAuthToken(token) {
    this._authToken = token;
  },

  /**
   * Set the refresh token
   * @param {string} token - JWT refresh token
   */
  setRefreshToken(token) {
    this._refreshToken = token;
  },

  /**
   * Get the auth token (from memory or storage)
   * @returns {Promise<string|null>} The auth token
   */
  async getAuthToken() {
    if (this._authToken) {
      return this._authToken;
    }
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        this._authToken = token;
      }
      return token;
    } catch (error) {
      logger.error('Error getting auth token:', error);
      return null;
    }
  },

  /**
   * Get the refresh token (from memory or storage)
   * @returns {Promise<string|null>} The refresh token
   */
  async getRefreshToken() {
    if (this._refreshToken) {
      return this._refreshToken;
    }
    try {
      const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (token) {
        this._refreshToken = token;
      }
      return token;
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Clear all auth tokens (on logout)
   */
  clearAuthToken() {
    this._authToken = null;
    this._refreshToken = null;
  },

  /**
   * Attempt to refresh the auth token using the refresh token
   * @returns {Promise<string|null>} New auth token or null if refresh failed
   */
  async refreshAuthToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this._isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise((resolve, reject) => {
        this._refreshQueue.push({ resolve, reject });
      });
    }

    this._isRefreshing = true;

    try {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        logger.debug('No refresh token available for token refresh');
        return null;
      }

      logger.debug('Attempting to refresh auth token...');

      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.debug('Token refresh failed:', errorData.message || response.status);
        return null;
      }

      const data = await response.json();
      // Handle standardized response format: { success: true, data: { tokens: {...} } }
      const newAuthToken = data.data?.tokens?.accessToken || data.data?.authToken || data.authToken;
      const newRefreshToken =
        data.data?.tokens?.refreshToken || data.data?.refreshToken || data.refreshToken;

      if (newAuthToken) {
        // Update tokens in memory and storage
        this._authToken = newAuthToken;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, newAuthToken);

        if (newRefreshToken) {
          this._refreshToken = newRefreshToken;
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        logger.debug('Auth token refreshed successfully');

        // Resolve all queued requests with the new token
        this._refreshQueue.forEach(({ resolve }) => resolve(newAuthToken));
        this._refreshQueue = [];

        return newAuthToken;
      }

      return null;
    } catch (error) {
      logger.error('Error refreshing auth token:', error);
      // Reject all queued requests
      this._refreshQueue.forEach(({ reject }) => reject(error));
      this._refreshQueue = [];
      return null;
    } finally {
      this._isRefreshing = false;
    }
  },

  /**
   * Make an API request with authentication and automatic token refresh
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} options - Additional options
   * @param {boolean} _isRetry - Internal flag to prevent infinite retry loops
   */
  async request(method, endpoint, data = null, options = {}, _isRetry = false) {
    // Client-side rate limiting (unless explicitly bypassed)
    if (!options.bypassRateLimit && !_isRetry) {
      const rateLimitKey = `${method}:${endpoint}`;
      const maxRequests = options.maxRequests || 10; // Default: 10 requests
      const windowMs = options.rateLimitWindow || 1000; // Default: 1 second window

      if (!rateLimiter.canMakeRequest(rateLimitKey, maxRequests, windowMs)) {
        const timeRemaining = rateLimiter.getTimeUntilNextRequest(rateLimitKey, windowMs);
        const error = new Error(STANDARD_ERROR_MESSAGES.RATE_LIMIT);
        error.code = 'RATE_LIMIT';
        error.retryAfter = Math.ceil(timeRemaining / 1000);
        throw error;
      }
    }

    const url = `${API_URL}${endpoint}`;

    // Get auth token
    const authToken = await this.getAuthToken();

    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Handle 401 Unauthorized - token may be expired, attempt refresh
      if (response.status === 401) {
        // Don't retry if this is already a retry or if hitting auth endpoints
        const isAuthEndpoint = endpoint.includes('/auth/');

        if (!_isRetry && !isAuthEndpoint) {
          logger.debug('Received 401, attempting token refresh...');

          // Try to refresh the token
          const newToken = await this.refreshAuthToken();

          if (newToken) {
            // Retry the original request with the new token
            logger.debug('Token refreshed, retrying original request...');
            return this.request(method, endpoint, data, options, true);
          }
        }

        // Token refresh failed or not applicable - clear tokens and throw
        this.clearAuthToken();
        const errorData = await response.json().catch(() => ({}));
        logger.apiError(endpoint, method, 401, 'Unauthorized - token expired or invalid');
        throw new Error(
          getUserFriendlyMessage(errorData.message || 'Session expired. Please login again.')
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle standardized error format: { success: false, message: '...', error: 'CODE' }
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        logger.apiError(endpoint, method, response.status, errorMessage);

        // Create error object with additional info from standardized format
        const error = new Error(getUserFriendlyMessage(errorMessage));
        error.code = errorData.error;
        error.statusCode = response.status;
        error.validationErrors = errorData.errors;

        throw error;
      }

      // All responses now follow standardized format: { success: true, message: '...', data: {...}, pagination?: {...} }
      // Return the entire response to maintain access to success, message, pagination, etc.
      return await response.json();
    } catch (error) {
      // Don't double-wrap errors we already threw (they already have user-friendly messages)
      if (error.message && error.code) {
        throw error;
      }

      // Handle network errors
      if (
        error.message?.includes('Network') ||
        error.message?.includes('fetch') ||
        error.name === 'TypeError' ||
        error.name === 'NetworkError'
      ) {
        logger.apiError(endpoint, method, 'NETWORK', error);
        const networkError = new Error(STANDARD_ERROR_MESSAGES.NETWORK_ERROR);
        networkError.code = 'NETWORK_ERROR';
        throw networkError;
      }

      // Log and wrap other errors
      logger.apiError(endpoint, method, 'ERROR', error);
      const friendlyError = new Error(getUserFriendlyMessage(error, options.context || ''));
      friendlyError.code = error.code || 'UNKNOWN_ERROR';
      throw friendlyError;
    }
  },

  get(endpoint, options) {
    return this.request('GET', endpoint, null, options);
  },

  post(endpoint, data, options) {
    return this.request('POST', endpoint, data, options);
  },

  put(endpoint, data, options) {
    return this.request('PUT', endpoint, data, options);
  },

  patch(endpoint, data, options) {
    return this.request('PATCH', endpoint, data, options);
  },

  delete(endpoint, options) {
    return this.request('DELETE', endpoint, null, options);
  },
};

export default api;
