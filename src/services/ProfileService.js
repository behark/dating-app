import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { ERROR_MESSAGES } from '../constants/constants';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';
import { validateNotEmpty, validateUserId } from '../utils/validators';

export class ProfileService {
  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      logger.error('Error retrieving auth token:', error);
      return null;
    }
  }

  static async getProfile(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await fetch(`${API_URL}/profile/${userId}`);

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
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch profile'));
      }

      return data.data?.user || null;
    } catch (error) {
      logger.error('Error fetching profile:', error);
      throw error;
    }
  }

  static async getMyProfile() {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/me`, {
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
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch profile'));
      }

      return data.data?.user || null;
    } catch (error) {
      logger.error('Error fetching my profile:', error);
      throw error;
    }
  }

  static async updateProfile(profileData) {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(profileData),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update profile'));
      }

      return data.data?.user || null;
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }

  static async uploadPhotos(photos) {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ photos }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to upload photos'));
      }

      return data.data?.photos || [];
    } catch (error) {
      logger.error('Error uploading photos:', error);
      throw error;
    }
  }

  static async reorderPhotos(photoIds) {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/photos/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ photoIds }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to reorder photos'));
      }

      return data.data?.photos || [];
    } catch (error) {
      logger.error('Error reordering photos:', error);
      throw error;
    }
  }

  static async deletePhoto(photoId) {
    try {
      if (!validateNotEmpty(photoId)) {
        throw new Error('Invalid photo ID provided');
      }

      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/photos/${photoId}`, {
        method: 'DELETE',
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
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to delete photo'));
      }

      return data.data?.photos || [];
    } catch (error) {
      logger.error('Error deleting photo:', error);
      throw error;
    }
  }

  static validatePhotos(photos) {
    if (!Array.isArray(photos)) {
      throw new Error('Photos must be an array');
    }

    if (photos.length < 1 || photos.length > 6) {
      throw new Error('You must upload between 1 and 6 photos');
    }

    return true;
  }

  static validateBio(bio) {
    if (bio && bio.length > 500) {
      throw new Error('Bio must not exceed 500 characters');
    }
    return true;
  }

  static validateAge(age) {
    if (age < 18 || age > 100) {
      throw new Error('Age must be between 18 and 100');
    }
    return true;
  }
}
