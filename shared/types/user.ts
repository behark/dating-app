/**
 * Shared type definitions for User
 * These types match the backend User model and should be kept in sync
 */

export interface IPhoto {
  _id?: string;
  url: string;
  isMain?: boolean;
  order?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  uploadedAt?: Date | string;
  rejectionReason?: string;
}

export interface IVideo {
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  order?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  uploadedAt?: Date | string;
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  city?: string;
  country?: string;
}

export interface IAgeRange {
  min: number;
  max: number;
}

export interface IProfilePrompt {
  promptId: string;
  answer: string;
}

export interface IEducation {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}

export interface IOccupation {
  jobTitle?: string;
  company?: string;
  industry?: string;
}

export interface IHeight {
  value?: number;
  unit?: 'cm' | 'ft';
}

export interface ISocialMedia {
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

export interface IUserSubscriptionInfo {
  tier: 'free' | 'gold' | 'platinum' | 'unlimited';
  startDate?: Date | string;
  endDate?: Date | string;
  stripeSubscriptionId?: string;
  status?: 'active' | 'cancelled' | 'expired' | 'past_due';
}

export interface PassportMode {
  enabled?: boolean;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  lastChanged?: Date | string;
  changeHistory?: Array<{
    location: any;
    city?: string;
    country?: string;
    changedAt: Date | string;
  }>;
}

export interface PrivacySettings {
  showDistance?: boolean;
  showAge?: boolean;
  showActive?: boolean;
  hasConsented?: boolean;
  consentDate?: Date | string;
  consentVersion?: string;
  consentHistory?: Array<{
    version: string;
    consentedAt: Date | string;
  }>;
  analyticsTracking?: boolean;
  marketingEmails?: boolean;
  thirdPartySharing?: boolean;
  locationHistoryEnabled?: boolean;
  changeHistory?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changedAt: Date | string;
  }>;
}

export interface NotificationPreferences {
  enabled?: boolean;
  matches?: boolean;
  messages?: boolean;
  likes?: boolean;
  superLikes?: boolean;
  promotions?: boolean;
  matchNotifications?: boolean;
  messageNotifications?: boolean;
  likeNotifications?: boolean;
  systemNotifications?: boolean;
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    start?: string;
    end?: string;
  };
}

export interface ReceivedLike {
  fromUserId: string;
  action: string;
  receivedAt: Date | string;
}

/**
 * Main User interface
 * Represents a user in the dating app
 */
export interface IUser {
  _id?: string;
  email: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  photos: IPhoto[];
  interests: string[];
  location?: ILocation;
  locationPrivacy?: 'hidden' | 'visible_to_matches' | 'visible_to_all';
  subscription?: IUserSubscriptionInfo;
  preferredAgeRange?: IAgeRange;
  preferredGender?: 'male' | 'female' | 'other' | 'any';
  preferredDistance?: number;
  profileCompleteness?: number;
  lastActive?: Date | string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
  // Enhanced profile fields
  videos?: IVideo[];
  profilePrompts?: IProfilePrompt[];
  education?: IEducation;
  occupation?: IOccupation;
  height?: IHeight;
  ethnicity?: string[];
  socialMedia?: ISocialMedia;
  
  // OAuth providers
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  oauthProviders?: string[];
  
  // Phone
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  
  // Account status
  isActive?: boolean;
  isVerified?: boolean;
  suspended?: boolean;
  needsReview?: boolean;
  
  // Profile verification
  isProfileVerified?: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationMethod?: 'photo' | 'video' | 'id' | 'none';
  
  // Activity & engagement
  isOnline?: boolean;
  isPremium?: boolean;
  activityScore?: number;
  totalSwipes?: number;
  totalMatches?: number;
  responseRate?: number;
  
  // Profile views
  profileViewCount?: number;
  profileViewedBy?: Array<{
    userId: string;
    viewedAt: Date | string;
  }>;
  
  // Boost tracking
  activeBoostId?: string;
  
  // Online status
  lastOnlineAt?: Date | string;
  
  // Safety & Privacy
  passportMode?: PassportMode;
  privacySettings?: PrivacySettings;
  notificationPreferences?: NotificationPreferences;
  blockedUsers?: string[];
  blockedCount?: number;
  reportCount?: number;
  suspensionType?: string;
  
  // Premium features
  stripeCustomerId?: string;
  boostAnalytics?: any;
  superLikesBalance?: number;
  boostsBalance?: number;
  rewindsBalance?: number;
  receivedLikes?: ReceivedLike[] | string[];
  advancedFilters?: any;
  adsPreferences?: any;
  language?: string;
  
  // Populated fields
  matches?: string[];
}

/**
 * User profile view (public-facing)
 * Represents minimal user data shown to other users
 */
export interface IUserProfile {
  _id: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  photos: IPhoto[];
  interests: string[];
  location?: ILocation;
  profileCompleteness?: number;
  lastActive?: Date | string;
  videos?: IVideo[];
  profilePrompts?: IProfilePrompt[];
  education?: IEducation;
  occupation?: IOccupation;
  height?: IHeight;
  ethnicity?: string[];
  isVerified?: boolean;
  isProfileVerified?: boolean;
  distance?: number; // Calculated distance from current user
}

export type User = IUser;
export type UserProfile = IUserProfile;
