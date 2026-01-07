import { API_URL } from '../config/api';
import { ERROR_MESSAGES } from '../constants/constants';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';
import { validateNotEmpty, validateUserId } from '../utils/validators';
import { sanitizeString, sanitizeArray } from '../utils/sanitize';
import api from './api';
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
        const cachedProfiles = (await OfflineService.getCachedProfiles()) || [];
        const updatedProfiles = cachedProfiles.filter(
          (p) => (p._id || p.uid) !== (profile._id || profile.uid)
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
      // Sanitize profile data before sending to backend
      const sanitizedData = {
        ...profileData,
      };

      if (sanitizedData.name) {
        sanitizedData.name = sanitizeString(sanitizedData.name);
      }
      if (sanitizedData.bio) {
        sanitizedData.bio = sanitizeString(sanitizedData.bio, { maxLength: 500 });
      }
      if (sanitizedData.interests && Array.isArray(sanitizedData.interests)) {
        sanitizedData.interests = sanitizeArray(sanitizedData.interests);
      }

      const data = await api.put('/profile/update', sanitizedData);

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

  // ============================================
  // Enhanced Profile Features
  // ============================================

  // Profile Prompts
  static async getAllPrompts() {
    try {
      const data = await api.get('/profile/enhanced/prompts/list');
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch prompts'));
      }
      return data.data?.prompts || [];
    } catch (error) {
      logger.error('Error fetching prompts:', error);
      throw error;
    }
  }

  static async updatePrompts(prompts) {
    try {
      const data = await api.put('/profile/enhanced/prompts/update', { prompts });
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update prompts'));
      }
      return data.data?.prompts || [];
    } catch (error) {
      logger.error('Error updating prompts:', error);
      throw error;
    }
  }

  // Education
  static async updateEducation(education) {
    try {
      const data = await api.put('/profile/enhanced/education', education);
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update education'));
      }
      return data.data?.education || null;
    } catch (error) {
      logger.error('Error updating education:', error);
      throw error;
    }
  }

  // Occupation
  static async updateOccupation(occupation) {
    try {
      const data = await api.put('/profile/enhanced/occupation', occupation);
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update occupation'));
      }
      return data.data?.occupation || null;
    } catch (error) {
      logger.error('Error updating occupation:', error);
      throw error;
    }
  }

  // Height
  static async updateHeight(height) {
    try {
      const data = await api.put('/profile/enhanced/height', height);
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update height'));
      }
      return data.data?.height || null;
    } catch (error) {
      logger.error('Error updating height:', error);
      throw error;
    }
  }

  // Ethnicity
  static async updateEthnicity(ethnicity) {
    try {
      const data = await api.put('/profile/enhanced/ethnicity', { ethnicity });
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update ethnicity'));
      }
      return data.data?.ethnicity || null;
    } catch (error) {
      logger.error('Error updating ethnicity:', error);
      throw error;
    }
  }
}
