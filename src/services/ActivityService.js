import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000/api';

export class ActivityService {
  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  // Update user's online status
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

  // Get user's online status
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

  // View a user's profile (records profile view)
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

  // Get profile views for current user
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

  // Get online status for multiple users
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

  // Send heartbeat to keep user online
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
