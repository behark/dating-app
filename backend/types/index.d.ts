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

export interface IUser {
  email: string;
  password?: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'non-binary' | 'prefer-not-to-say';
  bio?: string;
  photos: IPhoto[];
  interests: string[];
  location?: ILocation;
  locationPrivacy?: 'visible' | 'hidden' | 'visible_to_matches';
  subscription?: ISubscription;
  preferredAgeRange?: IAgeRange;
  preferredGender?: string;
  preferredDistance?: number;
  profileCompleteness?: number;
  lastActive?: Date;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: Date;
  phoneVerificationCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDocument extends IUser, Document {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
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
  url: string;
  isMain?: boolean;
  order?: number;
  status?: 'pending' | 'approved' | 'rejected';
  uploadedAt?: Date;
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ISubscription {
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
}

export interface IMatch {
  users: [Types.ObjectId, Types.ObjectId];
  createdAt?: Date;
  lastActivity?: Date;
  conversationStarted?: boolean;
}

export interface MatchDocument extends IMatch, Document {
  _id: Types.ObjectId;
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
  messageType?: 'text' | 'image' | 'gif' | 'voice' | 'video';
  mediaUrl?: string;
  createdAt?: Date;
}

export interface MessageDocument extends IMessage, Document {
  _id: Types.ObjectId;
}

export interface MessageModel extends Model<MessageDocument> {
  getMessagesForMatch(matchId: string, limit?: number, skip?: number): Promise<MessageDocument[]>;
  markMatchAsRead(matchId: string, userId: string): Promise<void>;
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
  preferredGender?: string;
  preferredDistance?: number;
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

export interface IEmailService {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
  sendVerificationEmail(email: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string): Promise<boolean>;
  sendMatchNotification(email: string, matchedUserName: string): Promise<boolean>;
}

export interface INotificationService {
  send(userId: string, notification: Partial<INotification>): Promise<boolean>;
  sendPush(userId: string, title: string, body: string, data?: Record<string, any>): Promise<boolean>;
  sendBulk(userIds: string[], notification: Partial<INotification>): Promise<{ sent: number; failed: number }>;
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
