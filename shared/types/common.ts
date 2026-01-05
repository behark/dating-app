/**
 * Shared common type definitions
 * Common types used across the application
 */

/**
 * API Response wrapper
 */
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

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | '1' | '-1';
}

/**
 * Discovery/Search options
 */
export interface DiscoveryOptions {
  excludeIds?: string[];
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female' | 'other' | 'any';
  radius?: number;
  sortBy?: 'recentActivity' | 'distance' | 'compatibility';
  limit?: number;
  skip?: number;
}

/**
 * Discovery result with user and metadata
 */
export interface DiscoveryResult {
  user: any; // UserProfile type
  distance: number;
  compatibilityScore?: number;
}

/**
 * Notification types
 */
export type NotificationType = 
  | 'match' 
  | 'message' 
  | 'like' 
  | 'superlike' 
  | 'profile_view' 
  | 'system';

/**
 * Notification interface
 */
export interface INotification {
  _id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read?: boolean;
  createdAt?: Date | string;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

/**
 * Authentication response
 */
export interface AuthResponse extends ApiResponse {
  data?: {
    user: any; // User type
    tokens: AuthTokens;
  };
}

/**
 * Geolocation coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

/**
 * Upload progress
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  url: string;
  key?: string;
  filename?: string;
  size?: number;
  contentType?: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Generic ID type (can be string or ObjectId)
 */
export type ID = string;

/**
 * Date type (can be Date or string)
 */
export type DateType = Date | string;

/**
 * Subscription tier
 */
export type SubscriptionTier = 'free' | 'gold' | 'platinum' | 'unlimited';

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

/**
 * Gender options
 */
export type Gender = 'male' | 'female' | 'other';

/**
 * Gender preference
 */
export type GenderPreference = Gender | 'any';

/**
 * Moderation status
 */
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

/**
 * Verification status
 */
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

/**
 * Location privacy
 */
export type LocationPrivacy = 'hidden' | 'visible_to_matches' | 'visible_to_all';

export type Notification = INotification;
