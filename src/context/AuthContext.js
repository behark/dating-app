import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { API_URL } from '../config/api';
import { ERROR_MESSAGES } from '../constants/constants';
import api from '../services/api';
import { LocationService } from '../services/LocationService';
import { NotificationService } from '../services/NotificationService';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import { extractGoogleUserInfo, decodeJWT } from '../utils/jwt';
import {
  storeAuthToken,
  storeRefreshToken,
  getAuthToken,
  getRefreshToken,
  removeAuthToken,
  removeRefreshToken,
  clearAllTokens,
} from '../utils/secureStorage';
import { setUser as setSentryUser, clearUser as clearSentryUser } from '../utils/sentry';
import logger from '../utils/logger';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const sessionCheckIntervalRef = useRef(null);

  const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId;
  const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId;
  const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId;

  // Check if Google Sign-In is configured on app start
  const isGoogleSignInConfigured = (() => {
    const clientId =
      Platform.OS === 'web'
        ? googleWebClientId
        : Platform.OS === 'ios'
          ? googleIosClientId
          : googleAndroidClientId;

    return (
      typeof clientId === 'string' &&
      clientId.length > 0 &&
      clientId.includes('.apps.googleusercontent.com')
    );
  })();

  // Google Sign-In with explicit redirect URI configuration
  // This prevents OAuth redirect_uri_mismatch errors
  const [_request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    webClientId: googleWebClientId,
    // Request ID token for secure server-side verification
    responseType: 'id_token',
    // Scopes needed for user info
    scopes: ['openid', 'profile', 'email'],
  });

  // Load user data from async storage on app start
  // CRITICAL FIX: Validate token with backend and refresh if expired
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        // CRITICAL FIX: Use secure storage for tokens
        const storedAuthToken = await getAuthToken();
        const storedRefreshToken = await getRefreshToken();

        if (storedUser && storedAuthToken) {
          // Set tokens in api service temporarily for validation
          api.setAuthToken(storedAuthToken);
          if (storedRefreshToken) {
            api.setRefreshToken(storedRefreshToken);
          }

          // CRITICAL FIX: Validate token with backend
          try {
            // Try to get current user profile to validate token
            const response = await api.get('/profile/me');
            
            if (response.success && response.data?.user) {
              // Token is valid - restore user session
              const userData = response.data.user;
              const normalizedUser = {
                ...userData,
                uid: userData._id || userData.uid,
              };
              
              setCurrentUser(normalizedUser);
              setAuthToken(storedAuthToken);
              setRefreshToken(storedRefreshToken);
              
              // Update stored user data with fresh data from backend
              await AsyncStorage.setItem('currentUser', JSON.stringify(normalizedUser));
              
              logger.info('User session restored - token validated');
            } else {
              // Token validation failed - try to refresh
              logger.warn('Token validation failed, attempting refresh...');
              throw new Error('Token validation failed');
            }
          } catch (validationError) {
            // Token may be expired - try to refresh if refresh token exists
            if (storedRefreshToken) {
              try {
                logger.debug('Attempting token refresh on app start...');
                const newToken = await api.refreshAuthToken();
                
                if (newToken) {
                  // Refresh successful - get fresh user data
                  const response = await api.get('/profile/me');
                  
                  if (response.success && response.data?.user) {
                    const userData = response.data.user;
                    const normalizedUser = {
                      ...userData,
                      uid: userData._id || userData.uid,
                    };
                    
                    setCurrentUser(normalizedUser);
                    setAuthToken(newToken);
                    
                    // Update stored tokens and user data
                    await AsyncStorage.setItem('currentUser', JSON.stringify(normalizedUser));
                    // CRITICAL FIX: Store token in secure storage
                    await storeAuthToken(newToken);
                    
                    logger.info('Token refreshed and user session restored');
                  } else {
                    throw new Error('Failed to get user data after refresh');
                  }
                } else {
                  // Refresh failed - clear session
                  throw new Error('Token refresh failed');
                }
              } catch (refreshError) {
                // Both validation and refresh failed - clear session
                logger.warn('Token validation and refresh failed, clearing session:', refreshError);
                await clearStoredAuth();
              }
            } else {
              // No refresh token - clear session
              logger.warn('Token invalid and no refresh token, clearing session');
              await clearStoredAuth();
            }
          }
        }
      } catch (error) {
        logger.error('Error loading user from storage:', error);
        // Clear potentially corrupted state
        await clearStoredAuth();
      } finally {
        setLoading(false);
      }
    };

    // Helper function to clear stored auth data
    const clearStoredAuth = async () => {
      try {
        setCurrentUser(null);
        setAuthToken(null);
        setRefreshToken(null);
        api.clearAuthToken();
        await AsyncStorage.multiRemove(['currentUser', 'authToken', 'refreshToken']);
      } catch (error) {
        logger.error('Error clearing stored auth:', error);
      }
    };

    loadUser();
  }, []);

  // Handle Google OAuth response
  useEffect(() => {
    if (!authToken) {
      // Clear interval if no token
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      setSessionWarningShown(false);
      return;
    }

    const checkTokenExpiry = async () => {
      try {
        const decoded = decodeJWT(authToken);
        if (!decoded || !decoded.exp) {
          return;
        }

        const expiryTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        // Warn user 5 minutes before expiry
        if (timeUntilExpiry > 0 && timeUntilExpiry <= fiveMinutes && !sessionWarningShown) {
          setSessionWarningShown(true);
          
          const minutesRemaining = Math.round(timeUntilExpiry / 60000);
          
          // Show alert with option to refresh
          Alert.alert(
            'Session Expiring Soon',
            `Your session will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Would you like to stay logged in?`,
            [
              {
                text: 'Stay Logged In',
                onPress: async () => {
                  try {
                    const newToken = await refreshSession();
                    if (newToken) {
                      Alert.alert('Success', 'Your session has been extended.');
                    } else {
                      Alert.alert('Error', 'Failed to refresh session. Please login again.');
                      await logout();
                    }
                  } catch (error) {
                    logger.error('Error refreshing session from warning', error);
                    Alert.alert('Error', 'Failed to refresh session. Please login again.');
                    await logout();
                  }
                },
              },
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => {
                  // Reset warning after 1 minute to show again if still close to expiry
                  setTimeout(() => {
                    setSessionWarningShown(false);
                  }, 60000);
                },
              },
            ],
            { cancelable: false }
          );
        }

        // Auto-refresh if less than 1 minute remaining
        if (timeUntilExpiry > 0 && timeUntilExpiry <= 60000 && !sessionWarningShown) {
          logger.info('Auto-refreshing token - less than 1 minute remaining');
          try {
            const newToken = await refreshSession();
            if (!newToken) {
              // Auto-refresh failed, show warning
              Alert.alert(
                'Session Expired',
                'Your session has expired. Please login again.',
                [{ text: 'OK', onPress: () => logout() }]
              );
            }
          } catch (error) {
            logger.error('Error auto-refreshing token', error);
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please login again.',
              [{ text: 'OK', onPress: () => logout() }]
            );
          }
        }

        // If token already expired, logout
        if (timeUntilExpiry <= 0) {
          logger.warn('Token expired, logging out');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [{ text: 'OK', onPress: () => logout() }]
          );
        }
      } catch (error) {
        logger.error('Error checking token expiry', error);
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every 30 seconds
    sessionCheckIntervalRef.current = setInterval(checkTokenExpiry, 30000);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, sessionWarningShown]); // refreshSession and logout are stable functions

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        signInWithGoogle(id_token).catch((error) => {
          logger.error('Google sign-in error:', error);
          // Error is already handled in signInWithGoogle and will be thrown to the caller
        });
      }
    } else if (response?.type === 'error') {
      logger.error('Google OAuth error:', response.error);
    } else if (response?.type === 'cancel') {
      logger.debug('Google sign-in cancelled by user');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const signup = async (email, password, name, age, gender, location) => {
    try {
      // CRITICAL FIX: Make location optional - use default if not provided
      let finalLocation = location;
      
      if (!location || !location.coordinates || !Array.isArray(location.coordinates)) {
        // Use default location (San Francisco) if not provided
        logger.warn('Location not provided during signup, using default location');
        finalLocation = {
          type: 'Point',
          coordinates: [-122.4194, 37.7749], // San Francisco default
        };
      } else if (location.type !== 'Point' || location.coordinates.length !== 2) {
        // Validate location format if provided
        logger.warn('Invalid location format, using default location');
        finalLocation = {
          type: 'Point',
          coordinates: [-122.4194, 37.7749], // San Francisco default
        };
      }

      // Log API URL for debugging
      logger.debug('Signup attempt', {
        email,
        name,
        hasLocation: !!location,
        usingDefaultLocation: !location,
        apiUrl: API_URL,
        fullUrl: `${API_URL}/auth/register`,
      });
      
      // CRITICAL FIX: Add timeout (15 seconds) and retry logic
      let response;
      let lastError;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await fetchWithTimeout(
            `${API_URL}/auth/register`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                password,
                name,
                age,
                gender,
                location: finalLocation,
              }),
            },
            15000 // 15 second timeout
          );
          break; // Success - exit retry loop
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries && (error.message?.includes('timeout') || error.message?.includes('Network'))) {
            logger.warn(`Signup attempt ${attempt + 1} failed, retrying...`, { error: error.message });
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          throw error;
        }
      }
      
      if (!response) {
        throw lastError || new Error('Network error. Please check your connection and try again.');
      }

      // Handle network errors
      if (!response) {
        logger.error('Signup - No response received', null, { email, apiUrl: API_URL });
        throw new Error('Network error. Please check your connection and try again.');
      }

      logger.debug('Signup - Response received', {
        status: response.status,
        statusText: response.statusText,
      });

      let data;
      try {
        const responseText = await response.text();
        logger.debug('Signup - Response text', { preview: responseText.substring(0, 200) });
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(responseText);
      } catch (jsonError) {
        logger.error('Signup - JSON parse error', jsonError, { email });
        throw new Error(ERROR_MESSAGES.INVALID_SERVER_RESPONSE);
      }

      if (!response.ok) {
        logger.error('Signup - Response not OK', null, { status: response.status, data, email });
        throw new Error(getUserFriendlyMessage(data.message || 'Registration failed'));
      }

      // Validate response structure
      if (!data || !data.data) {
        throw new Error(ERROR_MESSAGES.INVALID_SERVER_RESPONSE);
      }

      // Handle both old format (flat) and new format (nested tokens)
      const user = data.data.user;
      const token = data.data.tokens?.accessToken || data.data.authToken;
      const refToken = data.data.tokens?.refreshToken || data.data.refreshToken;

      if (!user || !token) {
        throw new Error('Invalid response data. Please try again.');
      }

      await saveUserSession(user, token, refToken);

      logger.info('Signup - Success', { email, userId: user._id || user.uid });
      return { user, authToken: token };
    } catch (error) {
      logger.error('Signup - Error caught', error, { email, message: error.message });
      // Re-throw with better error message if it's not already a user-friendly error
      if (
        error.message &&
        !error.message.includes('Network error') &&
        !error.message.includes('Invalid')
      ) {
        throw error;
      }
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  };

  // Helper function for fetch with timeout
  const fetchWithTimeout = async (url, options, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      // Log API URL for debugging
      logger.debug('Login attempt', { email, apiUrl: API_URL, fullUrl: `${API_URL}/auth/login` });
      
      // CRITICAL FIX: Add timeout (15 seconds) and retry logic
      let response;
      let lastError;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await fetchWithTimeout(
            `${API_URL}/auth/login`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            },
            15000 // 15 second timeout
          );
          break; // Success - exit retry loop
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries && (error.message?.includes('timeout') || error.message?.includes('Network'))) {
            logger.warn(`Login attempt ${attempt + 1} failed, retrying...`, { error: error.message });
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          throw error;
        }
      }
      
      if (!response) {
        throw lastError || new Error('Network error. Please check your connection and try again.');
      }

      // Handle network errors
      if (!response) {
        logger.error('Login - No response received', null, { email, apiUrl: API_URL });
        throw new Error('Network error. Please check your connection and try again.');
      }

      logger.debug('Login - Response received', {
        status: response.status,
        statusText: response.statusText,
      });

      let data;
      try {
        const responseText = await response.text();
        logger.debug('Login - Response text', { preview: responseText.substring(0, 200) });
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(responseText);
      } catch (jsonError) {
        logger.error('Login - JSON parse error', jsonError, { email });
        throw new Error(ERROR_MESSAGES.INVALID_SERVER_RESPONSE);
      }

      if (!response.ok) {
        logger.error('Login - Response not OK', null, { status: response.status, data, email });
        throw new Error(getUserFriendlyMessage(data.message || 'Login failed'));
      }

      // Validate response structure
      if (!data || !data.data) {
        throw new Error(ERROR_MESSAGES.INVALID_SERVER_RESPONSE);
      }

      // Handle both old format (flat) and new format (nested tokens)
      const user = data.data.user;
      const token = data.data.tokens?.accessToken || data.data.authToken;
      const refToken = data.data.tokens?.refreshToken || data.data.refreshToken;

      if (!user || !token) {
        throw new Error('Invalid response data. Please try again.');
      }

      await saveUserSession(user, token, refToken);

      logger.info('Login - Success', { email, userId: user._id || user.uid });
      return { user, authToken: token };
    } catch (error) {
      logger.error('Login - Error caught', error, { email, message: error.message });
      // Re-throw with better error message if it's not already a user-friendly error
      if (
        error.message &&
        !error.message.includes('Network error') &&
        !error.message.includes('Invalid')
      ) {
        throw error;
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      // CRITICAL FIX: Call backend to blacklist token before clearing local state
      if (authToken) {
        try {
          await api.post('/auth/logout');
          logger.info('Token blacklisted on backend');
        } catch (error) {
          // Log but don't block logout if backend fails
          // Token will expire naturally, but we should still clear local state
          logger.error('Backend logout failed (token may still be valid):', error);
        }
      }

      // Clear local state
      setCurrentUser(null);
      setAuthToken(null);
      setRefreshToken(null);

      // Clear token from api service
      api.clearAuthToken();

      await AsyncStorage.removeItem('currentUser');
      // CRITICAL FIX: Remove tokens from secure storage
      await clearAllTokens();
      
      // CRITICAL FIX: Clear user from Sentry
      clearSentryUser();
      
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error);
      // Even if there's an error, try to clear local state
      try {
        setCurrentUser(null);
        setAuthToken(null);
        setRefreshToken(null);
        api.clearAuthToken();
        await AsyncStorage.multiRemove(['currentUser', 'authToken', 'refreshToken']);
      } catch (clearError) {
        logger.error('Error clearing local state during logout:', clearError);
      }
    }
  };

  /**
   * Manually refresh the authentication token
   * This is called automatically by the api service on 401 errors,
   * but can also be called proactively to prevent token expiration
   * @returns {Promise<string|null>} New token if refresh succeeded, null otherwise
   */
  const refreshSession = async () => {
    try {
      const newToken = await api.refreshAuthToken();
      if (newToken) {
        setAuthToken(newToken);
        setSessionWarningShown(false); // Reset warning after successful refresh
        logger.debug('Session refreshed successfully');
        return newToken;
      }
      return null;
    } catch (error) {
      logger.error('Session refresh error:', error);
      return null;
    }
  };

  /**
   * Handle session expiration - called when token refresh fails
   * This clears the local session and forces re-login
   */
  const handleSessionExpired = async () => {
    logger.debug('Session expired, clearing local data...');
    await logout();
  };

  // Session timeout warning - Check token expiry and warn user 5 minutes before
  // Must be after logout and refreshSession are defined
  useEffect(() => {
    if (!authToken) {
      // Clear interval if no token
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      setSessionWarningShown(false);
      return;
    }

    const checkTokenExpiry = async () => {
      try {
        const decoded = decodeJWT(authToken);
        if (!decoded || !decoded.exp) {
          return;
        }

        const expiryTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        // Warn user 5 minutes before expiry
        if (timeUntilExpiry > 0 && timeUntilExpiry <= fiveMinutes && !sessionWarningShown) {
          setSessionWarningShown(true);
          
          const minutesRemaining = Math.round(timeUntilExpiry / 60000);
          
          // Show alert with option to refresh
          Alert.alert(
            'Session Expiring Soon',
            `Your session will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Would you like to stay logged in?`,
            [
              {
                text: 'Stay Logged In',
                onPress: async () => {
                  try {
                    const newToken = await refreshSession();
                    if (newToken) {
                      Alert.alert('Success', 'Your session has been extended.');
                    } else {
                      Alert.alert('Error', 'Failed to refresh session. Please login again.');
                      await logout();
                    }
                  } catch (error) {
                    logger.error('Error refreshing session from warning', error);
                    Alert.alert('Error', 'Failed to refresh session. Please login again.');
                    await logout();
                  }
                },
              },
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => {
                  // Reset warning after 1 minute to show again if still close to expiry
                  setTimeout(() => {
                    setSessionWarningShown(false);
                  }, 60000);
                },
              },
            ],
            { cancelable: false }
          );
        }

        // Auto-refresh if less than 1 minute remaining
        if (timeUntilExpiry > 0 && timeUntilExpiry <= 60000 && !sessionWarningShown) {
          logger.info('Auto-refreshing token - less than 1 minute remaining');
          try {
            const newToken = await refreshSession();
            if (!newToken) {
              // Auto-refresh failed, show warning
              Alert.alert(
                'Session Expired',
                'Your session has expired. Please login again.',
                [{ text: 'OK', onPress: () => logout() }]
              );
            }
          } catch (error) {
            logger.error('Error auto-refreshing token', error);
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please login again.',
              [{ text: 'OK', onPress: () => logout() }]
            );
          }
        }

        // If token already expired, logout
        if (timeUntilExpiry <= 0) {
          logger.warn('Token expired, logging out');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [{ text: 'OK', onPress: () => logout() }]
          );
        }
      } catch (error) {
        logger.error('Error checking token expiry', error);
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every 30 seconds
    sessionCheckIntervalRef.current = setInterval(checkTokenExpiry, 30000);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, sessionWarningShown]); // refreshSession and logout are stable functions

  const signInWithGoogle = async (idToken) => {
    try {
      // Extract user info from Google ID token for client-side use
      const userInfo = extractGoogleUserInfo(idToken);

      if (!userInfo || !userInfo.googleId || !userInfo.email) {
        throw new Error('Failed to extract user information from Google token');
      }

      // Send to backend for authentication with ID token for server-side verification
      // This prevents OAuth handshake failures by letting the server verify the token
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId: userInfo.googleId,
          email: userInfo.email,
          name: userInfo.name,
          photoUrl: userInfo.photoUrl,
          // Pass the raw ID token for server-side verification
          // This prevents redirect URI mismatches and expired token issues
          idToken: idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific OAuth error codes
        if (data.errorCode === 'REDIRECT_URI_MISMATCH') {
          throw new Error('Google Sign-In configuration error. Please contact support.');
        }
        if (data.errorCode === 'TOKEN_EXPIRED') {
          throw new Error('Your session has expired. Please try signing in again.');
        }
        if (data.errorCode === 'CLIENT_CONFIG_ERROR') {
          throw new Error('Google Sign-In is temporarily unavailable. Please try again later.');
        }
        throw new Error(getUserFriendlyMessage(data.message || 'Google sign in failed'));
      }

      const { user, authToken: token, refreshToken: refToken } = data.data;

      await saveUserSession(user, token, refToken);

      return { user, authToken: token };
    } catch (error) {
      logger.error('Google sign in error:', error);
      throw error;
    }
  };

  const saveUserSession = async (user, token, refToken) => {
    // Normalize user object - add uid alias for _id (Firebase compatibility)
    const normalizedUser = {
      ...user,
      uid: user._id || user.uid, // Support both MongoDB _id and Firebase uid
    };

    setCurrentUser(normalizedUser);
    setAuthToken(token);
    setRefreshToken(refToken);

    // Set tokens in api service for authenticated requests
    api.setAuthToken(token);
    if (refToken) {
      api.setRefreshToken(refToken);
    }

    await AsyncStorage.setItem('currentUser', JSON.stringify(normalizedUser));
    // CRITICAL FIX: Store tokens in secure storage (encrypted)
    await storeAuthToken(token);
    if (refToken) {
      await storeRefreshToken(refToken);
    }

    // CRITICAL FIX: Set user in Sentry for error tracking
    setSentryUser(normalizedUser);

    // Register for notifications and update location
    if (normalizedUser.uid) {
      try {
        await NotificationService.registerForPushNotifications(normalizedUser.uid);
        await LocationService.updateLocationOnLogin(normalizedUser.uid);
      } catch (error) {
        logger.error('Error during post-login setup:', error);
      }
    }
  };

  const verifyEmail = async (token) => {
    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  };

  const sendPhoneVerification = async (phoneNumber) => {
    const response = await fetch(`${API_URL}/auth/send-phone-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  };

  const verifyPhone = async (code) => {
    const response = await fetch(`${API_URL}/auth/verify-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  };

  const forgotPassword = async (email) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  };

  const resetPassword = async (token, newPassword) => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  };

  const deleteAccount = async (password) => {
    const response = await fetch(`${API_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    await logout();
    return data;
  };

  const promptGoogleSignIn = async () => {
    // Fail fast with a helpful message instead of sending users into
    // Google's "invalid_client" screen when client IDs aren't configured.
    if (!isGoogleSignInConfigured) {
      throw new Error(
        'Google Sign-In is coming soon. Please use email and password to sign in.'
      );
    }

    await promptAsync();
  };

  const value = {
    currentUser,
    authToken,
    refreshToken,
    signup,
    login,
    logout,
    refreshSession,
    handleSessionExpired,
    verifyEmail,
    sendPhoneVerification,
    verifyPhone,
    forgotPassword,
    resetPassword,
    deleteAccount,
    signInWithGoogle: promptGoogleSignIn,
    isGoogleSignInConfigured,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
