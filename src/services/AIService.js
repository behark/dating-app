import { ERROR_MESSAGES } from '../constants/constants';
import { handleApiResponse } from '../utils/apiResponseHandler';
import logger from '../utils/logger';
import { validateUserId } from '../utils/validators';
import api from './api';

export class AIService {
  constructor(_authToken) {}

  /**
   * Get smart photo selection recommendations
   * Analyzes user's photos and suggests which ones to prioritize
   */
  async getSmartPhotoSelection(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get(`/ai/smart-photos/${userId}`);
      const handled = handleApiResponse(response, 'Get smart photo recommendations');
      return handled.data || { recommendations: [], analysis: {} };
    } catch (error) {
      logger.error('Error getting smart photo selection:', error);
      throw error;
    }
  }

  /**
   * Get AI-generated bio suggestions
   * Creates personalized bio suggestions based on user profile
   */
  async getBioSuggestions(userId, interests = [], currentBio = '') {
    try {
      const response = await api.post('/ai/bio-suggestions', {
        userId,
        interests,
        currentBio,
      });
      const handled = handleApiResponse(response, 'Get bio suggestions');
      return handled.data || { suggestions: [], explanations: {} };
    } catch (error) {
      logger.error('Error getting bio suggestions:', error);
      throw error;
    }
  }

  /**
   * Calculate compatibility score with another user
   * Analyzes multiple factors to determine match compatibility
   */
  async getCompatibilityScore(userId, targetUserId) {
    try {
      if (!validateUserId(userId) || !validateUserId(targetUserId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get(`/ai/compatibility/${userId}/${targetUserId}`);
      const handled = handleApiResponse(response, 'Get compatibility score');
      return handled.data || { score: 0, breakdown: {}, explanation: '' };
    } catch (error) {
      logger.error('Error calculating compatibility score:', error);
      throw error;
    }
  }

  /**
   * Get conversation starter suggestions for a user
   * AI generates personalized opening lines based on profile
   */
  async getConversationStarters(userId, targetUserId, targetProfile = {}) {
    try {
      const response = await api.post('/ai/conversation-starters', {
        userId,
        targetUserId,
        targetProfile: {
          interests: targetProfile.interests || [],
          bio: targetProfile.bio || '',
          photos: targetProfile.photos || [],
          ...targetProfile,
        },
      });
      const handled = handleApiResponse(response, 'Get conversation starters');
      return handled.data || { starters: [], reasoning: {} };
    } catch (error) {
      logger.error('Error getting conversation starters:', error);
      throw error;
    }
  }

  /**
   * Analyze photo quality and attractiveness
   * Returns metrics for photo improvement suggestions
   */
  async analyzePhotoQuality(photoUri) {
    try {
      const formData = new FormData();
      const response = await fetch(photoUri);
      const blob = await response.blob();
      formData.append('photo', blob, 'photo.jpg');
      const uploadResponse = await api.post('/ai/analyze-photo', formData);
      const handled = handleApiResponse(uploadResponse, 'Analyze photo');
      return handled.data || { quality: {}, suggestions: [], score: 0 };
    } catch (error) {
      logger.error('Error analyzing photo quality:', error);
      throw error;
    }
  }

  /**
   * Get personalized matching recommendations
   * Uses ML to suggest best matches for the user
   */
  async getPersonalizedMatches(userId, options = {}) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const { limit = 10, location = true, interests = true, values = true } = options;

      const queryParams = new URLSearchParams({
        limit,
        useLocation: location,
        useInterests: interests,
        useValues: values,
      });

      const response = await api.get(`/ai/personalized-matches/${userId}?${queryParams}`);
      const handled = handleApiResponse(response, 'Get personalized matches');
      return handled.data || { matches: [], reasoning: {} };
    } catch (error) {
      logger.error('Error getting personalized matches:', error);
      throw error;
    }
  }

  /**
   * Get profile improvement suggestions
   * AI analyzes profile and suggests improvements
   */
  async getProfileImprovementSuggestions(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get(`/ai/profile-suggestions/${userId}`);
      const handled = handleApiResponse(response, 'Get profile suggestions');
      return handled.data || { suggestions: [], priority: [], impact: {} };
    } catch (error) {
      logger.error('Error getting profile improvement suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate conversation insights
   * Analyzes past conversations to provide tips
   */
  async getConversationInsights(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get(`/ai/conversation-insights/${userId}`);
      const handled = handleApiResponse(response, 'Get conversation insights');
      return handled.data || { insights: [], tips: [], patterns: {} };
    } catch (error) {
      logger.error('Error getting conversation insights:', error);
      throw error;
    }
  }
}

export default AIService;
