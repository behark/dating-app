/**
 * UserRepository Interface
 *
 * Abstract interface for user data operations.
 * Implementations can use Firebase, REST API, or any other data source.
 *
 * All methods should handle errors gracefully and return empty arrays/null
 * instead of throwing, allowing the UI to display appropriate empty states.
 */

export class UserRepository {
  /**
   * Get the current user's profile data
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} User data or null if not found/error
   */
  async getCurrentUser(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get discoverable users (excluding already swiped/matched users)
   * @param {string} userId - Current user's ID
   * @param {Object} options - Filter options
   * @param {string[]} options.excludeUserIds - User IDs to exclude
   * @param {number} options.limit - Maximum number of users to return
   * @returns {Promise<Array>} Array of user profiles (empty array on error)
   */
  async getDiscoverableUsers(userId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Update user profile data
   * @param {string} userId - The user's ID
   * @param {Object} data - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async updateUser(userId, data) {
    throw new Error('Method not implemented');
  }

  /**
   * Get a single user by ID
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} User data or null if not found/error
   */
  async getUserById(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Record a swipe action
   * @param {string} swiperId - The user who swiped
   * @param {string} swipedUserId - The user who was swiped on
   * @param {string} direction - 'left', 'right', or 'super'
   * @returns {Promise<Object>} Result with potential match info
   */
  async recordSwipe(swiperId, swipedUserId, direction) {
    throw new Error('Method not implemented');
  }

  /**
   * Clear the repository cache (if any)
   */
  clearCache() {
    // Optional: Override in implementations that use caching
  }
}

export default UserRepository;
