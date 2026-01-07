import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import ConsentBanner from '../components/ConsentBanner';
import { createLazyScreen } from '../components/LazyScreen';
import { useAuth } from '../context/AuthContext';
import { useDeepLinking } from './DeepLinkHandler';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import PrivacyService from '../services/PrivacyService';
import { UserBehaviorAnalytics } from '../services/UserBehaviorAnalytics';

// Core screens - loaded immediately for fast initial render
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
// PreviewHomeScreen removed - HomeScreen now handles guest mode with limited access
import ProfileScreen from '../screens/ProfileScreen';
import MatchesScreen from '../screens/MatchesScreen';

// Lazy-loaded screens - deferred for better startup performance
// These screens are loaded on-demand when user navigates to them
const ChatScreen = createLazyScreen(() => import('../screens/ChatScreen'), {
  loadingMessage: 'Loading chat...',
  displayName: 'ChatScreen',
});

// MatchesScreen moved to core imports

const EventsScreen = createLazyScreen(() => import('../screens/EventsScreen'), {
  loadingMessage: 'Loading events...',
  displayName: 'EventsScreen',
});

const GroupDatesScreen = createLazyScreen(() => import('../screens/GroupDatesScreen'), {
  loadingMessage: 'Loading social...',
  displayName: 'GroupDatesScreen',
});

const NotificationPreferencesScreen = createLazyScreen(
  () => import('../screens/NotificationPreferencesScreen'),
  { loadingMessage: 'Loading preferences...', displayName: 'NotificationPreferencesScreen' }
);

const PhotoGalleryScreen = createLazyScreen(() => import('../screens/PhotoGalleryScreen'), {
  loadingMessage: 'Loading gallery...',
  displayName: 'PhotoGalleryScreen',
});

const PreferencesScreen = createLazyScreen(() => import('../screens/PreferencesScreen'), {
  loadingMessage: 'Loading preferences...',
  displayName: 'PreferencesScreen',
});

// Premium routes - code-split by feature
const PremiumScreen = createLazyScreen(() => import('../screens/PremiumScreen'), {
  loadingMessage: 'Loading premium...',
  displayName: 'PremiumScreen',
});

const ProfileSharingScreen = createLazyScreen(() => import('../screens/ProfileSharingScreen'), {
  loadingMessage: 'Loading...',
  displayName: 'ProfileSharingScreen',
});

const SocialMediaConnectionScreen = createLazyScreen(
  () => import('../screens/SocialMediaConnectionScreen'),
  {
    loadingMessage: 'Loading social connections...',
    displayName: 'SocialMediaConnectionScreen',
  }
);

const ReportUserScreen = createLazyScreen(() => import('../screens/ReportUserScreen'), {
  loadingMessage: 'Loading...',
  displayName: 'ReportUserScreen',
});

const SafetyAdvancedScreen = createLazyScreen(() => import('../screens/SafetyAdvancedScreen'), {
  loadingMessage: 'Loading safety...',
  displayName: 'SafetyAdvancedScreen',
});

const SafetyTipsScreen = createLazyScreen(() => import('../screens/SafetyTipsScreen'), {
  loadingMessage: 'Loading safety tips...',
  displayName: 'SafetyTipsScreen',
});

const PrivacySettingsScreen = createLazyScreen(() => import('../screens/PrivacySettingsScreen'), {
  loadingMessage: 'Loading privacy settings...',
  displayName: 'PrivacySettingsScreen',
});

const AIInsightsScreen = createLazyScreen(() => import('../screens/AIInsightsScreen'), {
  loadingMessage: 'Loading AI insights...',
  displayName: 'AIInsightsScreen',
});

const PrivacyPolicyScreen = createLazyScreen(() => import('../screens/PrivacyPolicyScreen'), {
  loadingMessage: 'Loading privacy policy...',
  displayName: 'PrivacyPolicyScreen',
});

const TermsOfServiceScreen = createLazyScreen(() => import('../screens/TermsOfServiceScreen'), {
  loadingMessage: 'Loading terms of service...',
  displayName: 'TermsOfServiceScreen',
});

const VerificationScreen = createLazyScreen(() => import('../screens/VerificationScreen'), {
  loadingMessage: 'Loading verification...',
  displayName: 'VerificationScreen',
});

const ViewProfileScreen = createLazyScreen(() => import('../screens/ViewProfileScreen'), {
  loadingMessage: 'Loading profile...',
  displayName: 'ViewProfileScreen',
});

const EditProfileScreen = createLazyScreen(() => import('../screens/EditProfileScreen'), {
  loadingMessage: 'Loading editor...',
  displayName: 'EditProfileScreen',
});

const EmailVerificationScreen = createLazyScreen(
  () => import('../screens/EmailVerificationScreen'),
  {
    loadingMessage: 'Loading verification...',
    displayName: 'EmailVerificationScreen',
  }
);

const ForgotPasswordScreen = createLazyScreen(() => import('../screens/ForgotPasswordScreen'), {
  loadingMessage: 'Loading...',
  displayName: 'ForgotPasswordScreen',
});

const CreateEventScreen = createLazyScreen(() => import('../screens/CreateEventScreen'), {
  loadingMessage: 'Loading...',
  displayName: 'CreateEventScreen',
});

const EventDetailScreen = createLazyScreen(() => import('../screens/EventDetailScreen'), {
  loadingMessage: 'Loading event...',
  displayName: 'EventDetailScreen',
});

const CreateGroupDateScreen = createLazyScreen(() => import('../screens/CreateGroupDateScreen'), {
  loadingMessage: 'Loading...',
  displayName: 'CreateGroupDateScreen',
});

const GroupDateDetailScreen = createLazyScreen(() => import('../screens/GroupDateDetailScreen'), {
  loadingMessage: 'Loading group date...',
  displayName: 'GroupDateDetailScreen',
});

const MatchAnimationScreen = createLazyScreen(() => import('../screens/MatchAnimationScreen'), {
  loadingMessage: 'Loading...',
  displayName: 'MatchAnimationScreen',
});

const AddEmergencyContactScreen = createLazyScreen(
  () => import('../screens/AddEmergencyContactScreen'),
  {
    loadingMessage: 'Loading...',
    displayName: 'AddEmergencyContactScreen',
  }
);

// Additional screens for discovery features
const TopPicksScreen = createLazyScreen(() => import('../screens/TopPicksScreen'), {
  loadingMessage: 'Loading top picks...',
  displayName: 'TopPicksScreen',
});

const ExploreScreen = createLazyScreen(() => import('../screens/ExploreScreen'), {
  loadingMessage: 'Loading explore...',
  displayName: 'ExploreScreen',
});

const SuperLikeScreen = createLazyScreen(() => import('../screens/SuperLikeScreen'), {
  loadingMessage: 'Loading...',
  displayName: 'SuperLikeScreen',
});

const ProfileViewsScreen = createLazyScreen(() => import('../screens/ProfileViewsScreen'), {
  loadingMessage: 'Loading profile views...',
  displayName: 'ProfileViewsScreen',
});

const RegisterScreen = createLazyScreen(
  () => import('../screens/RegisterScreen').then((module) => ({ default: module.RegisterScreen })),
  {
    loadingMessage: 'Loading...',
    displayName: 'RegisterScreen',
  }
);

const PhoneVerificationScreen = createLazyScreen(
  () => import('../screens/PhoneVerificationScreen').then((module) => ({ default: module.PhoneVerificationScreen })),
  {
    loadingMessage: 'Loading...',
    displayName: 'PhoneVerificationScreen',
  }
);

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
