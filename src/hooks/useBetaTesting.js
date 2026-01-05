/**
 * Beta Testing Hook
 * Provides easy access to beta testing features in components
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../constants/constants';
import { betaTestingService } from '../services/BetaTestingService';
import { featureFlagService } from '../services/FeatureFlagService';
import logger from '../utils/logger';

const BETA_STORAGE_KEY = '@beta_enrollment';
const SESSION_STORAGE_KEY = '@beta_session';

export const useBetaTesting = (userId, userGroups = []) => {
  const [isBetaUser, setIsBetaUser] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef(null);
  const screenHistoryRef = useRef([]);
  const actionsRef = useRef([]);
  const sessionStartRef = useRef(null);

  // Check enrollment status
  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        const stored = await AsyncStorage.getItem(BETA_STORAGE_KEY);
        if (stored) {
          const enrollment = JSON.parse(stored);
          setIsBetaUser(enrollment.isEnrolled);
        }

        // Get feature flags for user
        const flags = featureFlagService.getUserFlags(userId, userGroups);
        setFeatureFlags(flags);
      } catch (error) {
        logger.error('Error checking beta enrollment', error, { userId });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      checkEnrollment();
    }
  }, [userId, userGroups]);

  // Enroll in beta program
  const enrollInBeta = useCallback(
    async (userData = {}) => {
      try {
        const enrollment = betaTestingService.enrollUser(userId, {
          ...userData,
          enrolledAt: new Date().toISOString(),
        });

        await AsyncStorage.setItem(
          BETA_STORAGE_KEY,
          JSON.stringify({
            isEnrolled: true,
            enrollment,
          })
        );

        setIsBetaUser(true);

        // Update feature flags to include beta_testers group
        const newGroups = [...userGroups, 'beta_testers'];
        const flags = featureFlagService.getUserFlags(userId, newGroups);
        setFeatureFlags(flags);

        return enrollment;
      } catch (error) {
        logger.error('Error enrolling in beta', error, { userId });
        throw error;
      }
    },
    [userId, userGroups]
  );

  // Leave beta program
  const leaveBeta = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(BETA_STORAGE_KEY);
      setIsBetaUser(false);

      // Reset to non-beta feature flags
      const flags = featureFlagService.getUserFlags(userId, userGroups);
      setFeatureFlags(flags);
    } catch (error) {
      logger.error('Error leaving beta', error, { userId });
      throw error;
    }
  }, [userId, userGroups]);

  // Check if feature is enabled
  const isFeatureEnabled = useCallback(
    (featureName) => {
      return featureFlags[featureName]?.enabled || false;
    },
    [featureFlags]
  );

  // Submit feedback
  const submitFeedback = useCallback(
    async (feedbackData) => {
      try {
        const feedback = betaTestingService.submitFeedback(userId, {
          ...feedbackData,
          isBetaUser,
        });

        // Also persist to AsyncStorage for offline support
        const storedFeedback = (await AsyncStorage.getItem(STORAGE_KEYS.PENDING_FEEDBACK)) || '[]';
        const pending = JSON.parse(storedFeedback);
        pending.push(feedback);
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_FEEDBACK, JSON.stringify(pending));

        return feedback;
      } catch (error) {
        logger.error('Error submitting feedback', error, { userId });
        throw error;
      }
    },
    [userId, isBetaUser]
  );

  // Submit bug report
  const submitBugReport = useCallback(
    async (bugData) => {
      try {
        return betaTestingService.submitBugReport(userId, bugData);
      } catch (error) {
        logger.error('Error submitting bug report', error, { userId });
        throw error;
      }
    },
    [userId]
  );

  // Start session tracking
  const startSession = useCallback(async (deviceInfo = {}) => {
    sessionStartRef.current = new Date();
    screenHistoryRef.current = [];
    actionsRef.current = [];

    sessionRef.current = {
      startTime: sessionStartRef.current,
      deviceInfo,
    };

    // Store session start
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        startTime: sessionStartRef.current.toISOString(),
      })
    );
  }, []);

  // End session and record analytics
  const endSession = useCallback(
    async (appVersion) => {
      if (!sessionStartRef.current) return;

      const endTime = new Date();
      const duration = endTime - sessionStartRef.current;

      try {
        const session = betaTestingService.recordSession(userId, {
          startTime: sessionStartRef.current,
          endTime,
          duration,
          screens: screenHistoryRef.current,
          actions: actionsRef.current,
          deviceInfo: sessionRef.current?.deviceInfo || {},
          appVersion,
          featuresUsed: [...new Set(actionsRef.current.map((a) => a.feature).filter(Boolean))],
        });

        // Clear session data
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStartRef.current = null;
        screenHistoryRef.current = [];
        actionsRef.current = [];

        return session;
      } catch (error) {
        logger.error('Error recording session', error, { userId });
      }
    },
    [userId]
  );

  // Track screen view
  const trackScreen = useCallback((screenName) => {
    screenHistoryRef.current.push({
      screen: screenName,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Track action/feature usage
  const trackAction = useCallback((actionName, feature = null, data = {}) => {
    actionsRef.current.push({
      action: actionName,
      feature,
      data,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Get all pending feedback to sync
  const getPendingFeedback = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_FEEDBACK);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error getting pending feedback', error);
      return [];
    }
  }, []);

  // Clear synced feedback
  const clearPendingFeedback = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_FEEDBACK);
    } catch (error) {
      logger.error('Error clearing pending feedback', error);
    }
  }, []);

  return {
    // State
    isBetaUser,
    isLoading,
    featureFlags,

    // Enrollment
    enrollInBeta,
    leaveBeta,

    // Feature flags
    isFeatureEnabled,

    // Feedback
    submitFeedback,
    submitBugReport,
    getPendingFeedback,
    clearPendingFeedback,

    // Session tracking
    startSession,
    endSession,
    trackScreen,
    trackAction,
  };
};

export default useBetaTesting;
