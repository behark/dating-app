import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { createLazyScreen, usePreloadScreens } from '../components/LazyScreen';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { UserBehaviorAnalytics } from '../services/UserBehaviorAnalytics';
import ConsentBanner from '../components/ConsentBanner';
import PrivacyService from '../services/PrivacyService';

// Core screens - loaded immediately for fast initial render
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PreviewHomeScreen from '../screens/PreviewHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Lazy-loaded screens - deferred for better startup performance
// These screens are loaded on-demand when user navigates to them
const ChatScreen = createLazyScreen(() => import('../screens/ChatScreen'), {
  loadingMessage: 'Loading chat...',
  displayName: 'ChatScreen',
});

const MatchesScreen = createLazyScreen(() => import('../screens/MatchesScreen'), {
  loadingMessage: 'Loading matches...',
  displayName: 'MatchesScreen',
});

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Screens to preload after initial render for smoother navigation
const screensToPreload = [MatchesScreen, ChatScreen, ViewProfileScreen];

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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
