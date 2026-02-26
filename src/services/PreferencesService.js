import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance as calcDist } from '../utils/distanceCalculator';
import { handleApiResponse } from '../utils/apiResponseHandler';
import logger from '../utils/logger';
import api from './api';

export class PreferencesService {
  static async getUserPreferences(userId) {
    try {
      // Try to get preferences from backend API first
      try {
        const response = await api.get('/profile/me');
        const handled = handleApiResponse(response, 'Get user preferences');
        const userData = handled.data?.user;

        if (userData?.preferences) {
          return {
            ...this.getDefaultPreferences(),
            ...userData.preferences,
          };
        }
      } catch (apiError) {
        logger.warn('Failed to get preferences from API, using defaults', apiError);
      }

      // Try to get from local storage as fallback
      const localPrefs = await AsyncStorage.getItem(`preferences_${userId}`);
      if (localPrefs) {
        return {
          ...this.getDefaultPreferences(),
          ...JSON.parse(localPrefs),
        };
      }

      return this.getDefaultPreferences();
    } catch (error) {
      logger.error('Error getting user preferences', error, { userId });
      return this.getDefaultPreferences();
    }
  }

  static getDefaultPreferences() {
    return {
      minAge: 18,
      maxAge: 100,
      maxDistance: 50,
      interestedIn: 'both',
      lookingFor: 'any',
      notificationsEnabled: true,
      matchNotifications: true,
      messageNotifications: true,
      likeNotifications: true,
      systemNotifications: true,
      showDistance: true,
      showAge: true,
      discoveryEnabled: true,
    };
  }

  static async updateUserPreferences(userId, preferences) {
    try {
      // Save locally as well for offline access
      await AsyncStorage.setItem(`preferences_${userId}`, JSON.stringify(preferences));

      try {
        const response = await api.put('/profile/update', { preferences });
        handleApiResponse(response, 'Update user preferences');
      } catch (apiError) {
        logger.warn('Failed to sync preferences to server', apiError);
      }

      logger.info('User preferences updated successfully', { userId });
      return true;
    } catch (error) {
      logger.error('Error updating user preferences', error, { userId });
      return false;
    }
  }

  static async updateSinglePreference(userId, key, value) {
    try {
      const preferences = await this.getUserPreferences(userId);
      preferences[key] = value;
      return await this.updateUserPreferences(userId, preferences);
    } catch (error) {
      logger.error('Error updating single preference', error, { userId, key, value });
      return false;
    }
  }

  // Advanced filtering logic
  static async filterUsersForDiscovery(currentUserId, allUsers, currentUserData = null) {
    try {
      const currentUserPrefs = await this.getUserPreferences(currentUserId);

      if (!currentUserPrefs.discoveryEnabled) {
        return [];
      }

      return allUsers.filter((user) => {
        // Don't show current user
        if (user.id === currentUserId || user._id === currentUserId) return false;

        // Age filter
        if (user.age < currentUserPrefs.minAge || user.age > currentUserPrefs.maxAge) {
          return false;
        }

        // Distance filter (if both users have location)
        if (currentUserData?.location && user.location) {
          const distance = this.calculateDistance(currentUserData.location, user.location);
          if (distance > currentUserPrefs.maxDistance) {
            return false;
          }
        }

        // Gender preference filter (would need gender field in user profile)
        // if (currentUserPrefs.interestedIn !== 'both' && user.gender !== currentUserPrefs.interestedIn) {
        //   return false;
        // }

        return true;
      });
    } catch (error) {
      logger.error('Error filtering users', error, { currentUserId, userCount: allUsers.length });
      return allUsers;
    }
  }

  /**
   * Calculate distance between two coordinates
   * @deprecated Use calculateDistance from '../utils/distanceCalculator' directly
   */
  static calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return Infinity;
    return calcDist(coord1.latitude, coord1.longitude, coord2.latitude, coord2.longitude);
  }

  static validatePreferences(preferences) {
    const errors = [];

    if (preferences.minAge < 18 || preferences.minAge > 100) {
      errors.push('Minimum age must be between 18 and 100');
    }

    if (preferences.maxAge < 18 || preferences.maxAge > 100) {
      errors.push('Maximum age must be between 18 and 100');
    }

    if (preferences.minAge > preferences.maxAge) {
      errors.push('Minimum age cannot be greater than maximum age');
    }

    if (preferences.maxDistance < 1 || preferences.maxDistance > 500) {
      errors.push('Maximum distance must be between 1 and 500 km');
    }

    if (!['men', 'women', 'both'].includes(preferences.interestedIn)) {
      errors.push('Invalid gender preference');
    }

    if (!['casual', 'serious', 'marriage', 'any'].includes(preferences.lookingFor)) {
      errors.push('Invalid relationship type preference');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default PreferencesService;
