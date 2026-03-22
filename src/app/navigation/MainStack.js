import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform } from 'react-native';
import { useChat } from '../providers/ChatProvider';
import { Colors } from '../../constants/colors';
import HapticFeedback from '../../utils/haptics';

// Import screens from centralized barrel export
import {
  HomeScreen,
  MatchesScreen,
  ProfileScreen,
  // ChatScreen, // Replaced by EnhancedChatScreen (superset of ChatScreen functionality)
  EnhancedChatScreen,
  EventsScreen,
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
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
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
        // Ensure tab bar items are accessible
        tabBarAllowFontScaling: true,
        tabBarHideOnKeyboard: true,
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
          title: 'Discover',
          tabBarAccessibilityLabel: 'Discover new people',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame" size={size || 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: 'Matches',
          tabBarAccessibilityLabel:
            unreadCount > 0
              ? `Matches, ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`
              : 'Matches and conversations',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size || 26} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
          tabBarBadgeStyle: {
            backgroundColor: '#e94057',
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Your profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: true,
      animationTypeForReplace: 'push',
    }}
  >
    {/* Main tab bar -- root of authenticated flow */}
    <Stack.Screen name="Main" component={MainTabs} options={{ gestureEnabled: false }} />

    {/* Chat & Messaging */}
    <Stack.Screen
      name="Chat"
      component={EnhancedChatScreen}
      options={{
        title: 'Chat',
        presentation: 'card',
        gestureEnabled: true,
      }}
    />

    {/* Profile Screens */}
    <Stack.Screen
      name="ViewProfile"
      component={ViewProfileScreen}
      options={{
        title: 'View Profile',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{
        title: 'Edit Profile',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="PhotoGallery"
      component={PhotoGalleryScreen}
      options={{
        title: 'Photos',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="ProfileSharing"
      component={ProfileSharingScreen}
      options={{
        title: 'Share Profile',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="ProfileViews"
      component={ProfileViewsScreen}
      options={{
        title: 'Profile Views',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="Verification"
      component={VerificationScreen}
      options={{
        title: 'Verify Your Identity',
        presentation: 'card',
      }}
    />

    {/* Settings & Preferences */}
    <Stack.Screen
      name="Preferences"
      component={PreferencesScreen}
      options={{
        title: 'Preferences',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="NotificationPreferences"
      component={NotificationPreferencesScreen}
      options={{
        title: 'Notification Settings',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="PrivacySettings"
      component={PrivacySettingsScreen}
      options={{
        title: 'Privacy Settings',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="SocialMediaConnection"
      component={SocialMediaConnectionScreen}
      options={{
        title: 'Connected Accounts',
        presentation: 'card',
      }}
    />

    {/* Legal */}
    <Stack.Screen
      name="PrivacyPolicy"
      component={PrivacyPolicyScreen}
      options={{
        title: 'Privacy Policy',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="TermsOfService"
      component={TermsOfServiceScreen}
      options={{
        title: 'Terms of Service',
        presentation: 'card',
      }}
    />

    {/* Premium */}
    <Stack.Screen
      name="Premium"
      component={PremiumScreen}
      options={{
        title: 'Premium',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="SuperLike"
      component={SuperLikeScreen}
      options={{
        title: 'Super Like',
        presentation: 'modal',
        animation: 'slide_from_bottom',
      }}
    />
    <Stack.Screen
      name="TopPicks"
      component={TopPicksScreen}
      options={{
        title: 'Top Picks',
        presentation: 'card',
      }}
    />

    {/* Discovery & Explore */}
    <Stack.Screen
      name="Explore"
      component={ExploreScreen}
      options={{
        title: 'Explore',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="AIInsights"
      component={AIInsightsScreen}
      options={{
        title: 'AI Insights',
        presentation: 'card',
      }}
    />

    {/* Events & Group Dates */}
    <Stack.Screen
      name="Events"
      component={EventsScreen}
      options={{
        title: 'Events',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="CreateEvent"
      component={CreateEventScreen}
      options={{
        title: 'Create Event',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="EventDetail"
      component={EventDetailScreen}
      options={{
        title: 'Event Details',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="CreateGroupDate"
      component={CreateGroupDateScreen}
      options={{
        title: 'Create Group Date',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="GroupDateDetail"
      component={GroupDateDetailScreen}
      options={{
        title: 'Group Date',
        presentation: 'card',
      }}
    />

    {/* Safety */}
    <Stack.Screen
      name="ReportUser"
      component={ReportUserScreen}
      options={{
        title: 'Report User',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="SafetyTips"
      component={SafetyTipsScreen}
      options={{
        title: 'Safety Tips',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="SafetyAdvanced"
      component={SafetyAdvancedScreen}
      options={{
        title: 'Advanced Safety',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="AddEmergencyContact"
      component={AddEmergencyContactScreen}
      options={{
        title: 'Emergency Contact',
        presentation: 'card',
      }}
    />

    {/* Verification & Auth (in-app) */}
    <Stack.Screen
      name="VerifyEmail"
      component={EmailVerificationScreen}
      options={{
        title: 'Verify Email',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="PhoneVerification"
      component={PhoneVerificationScreen}
      options={{
        title: 'Verify Phone',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{
        title: 'Reset Password',
        presentation: 'card',
      }}
    />

    {/* Fullscreen Modals */}
    <Stack.Screen
      name="MatchAnimation"
      component={MatchAnimationScreen}
      options={{
        title: 'New Match',
        presentation: 'transparentModal',
        animation: 'fade',
        gestureEnabled: false,
      }}
    />
  </Stack.Navigator>
);

export default MainStack;
