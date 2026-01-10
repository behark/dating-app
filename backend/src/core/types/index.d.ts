/**
 * Mongoose Model Type Definitions
 * Type definitions for domain models used in JSDoc annotations
 */

import { Document, Model, Types } from 'mongoose';

// Base document interface with common fields
interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface UserDocument extends BaseDocument {
  email: string;
  password?: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  photos: Array<{
    url: string;
    isMain?: boolean;
    order?: number;
    moderationStatus?: string;
  }>;
  interests: string[];
  location?: {
    type: 'Point';
    coordinates: [number, number];
    city?: string;
    country?: string;
  };
  subscription?: {
    tier: string;
    status: string;
    startDate?: Date;
    endDate?: Date;
  };
  isActive?: boolean;
  isVerified?: boolean;
  lastActive?: Date;
  points?: number;
}

export interface UserModel extends Model<UserDocument> {
  findNearby(longitude: number, latitude: number, maxDistance: number, options?: object): Promise<UserDocument[]>;
}

// Message types
export interface MessageDocument extends BaseDocument {
  matchId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'gif' | 'audio' | 'video';
  isRead: boolean;
  readAt?: Date;
  reactions: Array<{
    userId: Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  markAsRead(timestamp?: Date): void;
  addReaction(userId: string, emoji: string): void;
  removeReaction(userId: string, emoji: string): void;
}

export interface MessageModel extends Model<MessageDocument> {
  getMessagesForMatch(matchId: string, limit?: number, skip?: number): Promise<MessageDocument[]>;
  getUnreadCount(userId: string): Promise<number>;
  markMatchAsRead(matchId: string, userId: string): Promise<any>;
}

// Match types
export interface MatchDocument extends BaseDocument {
  users: Types.ObjectId[];
  status: 'active' | 'unmatched' | 'blocked';
  conversationStarted: boolean;
  conversationStartedBy?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  matchedAt: Date;
  markConversationStarted(messageBy: string): Promise<void>;
}

export interface MatchModel extends Model<MatchDocument> {
  matchExists(userId1: string, userId2: string): Promise<boolean>;
  createMatch(userId1: string, userId2: string, swipeId1?: string, swipeId2?: string): Promise<MatchDocument>;
  getUserMatches(userId: string, options?: object): Promise<MatchDocument[]>;
  unmatch(matchId: string, userId: string): Promise<MatchDocument | null>;
  getMatchCount(userId: string, status?: string): Promise<number>;
}

// Swipe types
export interface SwipeDocument extends BaseDocument {
  swiperId: Types.ObjectId;
  swipedId: Types.ObjectId;
  action: 'like' | 'pass' | 'superlike';
  isSuperLike: boolean;
  matchId?: Types.ObjectId;
}

export interface SwipeModel extends Model<SwipeDocument> {
  hasSwipedBefore(swiperId: string, swipedId: string): Promise<boolean>;
  checkForMatch(swiperId: string, swipedId: string): Promise<SwipeDocument | null>;
}

// Subscription types
export interface SubscriptionDocument extends BaseDocument {
  userId: Types.ObjectId;
  tier: 'free' | 'gold' | 'platinum' | 'unlimited';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  startDate: Date;
  endDate?: Date;
  trialUsed: boolean;
  stripeSubscriptionId?: string;
  hasFeature(featureName: string): boolean;
}

export interface SubscriptionModel extends Model<SubscriptionDocument> {
  getOrCreate(userId: string): Promise<SubscriptionDocument>;
  activateTrial(userId: string): Promise<{ success: boolean; message?: string; subscription?: SubscriptionDocument }>;
  upgradeSubscription(userId: string, planType: string, paymentData: any): Promise<{ success: boolean; subscription?: SubscriptionDocument }>;
  cancelSubscription(userId: string): Promise<{ success: boolean; subscription?: SubscriptionDocument }>;
}

// Block types
export interface BlockDocument extends BaseDocument {
  blockerId: Types.ObjectId;
  blockedUserId: Types.ObjectId;
  reason?: string;
}

export interface BlockModel extends Model<BlockDocument> { }

// Report types
export interface ReportDocument extends BaseDocument {
  reporterId: Types.ObjectId;
  reportedUserId: Types.ObjectId;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface ReportModel extends Model<ReportDocument> { }

// Event types
export interface EventDocument extends BaseDocument {
  creatorId: Types.ObjectId;
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  startDate: Date;
  endDate?: Date;
  maxAttendees?: number;
  attendees: Types.ObjectId[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface EventModel extends Model<EventDocument> { }

// GroupDate types
export interface GroupDateDocument extends BaseDocument {
  creatorId: Types.ObjectId;
  title: string;
  description: string;
  participants: Types.ObjectId[];
  maxParticipants: number;
  status: 'open' | 'full' | 'completed' | 'cancelled';
}

export interface GroupDateModel extends Model<GroupDateDocument> { }

// BoostProfile types
export interface BoostProfileDocument extends BaseDocument {
  userId: Types.ObjectId;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  boostMultiplier: number;
  deactivate(): Promise<BoostProfileDocument>;
  checkActive(): boolean;
}

export interface BoostProfileModel extends Model<BoostProfileDocument> { }

// SharedProfile types
export interface SharedProfileDocument extends BaseDocument {
  userId: Types.ObjectId;
  shareCode: string;
  expiresAt: Date;
  viewCount: number;
}

export interface SharedProfileModel extends Model<SharedProfileDocument> { }

// AchievementBadge types
export interface AchievementBadgeDocument extends BaseDocument {
  userId: Types.ObjectId;
  badgeType: string;
  unlockedAt: Date;
  progress?: number;
}

export interface AchievementBadgeModel extends Model<AchievementBadgeDocument> { }

// DailyReward types
export interface DailyRewardDocument extends BaseDocument {
  userId: Types.ObjectId;
  rewardType: string;
  rewardValue: number;
  isClaimed: boolean;
  claimedAt?: Date;
  expiresAt: Date;
}

export interface DailyRewardModel extends Model<DailyRewardDocument> { }

// FriendReview types
export interface FriendReviewDocument extends BaseDocument {
  reviewerId: Types.ObjectId;
  reviewedUserId: Types.ObjectId;
  rating: number;
  comment?: string;
}

export interface FriendReviewModel extends Model<FriendReviewDocument> { }

// SubscriptionTier types
export interface SubscriptionTierDocument extends BaseDocument {
  name: string;
  tier: 'free' | 'gold' | 'platinum' | 'unlimited';
  price: number;
  features: string[];
  limits: Record<string, number>;
}

export interface SubscriptionTierModel extends Model<SubscriptionTierDocument> { }

// Notification types
export interface NotificationDocument extends BaseDocument {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
}

export interface NotificationModel extends Model<NotificationDocument> { }

// PaymentTransaction types
export interface PaymentTransactionDocument extends BaseDocument {
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: 'stripe' | 'paypal' | 'apple' | 'google';
  providerId?: string;
}

export interface PaymentTransactionModel extends Model<PaymentTransactionDocument> { }
