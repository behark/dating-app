import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from './logger';

/**
 * Secure Storage Utility
 * Uses expo-secure-store for sensitive data (tokens) on native platforms
 * Falls back to AsyncStorage for web platform
 */

const TOKEN_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
};

/**
 * Check if secure storage is available
 * @returns {boolean}
 */
const isSecureStorageAvailable = () => {
  return Platform.OS !== 'web' && SecureStore.isAvailableAsync();
};

/**
 * Store a token securely
 * @param {string} key - Storage key
 * @param {string} value - Token value to store
 * @returns {Promise<void>}
 */
export const storeTokenSecurely = async (key, value) => {
  try {
    if (isSecureStorageAvailable()) {
      // Use SecureStore on native platforms (iOS Keychain / Android Keystore)
      await SecureStore.setItemAsync(key, value, {
        requireAuthentication: false, // Don't require biometric auth for tokens
        authenticationPrompt: '',
      });
      logger.debug(`Token stored securely in ${Platform.OS} secure storage`, { key });
    } else {
      // Fallback to AsyncStorage for web
      await AsyncStorage.setItem(key, value);
      logger.debug('Token stored in AsyncStorage (web platform)', { key });
    }
  } catch (error) {
    logger.error('Error storing token securely', error, { key });
    // Fallback to AsyncStorage if SecureStore fails
    try {
      await AsyncStorage.setItem(key, value);
      logger.warn('Fell back to AsyncStorage after SecureStore failure', { key });
    } catch (fallbackError) {
      logger.error('Failed to store token even in AsyncStorage', fallbackError, { key });
      throw fallbackError;
    }
  }
};

/**
 * Retrieve a token from secure storage
 * @param {string} key - Storage key
 * @returns {Promise<string|null>}
 */
export const getTokenSecurely = async (key) => {
  try {
    if (isSecureStorageAvailable()) {
      // Try SecureStore first on native platforms
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        logger.debug(`Token retrieved from ${Platform.OS} secure storage`, { key });
        return value;
      }
    }

    // Fallback to AsyncStorage
    const value = await AsyncStorage.getItem(key);
    if (value) {
      logger.debug('Token retrieved from AsyncStorage', { key });
      return value;
    }

    return null;
  } catch (error) {
    logger.error('Error retrieving token', error, { key });
    // Try AsyncStorage as fallback
    try {
      return await AsyncStorage.getItem(key);
    } catch (fallbackError) {
      logger.error('Failed to retrieve token even from AsyncStorage', fallbackError, { key });
      return null;
    }
  }
};

/**
 * Remove a token from secure storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export const removeTokenSecurely = async (key) => {
  try {
    if (isSecureStorageAvailable()) {
      await SecureStore.deleteItemAsync(key);
      logger.debug(`Token removed from ${Platform.OS} secure storage`, { key });
    }

    // Also remove from AsyncStorage (in case it was stored there)
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.error('Error removing token', error, { key });
    // Try AsyncStorage as fallback
    try {
      await AsyncStorage.removeItem(key);
    } catch (fallbackError) {
      logger.error('Failed to remove token even from AsyncStorage', fallbackError, { key });
    }
  }
};

/**
 * Store auth token securely
 * @param {string} token - Auth token
 * @returns {Promise<void>}
 */
export const storeAuthToken = async (token) => {
  return storeTokenSecurely(TOKEN_KEYS.AUTH_TOKEN, token);
};

/**
 * Store refresh token securely
 * @param {string} token - Refresh token
 * @returns {Promise<void>}
 */
export const storeRefreshToken = async (token) => {
  return storeTokenSecurely(TOKEN_KEYS.REFRESH_TOKEN, token);
};

/**
 * Get auth token from secure storage
 * @returns {Promise<string|null>}
 */
export const getAuthToken = async () => {
  return getTokenSecurely(TOKEN_KEYS.AUTH_TOKEN);
};

/**
 * Get refresh token from secure storage
 * @returns {Promise<string|null>}
 */
export const getRefreshToken = async () => {
  return getTokenSecurely(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Remove auth token from secure storage
 * @returns {Promise<void>}
 */
export const removeAuthToken = async () => {
  return removeTokenSecurely(TOKEN_KEYS.AUTH_TOKEN);
};

/**
 * Remove refresh token from secure storage
 * @returns {Promise<void>}
 */
export const removeRefreshToken = async () => {
  return removeTokenSecurely(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Clear all tokens from secure storage
 * @returns {Promise<void>}
 */
export const clearAllTokens = async () => {
  await Promise.all([removeAuthToken(), removeRefreshToken()]);
  logger.debug('All tokens cleared from secure storage');
};
