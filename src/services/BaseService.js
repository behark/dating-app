import logger from '../utils/logger';
import api from './api';

/**
 * Base Service Class
 *
 * Provides common functionality for all services including:
 * - Standardized error handling
 * - Logging
 * - API call patterns
 * - Response normalization
 */
export class BaseService {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  /**
   * Execute API call with standardized error handling
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data
   * @param {object} options - Additional options
   * @returns {Promise} API response
   */
  async apiCall(method, endpoint, data = null, options = {}) {
    try {
      let response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await api.get(endpoint, options);
          break;
        case 'POST':
          response = await api.post(endpoint, data, options);
          break;
        case 'PUT':
          response = await api.put(endpoint, data, options);
          break;
        case 'PATCH':
          response = await api.patch(endpoint, data, options);
          break;
        case 'DELETE':
          response = await api.delete(endpoint, options);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response;
    } catch (error) {
      logger.error(`[${this.serviceName}] API call failed`, error, {
        method,
        endpoint,
        data: typeof data === 'object' ? Object.keys(data) : data,
      });
      throw error;
    }
  }

  /**
   * GET request with error handling
   */
  async get(endpoint, options = {}) {
    return this.apiCall('GET', endpoint, null, options);
  }

  /**
   * POST request with error handling
   */
  async post(endpoint, data, options = {}) {
    return this.apiCall('POST', endpoint, data, options);
  }

  /**
   * PUT request with error handling
   */
  async put(endpoint, data, options = {}) {
    return this.apiCall('PUT', endpoint, data, options);
  }

  /**
   * PATCH request with error handling
   */
  async patch(endpoint, data, options = {}) {
    return this.apiCall('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request with error handling
   */
  async delete(endpoint, options = {}) {
    return this.apiCall('DELETE', endpoint, null, options);
  }

  /**
   * Log service-specific information
   */
  logInfo(message, data = {}) {
    logger.info(`[${this.serviceName}] ${message}`, data);
  }

  /**
   * Log service-specific errors
   */
  logError(message, error, data = {}) {
    logger.error(`[${this.serviceName}] ${message}`, error, data);
  }

  /**
   * Log service-specific warnings
   */
  logWarn(message, data = {}) {
    logger.warn(`[${this.serviceName}] ${message}`, data);
  }

  /**
   * Validate required parameters
   */
  validateRequired(params, requiredFields) {
    const missing = requiredFields.filter(field => !params[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Handle common CRUD operations
   */
  async create(endpoint, data, options = {}) {
    this.validateRequired(data, ['id']); // Most create operations need an ID
    return this.post(endpoint, data, options);
  }

  async read(endpoint, id, options = {}) {
    return this.get(`${endpoint}/${id}`, options);
  }

  async update(endpoint, id, data, options = {}) {
    return this.put(`${endpoint}/${id}`, data, options);
  }

  async remove(endpoint, id, options = {}) {
    return this.delete(`${endpoint}/${id}`, options);
  }

  async list(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.get(url, options);
  }
}

export default BaseService;