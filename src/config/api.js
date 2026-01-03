import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production API URL - your Render backend
const PRODUCTION_API_URL = 'https://dating-app-backend-x4yq.onrender.com/api';

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

  // Default to production URL
  return PRODUCTION_API_URL;
};

/**
 * Get the WebSocket server URL (without /api)
 */
const getSocketUrl = () => {
  const apiUrl = getApiUrl();
  return apiUrl.replace('/api', '');
};

export const API_URL = getApiUrl();
export const SOCKET_URL = getSocketUrl();

export default {
  API_URL,
  SOCKET_URL,
};
