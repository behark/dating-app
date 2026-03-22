import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary, { SimpleErrorBoundary } from './src/components/common/ErrorBoundary';
import NetworkStatusBanner from './src/components/common/NetworkStatusBanner';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/app/navigation/AppNavigator';
import AppInitializationService from './src/services/AppInitializationService';
import { UpdateService } from './src/services/UpdateService';

// Vercel Analytics and Speed Insights (web only)
// Using dynamic imports for web platform to avoid breaking native builds
let Analytics = null;
let SpeedInsights = null;
const enableVercelAnalytics =
  Constants.expoConfig?.extra?.vercelAnalyticsEnabled ||
  process.env.EXPO_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true';
const enableSpeedInsights =
  Constants.expoConfig?.extra?.vercelSpeedInsightsEnabled ||
  process.env.EXPO_PUBLIC_VERCEL_SPEED_INSIGHTS_ENABLED === 'true';

if (Platform.OS === 'web' && enableVercelAnalytics) {
  try {
    // eslint-disable-next-line import/no-unresolved
    const { Analytics: AnalyticsComponent } = require('@vercel/analytics/react');
    Analytics = AnalyticsComponent;
  } catch {
    // Vercel Analytics not available in this environment
  }
}

if (Platform.OS === 'web' && enableSpeedInsights) {
  try {
    // eslint-disable-next-line import/no-unresolved
    const { SpeedInsights: SpeedInsightsComponent } = require('@vercel/speed-insights/react');
    SpeedInsights = SpeedInsightsComponent;
  } catch {
    // Vercel Speed Insights not available in this environment
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

// Error recovery handlers for ErrorBoundary
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

  const handleNavigate = useCallback(() => {
    // Navigation will be handled by retry resetting state
  }, []);

  const handleOfflineMode = useCallback(() => {
    // Enable offline mode
  }, []);

  return (
    <ErrorBoundary
      maxRetries={3}
      enableRecoveryActions={true}
      enableCategorization={true}
      onLogin={handleLogin}
      onSettings={handleSettings}
      onNavigate={handleNavigate}
      onOfflineMode={handleOfflineMode}
    >
      <AppContent />
    </ErrorBoundary>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize app services
    AppInitializationService.initializeApp();

    // Setup console warning suppression
    AppInitializationService.setupConsoleWarnings();

    // Fix collapsing empty div (caused by Sentry or other libraries on web)
    if (Platform.OS === 'web') {
      const cleanupCollapsingDivs = () => {
        try {
          // Find and hide empty divs directly under body that have height: 0
          const emptyDivs = Array.from(document.querySelectorAll('body > div')).filter((el) => {
            const rect = el.getBoundingClientRect();
            // If div has height 0 or is very small, hide it (catches empty & collapsed elements)
            return rect.height <= 1 && el.children.length === 0;
          });

          emptyDivs.forEach((el) => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.height = '0';
            el.style.width = '0';
            el.style.margin = '0';
            el.style.padding = '0';
            el.style.border = 'none';
          });

          if (emptyDivs.length > 0) {
            // eslint-disable-next-line no-console
            console.info(`🧹 Fixed ${emptyDivs.length} collapsing empty div(s) on body`);
          }
        } catch (e) {
          // Silently ignore if we can't access DOM
        }
      };

      // Run cleanup immediately and after a short delay to catch divs added by async libraries
      cleanupCollapsingDivs();
      setTimeout(cleanupCollapsingDivs, 100);
      setTimeout(cleanupCollapsingDivs, 500);
    }

    // Cleanup on unmount
    return () => {
      UpdateService.cleanup();
    };
  }, []);

  return (
    <SimpleErrorBoundary>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </SimpleErrorBoundary>
  );
}
