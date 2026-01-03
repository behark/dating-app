/**
 * FirebaseUserRepository
 * 
 * Implementation of UserRepository using Firebase Firestore.
 * Handles all Firebase-specific logic and error handling.
 * Returns empty arrays/null on errors instead of throwing.
 */

import { arrayUnion, collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserRepository } from './UserRepository';

// Simple in-memory cache for user profiles
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class FirebaseUserRepository extends UserRepository {
  constructor() {
    super();
    this.db = db;
    this.cache = userCache;
    this.cacheDuration = CACHE_DURATION;
    
    // Start periodic cache cleanup
    this.cleanupInterval = setInterval(() => this.cleanupCache(), CACHE_DURATION);
  }

  /**
   * Get the current user's profile data
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} User data or null if not found/error
   */
  async getCurrentUser(userId) {
    try {
      if (!userId) {
        console.warn('FirebaseUserRepository: No userId provided to getCurrentUser');
        return null;
      }

      const userDoc = await getDoc(doc(this.db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.log('FirebaseUserRepository: User not found:', userId);
        return null;
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('FirebaseUserRepository: Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get discoverable users (excluding already swiped/matched users)
   * @param {string} userId - Current user's ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of user profiles (empty array on error)
   */
  async getDiscoverableUsers(userId, options = {}) {
    try {
      if (!userId) {
        console.warn('FirebaseUserRepository: No userId provided to getDiscoverableUsers');
        return [];
      }

      const { excludeUserIds = [], limit = 50 } = options;

      // Get current user data for swiped users and matches
      const currentUserData = await this.getCurrentUser(userId);
      
      // Combine exclusion lists
      const swipedUsers = currentUserData?.swipedUsers || [];
      const matches = currentUserData?.matches || [];
      const allExcluded = new Set([...excludeUserIds, ...swipedUsers, ...matches, userId]);

      // Fetch all users
      const usersRef = collection(this.db, 'users');
      const querySnapshot = await getDocs(usersRef);

      const availableUsers = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const docId = docSnapshot.id;
        
        // Skip excluded users
        if (allExcluded.has(docId)) {
          return;
        }

        // Check cache first
        const cachedUser = this.cache.get(docId);
        let user;

        if (cachedUser && (Date.now() - cachedUser.cachedAt) < this.cacheDuration) {
          user = cachedUser.data;
        } else {
          // Cache the user data
          const userData = docSnapshot.data();
          user = { id: docId, ...userData };
          this.cache.set(docId, {
            data: user,
            cachedAt: Date.now()
          });
        }

        // Only include users with complete profiles
        if (user.photoURL && user.name) {
          availableUsers.push(user);
        }
      });

      // Apply limit
      return availableUsers.slice(0, limit);
    } catch (error) {
      console.error('FirebaseUserRepository: Error getting discoverable users:', error);
      // Return empty array instead of throwing - allows UI to show "No users found"
      return [];
    }
  }

  /**
   * Update user profile data
   * @param {string} userId - The user's ID
   * @param {Object} data - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async updateUser(userId, data) {
    try {
      if (!userId) {
        console.warn('FirebaseUserRepository: No userId provided to updateUser');
        return false;
      }

      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      // Invalidate cache for this user
      this.cache.delete(userId);

      return true;
    } catch (error) {
      console.error('FirebaseUserRepository: Error updating user:', error);
      return false;
    }
  }

  /**
   * Get a single user by ID
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} User data or null if not found/error
   */
  async getUserById(userId) {
    try {
      if (!userId) {
        return null;
      }

      // Check cache first
      const cached = this.cache.get(userId);
      if (cached && (Date.now() - cached.cachedAt) < this.cacheDuration) {
        return cached.data;
      }

      const userDoc = await getDoc(doc(this.db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const user = { id: userDoc.id, ...userDoc.data() };
      
      // Update cache
      this.cache.set(userId, {
        data: user,
        cachedAt: Date.now()
      });

      return user;
    } catch (error) {
      console.error('FirebaseUserRepository: Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Record a swipe action
   * @param {string} swiperId - The user who swiped
   * @param {string} swipedUserId - The user who was swiped on
   * @param {string} direction - 'left', 'right', or 'super'
   * @returns {Promise<Object>} Result with potential match info
   */
  async recordSwipe(swiperId, swipedUserId, direction) {
    try {
      if (!swiperId || !swipedUserId) {
        return { success: false, isMatch: false };
      }

      // Add to swiped users list
      const swiperRef = doc(this.db, 'users', swiperId);
      await updateDoc(swiperRef, {
        swipedUsers: arrayUnion(swipedUserId)
      });

      // If right swipe or super like, check for match
      if (direction === 'right' || direction === 'super') {
        const swipedUserData = await this.getUserById(swipedUserId);
        
        // Check if the other user has already swiped right on us
        if (swipedUserData?.swipedUsers?.includes(swiperId)) {
          // It's a match!
          await this.createMatch(swiperId, swipedUserId);
          return { success: true, isMatch: true };
        }
      }

      return { success: true, isMatch: false };
    } catch (error) {
      console.error('FirebaseUserRepository: Error recording swipe:', error);
      return { success: false, isMatch: false };
    }
  }

  /**
   * Create a match between two users
   * @private
   */
  async createMatch(userId1, userId2) {
    try {
      // Add each user to the other's matches
      const user1Ref = doc(this.db, 'users', userId1);
      const user2Ref = doc(this.db, 'users', userId2);

      await Promise.all([
        updateDoc(user1Ref, { matches: arrayUnion(userId2) }),
        updateDoc(user2Ref, { matches: arrayUnion(userId1) })
      ]);

      // Create a match document
      const matchId = [userId1, userId2].sort().join('_');
      await setDoc(doc(this.db, 'matches', matchId), {
        users: [userId1, userId2],
        createdAt: new Date().toISOString(),
        lastMessage: null
      });

      return true;
    } catch (error) {
      console.error('FirebaseUserRepository: Error creating match:', error);
      return false;
    }
  }

  /**
   * Clear the repository cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Cleanup expired cache entries
   * @private
   */
  cleanupCache() {
    const now = Date.now();
    for (const [userId, cachedData] of this.cache.entries()) {
      if (now - cachedData.cachedAt > this.cacheDuration) {
        this.cache.delete(userId);
      }
    }
  }

  /**
   * Cleanup resources when repository is no longer needed
   */
  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clearCache();
  }
}

// Singleton instance for convenience
let instance = null;

export const getFirebaseUserRepository = () => {
  if (!instance) {
    instance = new FirebaseUserRepository();
  }
  return instance;
};

export default FirebaseUserRepository;
