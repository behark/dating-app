import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ConsentBanner from '../../components/ConsentBanner';
import { useAuth } from '../providers/AuthProvider';
import PrivacyService from '../../services/PrivacyService';
import { UserBehaviorAnalytics } from '../../services/UserBehaviorAnalytics';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

/**
 * Declarative deep linking configuration for NavigationContainer.
 * This replaces the manual useDeepLinking hook with React Navigation's
 * built-in deep link handling, which properly manages state restoration,
 * back-stack, and URL parsing.
 *
 * Supported URL patterns:
 * - dating-app://profile/:userId / https://dating-app.com/profile/:userId
 * - dating-app://chat/:matchId  / https://dating-app.com/chat/:matchId
 * - dating-app://discover       / https://dating-app.com/discover
 * - dating-app://matches        / https://dating-app.com/matches
 * - dating-app://settings       / https://dating-app.com/settings
 * - dating-app://premium        / https://dating-app.com/premium
 */
const linking = {
  prefixes: ['dating-app://', 'https://dating-app.com', 'https://www.dating-app.com'],
  config: {
    screens: {
      // Auth stack screens
      Home: 'home',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      VerifyEmail: 'verify-email',
      // Main stack (authenticated)
      Main: {
        screens: {
          Discover: 'discover',
          Matches: 'matches',
          Profile: 'profile',
        },
      },
      Chat: 'chat/:matchId',
      ViewProfile: 'profile/:userId',
      Premium: 'premium',
      Preferences: 'settings',
      Events: 'events',
      EventDetail: 'events/:eventId',
    },
  },
};

// Main navigator component

const AppNavigator = () => {
  const { currentUser, loading } = useAuth();
  const navigationRef = React.useRef(null);
  const routeNameRef = React.useRef(null);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [navigationReady, setNavigationReady] = useState(false);
  const wasAuthenticatedRef = useRef(null);

  // Check consent status when user logs in
  useEffect(() => {
    const checkConsent = async () => {
      if (!currentUser) {
        setShowConsentBanner(false);
        setCheckingConsent(false);
        return;
      }

      try {
        // Check local storage first
        const hasConsented = await AsyncStorage.getItem('hasConsented');

        if (hasConsented === 'true') {
          // Also verify with backend
          try {
            const consentStatus = await PrivacyService.getConsentStatus();
            if (consentStatus?.hasConsented) {
              setShowConsentBanner(false);
            } else {
              setShowConsentBanner(true);
            }
          } catch (error) {
            // If backend check fails, trust local storage
            setShowConsentBanner(false);
          }
        } else {
          // Check backend for existing consent
          try {
            const consentStatus = await PrivacyService.getConsentStatus();
            if (consentStatus?.hasConsented) {
              // Backend has consent but local doesn't - sync
              await AsyncStorage.setItem('hasConsented', 'true');
              setShowConsentBanner(false);
            } else {
              setShowConsentBanner(true);
            }
          } catch (error) {
            // If backend check fails, show consent banner
            setShowConsentBanner(true);
          }
        }
      } catch (error) {
        // On error, show consent banner to be safe
        setShowConsentBanner(true);
      } finally {
        setCheckingConsent(false);
      }
    };

    checkConsent();
  }, [currentUser]);

  const handleConsentComplete = () => {
    setShowConsentBanner(false);
  };

  // Track screen changes for analytics
  const onNavigationReady = () => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
    if (routeNameRef.current) {
      UserBehaviorAnalytics.startScreenTracking(routeNameRef.current);
    }
    // Mark navigation as ready so deep linking can be initialized
    setNavigationReady(true);
  };

  // Deep linking is now handled declaratively via the `linking` prop on
  // NavigationContainer. The DeepLinkHandler module is still available for
  // programmatic link creation (createDeepLink, createUniversalLink, openURL).

  // Initialize behavior analytics on mount
  useEffect(() => {
    UserBehaviorAnalytics.initialize();
  }, []);

  const onNavigationStateChange = () => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

    if (previousRouteName !== currentRouteName && currentRouteName) {
      // End tracking for previous screen
      UserBehaviorAnalytics.endScreenTracking();
      // Start tracking for new screen
      UserBehaviorAnalytics.startScreenTracking(currentRouteName);
    }

    routeNameRef.current = currentRouteName;
  };

  useEffect(() => {
    if (!navigationReady) {
      return;
    }

    const isAuthenticated = Boolean(currentUser);

    if (wasAuthenticatedRef.current === null) {
      wasAuthenticatedRef.current = isAuthenticated;
      return;
    }

    if (wasAuthenticatedRef.current !== isAuthenticated) {
      const targetRoute = isAuthenticated ? 'Main' : 'Home';
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });
    }

    wasAuthenticatedRef.current = isAuthenticated;
  }, [currentUser, navigationReady]);

  // Document title config for web -- shows screen name in browser tab
  const documentTitle = useMemo(
    () => ({
      formatter: (options, route) =>
        `${options?.title ?? route?.name ?? 'Dating App'} - Dating App`,
    }),
    []
  );

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading the app, please wait"
      >
        <ActivityIndicator size="large" color="#e94057" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <ConsentBanner
        visible={showConsentBanner && !checkingConsent}
        onConsentComplete={handleConsentComplete}
      />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={onNavigationReady}
        onStateChange={onNavigationStateChange}
        documentTitle={documentTitle}
        fallback={
          <View
            style={styles.loadingContainer}
            accessibilityRole="progressbar"
            accessibilityLabel="Resolving navigation link"
          >
            <ActivityIndicator size="large" color="#e94057" />
          </View>
        }
      >
        {currentUser ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
});

export default AppNavigator;
