const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');
const { authenticateToken } = require('../middleware/auth');

// Report user
router.post('/report', authenticateToken, safetyController.reportUser);

// Get reports (admin only)
router.get('/reports', authenticateToken, safetyController.getReports);

// Review report (admin only)
router.put('/reports/:reportId/review', authenticateToken, safetyController.reviewReport);

// Block user
router.post('/block', authenticateToken, safetyController.blockUser);

// Unblock user
router.delete('/block/:blockedUserId', authenticateToken, safetyController.unblockUser);

// Get blocked users
router.get('/blocked', authenticateToken, safetyController.getBlockedUsers);

// Check if user is blocked
router.get('/blocked/:otherUserId', authenticateToken, safetyController.checkIfBlocked);

// Flag content
router.post('/flag', authenticateToken, safetyController.flagContent);

// Get safety score (admin)
router.get('/safety-score/:userId', authenticateToken, safetyController.getSafetyScore);

// Get safety tips (public)
router.get('/tips', safetyController.getSafetyTips);

// Suspend user (admin)
router.put('/suspend/:userId', authenticateToken, safetyController.suspendUser);

// Unsuspend user (admin)
router.put('/unsuspend/:userId', authenticateToken, safetyController.unsuspendUser);

module.exports = router;
