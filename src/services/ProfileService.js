import { API_URL } from '../config/api';
import { ERROR_MESSAGES } from '../constants/constants';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';
import api from './api';
import { validateNotEmpty, validateUserId } from '../utils/validators';
import OfflineService from './OfflineService';

export class ProfileService {
  static async getProfile(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      // Check if offline - try cache first
      const isOnline = OfflineService.getNetworkStatus();
      if (!isOnline) {
        const cachedProfiles = await OfflineService.getCachedProfiles();
        if (cachedProfiles) {
          const cachedProfile = cachedProfiles.find((p) => p._id === userId || p.uid === userId);
          if (cachedProfile) {
            logger.info('Loading profile from cache (offline)');
            return cachedProfile;
          }
        }
        throw new Error('No cached profile available. Please check your connection.');
      }

      const data = await api.get(`/profile/${userId}`);

      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch profile'));
      }

      const profile = data.data?.user || null;
      
      // Cache profile for offline use
      if (profile) {
        const cachedProfiles = await OfflineService.getCachedProfiles() || [];
        const updatedProfiles = cachedProfiles.filter((p) => 
          (p._id || p.uid) !== (profile._id || profile.uid)
        );
        updatedProfiles.push(profile);
        await OfflineService.cacheProfiles(updatedProfiles);
      }

      return profile;
    } catch (error) {
      logger.error('Error fetching profile:', error);
      
      // Try cache on error
      const cachedProfiles = await OfflineService.getCachedProfiles();
      if (cachedProfiles) {
        const cachedProfile = cachedProfiles.find((p) => p._id === userId || p.uid === userId);
        if (cachedProfile) {
          logger.info('Loading profile from cache (error fallback)');
          return cachedProfile;
        }
      }
      
      throw error;
    }
  }

  static async getMyProfile() {
    try {
      // Check if offline - try cache first
      const isOnline = OfflineService.getNetworkStatus();
      if (!isOnline) {
        const cachedProfile = await OfflineService.getCachedUserProfile();
        if (cachedProfile) {
          logger.info('Loading my profile from cache (offline)');
          return cachedProfile;
        }
        throw new Error('No cached profile available. Please check your connection.');
      }

      const data = await api.get('/profile/me');

      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch profile'));
      }

      const profile = data.data?.user || null;
      
      // Cache profile for offline use
      if (profile) {
        await OfflineService.cacheUserProfile(profile);
      }

      return profile;
    } catch (error) {
      logger.error('Error fetching my profile:', error);
      
      // Try cache on error
      const cachedProfile = await OfflineService.getCachedUserProfile();
      if (cachedProfile) {
        logger.info('Loading my profile from cache (error fallback)');
        return cachedProfile;
      }
      
      throw error;
    }
  }

  static async updateProfile(profileData) {
    try {
      const data = await api.put('/profile/update', profileData);

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
      const data = await api.post('/profile/photos/upload', { photos });

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
      const data = await api.put('/profile/photos/reorder', { photoIds });

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

      const data = await api.delete(`/profile/photos/${photoId}`);

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
