import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Swipe } from '../models/Swipe';
import logger from '../utils/logger';
import { NotificationService } from './NotificationService';

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

      // Check swipe limit for free users
      const limitCheck = await this.checkSwipeLimit(swiperId, isPremium);
      if (!limitCheck.canSwipe) {
        return {
          success: false,
          error: 'Daily swipe limit reached',
          limitExceeded: true,
          remaining: limitCheck.remaining,
        };
      }

      // Check if swipe already exists
      const existingSwipe = await this.getSwipe(swiperId, targetId);
      if (existingSwipe) {
        return {
          success: false,
          error: 'Swipe already exists',
        };
      }

      // Create and save swipe
      const swipe = new Swipe(swiperId, targetId, type);
      const swipeData = {
        ...swipe.toFirestore(),
        createdAt: serverTimestamp(),
      };

      const swipeRef = await addDoc(collection(db, 'swipes'), swipeData);

      // Increment swipe counter
      await this.incrementSwipeCounter(swiperId);

      // Update user's swipedUsers array for backward compatibility
      await this.updateUserSwipedList(swiperId, targetId);

      // If it's a like, check for mutual like
      if (type === 'like') {
        const matchResult = await this.checkAndCreateMatch(swiperId, targetId);

        return {
          success: true,
          swipeId: swipeRef.id,
          match: matchResult.isMatch,
          matchId: matchResult.matchId || null,
        };
      }

      // For dislikes, just return success
      return {
        success: true,
        swipeId: swipeRef.id,
        match: false,
        matchId: null,
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
   * Checks if target user has also liked the swiper, and creates a match if so
   * @param {string} swiperId - User ID who just swiped
   * @param {string} targetId - User ID who was swiped on
   * @returns {Promise<Object>} Object with isMatch boolean and matchId if matched
   */
  static async checkAndCreateMatch(swiperId, targetId) {
    try {
      // Check if target has liked the swiper
      const targetSwipe = await this.getSwipe(targetId, swiperId);

      if (targetSwipe && targetSwipe.type === 'like') {
        // Mutual like detected - create a match
        const matchId = await this.createMatch(swiperId, targetId);

        // Update both users' matches arrays for backward compatibility
        await this.updateUserMatches(swiperId, targetId);

        // Send notification to the target user
        try {
          const swiperDoc = await getDoc(doc(db, 'users', swiperId));
          const swiperName = swiperDoc.data()?.name || 'Someone';
          await NotificationService.sendMatchNotification(targetId, swiperName);
        } catch (notifError) {
          logger.error('Error sending match notification', notifError, { targetId, swiperId });
          // Don't fail the match creation if notification fails
        }

        return {
          isMatch: true,
          matchId: matchId,
        };
      }

      return {
        isMatch: false,
        matchId: null,
      };
    } catch (error) {
      logger.error('Error checking for match', error, { swiperId, targetId });
      return {
        isMatch: false,
        matchId: null,
      };
    }
  }

  /**
   * Creates a match record in the matches collection
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<string>} Match document ID
   */
  static async createMatch(userId1, userId2) {
    try {
      // Create a consistent match ID (sorted user IDs to avoid duplicates)
      const sortedIds = [userId1, userId2].sort();
      const matchId = `${sortedIds[0]}_${sortedIds[1]}`;

      // Check if match already exists
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);

      if (matchDoc.exists()) {
        return matchId;
      }

      // Create new match
      const matchData = {
        user1: sortedIds[0],
        user2: sortedIds[1],
        createdAt: serverTimestamp(),
        lastMessageAt: null,
        lastMessage: null,
      };

      await setDoc(matchRef, matchData);

      return matchId;
    } catch (error) {
      logger.error('Error creating match', error, { userId1, userId2 });
      throw error;
    }
  }

  /**
   * Gets a swipe between two users
   * @param {string} swiperId - User ID of the swiper
   * @param {string} targetId - User ID of the target
   * @returns {Promise<Swipe|null>} Swipe object or null if not found
   */
  static async getSwipe(swiperId, targetId) {
    try {
      const q = query(
        collection(db, 'swipes'),
        where('swiper', '==', swiperId),
        where('target', '==', targetId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      if (!doc) {
        return null;
      }
      return Swipe.fromFirestore(doc.id, doc.data());
    } catch (error) {
      logger.error('Error getting swipe', error, { swiperId, targetId });
      return null;
    }
  }

  /**
   * Gets all swipes by a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<Swipe>>} Array of Swipe objects
   */
  static async getUserSwipes(userId) {
    try {
      const q = query(collection(db, 'swipes'), where('swiper', '==', userId));

      const querySnapshot = await getDocs(q);
      const swipes = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        if (docData) {
          swipes.push(Swipe.fromFirestore(doc.id, docData));
        }
      });

      return swipes;
    } catch (error) {
      logger.error('Error getting user swipes', error, { userId });
      return [];
    }
  }

  /**
   * Gets all swipes received by a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<Swipe>>} Array of Swipe objects
   */
  static async getReceivedSwipes(userId) {
    try {
      const q = query(collection(db, 'swipes'), where('target', '==', userId));

      const querySnapshot = await getDocs(q);
      const swipes = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        if (docData) {
          swipes.push(Swipe.fromFirestore(doc.id, docData));
        }
      });

      return swipes;
    } catch (error) {
      logger.error('Error getting received swipes', error, { userId });
      return [];
    }
  }

  /**
   * Updates user's swipedUsers array for backward compatibility
   * @param {string} userId - User ID
   * @param {string} swipedUserId - ID of user that was swiped on
   * @private
   */
  static async updateUserSwipedList(userId, swipedUserId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const swipedUsers = userDoc.data()?.swipedUsers || [];

      if (!swipedUsers.includes(swipedUserId)) {
        await setDoc(
          userRef,
          {
            swipedUsers: [...swipedUsers, swipedUserId],
          },
          { merge: true }
        );
      }
    } catch (error) {
      logger.error('Error updating user swiped list', error, { userId, swipedUserId });
    }
  }

  /**
   * Updates both users' matches arrays for backward compatibility
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @private
   */
  static async updateUserMatches(userId1, userId2) {
    try {
      const user1Ref = doc(db, 'users', userId1);
      const user2Ref = doc(db, 'users', userId2);

      const [user1Doc, user2Doc] = await Promise.all([getDoc(user1Ref), getDoc(user2Ref)]);

      const user1Matches = user1Doc.data()?.matches || [];
      const user2Matches = user2Doc.data()?.matches || [];

      const updates = [];

      if (!user1Matches.includes(userId2)) {
        updates.push(
          setDoc(
            user1Ref,
            {
              matches: [...user1Matches, userId2],
            },
            { merge: true }
          )
        );
      }

      if (!user2Matches.includes(userId1)) {
        updates.push(
          setDoc(
            user2Ref,
            {
              matches: [...user2Matches, userId1],
            },
            { merge: true }
          )
        );
      }

      await Promise.all(updates);
    } catch (error) {
      logger.error('Error updating user matches', error, { userId1, userId2 });
    }
  }

  /**
   * Gets swipe count for today for a user (freemium feature)
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of swipes made today
   */
  static async getSwipesCountToday(userId) {
    try {
      // Use backend API instead of direct Firebase call
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const { API_URL } = await import('../config/api');
      const authToken = await AsyncStorage.getItem('authToken');

      if (!authToken) {
        logger.warn('No auth token for getSwipesCountToday, returning 0');
        return 0;
      }

      const response = await fetch(`${API_URL}/swipes/count/today`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        logger.warn('Failed to get swipes count from API, returning 0');
        return 0;
      }

      const data = await response.json();
      return data.data?.count || 0;
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
   * @param {string} userId - User ID
   * @private
   */
  static async incrementSwipeCounter(userId) {
    try {
      const swipesCount = await this.getSwipesCountToday(userId);
      const today = new Date().toDateString();

      await setDoc(
        doc(db, 'users', userId),
        {
          swipesToday: swipesCount + 1,
          lastSwipeDate: today,
        },
        { merge: true }
      );
    } catch (error) {
      logger.error('Error incrementing swipe counter', error, { userId });
    }
  }

  /**
   * Undoes the last swipe for a user
   * @param {string} userId - User ID
   * @param {string} swipeId - ID of the swipe document to undo
   * @returns {Promise<Object>} Result object with success status
   */
  static async undoSwipe(userId, swipeId) {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'swipes', swipeId));

      // Decrement swipe counter
      const swipesCount = await this.getSwipesCountToday(userId);
      if (swipesCount > 0) {
        const today = new Date().toDateString();
        await setDoc(
          doc(db, 'users', userId),
          {
            swipesToday: swipesCount - 1,
            lastSwipeDate: today,
          },
          { merge: true }
        );
      }

      return {
        success: true,
        message: 'Swipe undone successfully',
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
   */
  static async getLastSwipe(userId) {
    try {
      const q = query(collection(db, 'swipes'), where('swiper', '==', userId));

      const querySnapshot = await getDocs(q);
      let lastSwipe = null;
      let lastTimestamp = null;

      querySnapshot.forEach((doc) => {
        const swipe = doc.data();
        if (swipe) {
          const timestamp = swipe.createdAt?.toMillis?.() || 0;
          if (timestamp > (lastTimestamp || 0)) {
            lastSwipe = { id: doc.id, ...swipe };
            lastTimestamp = timestamp;
          }
        }
      });

      return lastSwipe;
    } catch (error) {
      logger.error('Error getting last swipe', error, { userId });
      return null;
    }
  }
  /**
   * Unmatch with another user
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object>} Result object with success status
   */
  static async unmatch(userId1, userId2) {
    try {
      const { deleteDoc } = await import('firebase/firestore');

      // Delete the match document
      const sortedIds = [userId1, userId2].sort();
      const matchId = `${sortedIds[0]}_${sortedIds[1]}`;

      await deleteDoc(doc(db, 'matches', matchId));

      // Remove from both users' matches arrays
      const updates = [];

      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(doc(db, 'users', userId1)),
        getDoc(doc(db, 'users', userId2)),
      ]);

      const user1Matches = user1Doc.data()?.matches || [];
      const user2Matches = user2Doc.data()?.matches || [];

      if (user1Matches.includes(userId2)) {
        updates.push(
          setDoc(
            doc(db, 'users', userId1),
            {
              matches: user1Matches.filter((id) => id !== userId2),
            },
            { merge: true }
          )
        );
      }

      if (user2Matches.includes(userId1)) {
        updates.push(
          setDoc(
            doc(db, 'users', userId2),
            {
              matches: user2Matches.filter((id) => id !== userId1),
            },
            { merge: true }
          )
        );
      }

      await Promise.all(updates);

      return {
        success: true,
        message: 'Match deleted successfully',
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
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return [];
      }
      const userData = userDoc.data();
      if (!userData) {
        return [];
      }
      const matchIds = userData.matches || [];

      const matches = [];

      for (const matchedUserId of matchIds) {
        try {
          const matchedUserDoc = await getDoc(doc(db, 'users', matchedUserId));
          if (matchedUserDoc.exists()) {
            const sortedIds = [userId, matchedUserId].sort();
            const matchId = `${sortedIds[0]}_${sortedIds[1]}`;
            const matchDoc = await getDoc(doc(db, 'matches', matchId));
            const matchData = matchDoc.data() || {};
            const matchedUserData = matchedUserDoc.data();
            if (matchedUserData) {
              matches.push({
                id: matchId,
                userId: matchedUserId,
                user: {
                  id: matchedUserId,
                  name: matchedUserData.name,
                  photoURL: matchedUserData.photoURL,
                  age: matchedUserData.age,
                },
                createdAt: matchData.createdAt,
                isExpired: this.isMatchExpired(matchData),
              });
            }
          }
        } catch (error) {
          logger.error('Error getting match details', error, { userId, matchedUserId });
        }
      }

      return matches;
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
