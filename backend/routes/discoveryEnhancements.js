const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const discoveryEnhancementsController = require('../controllers/discoveryEnhancementsController');

// Explore/Browse mode
router.get('/explore', auth, discoveryEnhancementsController.exploreUsers);

// Top Picks
router.get('/top-picks', auth, discoveryEnhancementsController.getTopPicks);

// Recently Active Users
router.get('/recently-active', auth, discoveryEnhancementsController.getRecentlyActiveUsers);

// Verified Profiles
router.get('/verified', auth, discoveryEnhancementsController.getVerifiedProfiles);

// Profile Verification
router.post('/verify-profile', auth, discoveryEnhancementsController.verifyProfile);

// Admin: Approve verification
router.post('/approve-verification', auth, discoveryEnhancementsController.approveProfileVerification);

module.exports = router;
