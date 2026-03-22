const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const safetyController = require('../controllers/safetyController');
const safetyAdvancedController = require('../controllers/safetyAdvancedController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Helper middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => {
        if ('path' in err) {
          return { field: err.path, message: err.msg };
        }
        return { field: 'unknown', message: err.msg };
      }),
    });
  }
  next();
};

// ============================================================
// EXISTING SAFETY ENDPOINTS
// ============================================================

// Report user
router.post(
  '/report',
  authenticateToken,
  [
    body('reportedUserId').isMongoId().withMessage('Invalid user ID format'),
    body('reason')
      .isIn(['inappropriate', 'spam', 'harassment', 'fake_profile', 'underage', 'other'])
      .withMessage('Invalid report reason'),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  safetyController.reportUser
);

// Get reports (admin only)
router.get('/reports', authenticateToken, isAdmin, safetyController.getReports);

// Review report (admin only)
router.put(
  '/reports/:reportId/review',
  authenticateToken,
  isAdmin,
  [param('reportId').isMongoId().withMessage('Invalid report ID format')],
  handleValidationErrors,
  safetyController.reviewReport
);

// Block user
router.post(
  '/block',
  authenticateToken,
  [body('blockedUserId').isMongoId().withMessage('Invalid user ID format')],
  handleValidationErrors,
  safetyController.blockUser
);

// Unblock user
router.delete(
  '/block/:blockedUserId',
  authenticateToken,
  [param('blockedUserId').isMongoId().withMessage('Invalid user ID format')],
  handleValidationErrors,
  safetyController.unblockUser
);

// Get blocked users
router.get('/blocked', authenticateToken, safetyController.getBlockedUsers);

// Check if user is blocked
router.get(
  '/blocked/:otherUserId',
  authenticateToken,
  [param('otherUserId').isMongoId().withMessage('Invalid user ID format')],
  handleValidationErrors,
  safetyController.checkIfBlocked
);

// Flag content
router.post(
  '/flag',
  authenticateToken,
  [
    body('contentType')
      .isIn(['message', 'photo', 'profile', 'bio'])
      .withMessage('Invalid content type'),
    body('contentId').notEmpty().withMessage('Content ID is required'),
    body('reason').optional().trim().isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  safetyController.flagContent
);

// Get safety score (admin)
router.get(
  '/safety-score/:userId',
  authenticateToken,
  isAdmin,
  [param('userId').isMongoId().withMessage('Invalid user ID format')],
  handleValidationErrors,
  safetyController.getSafetyScore
);

// Get safety tips (public)
router.get('/tips', safetyController.getSafetyTips);

// Suspend user (admin)
router.put(
  '/suspend/:userId',
  authenticateToken,
  isAdmin,
  [param('userId').isMongoId().withMessage('Invalid user ID format')],
  handleValidationErrors,
  safetyController.suspendUser
);

// Unsuspend user (admin)
router.put(
  '/unsuspend/:userId',
  authenticateToken,
  isAdmin,
  [param('userId').isMongoId().withMessage('Invalid user ID format')],
  handleValidationErrors,
  safetyController.unsuspendUser
);

// Get current user's account status (for shadow-lock transparency)
router.get('/account-status', authenticateToken, safetyController.getAccountStatus);

// Appeal a suspension (for auto-suspended users)
router.post(
  '/appeal',
  authenticateToken,
  [
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Appeal reason is required')
      .isLength({ max: 2000 }),
  ],
  handleValidationErrors,
  safetyController.appealSuspension
);

// ============================================================
// ADVANCED SAFETY FEATURES (Tier 2 Features)
// ============================================================

// Date Plans - Share date plan with friends for safety
router.post('/date-plan', authenticateToken, safetyAdvancedController.shareDatePlan);

// Get active date plans
router.get('/date-plans/active', authenticateToken, safetyAdvancedController.getActiveDatePlans);

// Get date plans shared with user
router.get('/date-plans/shared', authenticateToken, safetyAdvancedController.getSharedDatePlans);

// Update date plan status
router.put(
  '/date-plan/:datePlanId',
  authenticateToken,
  [param('datePlanId').isMongoId().withMessage('Invalid date plan ID format')],
  handleValidationErrors,
  safetyAdvancedController.updateDatePlan
);

// Check-in Features
router.post('/checkin/start', authenticateToken, safetyAdvancedController.startCheckIn);
router.get('/checkin/active', authenticateToken, safetyAdvancedController.getActiveCheckIns);
router.post(
  '/checkin/:checkInId/complete',
  authenticateToken,
  [param('checkInId').isMongoId().withMessage('Invalid check-in ID format')],
  handleValidationErrors,
  safetyAdvancedController.completeCheckIn
);

// Emergency SOS Button
router.post('/sos', authenticateToken, safetyAdvancedController.sendEmergencySOS);
router.get('/sos/active', authenticateToken, safetyAdvancedController.getActiveSOS);
router.post(
  '/sos/:sosAlertId/respond',
  authenticateToken,
  [param('sosAlertId').isMongoId().withMessage('Invalid SOS alert ID format')],
  handleValidationErrors,
  safetyAdvancedController.respondToSOS
);
router.put(
  '/sos/:sosAlertId/resolve',
  authenticateToken,
  [param('sosAlertId').isMongoId().withMessage('Invalid SOS alert ID format')],
  handleValidationErrors,
  safetyAdvancedController.resolveSOS
);

// Background Checks (Premium Feature)
router.post(
  '/background-check',
  authenticateToken,
  safetyAdvancedController.initiateBackgroundCheck
);
router.get(
  '/background-check/:backgroundCheckId',
  authenticateToken,
  [param('backgroundCheckId').isMongoId().withMessage('Invalid background check ID format')],
  handleValidationErrors,
  safetyAdvancedController.getBackgroundCheckStatus
);
router.put(
  '/background-check/:backgroundCheckId',
  authenticateToken,
  [param('backgroundCheckId').isMongoId().withMessage('Invalid background check ID format')],
  handleValidationErrors,
  safetyAdvancedController.updateBackgroundCheck
);

// Emergency Contacts
router.post('/emergency-contact', authenticateToken, safetyAdvancedController.addEmergencyContact);
router.get('/emergency-contacts', authenticateToken, safetyAdvancedController.getEmergencyContacts);
router.delete(
  '/emergency-contact/:contactId',
  authenticateToken,
  [param('contactId').isMongoId().withMessage('Invalid contact ID format')],
  handleValidationErrors,
  safetyAdvancedController.deleteEmergencyContact
);

// Advanced Photo Verification with Liveness Detection
router.post(
  '/photo-verification/advanced',
  authenticateToken,
  safetyAdvancedController.submitAdvancedPhotoVerification
);

// Get photo verification status
router.get(
  '/photo-verification/status',
  authenticateToken,
  safetyAdvancedController.getPhotoVerificationStatus
);

module.exports = router;
