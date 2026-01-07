/**
 * Service Layer Index
 * Centralized exports for all services, organized by category
 */

// Core Services
export { default as api } from './api';
export type { ApiRequestOptions, NormalizedApiResponse, ApiError } from './api';
export { AnalyticsService } from './AnalyticsService';
export type {
  AnalyticsEventParams,
  AuthMethod,
  SwipeAction,
  MessageType,
  PremiumTier,
  ShareMethod,
  ShareContentType,
} from './AnalyticsService';
export { default as NotificationService } from './NotificationService';
export type {
  Notification,
  NotificationResponse,
  NotificationListeners,
  LocalNotificationConfig,
} from './NotificationService';
export { UpdateService } from './UpdateService';
export { UserBehaviorAnalytics } from './UserBehaviorAnalytics';
export { MonitoringService } from './MonitoringService';

// Infrastructure Services
export { PWAService } from './PWAService';
export { default as IAPService } from './IAPService';
export { default as OfflineService } from './OfflineService';
export { default as PrivacyService } from './PrivacyService';

// Feature Services - Profile
export { ProfileService } from './ProfileService';
export type {
  ProfileUpdateData,
  PhotoUploadData,
  EducationData,
  OccupationData,
  HeightData,
} from './ProfileService';
// Note: EnhancedProfileService merged into ProfileService

// Feature Services - Discovery & Matching
export { default as DiscoveryService } from './DiscoveryService';
export type {
  ExploreUsersOptions,
  VerifiedProfilesOptions,
  VerificationMethod,
  TopPicksResponse,
  UsersResponse,
} from './DiscoveryService';
export { SwipeController } from './SwipeController';

// Feature Services - Social
export { SocialFeaturesService } from './SocialFeaturesService';
export { SocialMediaService } from './SocialMediaService';

// Feature Services - AI
export { AIService } from './AIService';
export { default as AIGatewayService } from './AIGatewayService';

// Feature Services - Chat & Messaging
export { default as MediaMessagesService } from './MediaMessagesService';

// Feature Services - Premium & Payments
export { PremiumService } from './PremiumService';
export { PaymentService } from './PaymentService';

// Feature Services - Preferences & Settings
export { PreferencesService } from './PreferencesService';

// Feature Services - Safety & Verification
export { SafetyService } from './SafetyService';
export { VerificationService } from './VerificationService';
export { PhotoVerificationService } from './PhotoVerificationService';

// Feature Services - Activity & Gamification
export { ActivityService } from './ActivityService';
export { GamificationService } from './GamificationService';
export { default as AdvancedInteractionsService } from './AdvancedInteractionsService';

// Feature Services - Utilities
export { ImageService } from './ImageService';
export type {
  ImageCompressionOptions,
  ImageValidationResult,
  ImageUploadResult,
  ImageModerationResult,
  ImageData,
} from './ImageService';
export { LocationService } from './LocationService';
export type {
  LocationCoordinates,
  LocationPrivacy,
  UserProfileWithDistance,
} from './LocationService';
export { ValidationService } from './ValidationService';
export type {
  ProfileValidationResult,
  ImageFileValidationResult,
  UserProfileForValidation,
} from './ValidationService';
export { FeatureFlagService } from './FeatureFlagService';
export { BetaTestingService } from './BetaTestingService';

// Legacy exports (for backward compatibility)
// These will be deprecated in favor of the consolidated exports above
export { EnhancedProfileService } from './EnhancedProfileService';
