// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:1',message:'Module start',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Linking, Platform } from 'react-native';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:7',message:'Before firebase import',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
// #endregion
// Initialize Firebase before AnalyticsService (required for expo-firebase-analytics)
import './src/config/firebase';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:10',message:'After firebase import',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
// #endregion

// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:13',message:'Before ErrorBoundary import',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
// #endregion
import ErrorBoundary, { SimpleErrorBoundary } from './src/components/Common/ErrorBoundary';
import NetworkStatusBanner from './src/components/NetworkStatusBanner';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:16',message:'Before context imports',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
// #endregion
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SocketProvider } from './src/context/SocketContext';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:22',message:'After context imports',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
// #endregion
import AppNavigator from './src/navigation/AppNavigator';
import AppInitializationService from './src/services/AppInitializationService';
import { UpdateService } from './src/services/UpdateService';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:27',message:'Before Analytics declaration',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
// #endregion
// Vercel Analytics and Speed Insights (web only)
// Using dynamic imports for web platform to avoid breaking native builds
let Analytics = null;
let SpeedInsights = null;
// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:31',message:'After Analytics declaration',data:{analytics:typeof Analytics,speedInsights:typeof SpeedInsights,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
// #endregion

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
