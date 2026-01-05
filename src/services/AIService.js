import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { validateUserId } from '../utils/validators';
import { getUserFriendlyMessage } from '../utils/errorMessages';

export class AIService {
  constructor(authToken) {
    this.authToken = authToken;
  }

  /**
   * Get smart photo selection recommendations
   * Analyzes user's photos and suggests which ones to prioritize
   */
  async getSmartPhotoSelection(userId) {
    try {
      if (!validateUserId(userId)) {
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/ai/smart-photos/${userId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
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
        throw new Error(
          getUserFriendlyMessage(data.message || 'Failed to get smart photo recommendations')
        );
      }
      return data.data || { recommendations: [], analysis: {} }; // { recommendations: [...], analysis: {...} }
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
      const response = await fetch(`${API_BASE_URL}/ai/bio-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          userId,
          interests,
          currentBio,
        }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to get bio suggestions'));
      }
      return data.data || { suggestions: [], explanations: {} }; // { suggestions: [...], explanations: {...} }
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/ai/compatibility/${userId}/${targetUserId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
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
        throw new Error(
          getUserFriendlyMessage(data.message || 'Failed to calculate compatibility score')
        );
      }
      return data.data || { score: 0, breakdown: {}, explanation: '' }; // { score: 0-100, breakdown: {...}, explanation: '...' }
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
      const response = await fetch(`${API_BASE_URL}/ai/conversation-starters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          userId,
          targetUserId,
          targetProfile: {
            interests: targetProfile.interests || [],
            bio: targetProfile.bio || '',
            photos: targetProfile.photos || [],
            ...targetProfile,
          },
        }),
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
        throw new Error(
          getUserFriendlyMessage(data.message || 'Failed to get conversation starters')
        );
      }
      return data.data || { starters: [], reasoning: {} }; // { starters: [...], reasoning: {...} }
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

      const uploadResponse = await fetch(`${API_BASE_URL}/ai/analyze-photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`
        );
      }

      const data = await uploadResponse.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || 'Failed to analyze photo'));
      }
      return data.data || { quality: {}, suggestions: [], score: 0 }; // { quality: {...}, suggestions: [...], score: 0-100 }
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
        throw new Error('Invalid user ID provided');
      }

      const { limit = 10, location = true, interests = true, values = true } = options;

      const queryParams = new URLSearchParams({
        limit,
        useLocation: location,
        useInterests: interests,
        useValues: values,
      });

      const response = await fetch(
        `${API_BASE_URL}/ai/personalized-matches/${userId}?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );

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
        throw new Error(
          getUserFriendlyMessage(data.message || 'Failed to get personalized matches')
        );
      }
      return data.data || { matches: [], reasoning: {} }; // { matches: [...], reasoning: {...} }
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/ai/profile-suggestions/${userId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
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
        throw new Error(
          getUserFriendlyMessage(data.message || 'Failed to get profile suggestions')
        );
      }
      return data.data || { suggestions: [], priority: [], impact: {} }; // { suggestions: [...], priority: [...], impact: {...} }
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/ai/conversation-insights/${userId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
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
        throw new Error(
          getUserFriendlyMessage(data.message || 'Failed to get conversation insights')
        );
      }
      return data.data || { insights: [], tips: [], patterns: {} }; // { insights: [...], tips: [...], patterns: {...} }
    } catch (error) {
      logger.error('Error getting conversation insights:', error);
      throw error;
    }
  }
}

export default AIService;
