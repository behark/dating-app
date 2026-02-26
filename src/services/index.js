/**
 * Services Barrel Export
 *
 * Centralized exports for all service modules.
 * Import services from this file for cleaner imports.
 */

// Core API
export { default as api } from './api';

// User Services
export { default as ProfileService } from './ProfileService';
export { default as PreferencesService } from './PreferencesService';
export { default as VerificationService } from './VerificationService';
export { default as PhotoVerificationService } from './PhotoVerificationService';

// Discovery & Matching
export { default as DiscoveryService } from './DiscoveryService';
export { default as SwipeController } from './SwipeController';
export { default as AdvancedInteractionsService } from './AdvancedInteractionsService';

// Premium & Payments
export { default as PremiumService } from './PremiumService';
export { default as PaymentService } from './PaymentService';
export { default as IAPService } from './IAPService';

// Communication
export { default as NotificationService } from './NotificationService';
export { default as MediaMessagesService } from './MediaMessagesService';

// Location
export { default as LocationService } from './LocationService';

// Analytics
export { default as AnalyticsService } from './AnalyticsService';
export { default as UserBehaviorAnalytics } from './UserBehaviorAnalytics';

// AI Services
export { default as AIService } from './AIService';
export { default as AIGatewayService } from './AIGatewayService';

// Gamification
export { default as GamificationService } from './GamificationService';

// Social Features
export { default as SocialFeaturesService } from './SocialFeaturesService';
export { default as SocialMediaService } from './SocialMediaService';

// Safety & Privacy
export { default as SafetyService } from './SafetyService';
export { default as PrivacyService } from './PrivacyService';

// Media
export { default as ImageService } from './ImageService';

// App Management
export { default as AppInitializationService } from './AppInitializationService';
export { default as UpdateService } from './UpdateService';
export { default as OfflineService } from './OfflineService';
export { default as PWAService } from './PWAService';

// Utilities
export { default as ValidationService } from './ValidationService';
export { default as ActivityService } from './ActivityService';
