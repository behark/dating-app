import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

// Initialize Firebase before AnalyticsService (required for expo-firebase-analytics)
import './src/config/firebase';

import AppErrorBoundary from './src/components/AppErrorBoundary';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import NetworkStatusBanner from './src/components/NetworkStatusBanner';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import { AnalyticsService } from './src/services/AnalyticsService';
import NotificationService from './src/services/NotificationService';
import { PWAService } from './src/services/PWAService';
import { UpdateService } from './src/services/UpdateService';
import { UserBehaviorAnalytics } from './src/services/UserBehaviorAnalytics';
import { initSentry } from './src/utils/sentry';
import IAPService from './src/services/IAPService';
import api from './src/services/api';
import { API_ENDPOINTS } from './src/constants/constants';

// Vercel Analytics and Speed Insights (web only)
// Using dynamic imports for web platform to avoid breaking native builds
let Analytics = null;
let SpeedInsights = null;

if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line import/no-unresolved
    const { Analytics: AnalyticsComponent } = require('@vercel/analytics/react');
    Analytics = AnalyticsComponent;
  } catch (error) {
    console.warn('Vercel Analytics not available:', error);
  }

  try {
    // eslint-disable-next-line import/no-unresolved
    const { SpeedInsights: SpeedInsightsComponent } = require('@vercel/speed-insights/react');
    SpeedInsights = SpeedInsightsComponent;
  } catch (error) {
    console.warn('Vercel Speed Insights not available:', error);
  }
}

// Only import gesture handler on native platforms
if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <AppNavigator />
      {/* Network status with pending actions, retry, and auto-hide */}
      <NetworkStatusBanner />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Vercel Speed Insights - Web only */}
      {Platform.OS === 'web' && SpeedInsights && <SpeedInsights />}
      {/* Vercel Analytics - Web only */}
      {Platform.OS === 'web' && Analytics && <Analytics />}
    </>
  );
}

// Error recovery handlers for AppErrorBoundary
function AppWithErrorHandling() {
  const { logout } = useAuth();

  const handleLogin = useCallback(() => {
    // Force re-authentication
    logout?.();
  }, [logout]);

  const handleSettings = useCallback(() => {
    // Open app settings
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  const handleNavigate = useCallback((screen) => {
    // Navigation will be handled by retry resetting state
  }, []);

  const handleOfflineMode = useCallback(() => {
    // Enable offline mode
  }, []);

  return (
    <AppErrorBoundary
      maxRetries={3}
      onLogin={handleLogin}
      onSettings={handleSettings}
      onNavigate={handleNavigate}
      onOfflineMode={handleOfflineMode}
    >
      <AppContent />
    </AppErrorBoundary>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize app services
    const initializeApp = async () => {
      // CRITICAL FIX: Initialize Sentry error tracking
      const sentryDsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
      if (sentryDsn) {
        initSentry({
          dsn: sentryDsn,
          environment: __DEV__ ? 'development' : 'production',
          release: Constants.expoConfig?.version || '1.0.0',
        });
        if (__DEV__) console.log('✅ Sentry error tracking initialized');
      } else {
        if (__DEV__) console.warn('⚠️  Sentry DSN not configured - error tracking disabled');
      }

      // Register for push notifications (native only)
      if (Platform.OS !== 'web') {
        try {
          const pushToken = await NotificationService.registerForPushNotifications();
          if (pushToken) {
            console.log('✅ Push token:', pushToken);
            // Send push token to backend
            try {
              await api.post(API_ENDPOINTS.NOTIFICATIONS.PUSH_TOKEN, {
                expoPushToken: pushToken,
                platform: Platform.OS,
              });
              console.log('✅ Push token registered with backend');
            } catch (error) {
              console.error('❌ Failed to register push token with backend:', error);
            }
          }

          // Setup notification listeners
          const cleanup = NotificationService.setupNotificationListeners(
            (notification) => {
              console.log('📱 Notification received:', notification);
              // Handle foreground notifications
            },
            (response) => {
              const data = response.notification.request.content.data;
              console.log('📱 Notification tapped:', data);

              // Navigate based on notification type
              if (data && data.type) {
                switch (data.type) {
                  case 'match':
                    // Navigate to matches screen
                    // Note: Navigation handling would need to be implemented with navigation ref
                    console.log('Navigate to matches screen for match:', data.matchId);
                    break;
                  case 'message':
                    // Navigate to chat screen
                    console.log('Navigate to chat screen for message:', data.matchId);
                    break;
                  case 'like':
                    // Navigate to profile or matches
                    console.log('Navigate to profile for like:', data.userId);
                    break;
                  default:
                    console.log('Unknown notification type:', data.type);
                }
              }
            }
          );

          return cleanup;
        } catch (error) {
          console.error('❌ Error setting up push notifications:', error);
        }
      }
    };

    initializeApp();

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
        originalWarn.apply(console, args);
      };
    }

    // Initialize analytics on app start
    AnalyticsService.initialize();
    AnalyticsService.logAppOpened(true);

    // Initialize user behavior analytics
    UserBehaviorAnalytics.initialize();

    // Initialize IAP service (only on native platforms)
    if (Platform.OS !== 'web') {
      IAPService.initialize().catch((error) => {
        console.error('Failed to initialize IAP:', error);
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
          console.log('📱 App Version:', UpdateService.getDisplayVersion());
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

    // Cleanup on unmount
    return () => {
      UpdateService.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <AuthProvider>
            <SocketProvider>
              <ChatProvider>
                <AppWithErrorHandling />
              </ChatProvider>
            </SocketProvider>
          </AuthProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
