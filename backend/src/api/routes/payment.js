/**
 * Payment Routes
 *
 * All payment-related API endpoints including:
 * - /api/payment/tiers - Subscription tiers
 * - /api/payment/status - Payment status
 * - /api/payment/stripe/* - Stripe endpoints
 * - /api/payment/paypal/* - PayPal endpoints
 * - /api/payment/apple/* - Apple IAP endpoints
 * - /api/payment/google/* - Google Play endpoints
 * - /api/payment/webhooks/* - Webhook handlers
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

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

const router = express.Router();

// ==================== PUBLIC ENDPOINTS ====================

// Get subscription tiers (public)
router.get('/tiers', paymentController.getSubscriptionTiers);

// ==================== WEBHOOK ENDPOINTS (No auth, raw body) ====================
// These must be defined before the authenticate middleware
// Note: Stripe requires raw body for signature verification

router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

router.post('/webhooks/paypal', express.json(), paymentController.paypalWebhook);

router.post('/webhooks/apple', express.json(), paymentController.appleWebhook);

router.post('/webhooks/google', express.json(), paymentController.googleWebhook);

// ==================== AUTHENTICATED ENDPOINTS ====================

// Apply authentication to all routes below
router.use(authenticate);

// Status & History
router.get('/status', paymentController.getPaymentStatus);
router.get('/history', paymentController.getBillingHistory);

// ==================== STRIPE ROUTES ====================

// Create checkout session for subscription
router.post(
  '/stripe/checkout',
  [body('planType').isIn(['monthly', 'yearly']).withMessage('Plan type must be monthly or yearly')],
  handleValidationErrors,
  paymentController.createStripeCheckout
);

// Create payment intent for one-time purchase
router.post('/stripe/payment-intent', paymentController.createStripePaymentIntent);

// Create setup intent for saving payment method
router.post('/stripe/setup-intent', paymentController.createStripeSetupIntent);

// Get customer portal URL
router.get('/stripe/portal', paymentController.getStripePortal);

// ==================== PAYPAL ROUTES ====================

// Create subscription
router.post('/paypal/subscription', paymentController.createPayPalSubscription);

// Activate subscription after approval
router.post('/paypal/subscription/activate', paymentController.activatePayPalSubscription);

// Create order for one-time purchase
router.post('/paypal/order', paymentController.createPayPalOrder);

// Capture order after approval
router.post('/paypal/order/capture', paymentController.capturePayPalOrder);

// ==================== APPLE IAP ROUTES ====================

// Validate receipt
router.post(
  '/apple/validate',
  [body('receiptData').notEmpty().withMessage('Receipt data is required')],
  handleValidationErrors,
  paymentController.validateAppleReceipt
);

// Restore purchases
router.post('/apple/restore', paymentController.restoreApplePurchases);

// ==================== GOOGLE PLAY ROUTES ====================

// Validate purchase
router.post(
  '/google/validate',
  [
    body('purchaseToken').notEmpty().withMessage('Purchase token is required'),
    body('productId').notEmpty().withMessage('Product ID is required'),
  ],
  handleValidationErrors,
  paymentController.validateGooglePurchase
);

// Restore purchases
router.post('/google/restore', paymentController.restoreGooglePurchases);

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Cancel subscription
router.post('/subscription/cancel', paymentController.cancelSubscription);

// Resume subscription
router.post('/subscription/resume', paymentController.resumeSubscription);

// ==================== REFUND ROUTES ====================

// Request refund
router.post(
  '/refund/request',
  [
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Refund reason is required')
      .isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  paymentController.requestRefund
);

module.exports = router;
