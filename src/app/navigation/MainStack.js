import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { useChat } from '../providers/ChatProvider';
import { Colors } from '../../constants/colors';
import HapticFeedback from '../../utils/haptics';

// Import screens from centralized barrel export
import {
  HomeScreen,
  MatchesScreen,
  ProfileScreen,
  ChatScreen,
  EventsScreen,
  GroupDatesScreen,
  NotificationPreferencesScreen,
  PhotoGalleryScreen,
  PreferencesScreen,
  PremiumScreen,
  ProfileSharingScreen,
  SocialMediaConnectionScreen,
  ReportUserScreen,
  SafetyTipsScreen,
  SafetyAdvancedScreen,
  PrivacySettingsScreen,
  PrivacyPolicyScreen,
  TermsOfServiceScreen,
  AIInsightsScreen,
  ViewProfileScreen,
  EditProfileScreen,
  EmailVerificationScreen,
  PhoneVerificationScreen,
  ForgotPasswordScreen,
  CreateEventScreen,
  EventDetailScreen,
  CreateGroupDateScreen,
  GroupDateDetailScreen,
  MatchAnimationScreen,
  AddEmergencyContactScreen,
  TopPicksScreen,
  ExploreScreen,
  SuperLikeScreen,
  ProfileViewsScreen,
  VerificationScreen,
} from '../screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { unreadCount } = useChat();

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
      screenListeners={{
        tabPress: () => {
          HapticFeedback.lightImpact();
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

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      name="PhoneVerification"
      component={PhoneVerificationScreen}
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
  </Stack.Navigator>
);

export default MainStack;