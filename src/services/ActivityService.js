import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import logger from '../utils/logger';
import { validateUserId } from '../utils/validators';
import { handleApiResponse, handlePaginatedResponse, isValidationError } from '../utils/apiResponseHandler';

/**
 * ActivityService - Manages user activity tracking and online status
 *
 * Provides functionality for:
 * - Tracking user online/offline status
 * - Recording profile views
 * - Fetching activity data (who viewed profile, etc.)
 */
export class ActivityService {

  /**
   * Update the current user's online status
   * @param {boolean} isOnline - Whether the user is online
   * @returns {Promise<Object>} The updated activity data
   * @throws {Error} If validation fails or request fails
   */
  static async updateOnlineStatus(isOnline) {
    try {
      if (typeof isOnline !== 'boolean') {
        throw new Error('isOnline must be a boolean value');
      }

      const response = await api.put('/activity/update-online-status', { isOnline });
      const handled = handleApiResponse(response, 'Update online status');
      
      return handled.data;
    } catch (error) {
      if (isValidationError(error)) {
        logger.warn('Validation error updating online status:', error.validationErrors);
      } else {
        logger.error('Error updating online status:', error);
      }
      throw error;
    }
  }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update online status'));
      }

      return data.data || {};
    } catch (error) {
      logger.error('Error updating online status:', error);
      throw error;
    }
  }

  /**
   * Get another user's online status
   * @param {string} userId - The user ID to check
   * @returns {Promise<Object>} The user's online status data
   * @throws {Error} If no auth token or request fails
   */
  static async getOnlineStatus(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error('Invalid user ID provided');
      }

      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/online-status/${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch online status'));
      }

      return data.data || {};
    } catch (error) {
      logger.error('Error fetching online status:', error);
      throw error;
    }
  }

  /**
   * Record a profile view when viewing another user's profile
   * @param {string} userId - The ID of the profile being viewed
   * @returns {Promise<Object>} The profile view record
   * @throws {Error} If no auth token or request fails
   */
  static async viewProfile(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error('Invalid user ID provided');
      }

      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/view-profile/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to record profile view'));
      }

      return data.data || {};
    } catch (error) {
      logger.error('Error recording profile view:', error);
      throw error;
    }
  }

  /**
   * Get list of users who viewed the current user's profile
   * @returns {Promise<Object>} Profile views data including viewers list
   * @throws {Error} If no auth token or request fails
   */
  static async getProfileViews() {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/profile-views`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch profile views'));
      }

      return data.data || {};
    } catch (error) {
      logger.error('Error fetching profile views:', error);
      throw error;
    }
  }

  /**
   * Get online status for multiple users at once
   * @param {string[]} userIds - Array of user IDs to check
   * @returns {Promise<Object[]>} Array of user status objects
   * @throws {Error} If no auth token or request fails
   */
  static async getMultipleStatus(userIds) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('User IDs must be a non-empty array');
      }
      if (!userIds.every((id) => validateUserId(id))) {
        throw new Error('One or more invalid user IDs provided');
      }

      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch user statuses'));
      }

      return data.data?.statuses || [];
    } catch (error) {
      logger.error('Error fetching user statuses:', error);
      throw error;
    }
  }

  /**
   * Send a heartbeat to indicate the user is still online
   * Should be called periodically (e.g., every 30 seconds)
   * @returns {Promise<Object>} Heartbeat response
   * @throws {Error} If no auth token or request fails
   */
  static async sendHeartbeat() {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to send heartbeat'));
      }

      return data.data || {};
    } catch (error) {
      logger.error('Error sending heartbeat:', error);
      throw error;
    }
  }
}
