import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
// Only import gesture handler on native platforms
if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatusBanner from './src/components/NetworkStatusBanner';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import AppNavigator from './src/navigation/AppNavigator';
import { AnalyticsService } from './src/services/AnalyticsService';
import { PWAService } from './src/services/PWAService';

export default function App() {
  useEffect(() => {
    // Initialize analytics on app start
    AnalyticsService.initialize();
    AnalyticsService.logAppOpened(true);
    
    // Initialize PWA features for web
    if (Platform.OS === 'web') {
      PWAService.initialize();
    }
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <ChatProvider>
            <AppNavigator />
            <NetworkStatusBanner />
            <StatusBar style="auto" />
          </ChatProvider>
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
