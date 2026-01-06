import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import ConsentBanner from '../components/ConsentBanner';
import { createLazyScreen, usePreloadScreens } from '../components/LazyScreen';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import PrivacyService from '../services/PrivacyService';
import { UserBehaviorAnalytics } from '../services/UserBehaviorAnalytics';

// Core screens - loaded immediately for fast initial render
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PreviewHomeScreen from '../screens/PreviewHomeScreen';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Screens to preload after initial render for smoother navigation
const screensToPreload = [ChatScreen, ViewProfileScreen];

const MainTabs = () => {
  const { unreadCount } = useChat();

  // Preload commonly accessed screens after mount
  usePreloadScreens(screensToPreload);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border.gray,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: Colors.text.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame" size={size || 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size || 26} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
        }}
      />
      <Tab.Screen
        name="Social"
        component={GroupDatesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size || 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

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
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {currentUser ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="ViewProfile"
                component={ViewProfileScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="Preferences"
                component={PreferencesScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="NotificationPreferences"
                component={NotificationPreferencesScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="Verification"
                component={VerificationScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="Premium"
                component={PremiumScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="PhotoGallery"
                component={PhotoGalleryScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="ReportUser"
                component={ReportUserScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="SafetyTips"
                component={SafetyTipsScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="SafetyAdvanced"
                component={SafetyAdvancedScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="PrivacySettings"
                component={PrivacySettingsScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="TermsOfService"
                component={TermsOfServiceScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="AIInsights"
                component={AIInsightsScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="Events"
                component={EventsScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="ProfileSharing"
                component={ProfileSharingScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="SocialMediaConnection"
                component={SocialMediaConnectionScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="VerifyEmail"
                component={EmailVerificationScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="CreateEvent"
                component={CreateEventScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="EventDetail"
                component={EventDetailScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="CreateGroupDate"
                component={CreateGroupDateScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="GroupDateDetail"
                component={GroupDateDetailScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="MatchAnimation"
                component={MatchAnimationScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="AddEmergencyContact"
                component={AddEmergencyContactScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="TopPicks"
                component={TopPicksScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="Explore"
                component={ExploreScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="SuperLike"
                component={SuperLikeScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="ProfileViews"
                component={ProfileViewsScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Preview" component={PreviewHomeScreen} />
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="VerifyEmail"
                component={EmailVerificationScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;
