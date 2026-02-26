/**
 * AnalyticsService
 * Lightweight logger-based analytics tracking.
 * Firebase Analytics was removed during infrastructure simplification.
 * Events are logged via the app logger for debugging and future provider integration.
 */

import logger from '../utils/logger';

export class AnalyticsService {
  static initialized = false;
  static userId = null;

  static async initialize() {
    this.initialized = true;
    logger.info('[Analytics] initialized');
  }

  static async logEvent(name, params = {}) {
    logger.info(`[Analytics] event: ${name}`, params);
  }

  static async setUserId(userId) {
    this.userId = userId;
  }

  static async setUserProperties(properties) {
    logger.info('[Analytics] setUserProperties', properties);
  }

  static async logSignUp(method) {
    return this.logEvent('sign_up', { method });
  }

  static async logLogin(method) {
    return this.logEvent('login', { method });
  }

  static async logProfileView(profileId) {
    return this.logEvent('profile_view', { profileId });
  }

  static async logSwipe(direction, targetId) {
    return this.logEvent('swipe', { direction, targetId });
  }

  static async logMatch(matchId) {
    return this.logEvent('match', { matchId });
  }

  static async logMessageSent(conversationId) {
    return this.logEvent('message_sent', { conversationId });
  }

  static async logPremiumPurchase(plan) {
    return this.logEvent('premium_purchase', { plan });
  }

  static async logScreenView(screenName) {
    return this.logEvent('screen_view', { screenName });
  }

  static async logAppOpened() {
    return this.logEvent('app_opened');
  }

  static async logProfileCompletion(percentage) {
    return this.logEvent('profile_completion', { percentage });
  }

  static async logPhotoUpload(count) {
    return this.logEvent('photo_upload', { count });
  }

  static async logSearch(filters) {
    return this.logEvent('search', { filters });
  }

  static async logSettingsChange(setting, value) {
    return this.logEvent('settings_change', { setting, value });
  }

  static async logAppRating(rating) {
    return this.logEvent('app_rating', { rating });
  }

  static async logShare(contentType) {
    return this.logEvent('share', { contentType });
  }

  static async logError(errorName, errorMessage) {
    logger.error(`[Analytics] error: ${errorName}`, { errorMessage });
  }

  static async logTutorialComplete() {
    return this.logEvent('tutorial_complete');
  }
}

export default AnalyticsService;
