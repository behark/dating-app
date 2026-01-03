/**
 * Privacy Routes
 * GDPR and CCPA compliance endpoints
 */

const express = require('express');
const router = express.Router();
const privacyController = require('../controllers/privacyController');
const { authenticate } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimiter');

// Apply authentication to all privacy routes
router.use(authenticate);

// Apply stricter rate limiting to privacy endpoints
const privacyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10 // Max 10 requests per window
});

/**
 * GDPR: Data Portability - Export all user data
 * GET /api/privacy/export
 */
router.get('/export', privacyLimiter, privacyController.exportUserData);

/**
 * Privacy Settings
 * GET /api/privacy/settings
 * PUT /api/privacy/settings
 */
router.get('/settings', privacyController.getPrivacySettings);
router.put('/settings', privacyController.updatePrivacySettings);

/**
 * CCPA: Do Not Sell My Personal Information
 * POST /api/privacy/do-not-sell
 */
router.post('/do-not-sell', privacyController.doNotSell);

/**
 * GDPR: Right to be Forgotten - Delete account and all data
 * DELETE /api/privacy/delete-account
 */
router.delete('/delete-account', privacyLimiter, privacyController.deleteAccount);

/**
 * GDPR: Right to Rectification - Update personal data
 * PUT /api/privacy/rectify
 */
router.put('/rectify', privacyController.rectifyData);

/**
 * Consent Management
 * GET /api/privacy/consent - Get consent status
 * POST /api/privacy/consent - Record consent
 * DELETE /api/privacy/consent - Withdraw consent
 */
router.get('/consent', privacyController.getConsentStatus);
router.post('/consent', privacyController.recordConsent);
router.delete('/consent', privacyController.withdrawConsent);

module.exports = router;
