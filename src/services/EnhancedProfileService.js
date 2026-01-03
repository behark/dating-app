import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000/api';

export class EnhancedProfileService {
  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  // Profile Prompts
  static async getAllPrompts() {
    try {
      const response = await fetch(`${API_URL}/profile/prompts/list`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch prompts');
      }
      
      return data.data.prompts;
    } catch (error) {
      console.error('Error fetching prompts:', error);
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
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ prompts })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update prompts');
      }
      
      return data.data.prompts;
    } catch (error) {
      console.error('Error updating prompts:', error);
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
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(education)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update education');
      }
      
      return data.data.education;
    } catch (error) {
      console.error('Error updating education:', error);
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
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(occupation)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update occupation');
      }
      
      return data.data.occupation;
    } catch (error) {
      console.error('Error updating occupation:', error);
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
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(height)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update height');
      }
      
      return data.data.height;
    } catch (error) {
      console.error('Error updating height:', error);
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
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ ethnicity })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update ethnicity');
      }
      
      return data.data.ethnicity;
    } catch (error) {
      console.error('Error updating ethnicity:', error);
      throw error;
    }
  }
}
