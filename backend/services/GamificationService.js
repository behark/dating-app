const SwipeStreak = require('../models/SwipeStreak');
const DailyReward = require('../models/DailyReward');
const AchievementBadge = require('../models/AchievementBadge');
const Swipe = require('../models/Swipe');
const User = require('../models/User');

class GamificationService {
  /**
   * Update or create swipe streak for a user
   */
  static async updateSwipeStreak(userId) {
    try {
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
          totalSwipes: 1
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
    } catch (error) {
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
          100 + (currentStreak * 10),
          `${currentStreak}-day streak milestone bonus!`,
          `streak_milestone_${currentStreak}`
        );
      }
    } catch (error) {
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
    } catch (error) {
      console.error('Error getting swipe streak:', error);
      throw error;
    }
  }

  /**
   * Award a badge to a user
   */
  static async awardBadge(
    userId,
    badgeType,
    badgeName,
    badgeDescription,
    points = 0
  ) {
    try {
      // Check if badge already exists and is unlocked
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
          points
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
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Check and update badges based on user activity
   */
  static async updateBadgesForUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Get user statistics
      const matchCount = await Swipe.countDocuments({
        userId,
        swipeType: 'like',
        isMatched: true
      });

      const totalSwipes = await Swipe.countDocuments({ userId });

      // Award match-based badges
      const matchBadges = [
        { count: 1, type: 'first_match' },
        { count: 10, type: 'matchmaker' },
        { count: 25, type: 'socialite' },
        { count: 50, type: 'legend' }
      ];

      for (const badge of matchBadges) {
        if (matchCount >= badge.count) {
          const existing = await AchievementBadge.findOne({
            userId,
            badgeType: badge.type
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
    } catch (error) {
      console.error('Error updating badges:', error);
      throw error;
    }
  }

  /**
   * Create a daily reward
   */
  static async createDailyReward(
    userId,
    rewardType,
    rewardValue,
    rewardDescription,
    source
  ) {
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
          source
        }
      });

      await reward.save();
      return reward;
    } catch (error) {
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
      const rewards = await DailyReward.find({
        userId,
        isClaimed: false,
        expiresAt: { $gt: now }
      }).sort({ createdAt: -1 });

      return rewards;
    } catch (error) {
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

      // TODO: Add points to user account
      // await User.findByIdAndUpdate(reward.userId, {
      //   $inc: { points: reward.rewardValue }
      // });

      await reward.save();
      return reward;
    } catch (error) {
      console.error('Error claiming reward:', error);
      throw error;
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(userId) {
    try {
      const badges = await AchievementBadge.find({ userId }).sort({ unlockedAt: -1 });
      return badges;
    } catch (error) {
      console.error('Error getting user badges:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard by swipe streaks
   */
  static async getStreakLeaderboard(limit = 10) {
    try {
      const leaderboard = await SwipeStreak.find({
        currentStreak: { $gt: 0 }
      })
        .sort({ currentStreak: -1 })
        .limit(limit)
        .populate('userId', 'name photos');

      return leaderboard;
    } catch (error) {
      console.error('Error getting streak leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard by longest streaks
   */
  static async getLongestStreakLeaderboard(limit = 10) {
    try {
      const leaderboard = await SwipeStreak.find({
        longestStreak: { $gt: 0 }
      })
        .sort({ longestStreak: -1 })
        .limit(limit)
        .populate('userId', 'name photos');

      return leaderboard;
    } catch (error) {
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
        isClaimed: false
      });

      return {
        streak: streak || {},
        badges: badges,
        unclaimedRewards: rewards,
        badgeCount: badges.length
      };
    } catch (error) {
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
      verified_user: 'Verified User'
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
      swipe_legend: 'Completed 500 total swipes'
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
      verified_user: '✅'
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
      swipe_legend: 500
    };
    return requirements[badgeType] || 1;
  }
}

module.exports = GamificationService;
