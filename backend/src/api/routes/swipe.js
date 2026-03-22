const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const swipeController = require('../controllers/swipeController');
const { asyncHandler } = require('../../shared/utils/responseHelpers');

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

/**
 * POST /api/swipes
 * Create a new swipe
 * Body: { targetId, action, isPriority? }
 * Returns: { swipeId, action, isMatch, matchData?, remaining }
 */
router.post(
  '/',
  authenticate,
  [
    body('targetId').isMongoId().withMessage('Invalid target user ID format'),
    body('action')
      .isIn(['like', 'pass', 'superlike'])
      .withMessage('Action must be like, pass, or superlike'),
    body('isPriority').optional().isBoolean(),
  ],
  handleValidationErrors,
  asyncHandler(swipeController.createSwipe)
);

/**
 * GET /api/swipes/count/today
 * Get swipe count for today
 */
router.get('/count/today', authenticate, asyncHandler(swipeController.getSwipeCountToday));

/**
 * POST /api/swipes/undo
 * Undo a swipe
 * Body: { swipeId }
 */
router.post(
  '/undo',
  authenticate,
  [body('swipeId').isMongoId().withMessage('Invalid swipe ID format')],
  handleValidationErrors,
  asyncHandler(swipeController.undoSwipe)
);

/**
 * GET /api/swipes/user
 * Get user's swipes
 */
router.get('/user', authenticate, asyncHandler(swipeController.getUserSwipes));

/**
 * GET /api/swipes/received
 * Get received swipes (likes)
 */
router.get('/received', authenticate, asyncHandler(swipeController.getReceivedSwipes));

/**
 * GET /api/swipes/stats
 * Get swipe statistics for the current user
 */
router.get('/stats', authenticate, asyncHandler(swipeController.getSwipeStats));

/**
 * GET /api/swipes/pending-likes
 * Get pending likes (who liked you but you haven't swiped on yet)
 * Premium feature - free users only see count
 */
router.get(
  '/pending-likes',
  authenticate,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a non-negative integer'),
  ],
  handleValidationErrors,
  asyncHandler(swipeController.getPendingLikes)
);

/**
 * GET /api/swipes/matches
 * Get all matches for the current user
 * Query: { status?, limit?, skip?, sortBy? }
 */
router.get(
  '/matches',
  authenticate,
  [
    query('status')
      .optional()
      .isIn(['active', 'unmatched', 'blocked'])
      .withMessage('Invalid match status'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a non-negative integer'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'lastActivityAt'])
      .withMessage('Invalid sort field'),
  ],
  handleValidationErrors,
  asyncHandler(swipeController.getMatches)
);

/**
 * DELETE /api/swipes/matches/:matchId
 * Unmatch with a user
 */
router.delete(
  '/matches/:matchId',
  authenticate,
  [param('matchId').isMongoId().withMessage('Invalid match ID format')],
  handleValidationErrors,
  asyncHandler(swipeController.unmatch)
);

module.exports = router;
