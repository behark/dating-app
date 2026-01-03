import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Swipe } from '../models/Swipe';
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
   * @returns {Promise<Object>} Result object with success status, match info, and matchId if matched
   */
  static async saveSwipe(swiperId, targetId, type) {
    try {
      // Validate input
      const validation = Swipe.validate(swiperId, targetId, type);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
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
      console.error('Error saving swipe:', error);
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
          console.error('Error sending match notification:', notifError);
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
      console.error('Error checking for match:', error);
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
      console.error('Error creating match:', error);
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
      return Swipe.fromFirestore(doc.id, doc.data());
    } catch (error) {
      console.error('Error getting swipe:', error);
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
      const q = query(
        collection(db, 'swipes'),
        where('swiper', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const swipes = [];

      querySnapshot.forEach((doc) => {
        swipes.push(Swipe.fromFirestore(doc.id, doc.data()));
      });

      return swipes;
    } catch (error) {
      console.error('Error getting user swipes:', error);
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
      const q = query(
        collection(db, 'swipes'),
        where('target', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const swipes = [];

      querySnapshot.forEach((doc) => {
        swipes.push(Swipe.fromFirestore(doc.id, doc.data()));
      });

      return swipes;
    } catch (error) {
      console.error('Error getting received swipes:', error);
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
        await setDoc(userRef, {
          swipedUsers: [...swipedUsers, swipedUserId],
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating user swiped list:', error);
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

      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(user1Ref),
        getDoc(user2Ref),
      ]);

      const user1Matches = user1Doc.data()?.matches || [];
      const user2Matches = user2Doc.data()?.matches || [];

      const updates = [];
      
      if (!user1Matches.includes(userId2)) {
        updates.push(
          setDoc(user1Ref, {
            matches: [...user1Matches, userId2],
          }, { merge: true })
        );
      }

      if (!user2Matches.includes(userId1)) {
        updates.push(
          setDoc(user2Ref, {
            matches: [...user2Matches, userId1],
          }, { merge: true })
        );
      }

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating user matches:', error);
    }
  }
}
