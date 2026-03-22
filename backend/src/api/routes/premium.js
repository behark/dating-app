const express = require('express');
const { body, validationResult } = require('express-validator');
const premiumController = require('../controllers/premiumController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

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

// All routes require authentication
router.use(authenticate);

// Subscription management
router.get('/subscription/status', premiumController.getSubscriptionStatus);
router.post('/subscription/trial/start', premiumController.startTrial);
router.post(
  '/subscription/upgrade',
  [body('planType').isIn(['monthly', 'yearly']).withMessage('Plan type must be monthly or yearly')],
  handleValidationErrors,
  premiumController.upgradeToPremium
);
router.post('/subscription/cancel', premiumController.cancelSubscription);

// See Who Liked You
router.get('/likes/received', premiumController.getReceivedLikes);

// Passport Feature
router.get('/passport/status', premiumController.getPassportStatus);
router.post(
  '/passport/location',
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('city').optional().trim().isLength({ max: 200 }),
    body('country').optional().trim().isLength({ max: 100 }),
  ],
  handleValidationErrors,
  premiumController.setPassportLocation
);
router.post('/passport/disable', premiumController.disablePassport);

// Advanced Filters
router.get('/filters/options', premiumController.getAdvancedFilterOptions);
router.post('/filters/update', premiumController.updateAdvancedFilters);

// Priority Likes
router.post(
  '/likes/priority',
  [body('targetUserId').isMongoId().withMessage('Invalid target user ID format')],
  handleValidationErrors,
  premiumController.sendPriorityLike
);

// Ads Preferences
router.post(
  '/ads/preferences',
  [body('showAds').optional().isBoolean(), body('adCategories').optional().isArray({ max: 20 })],
  handleValidationErrors,
  premiumController.updateAdsPreferences
);

// Profile Boost Analytics
router.get('/analytics/boosts', premiumController.getBoostAnalytics);
router.post(
  '/analytics/boost-session',
  [
    body('duration')
      .isInt({ min: 1, max: 1440 })
      .withMessage('Duration must be between 1 and 1440 minutes'),
    body('viewsGained').optional().isInt({ min: 0 }),
    body('likesGained').optional().isInt({ min: 0 }),
    body('matches').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  premiumController.recordBoostSession
);

module.exports = router;
