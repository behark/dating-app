const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const featureFlagController = require('../controllers/featureFlagController');

// Get user's feature flags
router.get('/', authenticate, featureFlagController.getUserFlags);

// Get specific flag
router.get('/:flagName', authenticate, featureFlagController.getFlag);

// Admin routes
router.get('/admin', authenticate, isAdmin, featureFlagController.getAllFlags);
router.post('/admin', authenticate, isAdmin, featureFlagController.createOrUpdateFlag);
router.put('/admin/:flagName/rollout', authenticate, isAdmin, featureFlagController.updateRollout);
router.post(
  '/admin/:flagName/override',
  authenticate,
  isAdmin,
  featureFlagController.setUserOverride
);
router.delete(
  '/admin/:flagName/override/:userId',
  authenticate,
  isAdmin,
  featureFlagController.removeUserOverride
);

module.exports = router;
