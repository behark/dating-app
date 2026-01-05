/**
 * TypeScript Type Definitions
 * Provides type safety for the dating app
 */

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// User Types
export interface User {
  _id: string;
  uid?: string; // Alias for _id (Firebase compatibility)
  email: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  photos: Photo[]; // Required array (can be empty)
  location?: Location;
  interests: string[]; // Required array (can be empty)
  // Email verification
  isEmailVerified?: boolean;
  emailVerified?: boolean; // Alias for isEmailVerified
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: string;
  // Phone verification
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  phoneVerified?: boolean; // Alias for isPhoneVerified
  phoneVerificationCode?: string;
  phoneVerificationCodeExpiry?: string;
  // Premium & Subscription
  isPremium?: boolean;
  premiumExpiresAt?: string;
  subscription?: Subscription;
  subscriptionEnd?: string; // Deprecated: use subscription.endDate
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  // Location & Privacy
  locationPrivacy?: 'hidden' | 'visible_to_matches' | 'visible_to_all';
  lastLocationUpdate?: string;
  locationHistoryEnabled?: boolean;
  // Preferences
  preferredGender?: 'male' | 'female' | 'other' | 'any';
  preferredAgeRange?: AgeRange;
  preferredDistance?: number;
  // Account status
  isActive?: boolean;
  isVerified?: boolean;
  suspended?: boolean;
  suspendedAt?: string;
  suspendReason?: string;
  suspensionType?: 'manual' | 'auto' | null;
  needsReview?: boolean;
  appealReason?: string;
  appealedAt?: string;
  reportCount?: number;
  blockedUsers?: string[];
  blockedCount?: number;
  // Profile verification
  isProfileVerified?: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationMethod?: 'photo' | 'video' | 'id' | 'none';
  verificationDate?: string;
  // Activity & Engagement
  isOnline?: boolean;
  lastActive?: string;
  lastOnlineAt?: string;
  lastActivityAt?: string;
  profileViewCount?: number;
  profileViewedBy?: Array<{
    userId: string;
    viewedAt?: string;
  }>;
  activityScore?: number;
  totalSwipes?: number;
  totalMatches?: number;
  totalConversations?: number;
  responseRate?: number;
  profileCompleteness?: number;
  // Enhanced profile fields
  videos?: Video[];
  profilePrompts?: ProfilePrompt[];
  education?: Education;
  occupation?: Occupation;
  height?: Height;
  ethnicity?: string[];
  socialMedia?: SocialMedia;
  // OAuth providers
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  oauthProviders?: string[];
  // Premium Features - See Who Liked You
  receivedLikes?: Array<{
    fromUserId: string;
    action?: 'like' | 'superlike';
    receivedAt?: string;
  }>;
  // Premium Features - Passport (Location Override)
  passportMode?: {
    enabled?: boolean;
    currentLocation?: {
      type?: 'Point';
      coordinates?: [number, number];
      city?: string;
      country?: string;
    };
    lastChanged?: string;
    changeHistory?: Array<{
      location?: {
        type?: 'Point';
        coordinates?: [number, number];
      };
      city?: string;
      country?: string;
      changedAt?: string;
    }>;
  };
  // Premium Features - Advanced Filters
  advancedFilters?: {
    minIncome?: number;
    maxIncome?: number;
    educationLevel?: string[];
    bodyType?: string[];
    drinkingFrequency?: string;
    smokingStatus?: string;
    maritalStatus?: string[];
    hasChildren?: boolean;
    wantsChildren?: string;
    religion?: string[];
    zodiacSign?: string[];
    languages?: string[];
    pets?: Array<{
      type?: string;
      description?: string;
    }>;
    travelFrequency?: string;
  };
  // Premium Features - Priority Likes
  priorityLikesReceived?: number;
  priorityLikesSent?: number;
  // Premium Features - Ads Control
  adsPreferences?: {
    showAds?: boolean;
    adCategories?: string[];
    lastAdUpdate?: string;
  };
  // Premium Features - Boost Analytics
  boostAnalytics?: {
    totalBoosts?: number;
    totalProfileViews?: number;
    totalLikesReceivedDuringBoosts?: number;
    boostHistory?: Array<{
      startTime?: string;
      endTime?: string;
      duration?: number;
      viewsGained?: number;
      likesGained?: number;
      matches?: number;
    }>;
    averageViewsPerBoost?: number;
    averageLikesPerBoost?: number;
  };
  // Premium Features - Swipe Stats
  swipeStats?: {
    dailySwipeCount?: number;
    swipeResetTime?: string;
    totalSwipesAllTime?: number;
  };
  // Premium Features - Usage Tracking
  superLikeUsageToday?: number;
  superLikeResetTime?: string;
  rewindUsageToday?: number;
  rewindResetTime?: string;
  boostUsageToday?: number;
  boostResetTime?: string;
  activeBoostId?: string;
  // Privacy & Compliance (GDPR/CCPA)
  privacySettings?: {
    dataSharing?: boolean;
    marketingEmails?: boolean;
    thirdPartySharing?: boolean;
    analyticsTracking?: boolean;
    doNotSell?: boolean;
    doNotSellDate?: string;
    dataRetentionPeriod?: '1year' | '2years' | '5years' | 'indefinite';
    hasConsented?: boolean;
    consentDate?: string;
    consentVersion?: string;
    consentHistory?: Array<{
      timestamp?: string;
      action?: string;
      version?: string;
      purposes?: any;
      ipAddress?: string;
      userAgent?: string;
      changes?: any;
    }>;
    lastUpdated?: string;
  };
  // End-to-End Encryption
  encryptionPublicKey?: string;
  encryptionPrivateKeyEncrypted?: string;
  encryptionKeyVersion?: number;
  // Gamification
  gamification?: {
    xp?: number;
    totalXPEarned?: number;
    lastXPAction?: string;
    lastXPDate?: string;
    dailyChallenges?: Array<{
      challengeId?: string;
      id?: string;
      type?: string;
      title?: string;
      description?: string;
      icon?: string;
      targetCount?: number;
      currentProgress?: number;
      xpReward?: number;
      difficulty?: string;
      completed?: boolean;
      claimed?: boolean;
      claimedAt?: string;
      expiresAt?: string;
      order?: number;
    }>;
    lastChallengeDate?: string;
    dailyBonusClaimed?: boolean;
    lastBonusDate?: string;
    achievementProgress?: {
      matchCount?: number;
      messagesSent?: number;
      conversationsStarted?: number;
      superLikesSent?: number;
      datesScheduled?: number;
    };
  };
}

export interface Photo {
  _id?: string;
  url: string;
  order?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  isMain?: boolean;
  uploadedAt?: string;
}

export interface Video {
  _id?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds (6-15)
  order?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  uploadedAt?: string;
}

export interface ProfilePrompt {
  promptId: string;
  answer: string;
}

export interface Education {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}

export interface Occupation {
  jobTitle?: string;
  company?: string;
  industry?: string;
}

export interface Height {
  value?: number; // in cm
  unit?: 'cm' | 'ft';
}

export interface SocialMedia {
  spotify?: {
    id?: string;
    username?: string;
    profileUrl?: string;
    isVerified?: boolean;
  };
  instagram?: {
    id?: string;
    username?: string;
    profileUrl?: string;
    isVerified?: boolean;
  };
}

export interface Subscription {
  tier?: 'free' | 'gold' | 'platinum' | 'unlimited';
  startDate?: string;
  endDate?: string;
  stripeSubscriptionId?: string;
  status?: 'active' | 'cancelled' | 'expired' | 'past_due';
}

export interface AgeRange {
  min: number;
  max: number;
}

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Auth Types
export interface AuthTokens {
  authToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
}

export interface GoogleAuthData {
  googleId: string;
  email: string;
  name: string;
  photoUrl?: string;
}

// Discovery Types
export interface DiscoveryOptions {
  radius?: number;
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female' | 'other' | 'any';
  sortBy?: 'recentActivity' | 'distance' | 'compatibility';
  excludeIds?: string[];
  limit?: number;
  skip?: number;
}

export interface DiscoveryResult {
  users: User[];
  total?: number;
  hasMore?: boolean;
}

// Payment Types
export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export interface PaymentStatus {
  isPremium: boolean;
  subscriptionEnd?: string;
  features: Record<string, boolean>;
}

// Premium Types
export interface PremiumFeatures {
  superLikesPerDay: number;
  unlimitedSwipes: boolean;
  advancedFilters: boolean;
  seeWhoLikedYou: boolean;
  boostProfile: boolean;
  priorityLikes: boolean;
  hideAds: boolean;
  passport: boolean;
  profileBoostAnalytics: boolean;
}

// Chat Types
export interface Message {
  _id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'gif' | 'sticker' | 'voice' | 'video_call';
  timestamp: string;
  read: boolean;
  metadata?: Record<string, any>;
}

export interface Match {
  _id: string;
  users: string[];
  user1?: string;
  user2?: string;
  matchInitiator?: string;
  matchType?: 'regular' | 'superlike';
  status?: 'active' | 'unmatched' | 'blocked';
  createdAt: string;
  lastActivity?: string;
  conversationStarted?: boolean;
  lastMessage?: Message;
  unreadCount?: number;
}

// Service Method Types
export type ServiceMethod<T = any> = (...args: any[]) => Promise<T>;

// Error Types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

// Navigation Types
export interface NavigationParams {
  [key: string]: any;
}

// Component Props Types
export interface ScreenProps {
  navigation: any;
  route?: {
    params?: NavigationParams;
  };
}

// API Configuration
export interface ApiConfig {
  API_URL: string;
  API_BASE_URL: string;
  SOCKET_URL: string;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Logger Types
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// Export all types
export type {
  AgeRange,
  ApiConfig,
  ApiResponse,
  AppError,
  AuthTokens,
  DiscoveryOptions,
  DiscoveryResult,
  Education,
  GoogleAuthData,
  Height,
  Location,
  LogLevel,
  LoginCredentials,
  Match,
  Message,
  NavigationParams,
  Occupation,
  PaymentStatus,
  Photo,
  PremiumFeatures,
  ProfilePrompt,
  ScreenProps,
  ServiceMethod,
  SignupData,
  SocialMedia,
  Subscription,
  SubscriptionTier,
  User,
  ValidationResult,
  Video,
};
