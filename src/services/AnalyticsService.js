import { Platform } from 'react-native';

/**
 * AnalyticsService
 * Handles analytics tracking and event logging
 *
 * Uses Firebase JS SDK Analytics (firebase/analytics) for web
 * For React Native, analytics will gracefully degrade if not available
 */

let Analytics = null;
let analyticsLoadAttempted = false;

// Lazy load analytics to ensure Firebase is initialized first
const loadAnalytics = async () => {
  if (analyticsLoadAttempted) return Analytics;
  analyticsLoadAttempted = true;
  
  try {
    // Import Firebase app to check if initialized
    const { getApps, getApp } = require('firebase/app');
    
    const apps = getApps();
    if (apps.length === 0) {
      console.warn('Firebase not initialized - Analytics unavailable');
      return null;
    }
    
    const app = getApp();
    
    // On web, use Firebase JS SDK Analytics
    if (Platform.OS === 'web') {
      const { getAnalytics, isSupported, logEvent, setUserId: setAnalyticsUserId, setUserProperties } = require('firebase/analytics');
      
      // Check if Analytics is supported (requires browser environment)
      const supported = await isSupported();
      if (!supported) {
        console.warn('Firebase Analytics not supported in this environment');
        return null;
      }
      
      Analytics = {
        analytics: getAnalytics(app),
        logEvent: (eventName, params) => logEvent(getAnalytics(app), eventName, params),
        setUserId: (userId) => setAnalyticsUserId(getAnalytics(app), userId),
        setUserProperty: async (name, value) => {
          await setUserProperties(getAnalytics(app), { [name]: value });
        },
        setUserProperties: async (properties) => {
          await setUserProperties(getAnalytics(app), properties);
        },
      };
      console.log('Using Firebase JS SDK Analytics (web)');
      return Analytics;
    } else {
      // For React Native, gracefully degrade - Firebase Analytics JS SDK doesn't work on native
      // In the future, you could integrate React Native Firebase here
      console.warn('Firebase Analytics not available on native platforms - events will be logged to console only');
      Analytics = {
        logEvent: (eventName, params) => {
          if (__DEV__) {
            console.log('[Analytics]', eventName, params);
          }
        },
        setUserId: (userId) => {
          if (__DEV__) {
            console.log('[Analytics] User ID:', userId);
          }
        },
        setUserProperty: async () => {},
        setUserProperties: async () => {},
      };
      return Analytics;
    }
  } catch (error) {
    console.warn('Analytics library not available:', error.message);
    return null;
  }
};

export class AnalyticsService {
  static initialized = false;
  static userId = null;

  /**
   * Initialize analytics service
   */
  static async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Lazy load Analytics (ensures Firebase is initialized first on web)
      Analytics = await loadAnalytics();
      
      if (!Analytics) {
        console.warn('Analytics not available - skipping initialization');
        return;
      }

      // Set default properties
      if (Analytics.setUserProperty) {
        await Analytics.setUserProperty('platform', Platform.OS);
        await Analytics.setUserProperty('app_version', '1.0.0');
      }

      this.initialized = true;
      console.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Error initializing analytics:', error);
      // Don't block app startup if analytics fails
      this.initialized = false;
    }
  }

  /**
   * Log a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} params - Event parameters
   */
  static async logEvent(eventName, params = {}) {
    if (!this.initialized || !Analytics) {
      return;
    }

    try {
      if (Analytics && Analytics.logEvent) {
        await Analytics.logEvent(eventName, params);
      }
      if (__DEV__ && !Analytics) {
        console.log('[Analytics] Event (no analytics):', eventName, params);
      }
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  /**
   * Set user ID for analytics
   * @param {string} userId - User ID
   */
  static async setUserId(userId) {
    if (!this.initialized || !Analytics) {
      return;
    }

    try {
      this.userId = userId;
      if (Analytics && Analytics.setUserId) {
        await Analytics.setUserId(userId);
      }
      if (__DEV__) {
        console.log('Analytics user ID set:', userId);
      }
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  /**
   * Set user properties
   * @param {Object} properties - User properties
   */
  static async setUserProperties(properties) {
    if (!this.initialized || !Analytics) {
      return;
    }

    try {
      if (Analytics && Analytics.setUserProperties) {
        await Analytics.setUserProperties(properties);
      } else if (Analytics && Analytics.setUserProperty) {
        // Fallback to individual properties
        for (const [key, value] of Object.entries(properties)) {
          await Analytics.setUserProperty(key, String(value));
        }
      }
      if (__DEV__) {
        console.log('Analytics user properties set:', properties);
      }
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }

  // ==========================================
  // Dating App Specific Events
  // ==========================================

  /**
   * Log user sign up
   * @param {string} method - Sign up method (email, google, facebook, apple)
   */
  static async logSignUp(method) {
    await this.logEvent('sign_up', { method });
  }

  /**
   * Log user login
   * @param {string} method - Login method (email, google, facebook, apple)
   */
  static async logLogin(method) {
    await this.logEvent('login', { method });
  }

  /**
   * Log profile view
   * @param {string} profileId - ID of viewed profile
   */
  static async logProfileView(profileId) {
    await this.logEvent('profile_view', { profile_id: profileId });
  }

  /**
   * Log swipe action
   * @param {string} action - Swipe action (like, pass, superlike)
   * @param {string} profileId - ID of swiped profile
   */
  static async logSwipe(action, profileId) {
    await this.logEvent('swipe', { action, profile_id: profileId });
  }

  /**
   * Log match
   * @param {string} matchId - ID of the match
   */
  static async logMatch(matchId) {
    await this.logEvent('match', { match_id: matchId });
  }

  /**
   * Log message sent
   * @param {string} matchId - ID of the match
   * @param {string} messageType - Type of message (text, image, gif)
   */
  static async logMessageSent(matchId, messageType = 'text') {
    await this.logEvent('message_sent', {
      match_id: matchId,
      message_type: messageType,
    });
  }

  /**
   * Log premium purchase
   * @param {string} tier - Premium tier (gold, platinum)
   * @param {number} price - Purchase price
   * @param {string} currency - Currency code (USD, EUR, etc)
   */
  static async logPremiumPurchase(tier, price, currency = 'USD') {
    await this.logEvent('purchase', {
      tier,
      value: price,
      currency,
      item_id: `premium_${tier}`,
      item_name: `Premium ${tier}`,
      item_category: 'subscription',
    });
  }

  /**
   * Log screen view
   * @param {string} screenName - Name of the screen
   */
  static async logScreenView(screenName) {
    await this.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenName,
    });
  }

  /**
   * Log app opened
   * @param {boolean} isFirstLaunch - Whether this is the first app launch
   */
  static async logAppOpened(isFirstLaunch = false) {
    await this.logEvent('app_opened', {
      first_launch: isFirstLaunch,
    });
  }

  /**
   * Log profile completion
   * @param {number} completionPercentage - Profile completion percentage (0-100)
   */
  static async logProfileCompletion(completionPercentage) {
    await this.logEvent('profile_completion', {
      completion_percentage: completionPercentage,
    });
  }

  /**
   * Log photo upload
   * @param {number} photoCount - Number of photos uploaded
   */
  static async logPhotoUpload(photoCount) {
    await this.logEvent('photo_upload', {
      photo_count: photoCount,
    });
  }

  /**
   * Log search/filter usage
   * @param {Object} filters - Search filters applied
   */
  static async logSearch(filters) {
    await this.logEvent('search', filters);
  }

  /**
   * Log settings change
   * @param {string} setting - Setting changed
   * @param {any} value - New value
   */
  static async logSettingsChange(setting, value) {
    await this.logEvent('settings_change', {
      setting,
      value: String(value),
    });
  }

  /**
   * Log app rating
   * @param {number} rating - Rating value (1-5)
   */
  static async logAppRating(rating) {
    await this.logEvent('app_rating', { rating });
  }

  /**
   * Log share action
   * @param {string} contentType - Type of content shared (profile, match)
   * @param {string} method - Share method (social, link, etc)
   */
  static async logShare(contentType, method) {
    await this.logEvent('share', {
      content_type: contentType,
      method,
    });
  }

  /**
   * Log error/exception
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   */
  static async logError(errorType, errorMessage) {
    // Ensure errorMessage is a string
    const message = typeof errorMessage === 'string' 
      ? errorMessage 
      : errorMessage?.message || errorMessage?.toString() || String(errorMessage) || 'Unknown error';
    
    await this.logEvent('error', {
      error_type: errorType,
      error_message: message.substring(0, 100), // Limit message length
    });
  }

  /**
   * Log tutorial completion
   * @param {string} tutorialName - Name of the tutorial
   */
  static async logTutorialComplete(tutorialName) {
    await this.logEvent('tutorial_complete', {
      tutorial_name: tutorialName,
    });
  }
}

export default AnalyticsService;
