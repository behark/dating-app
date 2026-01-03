import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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
      const response = await fetch(`${API_BASE_URL}/premium/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data.data || {
        isPremium: false,
        features: {}
      };
    } catch (error) {
      console.error('Error checking premium status:', error);
      return { isPremium: false, features: {} };
    }
  }

  /**
   * Start free trial subscription
   */
  static async startTrialSubscription(userId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/subscription/trial/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting trial:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upgrade to premium subscription
   */
  static async upgradeToPremium(userId, planType = 'monthly', token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planType })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel premium subscription
   */
  static async cancelSubscription(userId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/subscription/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get received likes (See Who Liked You feature)
   */
  static async getReceivedLikes(userId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/likes/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data.data || { likes: [] };
    } catch (error) {
      console.error('Error getting received likes:', error);
      return { likes: [] };
    }
  }

  /**
   * Set passport location (location override)
   */
  static async setPassportLocation(longitude, latitude, city, country, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/passport/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ longitude, latitude, city, country })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error setting passport location:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get passport status
   */
  static async getPassportStatus(userId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/passport/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data.data || { enabled: false };
    } catch (error) {
      console.error('Error getting passport status:', error);
      return { enabled: false };
    }
  }

  /**
   * Disable passport mode
   */
  static async disablePassport(userId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/passport/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error disabling passport:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get advanced filter options
   */
  static async getAdvancedFilterOptions(userId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/filters/options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error getting filter options:', error);
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(filters)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating filters:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send priority like
   */
  static async sendPriorityLike(targetUserId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/likes/priority`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending priority like:', error);
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ showAds, adCategories })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating ads preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get profile boost analytics
   */
  static async getBoostAnalytics(userId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/analytics/boosts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error getting boost analytics:', error);
      return {};
    }
  }

  /**
   * Record boost session
   */
  static async recordBoostSession(duration, viewsGained, likesGained, matches, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/analytics/boost-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ duration, viewsGained, likesGained, matches })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error recording boost session:', error);
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
