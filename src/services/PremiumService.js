import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export class PremiumService {
  static PREMIUM_FEATURES = {
    SUPER_LIKES_PER_DAY: 5,
    UNLIMITED_SWIPES: true,
    ADVANCED_FILTERS: true,
    SEE_WHO_LIKED_YOU: true,
    BOOST_PROFILE: true,
    PRIORITY_MATCHING: true,
  };

  static async checkPremiumStatus(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      const now = new Date();
      const subscriptionEnd = userData?.subscriptionEnd ? new Date(userData.subscriptionEnd) : null;

      return {
        isPremium: subscriptionEnd && subscriptionEnd > now,
        subscriptionType: userData?.subscriptionType || null,
        subscriptionEnd: subscriptionEnd,
        features: this.getAvailableFeatures(userData),
      };
    } catch (error) {
      console.error('Error checking premium status:', error);
      return {
        isPremium: false,
        subscriptionType: null,
        subscriptionEnd: null,
        features: this.getAvailableFeatures(null),
      };
    }
  }

  static getAvailableFeatures(userData) {
    const isPremium = userData?.subscriptionEnd && new Date(userData.subscriptionEnd) > new Date();

    return {
      superLikesPerDay: isPremium ? this.PREMIUM_FEATURES.SUPER_LIKES_PER_DAY : 1,
      unlimitedSwipes: isPremium ? this.PREMIUM_FEATURES.UNLIMITED_SWIPES : false,
      advancedFilters: isPremium ? this.PREMIUM_FEATURES.ADVANCED_FILTERS : false,
      seeWhoLikedYou: isPremium ? this.PREMIUM_FEATURES.SEE_WHO_LIKED_YOU : false,
      boostProfile: isPremium ? this.PREMIUM_FEATURES.BOOST_PROFILE : false,
      priorityMatching: isPremium ? this.PREMIUM_FEATURES.PRIORITY_MATCHING : false,
    };
  }

  static async getSuperLikesUsedToday(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      const today = new Date().toDateString();
      const lastSuperLikeDate = userData?.lastSuperLikeDate;

      if (lastSuperLikeDate !== today) {
        // Reset counter for new day
        await updateDoc(doc(db, 'users', userId), {
          superLikesUsedToday: 0,
          lastSuperLikeDate: today,
        });
        return 0;
      }

      return userData?.superLikesUsedToday || 0;
    } catch (error) {
      console.error('Error getting super likes used today:', error);
      return 0;
    }
  }

  static async useSuperLike(userId, targetUserId) {
    try {
      const superLikesUsed = await this.getSuperLikesUsedToday(userId);
      const premiumStatus = await this.checkPremiumStatus(userId);

      const maxSuperLikes = premiumStatus.features.superLikesPerDay;

      if (superLikesUsed >= maxSuperLikes) {
        return { success: false, error: 'Daily super like limit reached' };
      }

      // Record the super like
      const today = new Date().toDateString();
      await updateDoc(doc(db, 'users', userId), {
        superLikesUsedToday: superLikesUsed + 1,
        lastSuperLikeDate: today,
      }, { merge: true });

      // Add to target user's super likes received
      const targetUserRef = doc(db, 'users', targetUserId);
      const targetUserDoc = await getDoc(targetUserRef);
      const superLikesReceived = targetUserDoc.data()?.superLikesReceived || [];

      await updateDoc(targetUserRef, {
        superLikesReceived: [...superLikesReceived, {
          fromUserId: userId,
          timestamp: new Date(),
        }],
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Error using super like:', error);
      return { success: false, error: error.message };
    }
  }

  static async getReceivedSuperLikes(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      const superLikesReceived = userData?.superLikesReceived || [];
      const recentSuperLikes = superLikesReceived.filter(like => {
        const likeDate = new Date(like.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return likeDate > weekAgo;
      });

      // Get user details for each super like
      const superLikesWithDetails = [];
      for (const like of recentSuperLikes) {
        try {
          const likerDoc = await getDoc(doc(db, 'users', like.fromUserId));
          if (likerDoc.exists()) {
            superLikesWithDetails.push({
              ...like,
              user: {
                id: likerDoc.id,
                name: likerDoc.data().name,
                photoURL: likerDoc.data().photoURL,
                age: likerDoc.data().age,
              },
            });
          }
        } catch (error) {
          console.error('Error getting liker details:', error);
        }
      }

      return superLikesWithDetails;
    } catch (error) {
      console.error('Error getting received super likes:', error);
      return [];
    }
  }

  static async boostProfile(userId) {
    try {
      const premiumStatus = await this.checkPremiumStatus(userId);

      if (!premiumStatus.features.boostProfile) {
        return { success: false, error: 'Premium feature required' };
      }

      const boostEndTime = new Date();
      boostEndTime.setMinutes(boostEndTime.getMinutes() + 30); // 30 minutes boost

      await updateDoc(doc(db, 'users', userId), {
        profileBoosted: true,
        boostEndTime: boostEndTime,
        lastBoostTime: new Date(),
      }, { merge: true });

      return { success: true, boostEndTime };
    } catch (error) {
      console.error('Error boosting profile:', error);
      return { success: false, error: error.message };
    }
  }

  static async checkProfileBoostStatus(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      const boostEndTime = userData?.boostEndTime ? new Date(userData.boostEndTime) : null;
      const now = new Date();

      if (boostEndTime && boostEndTime > now) {
        return {
          isBoosted: true,
          boostEndTime,
          timeRemaining: Math.max(0, Math.floor((boostEndTime - now) / (1000 * 60))), // minutes
        };
      } else {
        // Clear expired boost
        if (userData?.profileBoosted) {
          await updateDoc(doc(db, 'users', userId), {
            profileBoosted: false,
            boostEndTime: null,
          }, { merge: true });
        }

        return {
          isBoosted: false,
          boostEndTime: null,
          timeRemaining: 0,
        };
      }
    } catch (error) {
      console.error('Error checking profile boost status:', error);
      return {
        isBoosted: false,
        boostEndTime: null,
        timeRemaining: 0,
      };
    }
  }

  // Mock subscription methods (in production, integrate with payment processor)
  static async startTrialSubscription(userId) {
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial

      await updateDoc(doc(db, 'users', userId), {
        subscriptionType: 'trial',
        subscriptionEnd: trialEnd,
        subscriptionStart: new Date(),
      }, { merge: true });

      return { success: true, trialEnd };
    } catch (error) {
      console.error('Error starting trial subscription:', error);
      return { success: false, error: error.message };
    }
  }

  static async upgradeToPremium(userId, planType = 'monthly') {
    try {
      const subscriptionEnd = new Date();

      switch (planType) {
        case 'monthly':
          subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
          break;
        case 'yearly':
          subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
          break;
        default:
          subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      }

      await updateDoc(doc(db, 'users', userId), {
        subscriptionType: planType,
        subscriptionEnd: subscriptionEnd,
        subscriptionStart: new Date(),
      }, { merge: true });

      return { success: true, subscriptionEnd };
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      return { success: false, error: error.message };
    }
  }
}