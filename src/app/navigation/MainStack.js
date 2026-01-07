import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { useChat } from '../../context/ChatContext';
import { Colors } from '../../constants/colors';
import HapticFeedback from '../../utils/haptics';

// Feature-based screen imports
import HomeScreen from '../../features/discovery/screens/DiscoveryScreen';
import MatchesScreen from '../../features/matching/screens/MatchesScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';

// Lazy-loaded screens - Feature based
const ChatScreen = require('../../features/chat/screens/ChatScreen').default;
const PremiumScreen = require('../../features/premium/screens/PremiumScreen').default;
const ViewProfileScreen = require('../../features/profile/screens/ViewProfileScreen').default;
const EditProfileScreen = require('../../features/profile/screens/EditProfileScreen').default;
const PhotoGalleryScreen = require('../../features/profile/screens/PhotoGalleryScreen').default;
const VerificationScreen = require('../../features/profile/screens/VerificationScreen').default;
const EmailVerificationScreen = require('../../features/auth/screens/EmailVerificationScreen').default;
const PhoneVerificationScreen = require('../../features/auth/screens/PhoneVerificationScreen').default;
const ForgotPasswordScreen = require('../../features/auth/screens/ForgotPasswordScreen').default;
const MatchAnimationScreen = require('../../features/matching/screens/MatchAnimationScreen').default;
const TopPicksScreen = require('../../features/premium/screens/TopPicksScreen').default;
const ExploreScreen = require('../../features/discovery/screens/ExploreScreen').default;
const SuperLikeScreen = require('../../features/premium/screens/SuperLikeScreen').default;

// Legacy screens (still in old location)
const EventsScreen = require('../../screens/EventsScreen').default;
const GroupDatesScreen = require('../../screens/GroupDatesScreen').default;
const NotificationPreferencesScreen = require('../../screens/NotificationPreferencesScreen').default;
const PreferencesScreen = require('../../screens/PreferencesScreen').default;
const ProfileSharingScreen = require('../../screens/ProfileSharingScreen').default;
const SocialMediaConnectionScreen = require('../../screens/SocialMediaConnectionScreen').default;
const ReportUserScreen = require('../../screens/ReportUserScreen').default;
const SafetyTipsScreen = require('../../screens/SafetyTipsScreen').default;
const SafetyAdvancedScreen = require('../../screens/SafetyAdvancedScreen').default;
const PrivacySettingsScreen = require('../../screens/PrivacySettingsScreen').default;
const AIInsightsScreen = require('../../screens/AIInsightsScreen').default;
const CreateEventScreen = require('../../screens/CreateEventScreen').default;
const EventDetailScreen = require('../../screens/EventDetailScreen').default;
const CreateGroupDateScreen = require('../../screens/CreateGroupDateScreen').default;
const GroupDateDetailScreen = require('../../screens/GroupDateDetailScreen').default;
const AddEmergencyContactScreen = require('../../screens/AddEmergencyContactScreen').default;
const ProfileViewsScreen = require('../../screens/ProfileViewsScreen').default;

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
      component={require('../../screens/PrivacyPolicyScreen').default}
      options={{
        headerShown: false,
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="TermsOfService"
      component={require('../../screens/TermsOfServiceScreen').default}
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