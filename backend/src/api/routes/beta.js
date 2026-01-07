const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const betaController = require('../controllers/betaController');

// All routes require authentication
router.use(authenticate);

// Enroll in beta
router.post('/enroll', betaController.enroll);

// Get beta status
router.get('/status', betaController.getStatus);

// Submit feedback
router.post('/feedback', betaController.submitFeedback);

// Get user's feedback
router.get('/feedback', betaController.getFeedback);

// Record session
router.post('/session', betaController.recordSession);

// Admin routes
router.get('/analytics', isAdmin, betaController.getAnalytics);
router.put('/feedback/:id', isAdmin, betaController.updateFeedbackStatus);

module.exports = router;
