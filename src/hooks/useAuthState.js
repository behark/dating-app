/* eslint-disable sonarjs/cognitive-complexity */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import api, { setSessionExpiredCallback } from '../services/api';
import { LocationService } from '../services/LocationService';
import { NotificationService } from '../services/NotificationService';
import { decodeJWT } from '../utils/jwt';
import logger from '../utils/logger';
import {
  clearAllTokens,
  getAuthToken,
  getRefreshToken,
  storeAuthToken,
  storeRefreshToken,
} from '../utils/secureStorage';
import { clearUser as clearSentryUser, setUser as setSentryUser } from '../utils/sentry';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Core auth state management hook
 * Extracts auth state logic from AuthProvider for better testability and reuse
 */
export const useAuthState = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const sessionCheckIntervalRef = useRef(null);

  const clearSession = useCallback(async () => {
    setCurrentUser(null);
    setAuthToken(null);
    setRefreshToken(null);
    api.clearAuthToken();
    try {
      await AsyncStorage.multiRemove(['currentUser', 'authToken', 'refreshToken']);
      await clearAllTokens();
      clearSentryUser();
    } catch (error) {
      logger.error('Error clearing session:', error);
    }
  }, []);

  const saveSession = useCallback(async (user, token, refToken) => {
    const normalizedUser = {
      ...user,
      uid: user._id || user.uid,
    };

    setCurrentUser(normalizedUser);
    setAuthToken(token);
    setRefreshToken(refToken);

    api.setAuthToken(token);
    if (refToken) {
      api.setRefreshToken(refToken);
    }

    await AsyncStorage.setItem('currentUser', JSON.stringify(normalizedUser));
    await storeAuthToken(token);
    if (refToken) {
      await storeRefreshToken(refToken);
    }

    setSentryUser(normalizedUser);

    if (normalizedUser.uid) {
      try {
        await NotificationService.registerForPushNotifications(normalizedUser.uid);
        await LocationService.updateLocationOnLogin(normalizedUser.uid);
      } catch (error) {
        logger.error('Error during post-login setup:', error);
      }
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const newToken = await api.refreshAuthToken();
      if (newToken) {
        setAuthToken(newToken);
        setSessionWarningShown(false);
        logger.debug('Session refreshed successfully');
        return newToken;
      }
      return null;
    } catch (error) {
      logger.error('Session refresh error:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    setSessionExpiredCallback(clearSession);
    return () => setSessionExpiredCallback(null);
  }, [clearSession]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        const storedAuthToken = await getAuthToken();
        const storedRefreshToken = await getRefreshToken();

        if (storedUser && storedAuthToken) {
          try {
            const validateResponse = await fetch(`${API_URL}/profile/me`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${storedAuthToken}`,
              },
            });

            if (validateResponse.ok) {
              const response = await validateResponse.json();
              if (response.success && response.data?.user) {
                api.setAuthToken(storedAuthToken);
                if (storedRefreshToken) {
                  api.setRefreshToken(storedRefreshToken);
                }

                const userData = response.data.user;
                const normalizedUser = {
                  ...userData,
                  uid: userData._id || userData.uid,
                };

                setCurrentUser(normalizedUser);
                setAuthToken(storedAuthToken);
                setRefreshToken(storedRefreshToken);

                await AsyncStorage.setItem('currentUser', JSON.stringify(normalizedUser));
                logger.info('User session restored - token validated');
              } else {
                throw new Error('Token validation failed');
              }
            } else {
              throw new Error('Token validation request failed');
            }
          } catch (validationError) {
            if (storedRefreshToken) {
              try {
                api.setRefreshToken(storedRefreshToken);
                const newToken = await api.refreshAuthToken();

                if (newToken) {
                  const response = await api.get('/profile/me');
                  if (response.success && response.data?.user) {
                    const userData = response.data.user;
                    const normalizedUser = {
                      ...userData,
                      uid: userData._id || userData.uid,
                    };

                    setCurrentUser(normalizedUser);
                    setAuthToken(newToken);

                    await AsyncStorage.setItem('currentUser', JSON.stringify(normalizedUser));
                    await storeAuthToken(newToken);

                    logger.info('Token refreshed and user session restored');
                  } else {
                    throw new Error('Failed to get user data after refresh');
                  }
                } else {
                  throw new Error('Token refresh failed');
                }
              } catch (refreshError) {
                logger.warn('Token validation and refresh failed:', refreshError);
                await clearSession();
              }
            } else {
              logger.warn('Token invalid and no refresh token');
              await clearSession();
            }
          }
        }
      } catch (error) {
        logger.error('Error loading user from storage:', error);
        await clearSession();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [clearSession]);

  useEffect(() => {
    if (!authToken) {
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
        if (!decoded || !decoded.exp) return;

        const expiryTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        const oneMinute = 60 * 1000;
        const fiveMinutes = 5 * 60 * 1000;

        if (timeUntilExpiry <= 0) {
          logger.warn('Token expired, logging out');
          Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
            { text: 'OK', onPress: clearSession },
          ]);
          return;
        }

        if (timeUntilExpiry <= oneMinute) {
          logger.info('Auto-refreshing token - less than 1 minute remaining');
          const newToken = await refreshSession();
          if (!newToken) {
            Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
              { text: 'OK', onPress: clearSession },
            ]);
          }
          return;
        }

        if (timeUntilExpiry <= fiveMinutes && !sessionWarningShown) {
          setSessionWarningShown(true);
          const minutesRemaining = Math.round(timeUntilExpiry / 60000);

          Alert.alert(
            'Session Expiring Soon',
            `Your session will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Would you like to stay logged in?`,
            [
              {
                text: 'Stay Logged In',
                onPress: async () => {
                  const newToken = await refreshSession();
                  if (newToken) {
                    Alert.alert('Success', 'Your session has been extended.');
                  } else {
                    Alert.alert('Error', 'Failed to refresh session. Please login again.');
                    await clearSession();
                  }
                },
              },
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => setTimeout(() => setSessionWarningShown(false), 60000),
              },
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        logger.error('Error checking token expiry', error);
      }
    };

    checkTokenExpiry();
    sessionCheckIntervalRef.current = setInterval(checkTokenExpiry, 30000);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  }, [authToken, sessionWarningShown, refreshSession, clearSession]);

  return {
    currentUser,
    setCurrentUser,
    authToken,
    setAuthToken,
    refreshToken,
    setRefreshToken,
    loading,
    setLoading,
    loginInProgress,
    setLoginInProgress,
    sessionWarningShown,
    clearSession,
    saveSession,
    refreshSession,
  };
};

export default useAuthState;
