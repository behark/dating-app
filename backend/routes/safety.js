const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');
const safetyAdvancedController = require('../controllers/safetyAdvancedController');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// EXISTING SAFETY ENDPOINTS
// ============================================================

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

// Get current user's account status (for shadow-lock transparency)
router.get('/account-status', authenticateToken, safetyController.getAccountStatus);

// Appeal a suspension (for auto-suspended users)
router.post('/appeal', authenticateToken, safetyController.appealSuspension);

// ============================================================
// ADVANCED SAFETY FEATURES (Tier 2 Features)
// ============================================================

// Date Plans - Share date plan with friends for safety
router.post('/date-plan', authenticateToken, safetyAdvancedController.shareDatePlan);

// Get active date plans
router.get('/date-plans/active', authenticateToken, safetyAdvancedController.getActiveDatePlans);

// Check-in Features
router.post('/checkin/start', authenticateToken, safetyAdvancedController.startCheckIn);
router.post(
  '/checkin/:checkInId/complete',
  authenticateToken,
  safetyAdvancedController.completeCheckIn
);

// Emergency SOS Button
router.post('/sos', authenticateToken, safetyAdvancedController.sendEmergencySOS);
router.get('/sos/active', authenticateToken, safetyAdvancedController.getActiveSOS);
router.post('/sos/:sosAlertId/respond', authenticateToken, safetyAdvancedController.respondToSOS);
router.put('/sos/:sosAlertId/resolve', authenticateToken, safetyAdvancedController.resolveSOS);

// Background Checks (Premium Feature)
router.post(
  '/background-check',
  authenticateToken,
  safetyAdvancedController.initiateBackgroundCheck
);
router.get(
  '/background-check/:backgroundCheckId',
  authenticateToken,
  safetyAdvancedController.getBackgroundCheckStatus
);

// Emergency Contacts
router.post('/emergency-contact', authenticateToken, safetyAdvancedController.addEmergencyContact);
router.get('/emergency-contacts', authenticateToken, safetyAdvancedController.getEmergencyContacts);
router.delete(
  '/emergency-contact/:contactId',
  authenticateToken,
  safetyAdvancedController.deleteEmergencyContact
);

// Advanced Photo Verification with Liveness Detection
router.post(
  '/photo-verification/advanced',
  authenticateToken,
  safetyAdvancedController.submitAdvancedPhotoVerification
);

module.exports = router;
