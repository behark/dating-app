import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000/api';

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
   * Retrieve the authentication token from AsyncStorage
   * @returns {Promise<string|null>} The auth token or null if not found
   * @private
   */
  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  /**
   * Update the current user's online status
   * @param {boolean} isOnline - Whether the user is online
   * @returns {Promise<Object>} The updated activity data
   * @throws {Error} If no auth token or request fails
   */
  static async updateOnlineStatus(isOnline) {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/update-online-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ isOnline })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update online status');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error updating online status:', error);
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
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/online-status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch online status');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching online status:', error);
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
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/view-profile/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to record profile view');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error recording profile view:', error);
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
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile views');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching profile views:', error);
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
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/activity/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ userIds })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user statuses');
      }
      
      return data.data.statuses;
    } catch (error) {
      console.error('Error fetching user statuses:', error);
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
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send heartbeat');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      throw error;
    }
  }
}
