import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
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

  // Google Sign-In
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    webClientId: googleWebClientId,
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
          
          // Set token in api service for authenticated requests
          api.setAuthToken(storedAuthToken);
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
  }, [response]);

  const signup = async (email, password, name, age, gender) => {
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getUserFriendlyMessage(data.message || 'Registration failed'));
    }

    const { user, authToken: token, refreshToken: refToken } = data.data;

    await saveUserSession(user, token, refToken);

    return { user, authToken: token };
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getUserFriendlyMessage(data.message || 'Login failed'));
    }

    const { user, authToken: token, refreshToken: refToken } = data.data;

    await saveUserSession(user, token, refToken);

    return { user, authToken: token };
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

  const signInWithGoogle = async (idToken) => {
    try {
      // Extract user info from Google ID token
      const userInfo = extractGoogleUserInfo(idToken);

      if (!userInfo || !userInfo.googleId || !userInfo.email) {
        throw new Error('Failed to extract user information from Google token');
      }

      // Send to backend for authentication
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
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

    // Set token in api service for authenticated requests
    api.setAuthToken(token);

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
