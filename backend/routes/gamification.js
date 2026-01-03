const express = require('express');
const GamificationController = require('../controllers/gamificationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

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

module.exports = router;
