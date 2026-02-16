/* eslint-disable sonarjs/cognitive-complexity */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { initSentry } from '../utils/sentry';
import { API_ENDPOINTS } from '../constants/constants';
import logger from '../utils/logger';
import { AnalyticsService } from './AnalyticsService';
import NotificationService from './NotificationService';
import { PWAService } from './PWAService';
import { UpdateService } from './UpdateService';
import { UserBehaviorAnalytics } from './UserBehaviorAnalytics';
import IAPService from './IAPService';
import api from './api';

/**
 * Service to handle all app initialization logic
 * Extracted from App.js to improve maintainability
 */
class AppInitializationService {
  static async initializeApp() {
    let notificationCleanup = null;
    // CRITICAL FIX: Initialize Sentry error tracking
    const sentryDsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (sentryDsn) {
      initSentry({
        dsn: sentryDsn,
        environment: __DEV__ ? 'development' : 'production',
        release: Constants.expoConfig?.version || '1.0.0',
      });
      if (__DEV__) logger.debug('Sentry error tracking initialized');
    } else {
      if (__DEV__) console.warn('⚠️  Sentry DSN not configured - error tracking disabled');
    }

    // Register for push notifications (native only)
    if (Platform.OS !== 'web') {
      try {
        const pushToken = await NotificationService.registerForPushNotifications();
        if (pushToken) {
          logger.debug('Push token registered');
          // Send push token to backend
          try {
            await api.post(API_ENDPOINTS.NOTIFICATIONS.PUSH_TOKEN, {
              expoPushToken: pushToken,
              platform: Platform.OS,
            });
            logger.debug('Push token registered with backend');
          } catch (error) {
            logger.error('Failed to register push token with backend:', error);
          }
        }

        // Setup notification listeners
        notificationCleanup = NotificationService.setupNotificationListeners(
          (notification) => {
            logger.debug('Notification received');
            // Handle foreground notifications
          },
          (response) => {
            const data = response.notification.request.content.data;
            logger.debug('Notification tapped');

            // Navigate based on notification type
            if (data && data.type) {
              switch (data.type) {
                case 'match':
                  // Navigate to matches screen
                  // Note: Navigation handling would need to be implemented with navigation ref
                  logger.debug('Navigate to matches screen for match');
                  break;
                case 'message':
                  // Navigate to chat screen
                  logger.debug('Navigate to chat screen for message');
                  break;
                case 'like':
                  // Navigate to profile or matches
                  logger.debug('Navigate to profile for like');
                  break;
                default:
                  logger.debug('Unknown notification type:', data.type);
              }
            }
          }
        );
      } catch (error) {
        logger.error('Error setting up push notifications:', error);
      }
    }

    // Initialize analytics on app start
    AnalyticsService.initialize();
    AnalyticsService.logAppOpened(true);

    // Initialize user behavior analytics
    UserBehaviorAnalytics.initialize();

    // Initialize IAP service (only on native platforms)
    if (Platform.OS !== 'web') {
      IAPService.initialize().catch((error) => {
        logger.error('Failed to initialize IAP:', error);
      });
    }

    // Track registration funnel start
    UserBehaviorAnalytics.trackFunnelStep('registration', 'app_opened');

    // Initialize PWA features for web
    if (Platform.OS === 'web') {
      PWAService.initialize();
    }

    // Initialize OTA update service for native platforms
    if (Platform.OS !== 'web') {
      UpdateService.initialize().then(async () => {
        // Check for updates and show dialog if available
        const updateResult = await UpdateService.checkForUpdates();
        if (updateResult.status === 'update_available') {
          UpdateService.showUpdateDialog(false);
        } else if (updateResult.status === 'update_critical') {
          UpdateService.showUpdateDialog(true);
        }

        // Log version info
        if (__DEV__) {
          logger.debug('App Version:', UpdateService.getDisplayVersion());
        }
      });
    }

    // Register A/B tests
    UserBehaviorAnalytics.registerABTest('onboarding_flow', ['control', 'simplified', 'gamified'], {
      distribution: [0.34, 0.33, 0.33],
    });

    UserBehaviorAnalytics.registerABTest('premium_cta', ['control', 'urgency', 'social_proof'], {
      distribution: [0.34, 0.33, 0.33],
    });

    return notificationCleanup;
  }

  static setupConsoleWarnings() {
    // Suppress known warnings on web that are expected/harmless
    if (Platform.OS === 'web' && typeof console !== 'undefined') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args[0]?.toString() || '';
        // Filter out Radix UI Dialog accessibility warnings from Vercel Analytics
        if (
          message.includes('DialogContent') &&
          message.includes('DialogTitle') &&
          message.includes('screen reader')
        ) {
          return; // Suppress this specific warning
        }
        // Filter out Animated useNativeDriver warning on web (expected, native module doesn't exist on web)
        if (
          message.includes('useNativeDriver') &&
          message.includes('native animated module is missing')
        ) {
          return; // Suppress - this is expected on web
        }
        // Suppress zustand default export deprecation warnings from third-party bundles
        if (message.includes('zustand') && message.includes('Default export is deprecated')) {
          return;
        }
        originalWarn.apply(console, args);
      };
    }
  }
}

export default AppInitializationService;
