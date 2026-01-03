import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AnalyticsService } from './src/services/AnalyticsService';
import 'react-native-gesture-handler';

export default function App() {
  useEffect(() => {
    // Initialize analytics on app start
    AnalyticsService.initialize();
    AnalyticsService.logAppOpened(true);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ChatProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </ChatProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
