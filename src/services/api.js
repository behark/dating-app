import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';

// Token storage key
const AUTH_TOKEN_KEY = 'authToken';

const api = {
  // Auth token (cached in memory for performance)
  _authToken: null,

  /**
   * Set the auth token for API requests
   * @param {string} token - JWT auth token
   */
  setAuthToken(token) {
    this._authToken = token;
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
   * Clear the auth token (on logout)
   */
  clearAuthToken() {
    this._authToken = null;
  },

  /**
   * Make an API request with authentication
   */
  async request(method, endpoint, data = null, options = {}) {
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
      
      // Handle 401 Unauthorized - token may be expired
      if (response.status === 401) {
        this.clearAuthToken();
        const errorData = await response.json().catch(() => ({}));
        logger.apiError(endpoint, method, 401, 'Unauthorized - token expired or invalid');
        throw new Error(getUserFriendlyMessage(errorData.message || 'Session expired. Please login again.'));
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        logger.apiError(endpoint, method, response.status, errorMessage);
        throw new Error(getUserFriendlyMessage(errorMessage));
      }
      
      const responseData = await response.json();
      
      // Return consistent response structure
      // If response already has 'data' property, return as-is
      // Otherwise wrap in { data: response, success: true }
      if (responseData && typeof responseData === 'object') {
        if ('data' in responseData) {
          return responseData;
        }
        return { data: responseData, success: true };
      }
      
      return { data: responseData || {}, success: true };
    } catch (error) {
      // Don't double-wrap errors we already threw
      if (error.message && !error.message.includes('HTTP')) {
        throw error;
      }
      logger.apiError(endpoint, method, 'NETWORK', error);
      throw new Error(getUserFriendlyMessage(error.message || 'Network error. Please check your connection.'));
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
