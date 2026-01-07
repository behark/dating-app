const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const discoveryEnhancementsController = require('../controllers/discoveryEnhancementsController');

// Explore/Browse mode - supports guest access to demo profiles
router.get('/explore', optionalAuth, discoveryEnhancementsController.exploreUsers);

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

// Admin: Approve verification
router.post(
  '/approve-verification',
  authenticate,
  discoveryEnhancementsController.approveProfileVerification
);

module.exports = router;
