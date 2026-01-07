const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const advancedInteractionsController = require('../controllers/advancedInteractionsController');

// Super Likes routes
router.post('/super-like', authenticate, advancedInteractionsController.sendSuperLike);
router.get('/super-like-quota', authenticate, advancedInteractionsController.getSuperLikeQuota);

// Rewind routes
router.post('/rewind', authenticate, advancedInteractionsController.rewindLastSwipe);
router.get('/rewind-quota', authenticate, advancedInteractionsController.getRewindQuota);

// Boost Profile routes
router.post('/boost', authenticate, advancedInteractionsController.boostProfile);
router.get('/boost-quota', authenticate, advancedInteractionsController.getBoostQuota);

module.exports = router;
