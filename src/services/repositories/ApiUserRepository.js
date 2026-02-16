/**
 * ApiUserRepository
 *
 * Implementation of UserRepository using the REST API backend.
 * This is an alternative to FirebaseUserRepository that uses your
 * MongoDB backend deployed on Render.
 *
 * Returns empty arrays/null on errors instead of throwing.
 */

import { API_URL } from '../../config/api';
import logger from '../../utils/logger';
import { UserRepository } from './UserRepository';

// Simple in-memory cache for user profiles
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ApiUserRepository extends UserRepository {
  constructor(authToken = null) {
    super();
    this.authToken = authToken;
    this.cache = userCache;
    this.cacheDuration = CACHE_DURATION;

    // Start periodic cache cleanup
    this.cleanupInterval = setInterval(() => this.cleanupCache(), CACHE_DURATION);
  }

  /**
   * Set the auth token for API requests
   * @param {string} token - JWT auth token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Make an authenticated API request
   * @private
   */
  async apiRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error(`API Error [${endpoint}]`, null, {
          endpoint,
          status: response.status,
          message: data.message || response.statusText,
        });
        return null;
      }

      return data;
    } catch (error) {
      logger.error(`API Request Failed [${endpoint}]`, error, { endpoint });
      return null;
    }
  }

  /**
   * Get the current user's profile data
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} User data or null if not found/error
   */
  async getCurrentUser(userId) {
    try {
      if (!userId) {
        logger.warn('ApiUserRepository: No userId provided to getCurrentUser');
        return null;
      }

      // Use /profile/me endpoint for current user (more reliable than /users/:id)
      const response = await this.apiRequest('/profile/me');

      if (!response?.success || !response?.data) {
        return null;
      }

      const user = response.data.user || response.data;
      return { ...user, uid: user._id || user.uid || userId };
    } catch (error) {
      logger.error('ApiUserRepository: Error getting current user', error, { userId });
      return null;
    }
  }

  /**
   * Get discoverable users
   * @param {string} userId - Current user's ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of user profiles (empty array on error)
   */
  async getDiscoverableUsers(userId, options = {}) {
    try {
      if (!userId) {
        logger.warn('ApiUserRepository: No userId provided to getDiscoverableUsers');
        return [];
      }

      const {
        limit = 50,
        lat,
        lng,
        radius = 50000,
        minAge = 18,
        maxAge = 100,
        gender = 'any',
      } = options;

      // Build query params - lat and lng are required by backend
      // If not provided, use NYC as default (where many demo profiles are) instead of (0,0)
      const finalLat = lat || 40.7128; // New York City
      const finalLng = lng || -74.006;

      if (!lat || !lng) {
        logger.warn(
          'ApiUserRepository: Missing lat/lng for discovery, using NYC default location (40.7128, -74.0060)'
        );
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        lat: finalLat.toString(),
        lng: finalLng.toString(),
        ...(radius && { radius: radius.toString() }),
        minAge: minAge.toString(),
        maxAge: maxAge.toString(),
        gender,
      });

      const response = await this.apiRequest(`/discover?${params}`, {
        headers: { 'X-User-ID': userId },
      });

      if (!response?.success || !response?.data) {
        // Log the actual response to debug why profiles aren't showing
        logger.warn('ApiUserRepository: Discovery API returned no data', {
          userId,
          success: response?.success,
          data: response?.data,
          message: response?.message,
          error: response?.error,
        });
        // Return empty array on error - allows UI to show "No users found"
        return [];
      }

      const users = response.data.users || response.data || [];

      // Normalize user objects and cache them
      return users.map((user) => {
        // Handle photos being either objects with url property or direct URL strings
        const firstPhoto = user.photos?.[0];
        const photoURL =
          user.photoURL || (typeof firstPhoto === 'string' ? firstPhoto : firstPhoto?.url) || null;

        const normalizedUser = {
          ...user,
          id: user._id || user.id,
          uid: user._id || user.id,
          photoURL,
        };

        // Cache the user
        this.cache.set(normalizedUser.id, {
          data: normalizedUser,
          cachedAt: Date.now(),
        });

        return normalizedUser;
      });
    } catch (error) {
      logger.error('ApiUserRepository: Error getting discoverable users', error, {
        userId,
        options,
      });
      return [];
    }
  }

  /**
   * Update user profile data
   * @param {string} userId - The user's ID
   * @param {Object} data - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async updateUser(userId, data) {
    try {
      if (!userId) {
        logger.warn('ApiUserRepository: No userId provided to updateUser');
        return false;
      }

      const response = await this.apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response?.success) {
        // Invalidate cache
        this.cache.delete(userId);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('ApiUserRepository: Error updating user', error, { userId });
      return false;
    }
  }

  /**
   * Get a single user by ID
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} User data or null if not found/error
   */
  async getUserById(userId) {
    try {
      if (!userId) {
        return null;
      }

      // Check cache first
      const cached = this.cache.get(userId);
      if (cached && Date.now() - cached.cachedAt < this.cacheDuration) {
        return cached.data;
      }

      const response = await this.apiRequest(`/users/${userId}`);

      if (!response?.success || !response?.data) {
        return null;
      }

      const user = response.data.user || response.data;
      const normalizedUser = {
        ...user,
        id: user._id || user.id,
        uid: user._id || user.id,
      };

      // Update cache
      this.cache.set(userId, {
        data: normalizedUser,
        cachedAt: Date.now(),
      });

      return normalizedUser;
    } catch (error) {
      logger.error('ApiUserRepository: Error getting user by ID', error, { userId });
      return null;
    }
  }

  /**
   * Record a swipe action
   * @param {string} swiperId - The user who swiped
   * @param {string} swipedUserId - The user who was swiped on
   * @param {string} direction - 'left', 'right', or 'super'
   * @returns {Promise<Object>} Result with potential match info
   */
  async recordSwipe(swiperId, swipedUserId, direction) {
    try {
      if (!swiperId || !swipedUserId) {
        return { success: false, isMatch: false };
      }

      const response = await this.apiRequest('/swipe', {
        method: 'POST',
        headers: { 'X-User-ID': swiperId },
        body: JSON.stringify({
          targetUserId: swipedUserId,
          direction: direction === 'super' ? 'right' : direction,
          isSuperLike: direction === 'super',
        }),
      });

      if (response?.success) {
        return {
          success: true,
          isMatch: response.data?.isMatch || false,
          matchId: response.data?.matchId || null,
        };
      }

      return { success: false, isMatch: false };
    } catch (error) {
      logger.error('ApiUserRepository: Error recording swipe', error, {
        swiperId,
        swipedUserId,
        direction,
      });
      return { success: false, isMatch: false };
    }
  }

  /**
   * Clear the repository cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Cleanup expired cache entries
   * @private
   */
  cleanupCache() {
    const now = Date.now();
    for (const [userId, cachedData] of this.cache.entries()) {
      if (now - cachedData.cachedAt > this.cacheDuration) {
        this.cache.delete(userId);
      }
    }
  }

  /**
   * Cleanup resources when repository is no longer needed
   */
  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clearCache();
  }
}

// Singleton instance for convenience
let instance = null;

export const getApiUserRepository = (authToken) => {
  if (!instance) {
    instance = new ApiUserRepository(authToken);
  } else if (authToken) {
    instance.setAuthToken(authToken);
  }
  return instance;
};

export default ApiUserRepository;
