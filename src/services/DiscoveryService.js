import { API_BASE_URL } from '../config/api';

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
      const {
        radius = 50000,
        minAge = 18,
        maxAge = 100,
        gender = 'any',
        sortBy = 'recentActivity',
        limit = 20,
        skip = 0
      } = options;

      const queryParams = new URLSearchParams({
        lat,
        lng,
        radius,
        minAge,
        maxAge,
        gender,
        sortBy,
        limit,
        skip
      });

      const response = await fetch(
        `${API_BASE_URL}/discovery/explore?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error exploring users:', error);
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
      const queryParams = new URLSearchParams({ limit });

      const response = await fetch(
        `${API_BASE_URL}/discovery/top-picks?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error getting top picks:', error);
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
      const queryParams = new URLSearchParams({
        hoursBack,
        limit
      });

      const response = await fetch(
        `${API_BASE_URL}/discovery/recently-active?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error getting recently active users:', error);
      throw error;
    }
  }

  /**
   * Get verified profiles
   */
  async getVerifiedProfiles(lat, lng, options = {}) {
    try {
      const {
        minAge = 18,
        maxAge = 100,
        gender = 'any',
        radius = 50000,
        limit = 20,
        skip = 0
      } = options;

      const queryParams = new URLSearchParams({
        lat,
        lng,
        minAge,
        maxAge,
        gender,
        radius,
        limit,
        skip
      });

      const response = await fetch(
        `${API_BASE_URL}/discovery/verified?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error getting verified profiles:', error);
      throw error;
    }
  }

  /**
   * Initiate profile verification
   */
  async verifyProfile(verificationMethod = 'photo') {
    try {
      const response = await fetch(`${API_BASE_URL}/discovery/verify-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          verificationMethod
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error verifying profile:', error);
      throw error;
    }
  }

  /**
   * Admin: Approve profile verification
   */
  async approveProfileVerification(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/discovery/approve-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          userId
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error approving verification:', error);
      throw error;
    }
  }
}

export default DiscoveryService;
