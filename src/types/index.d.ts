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
  photos?: Photo[];
  location?: Location;
  interests?: string[];
  isEmailVerified?: boolean;
  isPremium?: boolean;
  subscriptionEnd?: string;
  createdAt?: string;
  updatedAt?: string;
  // Enhanced profile fields
  locationPrivacy?: 'hidden' | 'visible_to_matches' | 'visible_to_all';
  preferredGender?: 'male' | 'female' | 'other' | 'any';
  preferredAgeRange?: { min: number; max: number };
  preferredDistance?: number;
  isActive?: boolean;
  isVerified?: boolean;
  isProfileVerified?: boolean;
  lastActive?: string;
  // OAuth providers
  googleId?: string;
  facebookId?: string;
  appleId?: string;
}

export interface Photo {
  url: string;
  order: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  isMain?: boolean;
  uploadedAt?: string;
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
    ApiConfig, ApiResponse, AppError, AuthTokens, DiscoveryOptions,
    DiscoveryResult, GoogleAuthData, Location, LogLevel, LoginCredentials, Match, Message, NavigationParams, PaymentStatus, Photo, PremiumFeatures, ScreenProps, ServiceMethod, SignupData, SubscriptionTier, User, ValidationResult
};

