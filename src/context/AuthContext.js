import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { API_URL } from '../config/api';
import { LocationService } from '../services/LocationService';
import { NotificationService } from '../services/NotificationService';

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
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
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
      signInWithGoogle(id_token);
    }
  }, [response]);

  const signup = async (email, password, name, age, gender) => {
    try {
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
          gender
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const { user, authToken: token, refreshToken: refToken } = data.data;
      
      await saveUserSession(user, token, refToken);
      
      return { user, authToken: token };
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { user, authToken: token, refreshToken: refToken } = data.data;
      
      await saveUserSession(user, token, refToken);
      
      return { user, authToken: token };
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      setCurrentUser(null);
      setAuthToken(null);
      setRefreshToken(null);
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const signInWithGoogle = async (idToken) => {
    try {
      // You'll need to get user info from Google
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId: idToken,
          email: 'user@google.com', // You'll get this from Google's user info endpoint
          name: 'Google User'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google sign in failed');
      }

      const { user, authToken: token, refreshToken: refToken } = data.data;
      
      await saveUserSession(user, token, refToken);
      
      return { user, authToken: token };
    } catch (error) {
      throw error;
    }
  };

  const saveUserSession = async (user, token, refToken) => {
    // Normalize user object - add uid alias for _id (Firebase compatibility)
    const normalizedUser = {
      ...user,
      uid: user._id || user.uid,  // Support both MongoDB _id and Firebase uid
    };
    
    setCurrentUser(normalizedUser);
    setAuthToken(token);
    setRefreshToken(refToken);
    
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
        console.error('Error during post-login setup:', error);
      }
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const sendPhoneVerification = async (phoneNumber) => {
    try {
      const response = await fetch(`${API_URL}/auth/send-phone-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const verifyPhone = async (code) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const deleteAccount = async (password) => {
    try {
      const response = await fetch(`${API_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      await logout();
      return data;
    } catch (error) {
      throw error;
    }
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
