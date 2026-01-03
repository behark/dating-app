import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export class SocialMediaService {
  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  // Connect Spotify account
  static async connectSpotify(spotifyData) {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/social-media/connect-spotify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(spotifyData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect Spotify');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error connecting Spotify:', error);
      throw error;
    }
  }

  // Connect Instagram account
  static async connectInstagram(instagramData) {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/social-media/connect-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(instagramData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect Instagram');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error connecting Instagram:', error);
      throw error;
    }
  }

  // Disconnect Spotify
  static async disconnectSpotify() {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/social-media/disconnect-spotify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to disconnect Spotify');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
      throw error;
    }
  }

  // Disconnect Instagram
  static async disconnectInstagram() {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/social-media/disconnect-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to disconnect Instagram');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error disconnecting Instagram:', error);
      throw error;
    }
  }

  // Get social media profiles for a user (public view)
  static async getSocialMedia(userId) {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/social-media/${userId}/social-media`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch social media');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching social media:', error);
      throw error;
    }
  }
}
