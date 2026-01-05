import { API_URL as API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import {
  validateUserId,
  validateCoordinates,
  validateNumberRange,
  validateNotEmpty,
} from '../utils/validators';
import { getUserFriendlyMessage } from '../utils/errorMessages';

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
        throw new Error('Invalid user ID provided');
      }

      if (!token) {
        logger.warn('PremiumService: No token provided, returning free tier');
        return { isPremium: false, features: {} };
      }

      const response = await fetch(`${API_BASE_URL}/premium/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        // For 401 (unauthorized), return free tier instead of throwing
        if (response.status === 401) {
          logger.warn('PremiumService: Unauthorized (401), returning free tier');
          return { isPremium: false, features: {} };
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      if (!data.success) {
        // Return default free tier on error
        return {
          isPremium: false,
          features: {},
        };
      }
      return data.data || {
        isPremium: false,
        features: {},
      };
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/premium/subscription/trial/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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
        throw new Error('Invalid user ID provided');
      }
      if (!['monthly', 'yearly'].includes(planType)) {
        throw new Error('Plan type must be monthly or yearly');
      }

      const response = await fetch(`${API_BASE_URL}/premium/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planType }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/premium/subscription/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/premium/likes/received`, {
        headers: { Authorization: `Bearer ${token}` },
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
        return { likes: [] };
      }
      return data.data || { likes: [] };
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

      const response = await fetch(`${API_BASE_URL}/premium/passport/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ longitude, latitude, city, country }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/premium/passport/status`, {
        headers: { Authorization: `Bearer ${token}` },
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
        return { enabled: false };
      }
      return data.data || { enabled: false };
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/premium/passport/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/premium/filters/options`, {
        headers: { Authorization: `Bearer ${token}` },
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
        return {};
      }
      return data.data || {};
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
      const response = await fetch(`${API_BASE_URL}/premium/filters/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filters),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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

      const response = await fetch(`${API_BASE_URL}/premium/likes/priority`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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
      const response = await fetch(`${API_BASE_URL}/premium/ads/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ showAds, adCategories }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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
        throw new Error('Invalid user ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/premium/analytics/boosts`, {
        headers: { Authorization: `Bearer ${token}` },
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
        return {};
      }
      return data.data || {};
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

      const response = await fetch(`${API_BASE_URL}/premium/analytics/boost-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration, viewsGained, likesGained, matches }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || { success: true };
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
