/**
 * ProfileService (TypeScript)
 * Handles profile management operations including fetching, updating, and photo management
 */

import { ERROR_MESSAGES } from '../constants/constants';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';
import { validateNotEmpty, validateUserId } from '../utils/validators';
import { sanitizeString, sanitizeArray } from '../utils/sanitize';
import api from './api';
import OfflineService from './OfflineService';
import type { IUser, IUserProfile, IPhoto, IProfilePrompt, IEducation, IOccupation, IHeight } from '../../shared/types/user';

/**
 * Profile data for updates
 */
export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  interests?: string[];
  [key: string]: unknown;
}

/**
 * Photo upload data
 */
export interface PhotoUploadData {
  photos: Array<{ uri: string; type?: string; name?: string } | string>;
}

/**
 * Education data
 */
export interface EducationData {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}

/**
 * Occupation data
 */
export interface OccupationData {
  jobTitle?: string;
  company?: string;
  industry?: string;
}

/**
 * Height data
 */
export interface HeightData {
  value?: number;
  unit?: 'cm' | 'ft';
}

export class ProfileService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<IUser | IUserProfile | null> {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      // Check if offline - try cache first
      const isOnline = OfflineService.getNetworkStatus();
      if (!isOnline) {
        const cachedProfiles = await OfflineService.getCachedProfiles();
        if (cachedProfiles) {
          const cachedProfile = cachedProfiles.find((p: IUser) => p._id === userId || (p as { uid?: string }).uid === userId);
          if (cachedProfile) {
            logger.info('Loading profile from cache (offline)');
            return cachedProfile as IUser;
          }
        }
        throw new Error('No cached profile available. Please check your connection.');
      }

      const data = await api.get<IUser | IUserProfile>(`/profile/${userId}`);

      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch profile'));
      }

      const profile = (data.data as { user?: IUser | IUserProfile })?.user || data.data || null;

      // Cache profile for offline use
      if (profile) {
        const cachedProfiles = (await OfflineService.getCachedProfiles()) || [];
        const updatedProfiles = cachedProfiles.filter(
          (p: IUser) => (p._id || (p as { uid?: string }).uid) !== ((profile as IUser)._id || (profile as { uid?: string }).uid)
        );
        updatedProfiles.push(profile as IUser);
        await OfflineService.cacheProfiles(updatedProfiles);
      }

      return profile as IUser | IUserProfile | null;
    } catch (error) {
      logger.error('Error fetching profile', error as any);

      // Try cache on error
      const cachedProfiles = await OfflineService.getCachedProfiles();
      if (cachedProfiles) {
        const cachedProfile = cachedProfiles.find((p: IUser) => p._id === userId || (p as { uid?: string }).uid === userId);
        if (cachedProfile) {
          logger.info('Loading profile from cache (error fallback)');
          return cachedProfile as IUser;
        }
      }

      throw error;
    }
  }

  /**
   * Get current user's profile
   */
  static async getMyProfile(): Promise<IUser | null> {
    try {
      // Check if offline - try cache first
      const isOnline = OfflineService.getNetworkStatus();
      if (!isOnline) {
        const cachedProfile = await OfflineService.getCachedUserProfile();
        if (cachedProfile) {
          logger.info('Loading my profile from cache (offline)');
          return cachedProfile as IUser;
        }
        throw new Error('No cached profile available. Please check your connection.');
      }

      const data = await api.get<IUser>('/profile/me');

      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch profile'));
      }

      const profile = (data.data as { user?: IUser })?.user || data.data || null;

      // Cache profile for offline use
      if (profile) {
        await OfflineService.cacheUserProfile(profile as IUser);
      }

      return profile as IUser | null;
    } catch (error) {
      logger.error('Error fetching my profile', error as any);

      // Try cache on error
      const cachedProfile = await OfflineService.getCachedUserProfile();
      if (cachedProfile) {
        logger.info('Loading my profile from cache (error fallback)');
        return cachedProfile as IUser;
      }

      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: ProfileUpdateData): Promise<IUser | null> {
    try {
      // Sanitize profile data before sending to backend
      const sanitizedData: ProfileUpdateData = {
        ...profileData,
      };

      if (sanitizedData.name) {
        sanitizedData.name = sanitizeString(sanitizedData.name);
      }
      if (sanitizedData.bio) {
        sanitizedData.bio = sanitizeString(sanitizedData.bio, { trim: true, escapeHtml: true, maxLength: 500 });
      }
      if (sanitizedData.interests && Array.isArray(sanitizedData.interests)) {
        sanitizedData.interests = sanitizeArray(sanitizedData.interests);
      }

      const data = await api.put<IUser>('/profile/update', sanitizedData);

      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update profile'));
      }

      return (data.data as { user?: IUser })?.user || data.data || null;
    } catch (error) {
      logger.error('Error updating profile', error as any);
      throw error;
    }
  }

  /**
   * Upload photos
   */
  static async uploadPhotos(photos: PhotoUploadData['photos']): Promise<IPhoto[]> {
    try {
      const data = await api.post<IPhoto[]>('/profile/photos/upload', { photos });

      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to upload photos'));
      }

      return (data.data as { photos?: IPhoto[] })?.photos || data.data || [];
    } catch (error) {
      logger.error('Error uploading photos', error as any);
      throw error;
    }
  }

  /**
   * Reorder photos
   */
  static async reorderPhotos(photoIds: string[]): Promise<IPhoto[]> {
    try {
      const data = await api.put<IPhoto[]>('/profile/photos/reorder', { photoIds });

      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to reorder photos'));
      }

      return (data.data as { photos?: IPhoto[] })?.photos || data.data || [];
    } catch (error) {
      logger.error('Error reordering photos', error as any);
      throw error;
    }
  }

  /**
   * Delete photo
   */
  static async deletePhoto(photoId: string): Promise<IPhoto[]> {
    try {
      if (!validateNotEmpty(photoId)) {
        throw new Error('Invalid photo ID provided');
      }

      const data = await api.delete<IPhoto[]>(`/profile/photos/${photoId}`);

      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to delete photo'));
      }

      return (data.data as { photos?: IPhoto[] })?.photos || data.data || [];
    } catch (error) {
      logger.error('Error deleting photo', error as any);
      throw error;
    }
  }

  /**
   * Validate photos array
   */
  static validatePhotos(photos: unknown): boolean {
    if (!Array.isArray(photos)) {
      throw new Error('Photos must be an array');
    }

    if (photos.length < 1 || photos.length > 6) {
      throw new Error('You must upload between 1 and 6 photos');
    }

    return true;
  }

  /**
   * Validate bio text
   */
  static validateBio(bio: string | null | undefined): boolean {
    if (bio && bio.length > 500) {
      throw new Error('Bio must not exceed 500 characters');
    }
    return true;
  }

  /**
   * Validate age
   */
  static validateAge(age: number): boolean {
    if (age < 18 || age > 100) {
      throw new Error('Age must be between 18 and 100');
    }
    return true;
  }

  // ============================================
  // Enhanced Profile Features
  // ============================================

  /**
   * Get all profile prompts
   */
  static async getAllPrompts(): Promise<IProfilePrompt[]> {
    try {
      const data = await api.get<IProfilePrompt[]>('/profile/enhanced/prompts/list');
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to fetch prompts'));
      }
      return (data.data as { prompts?: IProfilePrompt[] })?.prompts || data.data || [];
    } catch (error) {
      logger.error('Error fetching prompts', error as any);
      throw error;
    }
  }

  /**
   * Update profile prompts
   */
  static async updatePrompts(prompts: IProfilePrompt[]): Promise<IProfilePrompt[]> {
    try {
      const data = await api.put<IProfilePrompt[]>('/profile/enhanced/prompts/update', { prompts });
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update prompts'));
      }
      return (data.data as { prompts?: IProfilePrompt[] })?.prompts || data.data || [];
    } catch (error) {
      logger.error('Error updating prompts', error as any);
      throw error;
    }
  }

  /**
   * Update education
   */
  static async updateEducation(education: EducationData): Promise<IEducation | null> {
    try {
      const data = await api.put<IEducation>('/profile/enhanced/education', education);
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update education'));
      }
      return (data.data as { education?: IEducation })?.education || data.data || null;
    } catch (error) {
      logger.error('Error updating education', error as any);
      throw error;
    }
  }

  /**
   * Update occupation
   */
  static async updateOccupation(occupation: OccupationData): Promise<IOccupation | null> {
    try {
      const data = await api.put<IOccupation>('/profile/enhanced/occupation', occupation);
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update occupation'));
      }
      return (data.data as { occupation?: IOccupation })?.occupation || data.data || null;
    } catch (error) {
      logger.error('Error updating occupation', error as any);
      throw error;
    }
  }

  /**
   * Update height
   */
  static async updateHeight(height: HeightData): Promise<IHeight | null> {
    try {
      const data = await api.put<IHeight>('/profile/enhanced/height', height);
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update height'));
      }
      return (data.data as { height?: IHeight })?.height || data.data || null;
    } catch (error) {
      logger.error('Error updating height', error as any);
      throw error;
    }
  }

  /**
   * Update ethnicity
   */
  static async updateEthnicity(ethnicity: string[]): Promise<string[] | null> {
    try {
      const data = await api.put<string[]>('/profile/enhanced/ethnicity', { ethnicity });
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update ethnicity'));
      }
      return (data.data as { ethnicity?: string[] })?.ethnicity || data.data || null;
    } catch (error) {
      logger.error('Error updating ethnicity', error as any);
      throw error;
    }
  }
}
