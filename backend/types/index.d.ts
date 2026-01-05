/**
 * Type Definitions for Dating App Backend
 * TD-005: TypeScript type definitions for backend services
 */

import { NextFunction, Request, Response } from 'express';
import { Document, Model, Query, Types } from 'mongoose';

// ============================================================
// Express Extensions
// ============================================================

export interface AuthenticatedRequest extends Request {
  user?: UserDocument;
  userId?: string;
}

export interface PaginatedRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | '1' | '-1';
  };
}

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

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================
// User Types
// ============================================================

export interface IVideo {
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  order?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  uploadedAt?: Date;
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

export interface IUser {
  email: string;
  password?: string;
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
  lastActive?: Date;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: Date;
  phoneVerificationCode?: string;
  phoneVerificationCodeExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
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
  // Account status
  isActive?: boolean;
  isVerified?: boolean;
  suspended?: boolean;
  suspendedAt?: Date;
  needsReview?: boolean;
  // Profile verification
  isProfileVerified?: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationMethod?: 'photo' | 'video' | 'id' | 'none';
  verificationDate?: Date;
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
    userId: Types.ObjectId;
    viewedAt: Date;
  }>;
  // Boost tracking
  activeBoostId?: Types.ObjectId;
  // Online status
  lastOnlineAt?: Date;
  // Safety & Privacy
  passportMode?: {
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
    lastChanged?: Date;
    changeHistory?: Array<{
      location: any;
      city?: string;
      country?: string;
      changedAt: Date;
    }>;
  };
  privacySettings?: {
    showDistance?: boolean;
    showAge?: boolean;
    showActive?: boolean;
    hasConsented?: boolean;
    consentDate?: Date;
    consentVersion?: string;
    consentHistory?: Array<{
      version: string;
      consentedAt: Date;
    }>;
    analyticsTracking?: boolean;
    marketingEmails?: boolean;
    thirdPartySharing?: boolean;
    locationHistoryEnabled?: boolean;
    changeHistory?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      changedAt: Date;
    }>;
  };
  notificationPreferences?: {
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
  };
  blockedUsers?: Types.ObjectId[];
  blockedCount?: number;
  reportCount?: number;
  suspensionType?: string;
  // Premium features
  stripeCustomerId?: string;
  boostAnalytics?: any;
  superLikesBalance?: number;
  boostsBalance?: number;
  rewindsBalance?: number;
  receivedLikes?: Array<
    | {
        fromUserId: Types.ObjectId;
        action: string;
        receivedAt: Date;
      }
    | Types.ObjectId
  >;
  advancedFilters?: any;
  adsPreferences?: any;
  language?: string;
}

export interface UserDocument extends IUser, Document {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  matchPassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
  updateLocation(longitude: number, latitude: number): void;
  matches?: Types.ObjectId[];
  values?: any;
}

export interface UserModel extends Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
  findNearby(
    longitude: number,
    latitude: number,
    radius: number,
    options?: DiscoveryOptions
  ): Query<UserDocument[], UserDocument>;
}

export interface IPhoto {
  _id?: Types.ObjectId;
  url: string;
  isMain?: boolean;
  order?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  uploadedAt?: Date;
  rejectionReason?: string;
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  city?: string;
  country?: string;
}

export interface IUserSubscriptionInfo {
  tier: 'free' | 'gold' | 'platinum' | 'unlimited';
  startDate?: Date;
  endDate?: Date;
  stripeSubscriptionId?: string;
  status?: 'active' | 'cancelled' | 'expired' | 'past_due';
}

export interface IAgeRange {
  min: number;
  max: number;
}

// ============================================================
// Match/Swipe Types
// ============================================================

export interface ISwipe {
  swiperId: Types.ObjectId;
  swipedId: Types.ObjectId;
  action: 'like' | 'dislike' | 'superlike';
  isMatch?: boolean;
  createdAt?: Date;
}

export interface SwipeDocument extends ISwipe, Document {
  _id: Types.ObjectId;
}

export interface SwipeModel extends Model<SwipeDocument> {
  getSwipedUserIds(userId: string): Promise<Types.ObjectId[]>;
  checkMatch(swiperId: string, swipedId: string): Promise<boolean>;
  createSwipeAtomic(swipeData: Partial<ISwipe>): Promise<SwipeDocument>;
  hasSwiped(swiperId: string, swipedId: string): Promise<SwipeDocument | null>;
  getMatches(userId: string): Promise<any[]>;
  getSwipeCountToday(swiperId: string): Promise<number>;
  canSwipe(
    swiperId: string,
    isPremium?: boolean
  ): Promise<{ canSwipe: boolean; remaining?: number; used?: number }>;
}

export interface IMatch {
  users: Types.ObjectId[];
  user1?: Types.ObjectId;
  user2?: Types.ObjectId;
  matchInitiator?: Types.ObjectId;
  matchType?: 'regular' | 'superlike';
  status?: 'active' | 'unmatched' | 'blocked';
  createdAt?: Date;
  lastActivity?: Date;
  conversationStarted?: boolean;
  unmatchedBy?: Types.ObjectId;
  unmatchedAt?: Date;
  firstMessageBy?: Types.ObjectId;
  firstMessageAt?: Date;
  messageCount?: number;
  lastActivityAt?: Date;
}

export interface MatchDocument extends IMatch, Document {
  _id: Types.ObjectId;
  getOtherUser(userId: string): Types.ObjectId;
  markConversationStarted(messageBy: Types.ObjectId): Promise<void>;
}

export interface MatchModel extends Model<MatchDocument> {
  matchExists(userId1: string, userId2: string): Promise<boolean>;
  createMatch(
    userId1: string,
    userId2: string,
    matchInitiator?: string,
    matchType?: string
  ): Promise<{
    match: MatchDocument;
    isNew: boolean;
    reactivated: boolean;
  }>;
  getUserMatches(userId: string, options?: any): Promise<MatchDocument[]>;
  unmatch(matchId: string, userId: string): Promise<void>;
  getMatchCount(userId: string, status?: string): Promise<number>;
}

// ============================================================
// Message Types
// ============================================================

export interface IMessage {
  matchId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  isEncrypted?: boolean;
  isRead?: boolean;
  readAt?: Date;
  type?: 'text' | 'image' | 'gif' | 'sticker' | 'voice' | 'video_call' | 'system';
  mediaUrl?: string;
  replyTo?: Types.ObjectId;
  createdAt?: Date;
  metadata?: Record<string, any>;
  // Media message fields
  voiceMessage?: {
    url: string;
    duration?: number;
    waveform?: number[];
    transcript?: string;
    isTranscribed?: boolean;
    language?: string;
  };
  videoCall?: {
    callId?: string;
    status?: 'initiated' | 'accepted' | 'rejected' | 'ended' | 'missed';
    startedAt?: Date;
    endedAt?: Date;
    duration?: number;
  };
}

export interface MessageDocument extends IMessage, Document {
  _id: Types.ObjectId;
  markAsRead(timestamp?: Date): void;
}

export interface MessageModel extends Model<MessageDocument> {
  getMessagesForMatch(matchId: string, limit?: number, skip?: number): Promise<MessageDocument[]>;
  markMatchAsRead(matchId: string, userId: string): Promise<{ modifiedCount: number }>;
  getUnreadCount(userId: string): Promise<number>;
}

export interface IConversation {
  matchId: Types.ObjectId;
  otherUser: {
    _id: Types.ObjectId;
    name: string;
    photos: IPhoto[];
    lastActive?: Date;
  };
  lastMessage?: IMessage;
  unreadCount: number;
}

// ============================================================
// Notification Types
// ============================================================

export interface INotification {
  userId: Types.ObjectId;
  type: 'match' | 'message' | 'like' | 'superlike' | 'profile_view' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  read?: boolean;
  createdAt?: Date;
}

export interface NotificationDocument extends INotification, Document {
  _id: Types.ObjectId;
}

// ============================================================
// Discovery Types
// ============================================================

export interface DiscoveryOptions {
  excludeIds?: (string | Types.ObjectId)[];
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female' | 'other' | 'any';
  radius?: number;
  sortBy?: 'recentActivity' | 'distance' | 'compatibility';
  limit?: number;
  skip?: number;
}

export interface DiscoveryResult {
  user: UserDocument;
  distance: number;
  compatibilityScore?: number;
}

// ============================================================
// Payment Types
// ============================================================

export interface IPayment {
  userId: Types.ObjectId;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  productType: 'subscription' | 'boost' | 'superlike_pack';
  productId?: string;
  createdAt?: Date;
}

export interface PaymentDocument extends IPayment, Document {
  _id: Types.ObjectId;
}

// ============================================================
// Analytics Types
// ============================================================

export interface IMetrics {
  dau: number;
  wau: number;
  mau: number;
  matchRate: number;
  messageResponseRate: number;
  premiumConversionRate: number;
  retention: {
    d1: number;
    d7: number;
    d30: number;
  };
}

export interface ITimeRange {
  startDate: Date;
  endDate: Date;
}

// ============================================================
// Rate Limiting Types
// ============================================================

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  onLimitReached?: (req: Request, res: Response) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// ============================================================
// Validation Types
// ============================================================

export interface ValidationSchema {
  [field: string]: {
    in?: ('body' | 'query' | 'params')[];
    optional?: boolean;
    isEmail?: { errorMessage?: string };
    isLength?: { options?: { min?: number; max?: number }; errorMessage?: string };
    isInt?: { options?: { min?: number; max?: number }; errorMessage?: string };
    isFloat?: { options?: { min?: number; max?: number }; errorMessage?: string };
    isIn?: { options?: any[][]; errorMessage?: string };
    isMongoId?: { errorMessage?: string };
    isURL?: { errorMessage?: string };
    isArray?: { options?: { min?: number; max?: number }; errorMessage?: string };
    isString?: boolean;
    notEmpty?: { errorMessage?: string };
    matches?: { options?: RegExp; errorMessage?: string };
    trim?: boolean;
    normalizeEmail?: boolean;
    toInt?: boolean;
    toFloat?: boolean;
  };
}

// ============================================================
// Service Types
// ============================================================

// Additional Model Types with Custom Methods

export interface IUserActivity {
  userId: Types.ObjectId;
  activityType:
    | 'login'
    | 'logout'
    | 'swipe'
    | 'match'
    | 'message'
    | 'profile_view'
    | 'profile_update'
    | 'super_like'
    | 'video_call';
  metadata?: any;
  relatedUserId?: Types.ObjectId;
  createdAt?: Date;
}

export interface UserActivityDocument extends IUserActivity, Document {
  _id: Types.ObjectId;
}

export interface UserActivityModel extends Model<UserActivityDocument> {
  getRecentlyActiveUsers(hours?: number, limit?: number): Promise<Types.ObjectId[]>;
  logActivity(userId: string, activityType: string, metadata?: any): Promise<UserActivityDocument>;
  getUserRecentActivity(
    userId: string,
    limit?: number,
    days?: number
  ): Promise<UserActivityDocument[]>;
  getActivitySummary(userId: string, days?: number): Promise<any>;
}

export interface IBoostProfile {
  userId: Types.ObjectId;
  tier: 'free' | 'vip';
  startedAt: Date;
  endsAt: Date;
  durationMinutes: number;
  visibilityMultiplier: number;
  impressions: number;
  isActive: boolean;
  createdAt?: Date;
}

export interface BoostProfileDocument extends IBoostProfile, Document {
  _id: Types.ObjectId;
  deactivate(): void;
  checkActive(): boolean;
}

export interface BoostProfileModel extends Model<BoostProfileDocument> {
  getRemainingForToday(userId: string): Promise<number>;
  getActiveBoost(userId: string): Promise<BoostProfileDocument | null>;
  deactivateExpired(): Promise<any>;
}

export interface ISuperLike {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  message?: string;
  isViewed: boolean;
  viewedAt?: Date;
  createdAt?: Date;
}

export interface SuperLikeDocument extends ISuperLike, Document {
  _id: Types.ObjectId;
}

export interface SuperLikeModel extends Model<SuperLikeDocument> {
  getRemainingForToday(userId: string): Promise<number>;
}

export interface IRewind {
  userId: Types.ObjectId;
  originalSwipeId: Types.ObjectId;
  swipedUserId: Types.ObjectId;
  originalAction: 'like' | 'pass' | 'superlike';
  success: boolean;
  createdAt?: Date;
}

export interface RewindDocument extends IRewind, Document {
  _id: Types.ObjectId;
}

export interface RewindModel extends Model<RewindDocument> {
  getRemainingForToday(userId: string): Promise<number>;
  getTotalRewindCount(userId: string): Promise<number>;
}

export interface ITopPicks {
  forUserId: Types.ObjectId;
  userId: Types.ObjectId;
  compatibilityScore: number;
  scoreBreakdown?: any;
  algorithmVersion: string;
  calculatedAt: Date;
  isSeen: boolean;
  seenAt?: Date;
  isActive: boolean;
  rankPosition: number;
}

export interface TopPicksDocument extends ITopPicks, Document {
  _id: Types.ObjectId;
  markAsSeen(): void;
}

export interface TopPicksModel extends Model<TopPicksDocument> {
  getTopPicksForUser(userId: string, limit?: number): Promise<TopPicksDocument[]>;
  recalculateForUser(userId: string): Promise<void>;
}

export interface ISubscriptionTier {
  name: string;
  tier: 'free' | 'gold' | 'platinum' | 'unlimited';
  displayName: string;
  description: string;
  pricing: {
    monthly: number;
    quarterly?: number;
    annual?: number;
  };
  features: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
}

export interface SubscriptionTierDocument extends ISubscriptionTier, Document {
  _id: Types.ObjectId;
  hasFeature(featureName: string): boolean;
  getFeatureValue(featureName: string): any;
}

export interface SubscriptionTierModel extends Model<SubscriptionTierDocument> {
  getActiveTiers(): Promise<SubscriptionTierDocument[]>;
  getTierById(tierId: string): Promise<SubscriptionTierDocument | null>;
  compareTiers(tier1Id: string, tier2Id: string): Promise<number>;
  initializeDefaultTiers(): Promise<void>;
}

export interface ISubscription {
  userId: Types.ObjectId;
  tierId?: Types.ObjectId;
  tier: 'free' | 'gold' | 'platinum' | 'unlimited';
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trial';
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  trialUsed: boolean;
  trialEndsAt?: Date;
  planType?: string;
  paymentMethod?: string;
  paymentId?: string;
  transactionId?: string;
  features?: any;
  superLikesUsedToday?: number;
  profileBoostsUsedThisMonth?: number;
  trial?: {
    startDate?: Date;
    endDate?: Date;
    isUsed?: boolean;
  };
}

export interface SubscriptionDocument extends ISubscription, Document {
  _id: Types.ObjectId;
  isTrialAvailable(): boolean;
  hasFeature(featureName: string): Promise<boolean>;
  isActive?: boolean;
  success?: boolean;
  message?: string;
  subscription?: any;
}

export interface SubscriptionModel extends Model<SubscriptionDocument> {
  getOrCreate(userId: string): Promise<SubscriptionDocument>;
  activateTrial(userId: string): Promise<SubscriptionDocument>;
  upgradeToPremium(
    userId: string,
    planType: string,
    paymentData?: any
  ): Promise<SubscriptionDocument>;
  cancelSubscription(userId: string): Promise<SubscriptionDocument>;
}

export interface IPaymentTransaction {
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  provider: 'stripe' | 'apple' | 'google';
  providerTransactionId: string;
  productType: 'subscription' | 'boost' | 'superlike' | 'rewind';
  productId?: string;
  status: 'pending' | 'completed' | 'expired' | 'failed' | 'refunded' | 'partial_refund';
  failureReason?: string;
  failureCode?: string;
  metadata?: any;
  refundStatus?: 'none' | 'pending' | 'partial_refund' | 'refunded' | 'denied';
  refundAmount?: number;
  refundReason?: string;
  refundRequestedAt?: Date;
  refundedAt?: Date;
  refundId?: string;
  createdAt?: Date;
  completedAt?: Date;
}

export interface PaymentTransactionDocument extends IPaymentTransaction, Document {
  _id: Types.ObjectId;
  markCompleted(additionalData?: any): void;
  markFailed(reason: string, code?: string): void;
  processRefund(refundAmount: number, refundId: string, reason?: string): void;
}

export interface PaymentTransactionModel extends Model<PaymentTransactionDocument> {
  getUserTransactions(userId: string, options?: any): Promise<PaymentTransactionDocument[]>;
  findByProviderId(
    provider: string,
    providerTransactionId: string
  ): Promise<PaymentTransactionDocument | null>;
  getUserTotalSpend(userId: string): Promise<number>;
  getRevenueAnalytics(startDate: Date, endDate: Date): Promise<any>;
  getRefundStats(startDate: Date, endDate: Date): Promise<any>;
}

// ============================================================
// Service Types
// ============================================================

export interface IEmailService {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
  sendVerificationEmail(email: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string): Promise<boolean>;
  sendMatchNotification(email: string, matchedUserName: string): Promise<boolean>;
}

export interface INotificationService {
  send(userId: string, notification: Partial<INotification>): Promise<boolean>;
  sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean>;
  sendBulk(
    userIds: string[],
    notification: Partial<INotification>
  ): Promise<{ sent: number; failed: number }>;
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, ttl?: number): Promise<number>;
}

// ============================================================
// Error Types
// ============================================================

export interface AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
}

export class NotFoundError extends Error implements AppError {
  statusCode: 404;
  status: 'fail';
  isOperational: true;
}

export class ValidationError extends Error implements AppError {
  statusCode: 400;
  status: 'fail';
  isOperational: true;
}

export class UnauthorizedError extends Error implements AppError {
  statusCode: 401;
  status: 'fail';
  isOperational: true;
}

// ============================================================
// Middleware Types
// ============================================================

export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export type RequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Response | Promise<void | Response>;

export type ErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Response;

// ============================================================
// Socket Types
// ============================================================

export interface SocketUser {
  id: string;
  socketId: string;
  userId: string;
  rooms: string[];
}

export interface ChatEvent {
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
}

export interface TypingEvent {
  matchId: string;
  userId: string;
  isTyping: boolean;
}

export interface OnlineStatusEvent {
  userId: string;
  isOnline: boolean;
  lastActive?: Date;
}

// ============================================================
// Additional Model Types
// ============================================================

export interface IAchievementBadge {
  userId: Types.ObjectId;
  badgeType: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  isUnlocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AchievementBadgeDocument extends IAchievementBadge, Document {
  _id: Types.ObjectId;
}

export interface AchievementBadgeModel extends Model<AchievementBadgeDocument> {
  findByUserId(userId: string): Promise<AchievementBadgeDocument[]>;
  findByBadgeType(badgeType: string): Promise<AchievementBadgeDocument[]>;
}

export interface IBlock {
  blockerId: Types.ObjectId;
  blockedUserId: Types.ObjectId;
  reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BlockDocument extends IBlock, Document {
  _id: Types.ObjectId;
}

export interface BlockModel extends Model<BlockDocument> {
  findBlockedUsers(userId: string): Promise<BlockDocument[]>;
  findBlockers(userId: string): Promise<BlockDocument[]>;
  isBlocked(blockerId: string, blockedUserId: string): Promise<boolean>;
}

export interface IDailyReward {
  userId: Types.ObjectId;
  rewardDate: Date;
  rewardType: 'login' | 'swipe' | 'match' | 'message' | 'profile_view';
  rewardValue: number;
  rewardDescription: string;
  isClaimed: boolean;
  claimedAt?: Date;
  expiresAt: Date;
  loginStreak?: number;
  bonusMultiplier?: number;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DailyRewardDocument extends IDailyReward, Document {
  _id: Types.ObjectId;
}

export interface DailyRewardModel extends Model<DailyRewardDocument> {
  getTodayReward(userId: string): Promise<DailyRewardDocument | null>;
  claimReward(rewardId: string): Promise<DailyRewardDocument>;
}

export interface IEvent {
  organizerId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  location: ILocation;
  locationName?: string;
  startDate: Date;
  endDate?: Date;
  maxAttendees?: number;
  currentAttendees?: number;
  isPublic: boolean;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  tags?: string[];
  coverImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventDocument extends IEvent, Document {
  _id: Types.ObjectId;
}

export interface EventModel extends Model<EventDocument> {
  findNearbyEvents(longitude: number, latitude: number, radius: number): Promise<EventDocument[]>;
  getUpcomingEvents(limit?: number): Promise<EventDocument[]>;
}

export interface IFriendReview {
  reviewerId: Types.ObjectId;
  reviewedUserId: Types.ObjectId;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FriendReviewDocument extends IFriendReview, Document {
  _id: Types.ObjectId;
}

export interface FriendReviewModel extends Model<FriendReviewDocument> {
  getReviewsForUser(userId: string): Promise<FriendReviewDocument[]>;
  getAverageRating(userId: string): Promise<number>;
}

export interface IGroupDate {
  organizerId: Types.ObjectId;
  title: string;
  description: string;
  location: ILocation;
  locationName?: string;
  dateTime: Date;
  maxParticipants?: number;
  currentParticipants?: number;
  category?: string;
  isPublic: boolean;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GroupDateDocument extends IGroupDate, Document {
  _id: Types.ObjectId;
}

export interface GroupDateModel extends Model<GroupDateDocument> {
  findNearbyGroupDates(
    longitude: number,
    latitude: number,
    radius: number
  ): Promise<GroupDateDocument[]>;
  getUpcomingGroupDates(limit?: number): Promise<GroupDateDocument[]>;
}

export interface IReport {
  reporterId: Types.ObjectId;
  reportedUserId: Types.ObjectId;
  reportType: 'inappropriate_content' | 'harassment' | 'spam' | 'fake_profile' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportDocument extends IReport, Document {
  _id: Types.ObjectId;
}

export interface ReportModel extends Model<ReportDocument> {
  getPendingReports(): Promise<ReportDocument[]>;
  getReportsForUser(userId: string): Promise<ReportDocument[]>;
}

export interface ISharedProfile {
  sharerId: Types.ObjectId;
  sharedWithId: Types.ObjectId;
  profileUserId: Types.ObjectId;
  message?: string;
  isViewed: boolean;
  viewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SharedProfileDocument extends ISharedProfile, Document {
  _id: Types.ObjectId;
}

export interface SharedProfileModel extends Model<SharedProfileDocument> {
  getSharedProfilesForUser(userId: string): Promise<SharedProfileDocument[]>;
  markAsViewed(shareId: string): Promise<SharedProfileDocument>;
}

export interface ISwipeStreak {
  userId: Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastSwipeDate: Date;
  streakStartDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SwipeStreakDocument extends ISwipeStreak, Document {
  _id: Types.ObjectId;
}

export interface SwipeStreakModel extends Model<SwipeStreakDocument> {
  getOrCreateStreak(userId: string): Promise<SwipeStreakDocument>;
  updateStreak(userId: string): Promise<SwipeStreakDocument>;
  getTopStreaks(limit?: number): Promise<SwipeStreakDocument[]>;
}

// ============================================================
// Performance Metric Types
// ============================================================

export interface IPerformanceMetric {
  type: 'api_request' | 'database_query' | 'cache_operation' | 'external_api_call';
  endpoint: string;
  method: string;
  duration: number;
  statusCode?: number;
  userId?: Types.ObjectId;
  isSlow: boolean;
  isVerySlow: boolean;
  isError: boolean;
  timestamp: Date;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PerformanceMetricDocument extends IPerformanceMetric, Document {
  _id: Types.ObjectId;
}

export interface PerformanceMetricModel extends Model<PerformanceMetricDocument> {
  getSlowRequests(
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<PerformanceMetricDocument[]>;
  getSlowQueries(
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<PerformanceMetricDocument[]>;
  getPerformanceSummary(
    startDate: Date,
    endDate: Date,
    groupBy?: string
  ): Promise<any[]>;
  getAverageResponseTimes(
    startDate: Date,
    endDate: Date
  ): Promise<any[]>;
}
