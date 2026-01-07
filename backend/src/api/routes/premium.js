const express = require('express');
const premiumController = require('../controllers/premiumController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Subscription management
router.get('/subscription/status', premiumController.getSubscriptionStatus);
router.post('/subscription/trial/start', premiumController.startTrial);
router.post('/subscription/upgrade', premiumController.upgradeToPremium);
router.post('/subscription/cancel', premiumController.cancelSubscription);

// See Who Liked You
router.get('/likes/received', premiumController.getReceivedLikes);

// Passport Feature
router.get('/passport/status', premiumController.getPassportStatus);
router.post('/passport/location', premiumController.setPassportLocation);
router.post('/passport/disable', premiumController.disablePassport);

// Advanced Filters
router.get('/filters/options', premiumController.getAdvancedFilterOptions);
router.post('/filters/update', premiumController.updateAdvancedFilters);

// Priority Likes
router.post('/likes/priority', premiumController.sendPriorityLike);

// Ads Preferences
router.post('/ads/preferences', premiumController.updateAdsPreferences);

// Profile Boost Analytics
router.get('/analytics/boosts', premiumController.getBoostAnalytics);
router.post('/analytics/boost-session', premiumController.recordBoostSession);

module.exports = router;
