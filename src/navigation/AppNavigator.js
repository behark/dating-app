import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import ConsentBanner from '../components/ConsentBanner';
import { useAuth } from '../context/AuthContext';
import { useDeepLinking } from './DeepLinkHandler';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import PrivacyService from '../services/PrivacyService';
import { UserBehaviorAnalytics } from '../services/UserBehaviorAnalytics';

// Main navigator component

const AppNavigator = () => {
  const { currentUser } = useAuth();
  const navigationRef = React.useRef(null);
  const routeNameRef = React.useRef(null);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [navigationReady, setNavigationReady] = useState(false);

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

  // Initialize deep linking - pass the ref directly (hook handles null gracefully)
  useDeepLinking(navigationReady ? navigationRef : null);

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

  return (
    <>
      <ConsentBanner
        visible={showConsentBanner && !checkingConsent}
        onConsentComplete={handleConsentComplete}
      />
      <NavigationContainer
        ref={navigationRef}
        onReady={onNavigationReady}
        onStateChange={onNavigationStateChange}
      >
        {currentUser ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;
