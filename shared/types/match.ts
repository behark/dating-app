/**
 * Shared type definitions for Match and Swipe
 * These types match the backend Match/Swipe models and should be kept in sync
 */

/**
 * Swipe action types
 */
export type SwipeAction = 'like' | 'dislike' | 'superlike';

/**
 * Match type
 */
export type MatchType = 'regular' | 'superlike';

/**
 * Match status
 */
export type MatchStatus = 'active' | 'unmatched' | 'blocked';

/**
 * Swipe interface
 */
export interface ISwipe {
  _id?: string;
  swiperId: string;
  swipedId: string;
  action: SwipeAction;
  isMatch?: boolean;
  createdAt?: Date | string;
}

/**
 * Match interface
 */
export interface IMatch {
  _id?: string;
  users: string[];
  user1?: string;
  user2?: string;
  matchInitiator?: string;
  matchType?: MatchType;
  status?: MatchStatus;
  createdAt?: Date | string;
  lastActivity?: Date | string;
  conversationStarted?: boolean;
}

/**
 * Match with populated user data
 */
export interface IMatchWithUser extends IMatch {
  otherUser: {
    _id: string;
    name: string;
    age?: number;
    photos: Array<{
      url: string;
      isMain?: boolean;
    }>;
    bio?: string;
    interests?: string[];
    location?: {
      city?: string;
      country?: string;
    };
    lastActive?: Date | string;
    isOnline?: boolean;
    distance?: number;
  };
  unreadCount?: number;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: Date | string;
    type?: string;
  };
}

/**
 * Swipe payload for API
 */
export interface SwipePayload {
  swipedId: string;
  action: SwipeAction;
}

/**
 * Swipe result from API
 */
export interface SwipeResult {
  success: boolean;
  isMatch: boolean;
  match?: IMatch;
  message?: string;
}

/**
 * Match creation result
 */
export interface MatchCreationResult {
  match: IMatch;
  isNew: boolean;
  reactivated: boolean;
}

/**
 * Swipe limits
 */
export interface SwipeLimits {
  canSwipe: boolean;
  remaining?: number;
  used?: number;
  limit?: number;
  resetAt?: Date | string;
}

export type Swipe = ISwipe;
export type Match = IMatch;
export type MatchWithUser = IMatchWithUser;
