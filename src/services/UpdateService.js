import Constants from 'expo-constants';
import { Platform, Alert, Linking } from 'react-native';
import logger from '../utils/logger';

// Check if expo-updates is available (only in standalone builds)
let Updates = null;
try {
  Updates = require('expo-updates');
} catch {
  // expo-updates not available in Expo Go or web
}

/**
 * App versioning and update constants
 */
export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
export const BUILD_NUMBER = Platform.select({
  ios: Constants.expoConfig?.ios?.buildNumber || '1',
  android: String(Constants.expoConfig?.android?.versionCode || 1),
  default: '1',
});

/**
 * Update check result types
 */
export const UpdateStatus = {
  NO_UPDATE: 'no_update',
  UPDATE_AVAILABLE: 'update_available',
  UPDATE_CRITICAL: 'update_critical',
  ERROR: 'error',
  NOT_SUPPORTED: 'not_supported',
};

/**
 * UpdateService - Handles app versioning and OTA updates
 */
export class UpdateService {
  static updateCheckInterval = null;
  static lastCheckTime = null;

  /**
   * Initialize update service
   * Call this in App.js on startup
   */
  static async initialize() {
    // Skip on web or in development
    if (Platform.OS === 'web' || __DEV__) {
      logger.debug('UpdateService: Skipping initialization (web or development)');
      return;
    }

    // Check for updates on app start
    await this.checkForUpdates();

    // Set up periodic update checks (every 30 minutes)
    this.updateCheckInterval = setInterval(
      () => {
        this.checkForUpdates(true); // Silent check
      },
      30 * 60 * 1000
    );
  }

  /**
   * Clean up on unmount
   */
  static cleanup() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Get current app version info
   */
  static getVersionInfo() {
    return {
      version: APP_VERSION,
      buildNumber: BUILD_NUMBER,
      platform: Platform.OS,
      runtimeVersion: Constants.expoConfig?.runtimeVersion || APP_VERSION,
      releaseChannel: Updates?.releaseChannel || 'default',
      updateId: Updates?.updateId || null,
      isEmbeddedLaunch: Updates?.isEmbeddedLaunch ?? true,
    };
  }

  /**
   * Check for OTA updates
   * @param {boolean} silent - If true, don't show alerts for no updates
   * @returns {Promise<{status: string, manifest?: object}>}
   */
  static async checkForUpdates(silent = false) {
    // Can't check updates on web or in Expo Go
    if (Platform.OS === 'web' || !Updates) {
      return { status: UpdateStatus.NOT_SUPPORTED };
    }

    // In development mode, expo-updates is disabled
    if (__DEV__) {
      return { status: UpdateStatus.NOT_SUPPORTED };
    }

    try {
      this.lastCheckTime = new Date();
      logger.info('UpdateService: Checking for updates...');

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        logger.info('UpdateService: Update available', { manifest: update.manifest });

        // Check if it's a critical update (you can add metadata in your update)
        const isCritical = update.manifest?.extra?.critical === true;

        return {
          status: isCritical ? UpdateStatus.UPDATE_CRITICAL : UpdateStatus.UPDATE_AVAILABLE,
          manifest: update.manifest,
        };
      }

      if (!silent) {
        logger.info('UpdateService: No update available');
      }
      return { status: UpdateStatus.NO_UPDATE };
    } catch (error) {
      logger.error('UpdateService: Error checking for updates', error);
      return { status: UpdateStatus.ERROR, error };
    }
  }

  /**
   * Download and apply an OTA update
   * @param {boolean} immediate - If true, restart immediately after download
   * @returns {Promise<boolean>}
   */
  static async downloadAndApplyUpdate(immediate = false) {
    if (!Updates || Platform.OS === 'web' || __DEV__) {
      logger.warn('UpdateService: Updates not available');
      return false;
    }

    try {
      logger.info('UpdateService: Downloading update...');

      // Download the update
      const result = await Updates.fetchUpdateAsync();

      if (!result.isNew) {
        logger.info('UpdateService: Downloaded update is not new');
        return false;
      }

      logger.info('UpdateService: Update downloaded successfully');

      if (immediate) {
        // Reload the app immediately
        await Updates.reloadAsync();
      } else {
        // The update will be applied on next app restart
        logger.info('UpdateService: Update will be applied on next restart');
      }

      return true;
    } catch (error) {
      logger.error('UpdateService: Error downloading update', error);
      return false;
    }
  }

  /**
   * Show update available dialog
   * @param {boolean} critical - If true, user cannot dismiss
   */
  static showUpdateDialog(critical = false) {
    const title = critical ? '🚨 Critical Update Required' : '✨ Update Available';
    const message = critical
      ? 'A critical update is available that includes important security fixes. Please update now to continue using the app.'
      : 'A new version of the app is available with improvements and bug fixes. Would you like to update now?';

    const buttons = critical
      ? [
          {
            text: 'Update Now',
            onPress: () => this.downloadAndApplyUpdate(true),
            style: 'default',
          },
        ]
      : [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Update Now',
            onPress: () => this.downloadAndApplyUpdate(true),
            style: 'default',
          },
        ];

    Alert.alert(title, message, buttons, { cancelable: !critical });
  }

  /**
   * Check backend for required minimum version
   * This can be used to force updates for critical changes
   * @param {string} backendUrl - Backend API URL
   */
  static async checkMinimumVersion(backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/api/app/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { requiresUpdate: false };
      }

      const data = await response.json();
      const currentVersion = this.parseVersion(APP_VERSION);
      const minVersion = this.parseVersion(data.minimumVersion || '0.0.0');

      const requiresUpdate = this.compareVersions(currentVersion, minVersion) < 0;

      if (requiresUpdate) {
        logger.warn('UpdateService: App version below minimum required', {
          current: APP_VERSION,
          minimum: data.minimumVersion,
        });
      }

      return {
        requiresUpdate,
        currentVersion: APP_VERSION,
        minimumVersion: data.minimumVersion,
        latestVersion: data.latestVersion,
        updateUrl: data.updateUrl,
        releaseNotes: data.releaseNotes,
      };
    } catch (error) {
      logger.error('UpdateService: Error checking minimum version', error);
      return { requiresUpdate: false, error };
    }
  }

  /**
   * Show store update dialog (for native app store updates)
   */
  static showStoreUpdateDialog(updateUrl, releaseNotes) {
    Alert.alert(
      '🎉 New Version Available',
      releaseNotes || 'A new version of the app is available in the app store.',
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: () => {
            if (updateUrl) {
              Linking.openURL(updateUrl);
            } else {
              // Default to app store
              const storeUrl = Platform.select({
                ios: 'https://apps.apple.com/app/dating-app/id<YOUR_APP_ID>',
                android: 'https://play.google.com/store/apps/details?id=com.datingapp.app',
              });
              if (storeUrl) {
                Linking.openURL(storeUrl);
              }
            }
          },
          style: 'default',
        },
      ]
    );
  }

  /**
   * Parse version string to comparable object
   */
  static parseVersion(versionString) {
    const parts = versionString.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }

  /**
   * Compare two versions
   * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
   */
  static compareVersions(a, b) {
    if (a.major !== b.major) return a.major < b.major ? -1 : 1;
    if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
    if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
    return 0;
  }

  /**
   * Get formatted version string for display
   */
  static getDisplayVersion() {
    return `v${APP_VERSION} (${BUILD_NUMBER})`;
  }

  /**
   * Check if this is the first launch after an update
   */
  static async isFirstLaunchAfterUpdate() {
    if (!Updates || Platform.OS === 'web') {
      return false;
    }

    try {
      // Check if we're running an embedded (bundled) launch or an OTA update
      return !Updates.isEmbeddedLaunch;
    } catch {
      return false;
    }
  }
}

export default UpdateService;
