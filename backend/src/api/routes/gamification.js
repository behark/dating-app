const express = require('express');
const { body, param, validationResult } = require('express-validator');
const GamificationController = require('../controllers/gamificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Helper middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => {
        if ('path' in err) {
          return { field: err.path, message: err.msg };
        }
        return { field: 'unknown', message: err.msg };
      }),
    });
  }
  next();
};

// Reusable param validators
const validateUserId = [
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors,
];

/**
 * SWIPE STREAKS
 */
// Track a swipe
router.post(
  '/streaks/track',
  [body('userId').isMongoId().withMessage('Invalid user ID format')],
  handleValidationErrors,
  GamificationController.trackSwipe
);

// Get swipe streak
router.get('/streaks/:userId', ...validateUserId, GamificationController.getSwipeStreak);

// Get streak leaderboard
router.get('/leaderboards/streaks', GamificationController.getStreakLeaderboard);

// Get longest streak leaderboard
router.get('/leaderboards/longest-streaks', GamificationController.getLongestStreakLeaderboard);

/**
 * ACHIEVEMENT BADGES
 */
// Award a badge
router.post(
  '/badges/award',
  [
    body('userId').isMongoId().withMessage('Invalid user ID format'),
    body('badgeType').trim().notEmpty().withMessage('Badge type is required'),
    body('badgeName').trim().notEmpty().withMessage('Badge name is required'),
    body('points').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  GamificationController.awardBadge
);

// Get user badges
router.get('/badges/:userId', ...validateUserId, GamificationController.getUserBadges);

// Update user badges based on activity
router.post('/badges/:userId/update', ...validateUserId, GamificationController.updateUserBadges);

/**
 * DAILY LOGIN REWARDS
 */
// Get daily rewards
router.get('/rewards/:userId', ...validateUserId, GamificationController.getDailyReward);

// Claim a reward
router.post(
  '/rewards/:rewardId/claim',
  [param('rewardId').isMongoId().withMessage('Invalid reward ID format')],
  handleValidationErrors,
  GamificationController.claimReward
);

/**
 * USER GAMIFICATION STATS
 */
// Get overall gamification stats
router.get('/stats/:userId', ...validateUserId, GamificationController.getUserStats);

/**
 * LEVEL PROGRESSION
 */
// Get user level
router.get('/levels/:userId', ...validateUserId, GamificationController.getUserLevel);

// Add XP to user
router.post(
  '/levels/add-xp',
  [
    body('userId').isMongoId().withMessage('Invalid user ID format'),
    body('xp').isInt({ min: 1, max: 10000 }).withMessage('XP must be between 1 and 10000'),
  ],
  handleValidationErrors,
  GamificationController.addXP
);

// Get level rewards
router.get(
  '/levels/:level/rewards',
  [param('level').isInt({ min: 1, max: 100 }).withMessage('Level must be between 1 and 100')],
  handleValidationErrors,
  GamificationController.getLevelRewards
);

/**
 * DAILY CHALLENGES
 */
// Get daily challenges
router.get(
  '/challenges/daily/:userId',
  ...validateUserId,
  GamificationController.getDailyChallenges
);

// Update challenge progress
router.post(
  '/challenges/progress',
  [
    body('challengeId').notEmpty().withMessage('Challenge ID is required'),
    body('progress').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  GamificationController.updateChallengeProgress
);

// Track action for challenges
router.post(
  '/challenges/track',
  [body('action').trim().notEmpty().withMessage('Action is required')],
  handleValidationErrors,
  GamificationController.trackChallengeAction
);

// Claim challenge reward
router.post(
  '/challenges/claim',
  [body('challengeId').notEmpty().withMessage('Challenge ID is required')],
  handleValidationErrors,
  GamificationController.claimChallengeReward
);

// Get completion bonus
router.get(
  '/challenges/bonus/:userId',
  ...validateUserId,
  GamificationController.getCompletionBonus
);

// Claim completion bonus
router.post(
  '/challenges/bonus/:userId/claim',
  ...validateUserId,
  GamificationController.claimCompletionBonus
);

/**
 * ACHIEVEMENTS
 */
// Get user achievements
router.get('/achievements/:userId', ...validateUserId, GamificationController.getUserAchievements);

// Check and unlock achievements
router.post('/achievements/check', GamificationController.checkAchievements);

// Unlock an achievement
router.post(
  '/achievements/unlock',
  [body('achievementId').notEmpty().withMessage('Achievement ID is required')],
  handleValidationErrors,
  GamificationController.unlockAchievement
);

// Get achievement progress
router.get(
  '/achievements/:userId/:achievementId/progress',
  [
    param('userId').isMongoId().withMessage('Invalid user ID format'),
    param('achievementId').notEmpty().withMessage('Achievement ID is required'),
  ],
  handleValidationErrors,
  GamificationController.getAchievementProgress
);

// Get recent achievements
router.get(
  '/achievements/:userId/recent',
  ...validateUserId,
  GamificationController.getRecentAchievements
);

module.exports = router;
