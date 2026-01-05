const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');
const GamificationService = require('../services/GamificationService');

const SwipeStreak = require('../models/SwipeStreak');

const AchievementBadge = require('../models/AchievementBadge');

const DailyReward = require('../models/DailyReward');

class GamificationController {
  /**
   * Track a swipe and update streak
   */
  static async trackSwipe(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const streak = await GamificationService.updateSwipeStreak(userId);
      const stats = await GamificationService.getUserGamificationStats(userId);

      res.json({
        success: true,
        data: { streak, stats },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to track swipe',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get swipe streak for user
   */
  static async getSwipeStreak(req, res) {
    try {
      const { userId } = req.params;

      const streak = await GamificationService.getSwipeStreak(userId);

      if (!streak) {
        return res.json({
          data: {
            currentStreak: 0,
            longestStreak: 0,
            lastSwipeDate: null,
          },
        });
      }

      res.json({ data: streak });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get swipe streak',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Award a badge to a user
   */
  static async awardBadge(req, res) {
    try {
      const { userId, badgeType, badgeName, badgeDescription, points } = req.body;

      const badge = await GamificationService.awardBadge(
        userId,
        badgeType,
        badgeName,
        badgeDescription,
        points
      );

      res.json({
        success: true,
        badge,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to award badge',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get user badges
   */
  static async getUserBadges(req, res) {
    try {
      const { userId } = req.params;

      const badges = await GamificationService.getUserBadges(userId);

      res.json({
        badges,
        totalBadges: badges.length,
        unlockedBadges: badges.filter((b) => b.isUnlocked).length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get badges',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get daily login reward
   */
  static async getDailyReward(req, res) {
    try {
      const { userId } = req.params;

      const unclaimed = await GamificationService.getUnclaimedRewards(userId);

      res.json({
        unclaimedRewards: unclaimed,
        totalUnclaimed: unclaimed.length,
        totalValue: unclaimed.reduce((sum, r) => sum + r.rewardValue, 0),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get daily reward',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Claim a reward
   */
  static async claimReward(req, res) {
    try {
      const { rewardId } = req.params;

      const reward = await GamificationService.claimReward(rewardId);

      res.json({
        success: true,
        reward,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to claim reward',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get gamification stats for a user
   */
  static async getUserStats(req, res) {
    try {
      const { userId } = req.params;

      const stats = await GamificationService.getUserGamificationStats(userId);

      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get gamification stats',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get streak leaderboard
   */
  static async getStreakLeaderboard(req, res) {
    try {
      const { limit = 10 } = req.query;

      const leaderboard = await GamificationService.getStreakLeaderboard(parseInt(limit));

      res.json({
        leaderboard,
        count: leaderboard.length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get leaderboard',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get longest streak leaderboard
   */
  static async getLongestStreakLeaderboard(req, res) {
    try {
      const { limit = 10 } = req.query;

      const leaderboard = await GamificationService.getLongestStreakLeaderboard(parseInt(limit));

      res.json({
        leaderboard,
        count: leaderboard.length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get longest streak leaderboard',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update badges based on user activity
   */
  static async updateUserBadges(req, res) {
    try {
      const { userId } = req.params;

      await GamificationService.updateBadgesForUser(userId);

      const updatedBadges = await GamificationService.getUserBadges(userId);

      res.json({
        success: true,
        data: {
          badges: updatedBadges,
          updated: updatedBadges.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update badges',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // =============================================
  // LEVEL PROGRESSION METHODS
  // =============================================

  /**
   * Get user level and XP
   */
  static async getUserLevel(req, res) {
    try {
      const { userId } = req.params;
      const levelData = await GamificationService.getUserLevel(userId);

      res.json({
        success: true,
        data: levelData,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get user level',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Add XP to user
   */
  static async addXP(req, res) {
    try {
      const { userId, amount, action } = req.body;

      if (!userId || !amount) {
        return res.status(400).json({ error: 'User ID and amount are required' });
      }

      const result = await GamificationService.addXP(userId, amount, action);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to add XP',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get level rewards
   */
  static async getLevelRewards(req, res) {
    try {
      const { level } = req.params;
      const rewards = await GamificationService.getLevelRewards(parseInt(level));

      res.json({
        success: true,
        data: rewards,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get level rewards',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // =============================================
  // DAILY CHALLENGES METHODS
  // =============================================

  /**
   * Get daily challenges for user
   */
  static async getDailyChallenges(req, res) {
    try {
      const { userId } = req.params;
      const challenges = await GamificationService.getDailyChallenges(userId);

      res.json({
        success: true,
        data: challenges,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get daily challenges',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update challenge progress
   */
  static async updateChallengeProgress(req, res) {
    try {
      const { userId, challengeId, progress } = req.body;
      const result = await GamificationService.updateChallengeProgress(
        userId,
        challengeId,
        progress
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update challenge progress',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Track action for challenges
   */
  static async trackChallengeAction(req, res) {
    try {
      const { userId, actionType, count } = req.body;
      const result = await GamificationService.trackChallengeAction(userId, actionType, count || 1);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to track challenge action',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Claim challenge reward
   */
  static async claimChallengeReward(req, res) {
    try {
      const { userId, challengeId } = req.body;
      const result = await GamificationService.claimChallengeReward(userId, challengeId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to claim challenge reward',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get completion bonus status
   */
  static async getCompletionBonus(req, res) {
    try {
      const { userId } = req.params;
      const bonus = await GamificationService.getCompletionBonus(userId);

      res.json({
        success: true,
        data: bonus,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get completion bonus',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Claim completion bonus
   */
  static async claimCompletionBonus(req, res) {
    try {
      const { userId } = req.params;
      const result = await GamificationService.claimCompletionBonus(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to claim completion bonus',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // =============================================
  // ACHIEVEMENT METHODS
  // =============================================

  /**
   * Get user achievements
   */
  static async getUserAchievements(req, res) {
    try {
      const { userId } = req.params;
      const achievements = await GamificationService.getUserAchievements(userId);

      res.json({
        success: true,
        data: achievements,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get user achievements',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check and unlock achievements
   */
  static async checkAchievements(req, res) {
    try {
      const { userId, stats } = req.body;
      const result = await GamificationService.checkAchievements(userId, stats);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to check achievements',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Unlock an achievement
   */
  static async unlockAchievement(req, res) {
    try {
      const { userId, achievementId } = req.body;
      const result = await GamificationService.unlockAchievement(userId, achievementId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to unlock achievement',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get achievement progress
   */
  static async getAchievementProgress(req, res) {
    try {
      const { userId, achievementId } = req.params;
      const progress = await GamificationService.getAchievementProgress(userId, achievementId);

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get achievement progress',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get recent achievements
   */
  static async getRecentAchievements(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 5 } = req.query;
      const achievements = await GamificationService.getRecentAchievements(userId, parseInt(limit));

      res.json({
        success: true,
        data: achievements,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get recent achievements',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

module.exports = GamificationController;
