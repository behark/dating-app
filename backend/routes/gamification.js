const express = require('express');
const GamificationController = require('../controllers/gamificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

/**
 * SWIPE STREAKS
 */
// Track a swipe
router.post('/streaks/track', GamificationController.trackSwipe);

// Get swipe streak
router.get('/streaks/:userId', GamificationController.getSwipeStreak);

// Get streak leaderboard
router.get('/leaderboards/streaks', GamificationController.getStreakLeaderboard);

// Get longest streak leaderboard
router.get('/leaderboards/longest-streaks', GamificationController.getLongestStreakLeaderboard);

/**
 * ACHIEVEMENT BADGES
 */
// Award a badge
router.post('/badges/award', GamificationController.awardBadge);

// Get user badges
router.get('/badges/:userId', GamificationController.getUserBadges);

// Update user badges based on activity
router.post('/badges/:userId/update', GamificationController.updateUserBadges);

/**
 * DAILY LOGIN REWARDS
 */
// Get daily rewards
router.get('/rewards/:userId', GamificationController.getDailyReward);

// Claim a reward
router.post('/rewards/:rewardId/claim', GamificationController.claimReward);

/**
 * USER GAMIFICATION STATS
 */
// Get overall gamification stats
router.get('/stats/:userId', GamificationController.getUserStats);

/**
 * LEVEL PROGRESSION
 */
// Get user level
router.get('/levels/:userId', GamificationController.getUserLevel);

// Add XP to user
router.post('/levels/add-xp', GamificationController.addXP);

// Get level rewards
router.get('/levels/:level/rewards', GamificationController.getLevelRewards);

/**
 * DAILY CHALLENGES
 */
// Get daily challenges
router.get('/challenges/daily/:userId', GamificationController.getDailyChallenges);

// Update challenge progress
router.post('/challenges/progress', GamificationController.updateChallengeProgress);

// Track action for challenges
router.post('/challenges/track', GamificationController.trackChallengeAction);

// Claim challenge reward
router.post('/challenges/claim', GamificationController.claimChallengeReward);

// Get completion bonus
router.get('/challenges/bonus/:userId', GamificationController.getCompletionBonus);

// Claim completion bonus
router.post('/challenges/bonus/:userId/claim', GamificationController.claimCompletionBonus);

/**
 * ACHIEVEMENTS
 */
// Get user achievements
router.get('/achievements/:userId', GamificationController.getUserAchievements);

// Check and unlock achievements
router.post('/achievements/check', GamificationController.checkAchievements);

// Unlock an achievement
router.post('/achievements/unlock', GamificationController.unlockAchievement);

// Get achievement progress
router.get('/achievements/:userId/:achievementId/progress', GamificationController.getAchievementProgress);

// Get recent achievements
router.get('/achievements/:userId/recent', GamificationController.getRecentAchievements);

module.exports = router;
