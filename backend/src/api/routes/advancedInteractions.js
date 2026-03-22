const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const advancedInteractionsController = require('../controllers/advancedInteractionsController');

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

// Super Likes routes
router.post(
  '/super-like',
  authenticate,
  [body('targetUserId').isMongoId().withMessage('Invalid target user ID format')],
  handleValidationErrors,
  advancedInteractionsController.sendSuperLike
);
router.get('/super-like-quota', authenticate, advancedInteractionsController.getSuperLikeQuota);

// Rewind routes
router.post(
  '/rewind',
  authenticate,
  [body('swipeId').optional().isMongoId().withMessage('Invalid swipe ID format')],
  handleValidationErrors,
  advancedInteractionsController.rewindLastSwipe
);
router.get('/rewind-quota', authenticate, advancedInteractionsController.getRewindQuota);

// Boost Profile routes
router.post(
  '/boost',
  authenticate,
  [
    body('duration')
      .optional()
      .isInt({ min: 1, max: 1440 })
      .withMessage('Duration must be between 1 and 1440 minutes'),
  ],
  handleValidationErrors,
  advancedInteractionsController.boostProfile
);
router.get('/boost-quota', authenticate, advancedInteractionsController.getBoostQuota);

module.exports = router;
