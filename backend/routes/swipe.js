const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const swipeController = require('../controllers/swipeController');

/**
 * POST /api/swipes
 * Create a new swipe
 * Body: { targetId, action }
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

module.exports = router;
