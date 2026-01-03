const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const advancedInteractionsController = require('../controllers/advancedInteractionsController');

// Super Likes routes
router.post('/super-like', auth, advancedInteractionsController.sendSuperLike);
router.get('/super-like-quota', auth, advancedInteractionsController.getSuperLikeQuota);

// Rewind routes
router.post('/rewind', auth, advancedInteractionsController.rewindLastSwipe);
router.get('/rewind-quota', auth, advancedInteractionsController.getRewindQuota);

// Boost Profile routes
router.post('/boost', auth, advancedInteractionsController.boostProfile);
router.get('/boost-quota', auth, advancedInteractionsController.getBoostQuota);

module.exports = router;
