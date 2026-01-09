/**
 * Screens Barrel Export
 * 
 * Centralized re-exports of all screens from feature folders.
 * This provides a clean import path for navigation while keeping
 * screens organized within their feature modules.
 */

// Discovery screens
export { default as HomeScreen } from '../../features/discovery/screens/HomeScreen';
export { default as DiscoveryScreen } from '../../features/discovery/screens/DiscoveryScreen';
export { default as ExploreScreen } from '../../features/discovery/screens/ExploreScreen';
export { default as PreviewHomeScreen } from '../../features/discovery/screens/PreviewHomeScreen';

// Matching screens
export { default as MatchesScreen } from '../../features/matching/screens/MatchesScreen';
export { default as MatchAnimationScreen } from '../../features/matching/screens/MatchAnimationScreen';
export { default as TopPicksScreen } from '../../features/matching/screens/TopPicksScreen';

// Chat screens
export { default as ChatScreen } from '../../features/chat/screens/ChatScreen';
export { default as EnhancedChatScreen } from '../../features/chat/screens/EnhancedChatScreen';

// Profile screens
export { default as ProfileScreen } from '../../features/profile/screens/ProfileScreen';
export { default as EditProfileScreen } from '../../features/profile/screens/EditProfileScreen';
export { default as ViewProfileScreen } from '../../features/profile/screens/ViewProfileScreen';
export { default as PhotoGalleryScreen } from '../../features/profile/screens/PhotoGalleryScreen';
export { default as ProfileSharingScreen } from '../../features/profile/screens/ProfileSharingScreen';
export { default as ProfileViewsScreen } from '../../features/profile/screens/ProfileViewsScreen';
export { default as VerificationScreen } from '../../features/profile/screens/VerificationScreen';
export { default as EnhancedProfileScreen } from '../../features/profile/screens/EnhancedProfileScreen';
export { default as EnhancedProfileEditScreen } from '../../features/profile/screens/EnhancedProfileEditScreen';

// Auth screens
export { default as LoginScreen } from '../../features/auth/screens/LoginScreen';
export { default as RegisterScreen } from '../../features/auth/screens/RegisterScreen';
export { default as EmailVerificationScreen } from '../../features/auth/screens/EmailVerificationScreen';
export { default as PhoneVerificationScreen } from '../../features/auth/screens/PhoneVerificationScreen';
export { default as ForgotPasswordScreen } from '../../features/auth/screens/ForgotPasswordScreen';
export { default as AuthVerificationScreen } from '../../features/auth/screens/VerificationScreen';

// Premium screens
export { default as PremiumScreen } from '../../features/premium/screens/PremiumScreen';
export { default as SuperLikeScreen } from '../../features/premium/screens/SuperLikeScreen';

// Settings screens
export { default as PreferencesScreen } from '../../features/settings/screens/PreferencesScreen';
export { default as NotificationPreferencesScreen } from '../../features/settings/screens/NotificationPreferencesScreen';
export { default as PrivacySettingsScreen } from '../../features/settings/screens/PrivacySettingsScreen';
export { default as PrivacyPolicyScreen } from '../../features/settings/screens/PrivacyPolicyScreen';
export { default as TermsOfServiceScreen } from '../../features/settings/screens/TermsOfServiceScreen';
export { default as SocialMediaConnectionScreen } from '../../features/settings/screens/SocialMediaConnectionScreen';

// Events screens
export { default as EventsScreen } from '../../features/events/screens/EventsScreen';
export { default as CreateEventScreen } from '../../features/events/screens/CreateEventScreen';
export { default as EventDetailScreen } from '../../features/events/screens/EventDetailScreen';
export { default as GroupDatesScreen } from '../../features/events/screens/GroupDatesScreen';
export { default as CreateGroupDateScreen } from '../../features/events/screens/CreateGroupDateScreen';
export { default as GroupDateDetailScreen } from '../../features/events/screens/GroupDateDetailScreen';

// Safety screens
export { default as ReportUserScreen } from '../../features/safety/screens/ReportUserScreen';
export { default as SafetyTipsScreen } from '../../features/safety/screens/SafetyTipsScreen';
export { default as SafetyAdvancedScreen } from '../../features/safety/screens/SafetyAdvancedScreen';
export { default as AddEmergencyContactScreen } from '../../features/safety/screens/AddEmergencyContactScreen';
export { default as AIInsightsScreen } from '../../features/safety/screens/AIInsightsScreen';
