import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { API_URL } from '../config/api';
import api from '../services/api';
import { LocationService } from '../services/LocationService';
import { NotificationService } from '../services/NotificationService';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import { extractGoogleUserInfo } from '../utils/jwt';
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

  const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId;
  const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId;
  const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId;

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
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        const storedAuthToken = await AsyncStorage.getItem('authToken');
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');

        if (storedUser && storedAuthToken) {
          setCurrentUser(JSON.parse(storedUser));
          setAuthToken(storedAuthToken);
          setRefreshToken(storedRefreshToken);
          
          // Set tokens in api service for authenticated requests
          api.setAuthToken(storedAuthToken);
          if (storedRefreshToken) {
            api.setRefreshToken(storedRefreshToken);
          }
        }
      } catch (error) {
        logger.error('Error loading user from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

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

  const signup = async (email, password, name, age, gender) => {
    try {
      // Log API URL for debugging
      logger.debug('Signup attempt', { email, name, apiUrl: API_URL, fullUrl: `${API_URL}/auth/register` });
      const response = await fetch(`${API_URL}/auth/register`, {
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
        }),
      });

      // Handle network errors
      if (!response) {
        logger.error('Signup - No response received', null, { email, apiUrl: API_URL });
        throw new Error('Network error. Please check your connection and try again.');
      }

      logger.debug('Signup - Response received', { status: response.status, statusText: response.statusText });

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
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        logger.error('Signup - Response not OK', null, { status: response.status, data, email });
        throw new Error(getUserFriendlyMessage(data.message || 'Registration failed'));
      }

      // Validate response structure
      if (!data || !data.data) {
        throw new Error('Invalid response from server. Please try again.');
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
      if (error.message && !error.message.includes('Network error') && !error.message.includes('Invalid')) {
        throw error;
      }
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  };

  const login = async (email, password) => {
    try {
      // Log API URL for debugging
      logger.debug('Login attempt', { email, apiUrl: API_URL, fullUrl: `${API_URL}/auth/login` });
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Handle network errors
      if (!response) {
        logger.error('Login - No response received', null, { email, apiUrl: API_URL });
        throw new Error('Network error. Please check your connection and try again.');
      }

      logger.debug('Login - Response received', { status: response.status, statusText: response.statusText });

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
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        logger.error('Login - Response not OK', null, { status: response.status, data, email });
        throw new Error(getUserFriendlyMessage(data.message || 'Login failed'));
      }

      // Validate response structure
      if (!data || !data.data) {
        throw new Error('Invalid response from server. Please try again.');
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
      if (error.message && !error.message.includes('Network error') && !error.message.includes('Invalid')) {
        throw error;
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      setCurrentUser(null);
      setAuthToken(null);
      setRefreshToken(null);
      
      // Clear token from api service
      api.clearAuthToken();
      
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  /**
   * Manually refresh the authentication token
   * This is called automatically by the api service on 401 errors,
   * but can also be called proactively to prevent token expiration
   * @returns {Promise<boolean>} True if refresh succeeded, false otherwise
   */
  const refreshSession = async () => {
    try {
      const newToken = await api.refreshAuthToken();
      if (newToken) {
        setAuthToken(newToken);
        logger.debug('Session refreshed successfully');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Session refresh error:', error);
      return false;
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
    await AsyncStorage.setItem('authToken', token);
    if (refToken) {
      await AsyncStorage.setItem('refreshToken', refToken);
    }

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
    const clientId =
      Platform.OS === 'web'
        ? googleWebClientId
        : Platform.OS === 'ios'
          ? googleIosClientId
          : googleAndroidClientId;

    const looksLikeGoogleClientId =
      typeof clientId === 'string' &&
      clientId.length > 0 &&
      clientId.includes('.apps.googleusercontent.com');

    if (!looksLikeGoogleClientId) {
      throw new Error(
        Platform.OS === 'web'
          ? 'Google Sign-In is not configured for web. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your OAuth Web Client ID (ends with .apps.googleusercontent.com) and redeploy.'
          : 'Google Sign-In is not configured for this platform. Set the appropriate EXPO_PUBLIC_GOOGLE_*_CLIENT_ID env var and rebuild.'
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
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
