/**
 * AnalyticsService
 * Stub - Firebase Analytics removed during infrastructure simplification.
 * All methods are no-ops to preserve call-site compatibility.
 */

export class AnalyticsService {
  static initialized = false;
  static userId = null;

  static async initialize() {}
  static async logEvent() {}
  static async setUserId() {}
  static async setUserProperties() {}
  static async logSignUp() {}
  static async logLogin() {}
  static async logProfileView() {}
  static async logSwipe() {}
  static async logMatch() {}
  static async logMessageSent() {}
  static async logPremiumPurchase() {}
  static async logScreenView() {}
  static async logAppOpened() {}
  static async logProfileCompletion() {}
  static async logPhotoUpload() {}
  static async logSearch() {}
  static async logSettingsChange() {}
  static async logAppRating() {}
  static async logShare() {}
  static async logError() {}
  static async logTutorialComplete() {}
}

export default AnalyticsService;
