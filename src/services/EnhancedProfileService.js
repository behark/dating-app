import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';
import api from './api';

export class EnhancedProfileService {
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
