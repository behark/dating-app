import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import NetworkStatusBanner from './src/components/NetworkStatusBanner';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { AnalyticsService } from './src/services/AnalyticsService';
import { PWAService } from './src/services/PWAService';
import { UserBehaviorAnalytics } from './src/services/UserBehaviorAnalytics';
// Vercel Speed Insights (web only)
let SpeedInsights;
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line import/no-unresolved
    const speedInsightsModule = require('@vercel/speed-insights/react');
    SpeedInsights = speedInsightsModule.SpeedInsights || speedInsightsModule.default;
  } catch (error) {
    console.warn('Speed Insights not available:', error);
  }
}

// Vercel Analytics (web only)
let Analytics;
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line import/no-unresolved
    Analytics = require('@vercel/analytics/react').Analytics;
  } catch (error) {
    console.warn('Vercel Analytics not available:', error);
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
    console.log(`[ErrorBoundary] Navigation requested to: ${screen}`);
  }, []);

  const handleOfflineMode = useCallback(() => {
    // Enable offline mode
    console.log('[ErrorBoundary] Offline mode enabled');
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
    // Initialize analytics on app start
    AnalyticsService.initialize();
    AnalyticsService.logAppOpened(true);

    // Initialize user behavior analytics
    UserBehaviorAnalytics.initialize();

    // Track registration funnel start
    UserBehaviorAnalytics.trackFunnelStep('registration', 'app_opened');

    // Initialize PWA features for web
    if (Platform.OS === 'web') {
      PWAService.initialize();
    }

    // Register A/B tests
    UserBehaviorAnalytics.registerABTest('onboarding_flow', ['control', 'simplified', 'gamified'], {
      distribution: [0.34, 0.33, 0.33],
    });

    UserBehaviorAnalytics.registerABTest('premium_cta', ['control', 'urgency', 'social_proof'], {
      distribution: [0.34, 0.33, 0.33],
    });
  }, []);

  return (
    <ThemeProvider>
      <AppProvider>
        <AuthProvider>
          <ChatProvider>
            <AppWithErrorHandling />
          </ChatProvider>
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
