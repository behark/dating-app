import { Swipe } from '../models/Swipe';
import logger from '../utils/logger';
import api from './api';

/**
 * SwipeController
 * Handles all swipe-related operations including saving swipes,
 * checking for mutual likes, and creating matches
 */
export class SwipeController {
  /**
   * Saves a swipe action and checks for mutual likes
   * @param {string} swiperId - User ID of the person who swiped
   * @param {string} targetId - User ID of the person being swiped on
   * @param {string} type - Type of swipe: 'like' or 'dislike'
   * @param {boolean} isPremium - Whether user has premium subscription
   * @returns {Promise<Object>} Result object with success status, match info, and matchId if matched
   */
  static async saveSwipe(swiperId, targetId, type, isPremium = false) {
    try {
      // Validate input
      const validation = Swipe.validate(swiperId, targetId, type);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Check swipe limit for free users (backend will also enforce this)
      const limitCheck = await this.checkSwipeLimit(swiperId, isPremium);
      if (!limitCheck.canSwipe) {
        return {
          success: false,
          error: 'Daily swipe limit reached',
          limitExceeded: true,
          remaining: limitCheck.remaining,
        };
      }

      // Use backend API to create swipe
      // Backend expects 'action' not 'type', and 'dislike' should be 'pass'
      const action = type === 'dislike' ? 'pass' : type; // Map 'dislike' to 'pass' for backend
      const response = await api.post('/swipes', {
        targetId,
        action, // 'like', 'pass', or 'superlike' (backend expects 'action' not 'type')
      });

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to save swipe',
          limitExceeded: response.error === 'SWIPE_LIMIT_EXCEEDED',
          remaining: response.data?.remaining || 0,
        };
      }

      // Backend handles match creation automatically
      return {
        success: true,
        swipeId: response.data?.swipeId || null,
        match: response.data?.isMatch || false,
        matchId: response.data?.matchId || null,
      };
    } catch (error) {
      logger.error('Error saving swipe', error, { swiperId, targetId, type });
      return {
        success: false,
        error: error.message || 'Failed to save swipe',
      };
    }
  }

  /**
   * Gets all swipes received by a user (who liked you)
   * @param {string} userId - User ID
   * @returns {Promise<Array<Swipe>>} Array of Swipe objects
   */
  static async getReceivedSwipes(userId) {
    try {
      const response = await api.get('/swipes/pending-likes');

      if (!response.success) {
        logger.error('Error getting received swipes', new Error(response.message), { userId });
        return [];
      }

      // Transform backend response to Swipe objects if needed
      const swipes = response.data?.pendingLikes || response.data || [];
      return swipes.map((swipeData) => {
        if (swipeData instanceof Swipe) {
          return swipeData;
        }
        // Convert backend format to Swipe object if needed
        return Swipe.fromFirestore(swipeData.id || swipeData.swipeId, {
          swiper: swipeData.swiperId || swipeData.userId,
          target: swipeData.targetId || userId,
          type: swipeData.type || 'like',
          createdAt: swipeData.createdAt,
        });
      });
    } catch (error) {
      logger.error('Error getting received swipes', error, { userId });
      return [];
    }
  }

  /**
   * Gets all swipes sent by a user (people you liked)
   * @param {string} userId - User ID
   * @returns {Promise<Array<Swipe>>} Array of Swipe objects
   */
  static async getSentSwipes(userId) {
    try {
      const response = await api.get('/swipes/user');

      if (!response.success) {
        logger.error('Error getting sent swipes', new Error(response.message), { userId });
        return [];
      }

      // Transform backend response to Swipe objects if needed
      const swipes = response.data?.swipes || response.data || [];
      // Filter to only show likes and superlikes (not passes)
      const likes = swipes.filter(
        (swipe) => swipe.action === 'like' || swipe.action === 'superlike'
      );
      
      return likes.map((swipeData) => {
        if (swipeData instanceof Swipe) {
          return swipeData;
        }
        // Convert backend format to Swipe object if needed
        // swipedId is populated with user data from backend
        const swipedUser = swipeData.swipedId || {};
        const userIdValue = swipedUser._id || swipedUser.id || swipeData.swipedId;
        
        return {
          id: swipeData._id || swipeData.id,
          swiper: userId,
          target: userIdValue,
          type: swipeData.action || 'like',
          createdAt: swipeData.createdAt,
          swiperInfo: {
            name: swipedUser.name || 'Unknown',
            photos: swipedUser.photos || [],
            photoURL: swipedUser.photoURL || swipedUser.photos?.[0]?.url,
            age: swipedUser.age,
          },
        };
      });
    } catch (error) {
      logger.error('Error getting sent swipes', error, { userId });
      return [];
    }
  }

  /**
   * Gets swipe count for today for a user (freemium feature)
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of swipes made today
   */
  static async getSwipesCountToday(userId) {
    try {
      // Use unified API client for consistency and error handling
      const response = await api.get('/swipes/count/today');
      if (!response) {
        logger.warn('No response from API for swipes count, returning 0');
        return 0;
      }
      if (response.success === false) {
        logger.warn('Failed to get swipes count from API', new Error(response.message));
        return 0;
      }
      const count = response.data?.count ?? response.count ?? 0;
      return Number.isFinite(count) ? count : 0;
    } catch (error) {
      logger.error('Error getting swipes count today', error, { userId });
      return 0;
    }
  }

  /**
   * Checks if user has reached daily swipe limit (50 for free users)
   * @param {string} userId - User ID
   * @param {boolean} isPremium - Whether user has premium subscription
   * @returns {Promise<Object>} Object with canSwipe boolean and remaining swipes
   */
  static async checkSwipeLimit(userId, isPremium = false) {
    try {
      if (isPremium) {
        // Premium users have unlimited swipes
        return {
          canSwipe: true,
          remaining: -1, // Unlimited
          isUnlimited: true,
        };
      }

      const swipesCount = await this.getSwipesCountToday(userId);
      const DAILY_SWIPE_LIMIT_FREE = 50;
      const remaining = Math.max(0, DAILY_SWIPE_LIMIT_FREE - swipesCount);

      return {
        canSwipe: swipesCount < DAILY_SWIPE_LIMIT_FREE,
        remaining: remaining,
        isUnlimited: false,
      };
    } catch (error) {
      logger.error('Error checking swipe limit', error, { userId, isPremium });
      return {
        canSwipe: true,
        remaining: -1,
        isUnlimited: false,
      };
    }
  }

  /**
   * Increments swipe counter for the day
   * @deprecated Backend now handles this automatically
   * @private
   */
  static async incrementSwipeCounter(userId) {
    // This method is deprecated - backend handles swipe counting
    logger.warn('incrementSwipeCounter is deprecated - backend handles this automatically');
  }

  /**
   * Undoes the last swipe for a user
   * @param {string} userId - User ID
   * @param {string} swipeId - ID of the swipe document to undo (optional, backend can find last swipe)
   * @returns {Promise<Object>} Result object with success status
   */
  static async undoSwipe(userId, swipeId = null) {
    try {
      const response = await api.post('/swipes/undo', {
        swipeId, // Optional - backend can find the last swipe if not provided
      });

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to undo swipe',
        };
      }

      return {
        success: true,
        message: response.message || 'Swipe undone successfully',
      };
    } catch (error) {
      logger.error('Error undoing swipe', error, { userId, swipeId });
      return {
        success: false,
        error: error.message || 'Failed to undo swipe',
      };
    }
  }

  /**
   * Gets the most recent swipe by a user (for undo functionality)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Most recent swipe or null
   * @deprecated Backend handles undo functionality automatically
   */
  static async getLastSwipe(userId) {
    // This method is deprecated - backend handles undo without needing to fetch last swipe
    logger.warn('getLastSwipe is deprecated - backend handles undo automatically');
    return null;
  }
  /**
   * Unmatch with another user
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object>} Result object with success status
   */
  static async unmatch(userId1, userId2) {
    try {
      // Create matchId in the same format as backend expects (sorted user IDs)
      const sortedIds = [userId1, userId2].sort();
      const matchId = `${sortedIds[0]}_${sortedIds[1]}`;

      const response = await api.delete(`/swipes/matches/${matchId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to unmatch',
        };
      }

      return {
        success: true,
        message: response.message || 'Match deleted successfully',
      };
    } catch (error) {
      logger.error('Error unmatching', error, { userId1, userId2 });
      return {
        success: false,
        error: error.message || 'Failed to unmatch',
      };
    }
  }

  /**
   * Gets all matches for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} Array of match objects with user details
   */
  static async getUserMatches(userId) {
    try {
      const response = await api.get('/swipes/matches');

      if (!response.success) {
        logger.error('Error getting user matches', new Error(response.message), { userId });
        return [];
      }

      // Transform backend response to match expected format
      const matches = response.data?.matches || response.data || [];
      return matches.map((match) => {
        // Handle different response formats
        const matchData = match.match || match;
        const userData = match.user || matchData.user || {};

        return {
          id: match.id || matchData.id || match.matchId,
          userId: userData.id || userData.userId,
          user: {
            id: userData.id || userData.userId,
            name: userData.name,
            photoURL: userData.photoURL || userData.photo,
            age: userData.age,
          },
          createdAt: matchData.createdAt || match.createdAt,
          isExpired: this.isMatchExpired(matchData || match),
        };
      });
    } catch (error) {
      logger.error('Error getting user matches', error, { userId });
      return [];
    }
  }

  /**
   * Checks if a match has expired (14 days by default)
   * @param {Object} matchData - Match document data
   * @param {number} expirationDays - Number of days before match expires (default 14)
   * @returns {boolean} True if match has expired
   */
  static isMatchExpired(matchData, expirationDays = 14) {
    if (!matchData.createdAt) return false;

    const createdDate = matchData.createdAt.toDate?.() || new Date(matchData.createdAt);
    const expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    return new Date() > expirationDate;
  }

  /**
   * Gets days remaining until a match expires
   * @param {Object} matchData - Match document data
   * @param {number} expirationDays - Number of days before match expires (default 14)
   * @returns {number} Days remaining (negative if already expired)
   */
  static getDaysUntilExpiration(matchData, expirationDays = 14) {
    if (!matchData.createdAt) return expirationDays;

    const createdDate = matchData.createdAt.toDate?.() || new Date(matchData.createdAt);
    const expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    const daysRemaining = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  }

  /**
   * Cleans up expired matches for a user
   * @param {string} userId - User ID
   * @param {number} expirationDays - Number of days before match expires (default 14)
   * @returns {Promise<Object>} Result object with count of removed matches
   */
  static async cleanupExpiredMatches(userId, expirationDays = 14) {
    try {
      const matches = await this.getUserMatches(userId);
      let removedCount = 0;

      for (const match of matches) {
        if (match.isExpired) {
          const result = await this.unmatch(userId, match.userId);
          if (result.success) {
            removedCount++;
          }
        }
      }

      return {
        success: true,
        removedCount: removedCount,
      };
    } catch (error) {
      logger.error('Error cleaning up expired matches', error, { userId, expirationDays });
      return {
        success: false,
        error: error.message,
        removedCount: 0,
      };
    }
  }
}
