const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../../shared/utils/responseHelpers');
const GamificationService = require('../../core/services/GamificationService');
const { logger } = require('../../infrastructure/external/LoggingService');

const SwipeStreak = require('../../core/domain/SwipeStreak');

const AchievementBadge = require('../../core/domain/AchievementBadge');

const DailyReward = require('../../core/domain/DailyReward');

class GamificationController {
  /**
   * Track a swipe and update streak
   */
  static async trackSwipe(req, res) {
    try {
      const userId = req.user.id;

      const streak = await GamificationService.updateSwipeStreak(userId);
      const stats = await GamificationService.getUserGamificationStats(userId);

      return sendSuccess(res, 200, {
        message: 'Swipe tracked successfully',
        data: { streak, stats },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to track swipe:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to track swipe' });
    }
  }

  /**
   * Get swipe streak for user
   */
  static async getSwipeStreak(req, res) {
    try {
      const userId = req.user.id;

      const streak = await GamificationService.getSwipeStreak(userId);

      if (!streak) {
        return sendSuccess(res, 200, {
          message: 'Swipe streak retrieved',
          data: {
            currentStreak: 0,
            longestStreak: 0,
            lastSwipeDate: null,
          },
        });
      }

      return sendSuccess(res, 200, {
        message: 'Swipe streak retrieved',
        data: streak,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get swipe streak:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to get swipe streak' });
    }
  }

  /**
   * Award a badge to a user
   */
  static async awardBadge(req, res) {
    try {
      const userId = req.user.id;
      const { badgeType, badgeName, badgeDescription, points } = req.body;

      const badge = await GamificationService.awardBadge(
        userId,
        badgeType,
        badgeName,
        badgeDescription,
        points
      );

      return sendSuccess(res, 200, {
        message: 'Badge awarded successfully',
        data: { badge },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to award badge:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to award badge' });
    }
  }

  /**
   * Get user badges
   */
  static async getUserBadges(req, res) {
    try {
      const userId = req.user.id;

      const badges = await GamificationService.getUserBadges(userId);

      return sendSuccess(res, 200, {
        message: 'User badges retrieved',
        data: {
          badges,
          totalBadges: badges.length,
          unlockedBadges: badges.filter((b) => b.isUnlocked).length,
        },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get badges:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to get badges' });
    }
  }

  /**
   * Get daily login reward
   */
  static async getDailyReward(req, res) {
    try {
      const userId = req.user.id;

      const unclaimed = await GamificationService.getUnclaimedRewards(userId);

      return sendSuccess(res, 200, {
        message: 'Daily rewards retrieved',
        data: {
          unclaimedRewards: unclaimed,
          totalUnclaimed: unclaimed.length,
          totalValue: unclaimed.reduce((sum, r) => sum + r.rewardValue, 0),
        },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get daily reward:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to get daily reward' });
    }
  }

  /**
   * Claim a reward
   */
  static async claimReward(req, res) {
    try {
      const { rewardId } = req.params;

      const reward = await GamificationService.claimReward(rewardId);

      return sendSuccess(res, 200, {
        message: 'Reward claimed successfully',
        data: { reward },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to claim reward:', { error: error.message, stack: error.stack });
      return sendError(res, 400, { message: 'Failed to claim reward' });
    }
  }

  /**
   * Get gamification stats for a user
   */
  static async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await GamificationService.getUserGamificationStats(userId);

      return sendSuccess(res, 200, {
        message: 'Gamification stats retrieved',
        data: stats,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get gamification stats:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, { message: 'Failed to get gamification stats' });
    }
  }

  /**
   * Get streak leaderboard
   */
  static async getStreakLeaderboard(req, res) {
    try {
      const { limit = 10 } = req.query;
      const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

      const leaderboard = await GamificationService.getStreakLeaderboard(safeLimit);

      return sendSuccess(res, 200, {
        message: 'Streak leaderboard retrieved',
        data: {
          leaderboard,
          count: leaderboard.length,
        },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get leaderboard:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to get leaderboard' });
    }
  }

  /**
   * Get longest streak leaderboard
   */
  static async getLongestStreakLeaderboard(req, res) {
    try {
      const { limit = 10 } = req.query;

      const leaderboard = await GamificationService.getLongestStreakLeaderboard(parseInt(limit));

      return sendSuccess(res, 200, {
        message: 'Longest streak leaderboard retrieved',
        data: {
          leaderboard,
          count: leaderboard.length,
        },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get longest streak leaderboard:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, { message: 'Failed to get longest streak leaderboard' });
    }
  }

  /**
   * Update badges based on user activity
   */
  static async updateUserBadges(req, res) {
    try {
      const userId = req.user.id;

      await GamificationService.updateBadgesForUser(userId);

      const updatedBadges = await GamificationService.getUserBadges(userId);

      return sendSuccess(res, 200, {
        message: 'Badges updated successfully',
        data: {
          badges: updatedBadges,
          updated: updatedBadges.length,
        },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to update badges:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to update badges' });
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
      const userId = req.user.id;
      const levelData = await GamificationService.getUserLevel(userId);

      return sendSuccess(res, 200, {
        message: 'User level retrieved',
        data: levelData,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get user level:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to get user level' });
    }
  }

  /**
   * Add XP to user
   */
  static async addXP(req, res) {
    try {
      const userId = req.user.id;
      const { amount, action } = req.body;

      if (!amount) {
        return sendError(res, 400, { message: 'Amount is required' });
      }

      const result = await GamificationService.addXP(userId, amount, action);

      return sendSuccess(res, 200, {
        message: 'XP added successfully',
        data: result,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to add XP:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to add XP' });
    }
  }

  /**
   * Get level rewards
   */
  static async getLevelRewards(req, res) {
    try {
      const { level } = req.params;
      const rewards = await GamificationService.getLevelRewards(parseInt(level));

      return sendSuccess(res, 200, {
        message: 'Level rewards retrieved',
        data: rewards,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get level rewards:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to get level rewards' });
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
      const userId = req.user.id;
      const challenges = await GamificationService.getDailyChallenges(userId);

      return sendSuccess(res, 200, {
        message: 'Daily challenges retrieved',
        data: challenges,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get daily challenges:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to get daily challenges' });
    }
  }

  /**
   * Update challenge progress
   */
  static async updateChallengeProgress(req, res) {
    try {
      const userId = req.user.id;
      const { challengeId, progress } = req.body;
      const result = await GamificationService.updateChallengeProgress(
        userId,
        challengeId,
        progress
      );

      return sendSuccess(res, 200, {
        message: 'Challenge progress updated',
        data: result,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to update challenge progress:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, { message: 'Failed to update challenge progress' });
    }
  }

  /**
   * Track action for challenges
   */
  static async trackChallengeAction(req, res) {
    try {
      const userId = req.user.id;
      const { actionType, count } = req.body;
      const result = await GamificationService.trackChallengeAction(userId, actionType, count || 1);

      return sendSuccess(res, 200, {
        message: 'Challenge action tracked',
        data: result,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to track challenge action:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, { message: 'Failed to track challenge action' });
    }
  }

  /**
   * Claim challenge reward
   */
  static async claimChallengeReward(req, res) {
    try {
      const userId = req.user.id;
      const { challengeId } = req.body;
      const result = await GamificationService.claimChallengeReward(userId, challengeId);

      return sendSuccess(res, 200, {
        message: 'Challenge reward claimed',
        data: result,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to claim challenge reward:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 400, { message: 'Failed to claim challenge reward' });
    }
  }

  /**
   * Get completion bonus status
   */
  static async getCompletionBonus(req, res) {
    try {
      const userId = req.user.id;
      const bonus = await GamificationService.getCompletionBonus(userId);

      return sendSuccess(res, 200, {
        message: 'Completion bonus retrieved',
        data: bonus,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get completion bonus:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to get completion bonus' });
    }
  }

  /**
   * Claim completion bonus
   */
  static async claimCompletionBonus(req, res) {
    try {
      const userId = req.user.id;
      const result = await GamificationService.claimCompletionBonus(userId);

      return sendSuccess(res, 200, {
        message: 'Completion bonus claimed',
        data: result,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to claim completion bonus:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 400, { message: 'Failed to claim completion bonus' });
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
      const userId = req.user.id;
      const achievements = await GamificationService.getUserAchievements(userId);

      return sendSuccess(res, 200, {
        message: 'User achievements retrieved',
        data: achievements,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get user achievements:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, { message: 'Failed to get user achievements' });
    }
  }

  /**
   * Check and unlock achievements
   */
  static async checkAchievements(req, res) {
    try {
      const userId = req.user.id;
      const { stats } = req.body;
      const result = await GamificationService.checkAchievements(userId, stats);

      return sendSuccess(res, 200, {
        message: 'Achievements checked',
        data: result,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to check achievements:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to check achievements' });
    }
  }

  /**
   * Unlock an achievement
   */
  static async unlockAchievement(req, res) {
    try {
      const userId = req.user.id;
      const { achievementId } = req.body;
      const result = await GamificationService.unlockAchievement(userId, achievementId);

      return sendSuccess(res, 200, {
        message: 'Achievement unlocked',
        data: result,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to unlock achievement:', { error: error.message, stack: error.stack });
      return sendError(res, 500, { message: 'Failed to unlock achievement' });
    }
  }

  /**
   * Get achievement progress
   */
  static async getAchievementProgress(req, res) {
    try {
      const userId = req.user.id;
      const { achievementId } = req.params;
      const progress = await GamificationService.getAchievementProgress(userId, achievementId);

      return sendSuccess(res, 200, {
        message: 'Achievement progress retrieved',
        data: progress,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get achievement progress:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, { message: 'Failed to get achievement progress' });
    }
  }

  /**
   * Get recent achievements
   */
  static async getRecentAchievements(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 5 } = req.query;
      const achievements = await GamificationService.getRecentAchievements(userId, parseInt(limit));

      return sendSuccess(res, 200, {
        message: 'Recent achievements retrieved',
        data: achievements,
      });
    } catch (/** @type {any} */ error) {
      logger.error('Failed to get recent achievements:', {
        error: error.message,
        stack: error.stack,
      });
      return sendError(res, 500, { message: 'Failed to get recent achievements' });
    }
  }
}

module.exports = GamificationController;
