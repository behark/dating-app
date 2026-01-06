import { ERROR_MESSAGES } from '../constants/constants';
import { handleApiResponse } from '../utils/apiResponseHandler';
import logger from '../utils/logger';
import {
  validateCoordinates,
  validateNotEmpty,
  validateNumberRange,
  validateUserId,
} from '../utils/validators';
import api from './api';

export class PremiumService {
  static PREMIUM_FEATURES = {
    SUPER_LIKES_PER_DAY: 5,
    UNLIMITED_SWIPES: true,
    ADVANCED_FILTERS: true,
    SEE_WHO_LIKED_YOU: true,
    BOOST_PROFILE: true,
    PRIORITY_LIKES: true,
    HIDE_ADS: true,
    PASSPORT: true,
    PROFILE_BOOST_ANALYTICS: true,
  };

  /**
   * Check premium subscription status
   */
  static async checkPremiumStatus(userId, token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get('/premium/subscription/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const handled = handleApiResponse(response, 'Check premium status');
      return handled.data || { isPremium: false, features: {} };
    } catch (error) {
      logger.error('Error checking premium status:', error);
      return { isPremium: false, features: {} };
    }
  }

  /**
   * Start free trial subscription
   */
  static async startTrialSubscription(userId, token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.post(
        '/premium/subscription/trial/start',
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const handled = handleApiResponse(response, 'Start trial subscription');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error starting trial:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upgrade to premium subscription
   */
  static async upgradeToPremium(userId, planType = 'monthly', token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }
      if (!['monthly', 'yearly'].includes(planType)) {
        throw new Error('Plan type must be monthly or yearly');
      }

      const response = await api.post(
        '/premium/subscription/upgrade',
        { planType },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const handled = handleApiResponse(response, 'Upgrade to premium');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error upgrading to premium:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel premium subscription
   */
  static async cancelSubscription(userId, token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.post(
        '/premium/subscription/cancel',
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const handled = handleApiResponse(response, 'Cancel subscription');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get received likes (See Who Liked You feature)
   */
  static async getReceivedLikes(userId, token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get('/premium/likes/received', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const handled = handleApiResponse(response, 'Get received likes');
      return handled.data || { likes: [] };
    } catch (error) {
      logger.error('Error getting received likes:', error);
      return { likes: [] };
    }
  }

  /**
   * Set passport location (location override)
   */
  static async setPassportLocation(longitude, latitude, city, country, token) {
    try {
      if (!validateCoordinates(latitude, longitude)) {
        throw new Error('Invalid coordinates provided');
      }
      if (!validateNotEmpty(city) || !validateNotEmpty(country)) {
        throw new Error('City and country are required');
      }

      const response = await api.post(
        '/premium/passport/location',
        { longitude, latitude, city, country },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const handled = handleApiResponse(response, 'Set passport location');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error setting passport location:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get passport status
   */
  static async getPassportStatus(userId, token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get('/premium/passport/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const handled = handleApiResponse(response, 'Get passport status');
      return handled.data || { enabled: false };
    } catch (error) {
      logger.error('Error getting passport status:', error);
      return { enabled: false };
    }
  }

  /**
   * Disable passport mode
   */
  static async disablePassport(userId, token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.post(
        '/premium/passport/disable',
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const handled = handleApiResponse(response, 'Disable passport');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error disabling passport:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get advanced filter options
   */
  static async getAdvancedFilterOptions(userId, token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get('/premium/filters/options', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const handled = handleApiResponse(response, 'Get advanced filter options');
      return handled.data || {};
    } catch (error) {
      logger.error('Error getting filter options:', error);
      return {};
    }
  }

  /**
   * Update advanced filters
   */
  static async updateAdvancedFilters(filters, token) {
    try {
      const response = await api.post('/premium/filters/update', filters, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const handled = handleApiResponse(response, 'Update advanced filters');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error updating filters:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send priority like
   */
  static async sendPriorityLike(targetUserId, token) {
    try {
      if (!validateUserId(targetUserId)) {
        throw new Error('Invalid target user ID provided');
      }

      const response = await api.post(
        '/premium/likes/priority',
        { targetUserId },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const handled = handleApiResponse(response, 'Send priority like');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error sending priority like:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update ads preferences
   */
  static async updateAdsPreferences(showAds, adCategories, token) {
    try {
      const response = await api.post(
        '/premium/ads/preferences',
        { showAds, adCategories },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const handled = handleApiResponse(response, 'Update ads preferences');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error updating ads preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get profile boost analytics
   */
  static async getBoostAnalytics(userId, token) {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.get('/premium/analytics/boosts', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const handled = handleApiResponse(response, 'Get boost analytics');
      return handled.data || {};
    } catch (error) {
      logger.error('Error getting boost analytics:', error);
      return {};
    }
  }

  /**
   * Record boost session
   */
  static async recordBoostSession(duration, viewsGained, likesGained, matches, token) {
    try {
      // Validate inputs
      if (!validateNumberRange(duration, 0, 1440)) {
        throw new Error('Duration must be between 0 and 1440 minutes (24 hours)');
      }
      if (viewsGained < 0 || !Number.isInteger(viewsGained)) {
        throw new Error('Views gained must be a non-negative integer');
      }
      if (likesGained < 0 || !Number.isInteger(likesGained)) {
        throw new Error('Likes gained must be a non-negative integer');
      }
      if (matches < 0 || !Number.isInteger(matches)) {
        throw new Error('Matches must be a non-negative integer');
      }

      const response = await api.post(
        '/premium/analytics/boost-session',
        { duration, viewsGained, likesGained, matches },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const handled = handleApiResponse(response, 'Record boost session');
      return handled.data || { success: true };
    } catch (error) {
      logger.error('Error recording boost session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available features for current user
   */
  static getAvailableFeatures(userData) {
    const isPremium = userData?.subscriptionEnd && new Date(userData.subscriptionEnd) > new Date();

    return {
      superLikesPerDay: isPremium ? this.PREMIUM_FEATURES.SUPER_LIKES_PER_DAY : 1,
      unlimitedSwipes: isPremium ? this.PREMIUM_FEATURES.UNLIMITED_SWIPES : false,
      advancedFilters: isPremium ? this.PREMIUM_FEATURES.ADVANCED_FILTERS : false,
      seeWhoLikedYou: isPremium ? this.PREMIUM_FEATURES.SEE_WHO_LIKED_YOU : false,
      boostProfile: isPremium ? this.PREMIUM_FEATURES.BOOST_PROFILE : false,
      priorityLikes: isPremium ? this.PREMIUM_FEATURES.PRIORITY_LIKES : false,
      hideAds: isPremium ? this.PREMIUM_FEATURES.HIDE_ADS : false,
      passport: isPremium ? this.PREMIUM_FEATURES.PASSPORT : false,
      profileBoostAnalytics: isPremium ? this.PREMIUM_FEATURES.PROFILE_BOOST_ANALYTICS : false,
    };
  }
}
