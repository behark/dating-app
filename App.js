import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Linking, Platform } from 'react-native';

// Initialize Firebase before AnalyticsService (required for expo-firebase-analytics)
import './src/config/firebase';

import ErrorBoundary, { SimpleErrorBoundary } from './src/components/Common/ErrorBoundary';
import NetworkStatusBanner from './src/components/NetworkStatusBanner';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import AppInitializationService from './src/services/AppInitializationService';
import { UpdateService } from './src/services/UpdateService';

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

  const handleNavigate = useCallback((screen) => {
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

    // Cleanup on unmount
    return () => {
      UpdateService.cleanup();
    };
  }, []);

  return (
    <SimpleErrorBoundary>
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
    </SimpleErrorBoundary>
  );
}
