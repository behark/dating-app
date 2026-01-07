/**
 * AnalyticsService (TypeScript)
 * Handles analytics tracking and event logging
 *
 * Uses Firebase JS SDK Analytics (firebase/analytics) for web
 * For React Native, analytics will gracefully degrade if not available
 */

import { Platform } from 'react-native';

/**
 * Analytics interface for Firebase Analytics
 */
interface AnalyticsInstance {
  analytics?: unknown;
  logEvent: (eventName: string, params?: Record<string, unknown>) => void | Promise<void>;
  setUserId: (userId: string) => void | Promise<void>;
  setUserProperty?: (name: string, value: string) => Promise<void>;
  setUserProperties?: (properties: Record<string, string>) => Promise<void>;
}

/**
 * Analytics event parameters
 */
export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Sign up/login method type
 */
export type AuthMethod = 'email' | 'google' | 'facebook' | 'apple';

/**
 * Swipe action type
 */
export type SwipeAction = 'like' | 'pass' | 'superlike';

/**
 * Message type
 */
export type MessageType = 'text' | 'image' | 'gif';

/**
 * Premium tier type
 */
export type PremiumTier = 'gold' | 'platinum';

/**
 * Share method type
 */
export type ShareMethod = 'social' | 'link' | 'other';

/**
 * Content type for sharing
 */
export type ShareContentType = 'profile' | 'match' | 'other';

let Analytics: AnalyticsInstance | null = null;
let analyticsLoadAttempted = false;

// Lazy load analytics to ensure Firebase is initialized first
const loadAnalytics = async (): Promise<AnalyticsInstance | null> => {
  if (analyticsLoadAttempted) return Analytics;
  analyticsLoadAttempted = true;

  try {
    // Import Firebase app to check if initialized
    const { getApps, getApp } = require('firebase/app') as {
      getApps: () => unknown[];
      getApp: () => unknown;
    };

    const apps = getApps();
    if (apps.length === 0) {
      console.warn('Firebase not initialized - Analytics unavailable');
      return null;
    }

    const app = getApp();

    // On web, use Firebase JS SDK Analytics
    if (Platform.OS === 'web') {
      const {
        getAnalytics,
        isSupported,
        logEvent,
        setUserId: setAnalyticsUserId,
        setUserProperties,
      } = require('firebase/analytics') as {
        getAnalytics: (app: unknown) => unknown;
        isSupported: () => Promise<boolean>;
        logEvent: (analytics: unknown, eventName: string, params?: Record<string, unknown>) => void;
        setUserId: (analytics: unknown, userId: string) => void;
        setUserProperties: (analytics: unknown, properties: Record<string, string>) => Promise<void>;
      };

      // Check if Analytics is supported (requires browser environment)
      const supported = await isSupported();
      if (!supported) {
        console.warn('Firebase Analytics not supported in this environment');
        return null;
      }

      const analyticsInstance = getAnalytics(app);
      Analytics = {
        analytics: analyticsInstance,
        logEvent: (eventName: string, params?: Record<string, unknown>) =>
          logEvent(analyticsInstance, eventName, params),
        setUserId: (userId: string) => setAnalyticsUserId(analyticsInstance, userId),
        setUserProperty: async (name: string, value: string) => {
          await setUserProperties(analyticsInstance, { [name]: value });
        },
        setUserProperties: async (properties: Record<string, string>) => {
          await setUserProperties(analyticsInstance, properties);
        },
      };
      console.log('Using Firebase JS SDK Analytics (web)');
      return Analytics;
    } else {
      // For React Native, gracefully degrade - Firebase Analytics JS SDK doesn't work on native
      // In the future, you could integrate React Native Firebase here
      console.warn('Firebase Analytics not available on native platforms - events will be logged to console only');
      Analytics = {
        logEvent: (eventName: string, params?: Record<string, unknown>) => {
          if (__DEV__) {
            console.log('[Analytics]', eventName, params);
          }
        },
        setUserId: (userId: string) => {
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('Analytics library not available:', errorMessage);
    return null;
  }
};

export class AnalyticsService {
  static initialized: boolean = false;
  static userId: string | null = null;

  /**
   * Initialize analytics service
   */
  static async initialize(): Promise<void> {
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
   */
  static async logEvent(eventName: string, params: AnalyticsEventParams = {}): Promise<void> {
    if (!this.initialized || !Analytics) {
      return;
    }

    try {
      if (Analytics && Analytics.logEvent) {
        await Analytics.logEvent(eventName, params as Record<string, unknown>);
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
   */
  static async setUserId(userId: string): Promise<void> {
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
   */
  static async setUserProperties(properties: Record<string, string>): Promise<void> {
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
   */
  static async logSignUp(method: AuthMethod): Promise<void> {
    await this.logEvent('sign_up', { method });
  }

  /**
   * Log user login
   */
  static async logLogin(method: AuthMethod): Promise<void> {
    await this.logEvent('login', { method });
  }

  /**
   * Log profile view
   */
  static async logProfileView(profileId: string): Promise<void> {
    await this.logEvent('profile_view', { profile_id: profileId });
  }

  /**
   * Log swipe action
   */
  static async logSwipe(action: SwipeAction, profileId: string): Promise<void> {
    await this.logEvent('swipe', { action, profile_id: profileId });
  }

  /**
   * Log match
   */
  static async logMatch(matchId: string): Promise<void> {
    await this.logEvent('match', { match_id: matchId });
  }

  /**
   * Log message sent
   */
  static async logMessageSent(matchId: string, messageType: MessageType = 'text'): Promise<void> {
    await this.logEvent('message_sent', {
      match_id: matchId,
      message_type: messageType,
    });
  }

  /**
   * Log premium purchase
   */
  static async logPremiumPurchase(tier: PremiumTier, price: number, currency: string = 'USD'): Promise<void> {
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
   */
  static async logScreenView(screenName: string): Promise<void> {
    await this.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenName,
    });
  }

  /**
   * Log app opened
   */
  static async logAppOpened(isFirstLaunch: boolean = false): Promise<void> {
    await this.logEvent('app_opened', {
      first_launch: isFirstLaunch,
    });
  }

  /**
   * Log profile completion
   */
  static async logProfileCompletion(completionPercentage: number): Promise<void> {
    await this.logEvent('profile_completion', {
      completion_percentage: completionPercentage,
    });
  }

  /**
   * Log photo upload
   */
  static async logPhotoUpload(photoCount: number): Promise<void> {
    await this.logEvent('photo_upload', {
      photo_count: photoCount,
    });
  }

  /**
   * Log search/filter usage
   */
  static async logSearch(filters: AnalyticsEventParams): Promise<void> {
    await this.logEvent('search', filters);
  }

  /**
   * Log settings change
   */
  static async logSettingsChange(setting: string, value: unknown): Promise<void> {
    await this.logEvent('settings_change', {
      setting,
      value: String(value),
    });
  }

  /**
   * Log app rating
   */
  static async logAppRating(rating: number): Promise<void> {
    await this.logEvent('app_rating', { rating });
  }

  /**
   * Log share action
   */
  static async logShare(contentType: ShareContentType, method: ShareMethod): Promise<void> {
    await this.logEvent('share', {
      content_type: contentType,
      method,
    });
  }

  /**
   * Log error/exception
   */
  static async logError(errorType: string, errorMessage: string | Error | unknown): Promise<void> {
    // Ensure errorMessage is a string
    const message =
      typeof errorMessage === 'string'
        ? errorMessage
        : errorMessage instanceof Error
          ? errorMessage.message
          : errorMessage?.toString?.() || String(errorMessage) || 'Unknown error';

    await this.logEvent('error', {
      error_type: errorType,
      error_message: message.substring(0, 100), // Limit message length
    });
  }

  /**
   * Log tutorial completion
   */
  static async logTutorialComplete(tutorialName: string): Promise<void> {
    await this.logEvent('tutorial_complete', {
      tutorial_name: tutorialName,
    });
  }
}

export default AnalyticsService;
