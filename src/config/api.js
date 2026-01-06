import Constants from 'expo-constants';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Get API URLs from environment variables
// Production API URL - from environment variable
const PRODUCTION_API_URL =
  process.env.EXPO_PUBLIC_API_URL_PRODUCTION ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000/api'; // Use local as ultimate fallback for safety during dev

// Development API URL - use localhost for local testing
const DEVELOPMENT_API_URL =
  process.env.EXPO_PUBLIC_API_URL_DEVELOPMENT ||
  process.env.EXPO_PUBLIC_API_URL_DEV ||
  'http://localhost:3000/api';

// Mock API URL for UI testing without backend
const MOCK_API_URL = null; // Set to a mock server if needed

/**
 * Normalize API URL to ensure it ends with /api
 */
const normalizeApiUrl = (url) => {
  return url.endsWith('/api') ? url : `${url}/api`;
};

/**
 * Check if we're in development mode
 */
const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || (typeof __DEV__ !== 'undefined' && __DEV__);
};

/**
 * Get runtime API URL from window environment (for web builds on Vercel)
 */
const getRuntimeApiUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const runtimeUrl = window.__ENV__?.EXPO_PUBLIC_API_URL;
    if (runtimeUrl) {
      return normalizeApiUrl(runtimeUrl);
    }
  }
  return null;
};

/**
 * Get API URL from Expo config (set at build time)
 */
const getConfigApiUrl = () => {
  const configUrl = Constants.expoConfig?.extra?.backendUrl;
  if (configUrl && configUrl !== 'http://localhost:3000/api') {
    return configUrl;
  }
  return null;
};

/**
 * Get API URL from process.env (works at build time)
 */
const getEnvApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl) {
    const isDev = isDevelopmentMode();
    if (isDev || !envUrl.includes('localhost')) {
      let normalizedUrl = normalizeApiUrl(envUrl);

      // CRITICAL: Enforce HTTPS in production
      if (!isDev && normalizedUrl.startsWith('http://')) {
        normalizedUrl = normalizedUrl.replace('http://', 'https://');
        logger.warn('HTTP URL detected in production, forcing HTTPS', {
          originalUrl: envUrl,
          correctedUrl: normalizedUrl,
        });
      }

      return normalizedUrl;
    }
  }
  return null;
};

/**
 * Get default API URL based on environment and platform
 */
const getDefaultApiUrl = () => {
  const isDev = isDevelopmentMode();
  return isDev ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
};

/**
 * Get the backend API URL
 * Priority:
 * 1. Runtime environment variable (for web builds on Vercel)
 * 2. Expo config extra.backendUrl (set at build time)
 * 3. Process.env variables
 * 4. Production URL as default
 */
const getApiUrl = () => {
  return getRuntimeApiUrl() || getConfigApiUrl() || getEnvApiUrl() || getDefaultApiUrl();
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
  logger.debug('🌐 API Configuration:', {
    platform: Platform.OS,
    apiUrl: API_URL,
    isDev: typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined',
    windowEnv: window.__ENV__,
    configUrl: Constants.expoConfig?.extra?.backendUrl,
    envUrl: process.env.EXPO_PUBLIC_API_URL,
  });
}

export default {
  API_URL,
  API_BASE_URL,
  SOCKET_URL,
};
