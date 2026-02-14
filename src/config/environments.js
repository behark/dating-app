// Environment configuration management
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

export class EnvironmentConfig {
  static getCurrentEnvironment() {
    if (process.env.NODE_ENV === 'production') {
      return ENVIRONMENTS.PRODUCTION;
    }

    if (process.env.EXPO_PUBLIC_ENV === 'staging') {
      return ENVIRONMENTS.STAGING;
    }

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
        analyticsEnabled: false,
        errorReportingEnabled: false,
        debugMode: true,
        maxMessagesPerChat: 1000,
        cacheExpirationHours: 1,
      },
      [ENVIRONMENTS.STAGING]: {
        apiUrl: 'https://staging.yourapp.com',
        analyticsEnabled: true,
        errorReportingEnabled: true,
        debugMode: true,
        maxMessagesPerChat: 5000,
        cacheExpirationHours: 6,
      },
      [ENVIRONMENTS.PRODUCTION]: {
        apiUrl: 'https://yourapp.com',
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

  static validateEnvironmentVariables() {
    const requiredVars = ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_BACKEND_URL'];

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
