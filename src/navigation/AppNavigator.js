// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppNavigator.js:1',message:'AppNavigator module start',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppNavigator.js:5',message:'Before createLazyScreen import',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
// #endregion
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

  // Initialize deep linking
  useDeepLinking(navigationRef.current);

  // Initialize behavior analytics on mount
  useEffect(() => {
    UserBehaviorAnalytics.initialize();
  }, []);

  // Track screen changes for analytics
  const onNavigationReady = () => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
    if (routeNameRef.current) {
      UserBehaviorAnalytics.startScreenTracking(routeNameRef.current);
    }
  };

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
