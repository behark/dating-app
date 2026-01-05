// Environment configuration management
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

export class EnvironmentConfig {
  static getCurrentEnvironment() {
    // Check for environment variables first
    if (process.env.NODE_ENV === 'production') {
      return ENVIRONMENTS.PRODUCTION;
    }

    if (process.env.EXPO_PUBLIC_ENV === 'staging') {
      return ENVIRONMENTS.STAGING;
    }

    // Default to development
    return ENVIRONMENTS.DEVELOPMENT;
  }

  static isProduction() {
    return this.getCurrentEnvironment() === ENVIRONMENTS.PRODUCTION;
  }

  static isDevelopment() {
    return this.getCurrentEnvironment() === ENVIRONMENTS.DEVELOPMENT;
  }

  static isStaging() {
    return this.getCurrentEnvironment() === ENVIRONMENTS.STAGING;
  }

  static getConfig() {
    const env = this.getCurrentEnvironment();

    const configs = {
      [ENVIRONMENTS.DEVELOPMENT]: {
        apiUrl: 'http://localhost:3000',
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        },
        analyticsEnabled: false,
        errorReportingEnabled: false,
        debugMode: true,
        maxMessagesPerChat: 1000,
        cacheExpirationHours: 1,
      },
      [ENVIRONMENTS.STAGING]: {
        apiUrl: 'https://staging.yourapp.com',
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        },
        analyticsEnabled: true,
        errorReportingEnabled: true,
        debugMode: true,
        maxMessagesPerChat: 5000,
        cacheExpirationHours: 6,
      },
      [ENVIRONMENTS.PRODUCTION]: {
        apiUrl: 'https://yourapp.com',
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        },
        analyticsEnabled: true,
        errorReportingEnabled: true,
        debugMode: false,
        maxMessagesPerChat: 10000,
        cacheExpirationHours: 24,
      },
    };

    return configs[env];
  }

  static getFeatureFlags() {
    const env = this.getCurrentEnvironment();

    const featureFlags = {
      [ENVIRONMENTS.DEVELOPMENT]: {
        premiumFeatures: true,
        pushNotifications: true,
        locationServices: true,
        advancedFilters: true,
        profileVerification: true,
        analytics: false,
        errorReporting: false,
      },
      [ENVIRONMENTS.STAGING]: {
        premiumFeatures: true,
        pushNotifications: true,
        locationServices: true,
        advancedFilters: true,
        profileVerification: true,
        analytics: true,
        errorReporting: true,
      },
      [ENVIRONMENTS.PRODUCTION]: {
        premiumFeatures: true,
        pushNotifications: true,
        locationServices: true,
        advancedFilters: true,
        profileVerification: true,
        analytics: true,
        errorReporting: true,
      },
    };

    return featureFlags[env];
  }

  static logEnvironmentInfo() {
    const env = this.getCurrentEnvironment();
    const config = this.getConfig();
    const features = this.getFeatureFlags();

    // Import logger dynamically to avoid circular dependency
    const logger = require('../utils/logger').default;
    logger.info('Environment Configuration', {
      environment: env,
      apiUrl: config.apiUrl,
      debugMode: config.debugMode,
      analyticsEnabled: config.analyticsEnabled,
      errorReportingEnabled: config.errorReportingEnabled,
      featureFlags: features,
    });
  }

  // Validation helpers
  static validateEnvironmentVariables() {
    const requiredVars = [
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'EXPO_PUBLIC_FIREBASE_APP_ID',
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing);
      return false;
    }

    return true;
  }

  static getBuildInfo() {
    return {
      version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
      buildTime: new Date().toISOString(),
      environment: this.getCurrentEnvironment(),
    };
  }
}
