import { API_BASE_URL } from '../config/api';
import { ERROR_MESSAGES } from '../constants/constants';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';
import { validateCoordinates, validateNumberRange, validateUserId } from '../utils/validators';

/**
 * DiscoveryService - User discovery and exploration functionality
 *
 * Provides methods for:
 * - Exploring users based on location and filters
 * - Getting top picks and recently active users
 * - Fetching verified profiles
 * - Calculating distance between users
 */
class DiscoveryService {
  /**
   * Create a new DiscoveryService instance
   * @param {string} authToken - JWT authentication token
   */
  constructor(authToken) {
    this.authToken = authToken;
  }

  /**
   * Explore users with filters and location-based search
   * @param {number} lat - User's current latitude
   * @param {number} lng - User's current longitude
   * @param {Object} [options={}] - Search options
   * @param {number} [options.radius=50000] - Search radius in meters
   * @param {number} [options.minAge=18] - Minimum age filter
   * @param {number} [options.maxAge=100] - Maximum age filter
   * @param {string} [options.gender='any'] - Gender filter ('male', 'female', 'any')
   * @param {string} [options.sortBy='recentActivity'] - Sort order
   * @param {number} [options.limit=20] - Maximum results to return
   * @param {number} [options.skip=0] - Results to skip for pagination
   * @returns {Promise<Object>} Users matching criteria
   * @throws {Error} If request fails
   */
  async exploreUsers(lat, lng, options = {}) {
    try {
      // Validate inputs
      if (!validateCoordinates(lat, lng)) {
        throw new Error('Invalid coordinates provided');
      }

      const {
        radius = 50000,
        minAge = 18,
        maxAge = 100,
        gender = 'any',
        sortBy = 'recentActivity',
        limit = 20,
        skip = 0,
      } = options;

      // Validate options
      if (!validateNumberRange(radius, 1000, 100000)) {
        throw new Error('Radius must be between 1km and 100km');
      }
      if (!validateNumberRange(minAge, 18, 100) || !validateNumberRange(maxAge, 18, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_AGE_RANGE);
      }
      if (!validateNumberRange(limit, 1, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_LIMIT_RANGE);
      }

      const queryParams = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
        minAge: minAge.toString(),
        maxAge: maxAge.toString(),
        gender,
        sortBy,
        limit: limit.toString(),
        skip: skip.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/discovery/explore?${queryParams}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = getUserFriendlyMessage(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || [];
    } catch (error) {
      logger.error('Error exploring users:', error);
      throw error;
    }
  }

  /**
   * Get top picks - highly compatible users based on algorithm
   * @param {number} [limit=10] - Maximum number of picks to return
   * @returns {Promise<Object>} Top pick users
   * @throws {Error} If request fails
   */
  async getTopPicks(limit = 10) {
    try {
      // Validate input
      if (!validateNumberRange(limit, 1, 50)) {
        throw new Error('Limit must be between 1 and 50');
      }

      const queryParams = new URLSearchParams({ limit: limit.toString() });

      const response = await fetch(`${API_BASE_URL}/discovery/top-picks?${queryParams}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = getUserFriendlyMessage(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || { topPicks: [] };
    } catch (error) {
      logger.error('Error getting top picks:', error);
      throw error;
    }
  }

  /**
   * Get recently active users
   * @returns {Promise<Object>} Recently active users
   * @throws {Error} If request fails
   */
  async getRecentlyActiveUsers(hoursBack = 24, limit = 20) {
    try {
      // Validate inputs
      if (!validateNumberRange(hoursBack, 1, 168)) {
        throw new Error('Hours back must be between 1 and 168 (1 week)');
      }
      if (!validateNumberRange(limit, 1, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_LIMIT_RANGE);
      }

      const queryParams = new URLSearchParams({
        hoursBack: hoursBack.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/discovery/recently-active?${queryParams}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = getUserFriendlyMessage(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || { users: [] };
    } catch (error) {
      logger.error('Error getting recently active users:', error);
      throw error;
    }
  }

  /**
   * Get verified profiles
   */
  async getVerifiedProfiles(lat, lng, options = {}) {
    try {
      // Validate coordinates
      if (!validateCoordinates(lat, lng)) {
        throw new Error('Invalid coordinates provided');
      }

      const {
        minAge = 18,
        maxAge = 100,
        gender = 'any',
        radius = 50000,
        limit = 20,
        skip = 0,
      } = options;

      // Validate options
      if (!validateNumberRange(radius, 1000, 100000)) {
        throw new Error('Radius must be between 1km and 100km');
      }
      if (!validateNumberRange(minAge, 18, 100) || !validateNumberRange(maxAge, 18, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_AGE_RANGE);
      }
      if (!validateNumberRange(limit, 1, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_LIMIT_RANGE);
      }

      const queryParams = new URLSearchParams({
        lat,
        lng,
        minAge,
        maxAge,
        gender,
        radius,
        limit,
        skip,
      });

      const response = await fetch(`${API_BASE_URL}/discovery/verified?${queryParams}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = getUserFriendlyMessage(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || { users: [] };
    } catch (error) {
      logger.error('Error getting verified profiles:', error);
      throw error;
    }
  }

  /**
   * Initiate profile verification
   */
  async verifyProfile(verificationMethod = 'photo') {
    try {
      if (!['photo', 'document', 'video'].includes(verificationMethod)) {
        throw new Error('Invalid verification method. Must be photo, document, or video');
      }

      const response = await fetch(`${API_BASE_URL}/discovery/verify-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          verificationMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = getUserFriendlyMessage(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error verifying profile:', error);
      throw error;
    }
  }

  /**
   * Admin: Approve profile verification
   */
  async approveProfileVerification(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await fetch(`${API_BASE_URL}/discovery/approve-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = getUserFriendlyMessage(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error approving verification:', error);
      throw error;
    }
  }
}

export default DiscoveryService;
