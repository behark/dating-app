const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');
const discoveryEnhancementsController = require('../controllers/discoveryEnhancementsController');

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

// Explore/Browse mode - supports guest access to demo profiles
router.get(
  '/explore',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
  handleValidationErrors,
  discoveryEnhancementsController.exploreUsers
);

// Top Picks
router.get('/top-picks', authenticate, discoveryEnhancementsController.getTopPicks);

// Recently Active Users
router.get(
  '/recently-active',
  authenticate,
  discoveryEnhancementsController.getRecentlyActiveUsers
);

// Verified Profiles
router.get('/verified', authenticate, discoveryEnhancementsController.getVerifiedProfiles);

// Profile Verification
router.post('/verify-profile', authenticate, discoveryEnhancementsController.verifyProfile);

// Admin: Approve verification (admin only - SECURITY FIX: was missing isAdmin check)
router.post(
  '/approve-verification',
  authenticate,
  isAdmin,
  discoveryEnhancementsController.approveProfileVerification
);

module.exports = router;
