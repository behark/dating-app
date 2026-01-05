import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import logger from '../utils/logger';
import { getUserFriendlyMessage } from '../utils/errorMessages';

export class EnhancedProfileService {
  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      logger.error('Error retrieving auth token:', error);
      return null;
    }
  }

  // Profile Prompts
  static async getAllPrompts() {
    try {
      const response = await fetch(`${API_URL}/profile/prompts/list`);

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
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/prompts/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ prompts }),
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
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/education`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(education),
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
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/occupation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(occupation),
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
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/height`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(height),
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
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/ethnicity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ethnicity }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to update ethnicity'));
      }

      return data.data?.ethnicity || null;
    } catch (error) {
      logger.error('Error updating ethnicity:', error);
      throw error;
    }
  }
}
