const SwipeStreak = require('../domain/SwipeStreak');
const DailyReward = require('../domain/DailyReward');
const AchievementBadge = require('../domain/AchievementBadge');
const Swipe = require('../domain/Swipe');
const User = require('../domain/User');

// XP amounts for different actions
const XP_ACTIONS = {
  DAILY_LOGIN: 10,
  COMPLETE_PROFILE: 50,
  SEND_MESSAGE: 5,
  RECEIVE_MATCH: 25,
  FIRST_DATE: 100,
  VERIFY_PHOTO: 30,
  VERIFY_ID: 50,
  SEND_SUPER_LIKE: 15,
  COMPLETE_CHALLENGE: 20,
  STREAK_BONUS: 5,
  REFER_FRIEND: 75,
};

// Level definitions
const LEVELS = [
  { level: 1, name: 'Newcomer', minXP: 0, maxXP: 100, icon: '🌱', color: '#78909C' },
  { level: 2, name: 'Explorer', minXP: 100, maxXP: 300, icon: '🧭', color: '#4CAF50' },
  { level: 3, name: 'Connector', minXP: 300, maxXP: 600, icon: '🤝', color: '#2196F3' },
  { level: 4, name: 'Social Butterfly', minXP: 600, maxXP: 1000, icon: '🦋', color: '#9C27B0' },
  { level: 5, name: 'Charmer', minXP: 1000, maxXP: 1500, icon: '✨', color: '#FF9800' },
  { level: 6, name: 'Heartbreaker', minXP: 1500, maxXP: 2200, icon: '💔', color: '#E91E63' },
  { level: 7, name: 'Love Expert', minXP: 2200, maxXP: 3000, icon: '💝', color: '#F44336' },
  { level: 8, name: 'Matchmaker', minXP: 3000, maxXP: 4000, icon: '💘', color: '#E040FB' },
  { level: 9, name: 'Cupid', minXP: 4000, maxXP: 5500, icon: '🏹', color: '#FF4081' },
  { level: 10, name: 'Cupid Elite', minXP: 5500, maxXP: Infinity, icon: '👑', color: '#FFD700' },
];

// Achievement definitions
const ACHIEVEMENTS = {
  FIRST_MATCH: {
    id: 'first_match',
    name: 'First Spark',
    description: 'Get your first match',
    icon: '💫',
    xpReward: 50,
    rarity: 'common',
    category: 'matching',
    target: 1,
  },
  TEN_MATCHES: {
    id: 'ten_matches',
    name: 'Popular',
    description: 'Get 10 matches',
    icon: '🌟',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'matching',
    target: 10,
  },
  HUNDRED_MATCHES: {
    id: 'hundred_matches',
    name: 'Magnetic',
    description: 'Get 100 matches',
    icon: '🧲',
    xpReward: 500,
    rarity: 'rare',
    category: 'matching',
    target: 100,
  },
  FIRST_MESSAGE: {
    id: 'first_message',
    name: 'Ice Breaker',
    description: 'Send your first message',
    icon: '💬',
    xpReward: 25,
    rarity: 'common',
    category: 'conversation',
    target: 1,
  },
  CONVERSATION_STARTER: {
    id: 'conversation_starter',
    name: 'Conversation Starter',
    description: 'Start 10 conversations',
    icon: '🎯',
    xpReward: 75,
    rarity: 'uncommon',
    category: 'conversation',
    target: 10,
  },
  SEVEN_DAY_STREAK: {
    id: 'seven_day_streak',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'engagement',
    target: 7,
  },
  THIRTY_DAY_STREAK: {
    id: 'thirty_day_streak',
    name: 'Dedication',
    description: 'Maintain a 30-day streak',
    icon: '💎',
    xpReward: 300,
    rarity: 'rare',
    category: 'engagement',
    target: 30,
  },
  PROFILE_COMPLETE: {
    id: 'profile_complete',
    name: 'Perfect Profile',
    description: 'Complete your profile 100%',
    icon: '✅',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'profile',
    target: 100,
  },
  VERIFIED: {
    id: 'verified',
    name: 'Verified',
    description: 'Get photo verified',
    icon: '✓',
    xpReward: 50,
    rarity: 'common',
    category: 'profile',
    target: 1,
  },
  SUPER_LIKER: {
    id: 'super_liker',
    name: 'Super Liker',
    description: 'Send 10 Super Likes',
    icon: '⭐',
    xpReward: 75,
    rarity: 'uncommon',
    category: 'interaction',
    target: 10,
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Have 5 active conversations',
    icon: '🦋',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'conversation',
    target: 5,
  },
  FIRST_DATE: {
    id: 'first_date',
    name: 'First Date',
    description: 'Schedule your first date',
    icon: '🌹',
    xpReward: 150,
    rarity: 'rare',
    category: 'dating',
    target: 1,
  },
};

// Daily challenge templates
const CHALLENGE_TEMPLATES = [
  {
    id: 'send_messages',
    type: 'messages',
    title: 'Chat Champion',
    description: 'Send messages to matches',
    icon: '💬',
    targetCount: 5,
    xpReward: 30,
    difficulty: 'easy',
  },
  {
    id: 'swipe_right',
    type: 'swipes',
    title: 'Spread the Love',
    description: 'Like profiles',
    icon: '❤️',
    targetCount: 20,
    xpReward: 25,
    difficulty: 'easy',
  },
  {
    id: 'update_profile',
    type: 'profile',
    title: 'Fresh Look',
    description: 'Update your profile',
    icon: '✨',
    targetCount: 1,
    xpReward: 20,
    difficulty: 'easy',
  },
  {
    id: 'super_like',
    type: 'super_like',
    title: 'Super Star',
    description: 'Send a Super Like',
    icon: '⭐',
    targetCount: 1,
    xpReward: 35,
    difficulty: 'medium',
  },
  {
    id: 'start_conversations',
    type: 'conversation_start',
    title: 'Ice Breaker',
    description: 'Start new conversations',
    icon: '🎯',
    targetCount: 3,
    xpReward: 40,
    difficulty: 'medium',
  },
  {
    id: 'view_profiles',
    type: 'profile_views',
    title: 'Explorer',
    description: 'View profiles',
    icon: '👀',
    targetCount: 30,
    xpReward: 20,
    difficulty: 'easy',
  },
];

class GamificationService {
  /**
   * Update or create swipe streak for a user
   */
  static async updateSwipeStreak(userId) {
    try {
      /** @type {any} */
      let streak = await SwipeStreak.findOne({ userId });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!streak) {
        // Create new streak record
        streak = new SwipeStreak({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastSwipeDate: new Date(),
          streakStartDate: new Date(),
          swipesInCurrentStreak: 1,
          totalSwipes: 1,
        });
      } else {
        const lastSwipeDate = new Date(streak.lastSwipeDate);
        lastSwipeDate.setHours(0, 0, 0, 0);

        if (lastSwipeDate.getTime() === today.getTime()) {
          // Same day - increment swipes
          streak.swipesInCurrentStreak += 1;
          streak.totalSwipes += 1;
        } else if (lastSwipeDate.getTime() === new Date(today.getTime() - 86400000).getTime()) {
          // Consecutive day - continue streak
          streak.currentStreak += 1;
          streak.swipesInCurrentStreak = 1;
          streak.totalSwipes += 1;

          // Update longest streak
          if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
          }

          // Check for milestones
          await this.checkStreakMilestones(userId, streak.currentStreak);
        } else {
          // Streak broken - reset
          streak.streakBrokenCount += 1;
          streak.currentStreak = 1;
          streak.streakStartDate = new Date();
          streak.swipesInCurrentStreak = 1;
          streak.totalSwipes += 1;
        }

        streak.lastSwipeDate = new Date();
        streak.notifiedAboutStreak = false;
      }

      await streak.save();
      return streak;
    } catch (/** @type {any} */ error) {
      console.error('Error updating swipe streak:', error);
      throw error;
    }
  }

  /**
   * Check for streak milestones and award badges
   */
  static async checkStreakMilestones(userId, currentStreak) {
    try {
      const milestones = [7, 14, 30, 60, 100];
      if (milestones.includes(currentStreak)) {
        const badgeType = `streak_champion_${currentStreak}`;
        const badgeName = this.getBadgeName(badgeType);
        const badgeDescription = `Maintained a ${currentStreak}-day swipe streak`;

        await this.awardBadge(userId, badgeType, badgeName, badgeDescription, 50);

        // Create reward for milestone
        await this.createDailyReward(
          userId,
          'streak_milestone',
          100 + currentStreak * 10,
          `${currentStreak}-day streak milestone bonus!`,
          `streak_milestone_${currentStreak}`
        );
      }
    } catch (/** @type {any} */ error) {
      console.error('Error checking streak milestones:', error);
    }
  }

  /**
   * Get swipe streak for a user
   */
  static async getSwipeStreak(userId) {
    try {
      const streak = await SwipeStreak.findOne({ userId });
      return streak || null;
    } catch (/** @type {any} */ error) {
      console.error('Error getting swipe streak:', error);
      throw error;
    }
  }

  /**
   * Award a badge to a user
   */
  static async awardBadge(userId, badgeType, badgeName, badgeDescription, points = 0) {
    try {
      // Check if badge already exists and is unlocked
      /** @type {any} */
      let badge = await AchievementBadge.findOne({ userId, badgeType });

      if (!badge) {
        badge = new AchievementBadge({
          userId,
          badgeType,
          badgeName,
          badgeDescription,
          badgeIcon: this.getBadgeIcon(badgeType),
          rarity: this.getBadgeRarity(badgeType),
          progressRequired: this.getProgressRequired(badgeType),
          isUnlocked: true,
          unlockedAt: new Date(),
          points,
        });
      } else if (!badge.isUnlocked) {
        badge.isUnlocked = true;
        badge.unlockedAt = new Date();
        badge.points = points;
      } else {
        return badge; // Already unlocked
      }

      await badge.save();

      // Award points as daily reward
      if (points > 0) {
        await this.createDailyReward(
          userId,
          'achievement',
          points,
          `Unlocked badge: ${badgeName}`,
          `badge_${badgeType}`
        );
      }

      return badge;
    } catch (/** @type {any} */ error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Check and update badges based on user activity
   */
  static async updateBadgesForUser(userId) {
    try {
      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) return;

      // Get user statistics
      const matchCount = await Swipe.countDocuments({
        userId,
        swipeType: 'like',
        isMatched: true,
      });

      const totalSwipes = await Swipe.countDocuments({ userId });

      // Award match-based badges
      const matchBadges = [
        { count: 1, type: 'first_match' },
        { count: 10, type: 'matchmaker' },
        { count: 25, type: 'socialite' },
        { count: 50, type: 'legend' },
      ];

      for (const badge of matchBadges) {
        if (matchCount >= badge.count) {
          const existing = await AchievementBadge.findOne({
            userId,
            badgeType: badge.type,
          });

          if (!existing || !existing.isUnlocked) {
            const badgeName = this.getBadgeName(badge.type);
            const badgeDescription = this.getBadgeDescription(badge.type);
            await this.awardBadge(userId, badge.type, badgeName, badgeDescription, 50);
          }
        }
      }

      // Award swipe-based badges
      if (totalSwipes >= 100) {
        await this.awardBadge(
          userId,
          'swipe_master',
          'Swipe Master',
          'Completed 100 swipes in a single day',
          50
        );
      }

      if (totalSwipes >= 500) {
        await this.awardBadge(
          userId,
          'swipe_legend',
          'Swipe Legend',
          'Completed 500 total swipes',
          75
        );
      }

      return true;
    } catch (/** @type {any} */ error) {
      console.error('Error updating badges:', error);
      throw error;
    }
  }

  /**
   * Create a daily reward
   */
  static async createDailyReward(userId, rewardType, rewardValue, rewardDescription, source) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // Expires in 24 hours

      const reward = new DailyReward({
        userId,
        rewardDate: new Date(),
        rewardType,
        rewardValue,
        rewardDescription,
        expiresAt,
        metadata: {
          source,
        },
      });

      await reward.save();
      return reward;
    } catch (/** @type {any} */ error) {
      console.error('Error creating daily reward:', error);
      throw error;
    }
  }

  /**
   * Get unclaimed rewards for a user
   */
  static async getUnclaimedRewards(userId) {
    try {
      const now = new Date();
      return await DailyReward.find({
        userId,
        isClaimed: false,
        expiresAt: { $gt: now },
      }).sort({ createdAt: -1 });
    } catch (/** @type {any} */ error) {
      console.error('Error getting unclaimed rewards:', error);
      throw error;
    }
  }

  /**
   * Claim a daily reward
   */
  static async claimReward(rewardId) {
    try {
      const reward = await DailyReward.findById(rewardId);
      if (!reward) throw new Error('Reward not found');
      if (reward.isClaimed) throw new Error('Reward already claimed');
      if (new Date() > reward.expiresAt) throw new Error('Reward has expired');

      reward.isClaimed = true;
      reward.claimedAt = new Date();

      // Add points to user account
      await User.findByIdAndUpdate(reward.userId, {
        $inc: { points: reward.rewardValue },
      });

      await reward.save();
      return reward;
    } catch (/** @type {any} */ error) {
      console.error('Error claiming reward:', error);
      throw error;
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(userId) {
    try {
      return await AchievementBadge.find({ userId }).sort({ unlockedAt: -1 });
    } catch (/** @type {any} */ error) {
      console.error('Error getting user badges:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard by swipe streaks
   */
  static async getStreakLeaderboard(limit = 10) {
    try {
      return await SwipeStreak.find({
        currentStreak: { $gt: 0 },
      })
        .sort({ currentStreak: -1 })
        .limit(limit)
        .populate('userId', 'name photos');
    } catch (/** @type {any} */ error) {
      console.error('Error getting streak leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard by longest streaks
   */
  static async getLongestStreakLeaderboard(limit = 10) {
    try {
      return await SwipeStreak.find({
        longestStreak: { $gt: 0 },
      })
        .sort({ longestStreak: -1 })
        .limit(limit)
        .populate('userId', 'name photos');
    } catch (/** @type {any} */ error) {
      console.error('Error getting longest streak leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user's gamification stats
   */
  static async getUserGamificationStats(userId) {
    try {
      const streak = await SwipeStreak.findOne({ userId });
      const badges = await AchievementBadge.find({ userId, isUnlocked: true });
      const rewards = await DailyReward.find({
        userId,
        isClaimed: false,
      });

      return {
        streak: streak || {},
        badges: badges,
        unclaimedRewards: rewards,
        badgeCount: badges.length,
      };
    } catch (/** @type {any} */ error) {
      console.error('Error getting user gamification stats:', error);
      throw error;
    }
  }

  // Helper methods
  static getBadgeName(badgeType) {
    const badgeNames = {
      first_match: 'First Match',
      matchmaker: 'Matchmaker',
      socialite: 'Socialite',
      legend: 'Legend',
      swipe_master: 'Swipe Master',
      swipe_legend: 'Swipe Legend',
      streak_champion_7: '7-Day Champion',
      streak_champion_30: '30-Day Champion',
      streak_champion_100: '100-Day Champion',
      conversation_starter: 'Conversation Starter',
      chat_enthusiast: 'Chat Enthusiast',
      profile_perfectionist: 'Profile Perfectionist',
      early_adopter: 'Early Adopter',
      group_date_host: 'Group Date Host',
      event_attendee: 'Event Attendee',
      friend_reviewer: 'Friend Reviewer',
      social_butterfly: 'Social Butterfly',
      connector: 'Connector',
      verified_user: 'Verified User',
    };
    return badgeNames[badgeType] || 'Unknown Badge';
  }

  static getBadgeDescription(badgeType) {
    const descriptions = {
      first_match: 'Got your first match!',
      matchmaker: 'Achieved 10 matches',
      socialite: 'Achieved 25 matches',
      legend: 'Achieved 50 matches',
      swipe_master: 'Completed 100 swipes in a day',
      swipe_legend: 'Completed 500 total swipes',
    };
    return descriptions[badgeType] || 'Achievement unlocked!';
  }

  static getBadgeIcon(badgeType) {
    const icons = {
      first_match: '💕',
      matchmaker: '🎯',
      socialite: '🌟',
      legend: '👑',
      swipe_master: '⚡',
      swipe_legend: '🔥',
      streak_champion_7: '🏆',
      streak_champion_30: '🏅',
      streak_champion_100: '💎',
      conversation_starter: '💬',
      chat_enthusiast: '💌',
      profile_perfectionist: '✨',
      early_adopter: '🚀',
      group_date_host: '🎉',
      event_attendee: '🎊',
      friend_reviewer: '⭐',
      social_butterfly: '🦋',
      connector: '🔗',
      verified_user: '✅',
    };
    return icons[badgeType] || '🏅';
  }

  static getBadgeRarity(badgeType) {
    if (badgeType.includes('legend') || badgeType.includes('champion_100')) {
      return 'legendary';
    }
    if (badgeType.includes('champion_30') || badgeType.includes('socialite')) {
      return 'epic';
    }
    if (badgeType.includes('champion_7') || badgeType.includes('matchmaker')) {
      return 'rare';
    }
    return 'common';
  }

  static getProgressRequired(badgeType) {
    const requirements = {
      first_match: 1,
      matchmaker: 10,
      socialite: 25,
      legend: 50,
      swipe_master: 100,
      swipe_legend: 500,
    };
    return requirements[badgeType] || 1;
  }

  // =============================================
  // LEVEL PROGRESSION METHODS
  // =============================================

  /**
   * Get user level data
   */
  static async getUserLevel(userId) {
    try {
      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) {
        return { currentXP: 0, level: 1, totalXPEarned: 0 };
      }

      const currentXP = user.gamification?.xp || 0;
      const level = this.calculateLevel(currentXP);
      const levelData =
        LEVELS.find((l) => l.level === level) || (LEVELS.length > 0 ? LEVELS[0] : null);
      if (!levelData) {
        return null;
      }

      return {
        currentXP,
        level,
        levelData,
        totalXPEarned: user.gamification?.totalXPEarned || currentXP,
      };
    } catch (/** @type {any} */ error) {
      console.error('Error getting user level:', error);
      return { currentXP: 0, level: 1, totalXPEarned: 0 };
    }
  }

  /**
   * Calculate level from XP
   */
  static calculateLevel(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXP) {
        return LEVELS[i].level;
      }
    }
    return 1;
  }

  /**
   * Add XP to user
   */
  static async addXP(userId, amount, action) {
    try {
      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const previousXP = user.gamification?.xp || 0;
      const newXP = previousXP + amount;

      // Update user XP
      user.gamification = user.gamification || {};
      user.gamification.xp = newXP;
      user.gamification.totalXPEarned = (user.gamification.totalXPEarned || 0) + amount;
      user.gamification.lastXPAction = action;
      user.gamification.lastXPDate = new Date();

      await user.save();

      // Check for level up
      const previousLevel = this.calculateLevel(previousXP);
      const currentLevel = this.calculateLevel(newXP);
      const leveledUp = currentLevel > previousLevel;

      return {
        previousXP,
        currentXP: newXP,
        xpAdded: amount,
        action,
        leveledUp,
        previousLevel,
        currentLevel,
        newLevel: leveledUp ? LEVELS.find((l) => l.level === currentLevel) : null,
      };
    } catch (/** @type {any} */ error) {
      console.error('Error adding XP:', error);
      throw error;
    }
  }

  /**
   * Get level rewards
   */
  static async getLevelRewards(level) {
    const rewards = {
      1: { superLikes: 1, boosts: 0, badge: null },
      2: { superLikes: 2, boosts: 0, badge: 'Explorer Badge' },
      3: { superLikes: 2, boosts: 1, badge: 'Connector Badge' },
      4: { superLikes: 3, boosts: 1, badge: 'Social Butterfly Badge' },
      5: { superLikes: 3, boosts: 2, badge: 'Charmer Badge' },
      6: { superLikes: 4, boosts: 2, badge: 'Heartbreaker Badge' },
      7: { superLikes: 4, boosts: 3, badge: 'Love Expert Badge' },
      8: { superLikes: 5, boosts: 3, badge: 'Matchmaker Badge' },
      9: { superLikes: 5, boosts: 4, badge: 'Cupid Badge' },
      10: { superLikes: 10, boosts: 5, badge: 'Cupid Elite Badge', premium: true },
    };

    if (rewards[level]) {
      return rewards[level];
    }
    return rewards[1] || null;
  }

  // =============================================
  // DAILY CHALLENGES METHODS
  // =============================================

  /**
   * Get daily challenges for user
   */
  static async getDailyChallenges(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toDateString();

      // Check if user has challenges for today
      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const challenges = user.gamification?.dailyChallenges || [];
      const lastChallengeDate = user.gamification?.lastChallengeDate;

      // Generate new challenges if needed
      if (!lastChallengeDate || new Date(lastChallengeDate).toDateString() !== todayStr) {
        const newChallenges = this.generateDailyChallenges(todayStr);

        user.gamification = user.gamification || {};
        user.gamification.dailyChallenges = newChallenges;
        user.gamification.lastChallengeDate = today;
        await user.save();

        return newChallenges;
      }

      return challenges;
    } catch (/** @type {any} */ error) {
      console.error('Error getting daily challenges:', error);
      return this.generateDailyChallenges(new Date().toDateString());
    }
  }

  /**
   * Generate daily challenges
   */
  static generateDailyChallenges(dateStr) {
    const seed = dateStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

    const shuffled = [...CHALLENGE_TEMPLATES].sort((a, b) => {
      return ((seed * a.id.charCodeAt(0)) % 100) - ((seed * b.id.charCodeAt(0)) % 100);
    });

    return shuffled.slice(0, 3).map((template, index) => ({
      ...template,
      challengeId: `${template.id}_${dateStr}`,
      currentProgress: 0,
      completed: false,
      claimed: false,
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      order: index,
    }));
  }

  /**
   * Update challenge progress
   */
  static async updateChallengeProgress(userId, challengeId, progress) {
    try {
      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const challenges = user.gamification?.dailyChallenges || [];
      const challengeIndex = challenges.findIndex((c) => c.challengeId === challengeId);

      if (challengeIndex === -1) {
        return { success: false, message: 'Challenge not found' };
      }

      const challenge = challenges[challengeIndex];
      challenge.currentProgress = Math.min(progress, challenge.targetCount);
      challenge.completed = challenge.currentProgress >= challenge.targetCount;

      user.gamification.dailyChallenges = challenges;
      await user.save();

      return { success: true, challenge };
    } catch (/** @type {any} */ error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }

  /**
   * Track action for challenges
   */
  static async trackChallengeAction(userId, actionType, count = 1) {
    try {
      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const challenges = user.gamification?.dailyChallenges || [];
      const updatedChallenges = [];

      for (const challenge of challenges) {
        if (challenge.type === actionType && !challenge.completed) {
          challenge.currentProgress = Math.min(
            challenge.currentProgress + count,
            challenge.targetCount
          );
          challenge.completed = challenge.currentProgress >= challenge.targetCount;
          updatedChallenges.push(challenge);
        }
      }

      if (updatedChallenges.length > 0) {
        user.gamification.dailyChallenges = challenges;
        await user.save();
      }

      return { success: true, updatedChallenges };
    } catch (/** @type {any} */ error) {
      console.error('Error tracking challenge action:', error);
      throw error;
    }
  }

  /**
   * Claim challenge reward
   */
  static async claimChallengeReward(userId, challengeId) {
    try {
      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const challenges = user.gamification?.dailyChallenges || [];
      const challenge = challenges.find((c) => c.challengeId === challengeId);

      if (!challenge) throw new Error('Challenge not found');
      if (!challenge.completed) throw new Error('Challenge not completed');
      if (challenge.claimed) throw new Error('Reward already claimed');

      challenge.claimed = true;
      challenge.claimedAt = new Date();

      // Add XP reward
      await this.addXP(userId, challenge.xpReward, 'challenge_complete');

      user.gamification.dailyChallenges = challenges;
      await user.save();

      return { success: true, xpEarned: challenge.xpReward, challenge };
    } catch (/** @type {any} */ error) {
      console.error('Error claiming challenge reward:', error);
      throw error;
    }
  }

  /**
   * Get completion bonus status
   */
  static async getCompletionBonus(userId) {
    try {
      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) return { available: false, bonusXP: 50 };

      const challenges = user.gamification?.dailyChallenges || [];
      const allCompleted =
        challenges.length > 0 && challenges.every((c) => c.completed && c.claimed);
      const bonusClaimed = user.gamification?.dailyBonusClaimed;
      const lastBonusDate = user.gamification?.lastBonusDate;
      const today = new Date().toDateString();

      const available =
        allCompleted && (!bonusClaimed || new Date(lastBonusDate).toDateString() !== today);

      return { available, bonusXP: 50 };
    } catch (/** @type {any} */ error) {
      console.error('Error getting completion bonus:', error);
      return { available: false, bonusXP: 50 };
    }
  }

  /**
   * Claim completion bonus
   */
  static async claimCompletionBonus(userId) {
    try {
      const bonus = await this.getCompletionBonus(userId);
      if (!bonus.available) throw new Error('Bonus not available');

      /** @type {any} */
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      user.gamification.dailyBonusClaimed = true;
      user.gamification.lastBonusDate = new Date();
      await user.save();

      await this.addXP(userId, 50, 'daily_bonus');

      return { success: true, xpEarned: 50 };
    } catch (/** @type {any} */ error) {
      console.error('Error claiming completion bonus:', error);
      throw error;
    }
  }

  // =============================================
  // ACHIEVEMENT METHODS
  // =============================================

  /**
   * Get user achievements
   */
  static async getUserAchievements(userId) {
    try {
      const badges = await AchievementBadge.find({ userId, isUnlocked: true });
      const allAchievements = Object.values(ACHIEVEMENTS);

      const unlocked = badges.map((b) => b.badgeType);
      const progress = {};

      // Calculate progress for each achievement
      for (const achievement of allAchievements) {
        /** @type {any} */
        const badge = badges.find((b) => b.badgeType === achievement.id);
        progress[achievement.id] = {
          current: badge?.progressCurrent || 0,
          target: achievement.target,
          percentage: badge ? Math.min(100, (badge.progressCurrent / achievement.target) * 100) : 0,
          unlocked: unlocked.includes(achievement.id),
        };
      }

      return { unlocked, progress, achievements: allAchievements };
    } catch (/** @type {any} */ error) {
      console.error('Error getting user achievements:', error);
      return { unlocked: [], progress: {} };
    }
  }

  /**
   * Check and unlock achievements based on stats
   */
  static async checkAchievements(userId, stats) {
    try {
      const unlockedAchievements = [];

      // Check match-based achievements
      if (stats.matchCount >= 1) {
        const result = await this.unlockAchievement(userId, 'first_match');
        if (result.newlyUnlocked) unlockedAchievements.push(result.achievement);
      }
      if (stats.matchCount >= 10) {
        const result = await this.unlockAchievement(userId, 'ten_matches');
        if (result.newlyUnlocked) unlockedAchievements.push(result.achievement);
      }

      // Check streak achievements
      if (stats.currentStreak >= 7) {
        const result = await this.unlockAchievement(userId, 'seven_day_streak');
        if (result.newlyUnlocked) unlockedAchievements.push(result.achievement);
      }
      if (stats.currentStreak >= 30) {
        const result = await this.unlockAchievement(userId, 'thirty_day_streak');
        if (result.newlyUnlocked) unlockedAchievements.push(result.achievement);
      }

      // Check message achievements
      if (stats.messagesSent >= 1) {
        const result = await this.unlockAchievement(userId, 'first_message');
        if (result.newlyUnlocked) unlockedAchievements.push(result.achievement);
      }

      return { checked: true, unlockedAchievements };
    } catch (/** @type {any} */ error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  /**
   * Unlock an achievement
   */
  static async unlockAchievement(userId, achievementId) {
    try {
      const achievement =
        ACHIEVEMENTS[achievementId.toUpperCase()] ||
        Object.values(ACHIEVEMENTS).find((a) => a.id === achievementId);

      if (!achievement) throw new Error('Achievement not found');

      // Check if already unlocked
      let badge = await AchievementBadge.findOne({ userId, badgeType: achievement.id });

      if (badge && badge.isUnlocked) {
        return { success: true, newlyUnlocked: false, achievement };
      }

      // Create or update badge
      if (!badge) {
        badge = new AchievementBadge({
          userId,
          badgeType: achievement.id,
          badgeName: achievement.name,
          badgeDescription: achievement.description,
          badgeIcon: achievement.icon,
          rarity: achievement.rarity,
          isUnlocked: true,
          unlockedAt: new Date(),
          points: achievement.xpReward,
        });
      } else {
        badge.isUnlocked = true;
        badge.unlockedAt = new Date();
      }

      await badge.save();

      // Award XP
      if (achievement.xpReward) {
        await this.addXP(userId, achievement.xpReward, 'achievement_unlock');
      }

      return { success: true, newlyUnlocked: true, achievement, badge };
    } catch (/** @type {any} */ error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  /**
   * Get achievement progress
   */
  static async getAchievementProgress(userId, achievementId) {
    try {
      /** @type {any} */
      const badge = await AchievementBadge.findOne({ userId, badgeType: achievementId });
      const achievement = Object.values(ACHIEVEMENTS).find((a) => a.id === achievementId);

      if (!achievement) {
        return { current: 0, target: 1, percentage: 0 };
      }

      const current = badge?.progressCurrent || 0;
      const target = achievement.target;
      const percentage = Math.min(100, (current / target) * 100);

      return { current, target, percentage, unlocked: badge?.isUnlocked || false };
    } catch (/** @type {any} */ error) {
      console.error('Error getting achievement progress:', error);
      return { current: 0, target: 1, percentage: 0 };
    }
  }

  /**
   * Get recent achievements
   */
  static async getRecentAchievements(userId, limit = 5) {
    try {
      const badges = await AchievementBadge.find({ userId, isUnlocked: true })
        .sort({ unlockedAt: -1 })
        .limit(limit);

      return badges.map((b) => ({
        id: b.badgeType,
        name: b.badgeName,
        description: b.badgeDescription,
        icon: b.badgeIcon,
        rarity: b.rarity,
        unlockedAt: b.unlockedAt,
      }));
    } catch (/** @type {any} */ error) {
      console.error('Error getting recent achievements:', error);
      return [];
    }
  }
}

// Export constants along with the service
GamificationService.XP_ACTIONS = XP_ACTIONS;
GamificationService.LEVELS = LEVELS;
GamificationService.ACHIEVEMENTS = ACHIEVEMENTS;
GamificationService.CHALLENGE_TEMPLATES = CHALLENGE_TEMPLATES;

module.exports = GamificationService;
