import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import logger from '../utils/logger';

// Firebase Analytics events
export const ANALYTICS_EVENTS = {
  // User actions
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  PROFILE_COMPLETED: 'profile_completed',
  PROFILE_UPDATED: 'profile_updated',

  // Swiping actions
  SWIPE_RIGHT: 'swipe_right',
  SWIPE_LEFT: 'swipe_left',
  SUPER_LIKE_USED: 'super_like_used',
  MATCH_CREATED: 'match_created',

  // Chat actions
  MESSAGE_SENT: 'message_sent',
  CHAT_OPENED: 'chat_opened',

  // Premium actions
  PREMIUM_UPGRADED: 'premium_upgraded',
  PREMIUM_TRIAL_STARTED: 'premium_trial_started',

  // Verification
  VERIFICATION_REQUESTED: 'verification_requested',
  VERIFICATION_APPROVED: 'verification_approved',

  // Error tracking
  ERROR_OCCURRED: 'error_occurred',

  // Performance
  APP_OPENED: 'app_opened',
  SCREEN_VIEW: 'screen_view',
};

export class AnalyticsService {
  static analytics = null;

  static async initialize() {
    try {
      // Initialize Firebase Analytics
      const app = initializeApp({
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      });

      // Only initialize analytics on web platform
      if (typeof window !== 'undefined') {
        this.analytics = getAnalytics(app);

        // Set up auth state listener for user tracking
        const auth = getAuth(app);
        auth.onAuthStateChanged((user) => {
          if (user) {
            this.setUserId(user.uid);
            this.setUserProperties({
              email_verified: user.emailVerified,
              provider: user.providerData[0]?.providerId || 'unknown',
            });
          }
        });
      }
    } catch (error) {
      logger.warn('Analytics initialization failed', error);
    }
  }

  static setUserId(userId) {
    if (this.analytics) {
      setUserId(this.analytics, userId);
    }
  }

  static setUserProperties(properties) {
    if (this.analytics) {
      setUserProperties(this.analytics, properties);
    }
  }

  static logEvent(eventName, parameters = {}) {
    try {
      if (this.analytics) {
        logEvent(this.analytics, eventName, parameters);
      }

      // Also log to console in development
      if (__DEV__) {
        logger.debug('Analytics Event', { eventName, parameters });
      }
    } catch (error) {
      logger.warn('Analytics event logging failed', error, { eventName });
    }
  }

  // User lifecycle events
  static logUserRegistered(method = 'email') {
    this.logEvent(ANALYTICS_EVENTS.USER_REGISTERED, { method });
  }

  static logUserLoggedIn(method = 'email') {
    this.logEvent(ANALYTICS_EVENTS.USER_LOGGED_IN, { method });
  }

  static logUserLoggedOut() {
    this.logEvent(ANALYTICS_EVENTS.USER_LOGGED_OUT);
  }

  static logProfileCompleted() {
    this.logEvent(ANALYTICS_EVENTS.PROFILE_COMPLETED);
  }

  static logProfileUpdated(fields = []) {
    this.logEvent(ANALYTICS_EVENTS.PROFILE_UPDATED, { fields_updated: fields.join(',') });
  }

  // Swiping events
  static logSwipe(direction, hasMatch = false) {
    const event =
      direction === 'right' ? ANALYTICS_EVENTS.SWIPE_RIGHT : ANALYTICS_EVENTS.SWIPE_LEFT;
    this.logEvent(event, { resulted_in_match: hasMatch });
  }

  static logSuperLikeUsed() {
    this.logEvent(ANALYTICS_EVENTS.SUPER_LIKE_USED);
  }

  static logMatchCreated(matchId) {
    this.logEvent(ANALYTICS_EVENTS.MATCH_CREATED, { match_id: matchId });
  }

  // Chat events
  static logMessageSent(chatId, messageLength) {
    this.logEvent(ANALYTICS_EVENTS.MESSAGE_SENT, {
      chat_id: chatId,
      message_length: messageLength,
    });
  }

  static logChatOpened(chatId) {
    this.logEvent(ANALYTICS_EVENTS.CHAT_OPENED, { chat_id: chatId });
  }

  // Premium events
  static logPremiumUpgraded(planType, amount = null) {
    this.logEvent(ANALYTICS_EVENTS.PREMIUM_UPGRADED, {
      plan_type: planType,
      amount: amount,
    });
  }

  static logPremiumTrialStarted() {
    this.logEvent(ANALYTICS_EVENTS.PREMIUM_TRIAL_STARTED);
  }

  // Verification events
  static logVerificationRequested() {
    this.logEvent(ANALYTICS_EVENTS.VERIFICATION_REQUESTED);
  }

  static logVerificationApproved() {
    this.logEvent(ANALYTICS_EVENTS.VERIFICATION_APPROVED);
  }

  // Error tracking
  static logError(error, context = {}) {
    this.logEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_message: error.message || 'Unknown error',
      error_code: error.code || 'unknown',
      context: JSON.stringify(context),
    });
  }

  // Performance tracking
  static logAppOpened(coldStart = false) {
    this.logEvent(ANALYTICS_EVENTS.APP_OPENED, { cold_start: coldStart });
  }

  static logScreenView(screenName, previousScreen = null) {
    this.logEvent(ANALYTICS_EVENTS.SCREEN_VIEW, {
      screen_name: screenName,
      previous_screen: previousScreen,
    });
  }

  // Custom events
  static logCustomEvent(eventName, parameters = {}) {
    this.logEvent(eventName, parameters);
  }

  // Performance metrics
  static logPerformanceMetric(metricName, value, unit = 'ms') {
    this.logEvent('performance_metric', {
      metric_name: metricName,
      value: value,
      unit: unit,
    });
  }

  // User engagement
  static logUserEngagement(action, details = {}) {
    this.logEvent('user_engagement', {
      action: action,
      ...details,
    });
  }

  // Business metrics
  static logRevenue(amount, currency = 'USD', product = 'premium') {
    this.logEvent('purchase', {
      value: amount,
      currency: currency,
      items: [{ item_name: product }],
    });
  }
}
