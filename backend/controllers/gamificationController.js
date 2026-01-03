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
        streak,
        stats
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to track swipe',
        message: error.message
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
          currentStreak: 0,
          longestStreak: 0,
          lastSwipeDate: null
        });
      }

      res.json(streak);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get swipe streak',
        message: error.message
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
        badge
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to award badge',
        message: error.message
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
        unlockedBadges: badges.filter(b => b.isUnlocked).length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get badges',
        message: error.message
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
        totalValue: unclaimed.reduce((sum, r) => sum + r.rewardValue, 0)
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get daily reward',
        message: error.message
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
        reward
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to claim reward',
        message: error.message
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
        message: error.message
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
        count: leaderboard.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get leaderboard',
        message: error.message
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
        count: leaderboard.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get longest streak leaderboard',
        message: error.message
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
        badges: updatedBadges,
        updated: updatedBadges.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update badges',
        message: error.message
      });
    }
  }
}

module.exports = GamificationController;
