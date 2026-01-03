const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const swipeController = require('../controllers/swipeController');

/**
 * POST /api/swipes
 * Create a new swipe
 * Body: { targetId, action, isPriority? }
 * Returns: { swipeId, action, isMatch, matchData?, remaining }
 */
router.post('/', authenticate, swipeController.createSwipe);

/**
 * GET /api/swipes/count/today
 * Get swipe count for today
 */
router.get('/count/today', authenticate, swipeController.getSwipeCountToday);

/**
 * POST /api/swipes/undo
 * Undo a swipe
 * Body: { swipeId }
 */
router.post('/undo', authenticate, swipeController.undoSwipe);

/**
 * GET /api/swipes/user
 * Get user's swipes
 */
router.get('/user', authenticate, swipeController.getUserSwipes);

/**
 * GET /api/swipes/received
 * Get received swipes (likes)
 */
router.get('/received', authenticate, swipeController.getReceivedSwipes);

/**
 * GET /api/swipes/stats
 * Get swipe statistics for the current user
 */
router.get('/stats', authenticate, swipeController.getSwipeStats);

/**
 * GET /api/swipes/pending-likes
 * Get pending likes (who liked you but you haven't swiped on yet)
 * Premium feature - free users only see count
 */
router.get('/pending-likes', authenticate, swipeController.getPendingLikes);

/**
 * GET /api/swipes/matches
 * Get all matches for the current user
 * Query: { status?, limit?, skip?, sortBy? }
 */
router.get('/matches', authenticate, swipeController.getMatches);

/**
 * DELETE /api/swipes/matches/:matchId
 * Unmatch with a user
 */
router.delete('/matches/:matchId', authenticate, swipeController.unmatch);

module.exports = router;
