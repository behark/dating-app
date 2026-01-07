const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const syncController = require('../controllers/syncController');

// All routes require authentication
router.use(authenticate);

// Execute queued offline actions
router.post('/execute', syncController.executeSync);

// Get sync conflicts
router.get('/conflicts', syncController.getConflicts);

// Resolve sync conflict
router.post('/resolve', syncController.resolveConflict);

// Get sync status
router.get('/status', syncController.getSyncStatus);

module.exports = router;
