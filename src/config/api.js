import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production API URL - your Render backend
const PRODUCTION_API_URL = 'https://dating-app-backend-x4yq.onrender.com/api';

// Development API URL - use deployed backend for testing
const DEVELOPMENT_API_URL = 'https://dating-app-backend-x4yq.onrender.com/api';

// Mock API URL for UI testing without backend
const MOCK_API_URL = null; // Set to a mock server if needed

/**
 * Get the backend API URL
 * Priority:
 * 1. Runtime environment variable (for web builds on Vercel)
 * 2. Expo config extra.backendUrl (set at build time)
 * 3. Production URL as default
 */
const getApiUrl = () => {
  // For web platform, check window environment variable first
  // This allows setting the URL at runtime via Vercel environment variables
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Check for runtime injected env var
    const runtimeUrl = window.__ENV__?.EXPO_PUBLIC_API_URL;
    if (runtimeUrl) {
      return runtimeUrl.endsWith('/api') ? runtimeUrl : `${runtimeUrl}/api`;
    }
  }

  // Check Expo config (set at build time via app.config.js)
  const configUrl = Constants.expoConfig?.extra?.backendUrl;
  if (configUrl && configUrl !== 'http://localhost:3000/api') {
    return configUrl;
  }

  // Check process.env (works at build time)
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // Default to localhost in development, production otherwise
  return __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
};

/**
 * Get the WebSocket server URL (without /api)
 */
const getSocketUrl = () => {
  const apiUrl = getApiUrl();
  return apiUrl.replace('/api', '');
};

export const API_URL = getApiUrl();
export const API_BASE_URL = API_URL; // Alias for backward compatibility
export const SOCKET_URL = getSocketUrl();

// Debug logging for API URL (only in browser)
if (typeof window !== 'undefined') {
  console.log('🌐 API Configuration:');
  console.log('  - Platform:', Platform.OS);
  console.log('  - API_URL:', API_URL);
  console.log('  - __DEV__:', typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined');
  console.log('  - window.__ENV__:', window.__ENV__);
  console.log('  - Constants.expoConfig?.extra?.backendUrl:', Constants.expoConfig?.extra?.backendUrl);
  console.log('  - process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
}

export default {
  API_URL,
  API_BASE_URL,
  SOCKET_URL,
};
