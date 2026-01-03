/**
 * Payment Controller
 * 
 * Handles all payment-related API endpoints including:
 * - Stripe checkout and subscriptions
 * - PayPal payments
 * - In-app purchase validation
 * - Refund requests
 * - Payment webhooks
 */

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const SubscriptionTier = require('../models/SubscriptionTier');
const PaymentTransaction = require('../models/PaymentTransaction');
const StripeService = require('../services/StripeService');
const PayPalService = require('../services/PayPalService');
const AppleIAPService = require('../services/AppleIAPService');
const GooglePlayService = require('../services/GooglePlayService');
const RefundService = require('../services/RefundService');
const paymentConfig = require('../config/payment');

/**
 * Get available subscription tiers
 */
const getSubscriptionTiers = async (req, res) => {
  try {
    const tiers = await SubscriptionTier.getActiveTiers();

    res.json({
      success: true,
      data: {
        tiers,
        consumables: paymentConfig.consumableProducts,
      },
    });
  } catch (error) {
    console.error('Error getting subscription tiers:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscription tiers',
    });
  }
};

/**
 * Get current subscription status with payment info
 */
const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const subscription = await Subscription.findOne({ userId });

    // Get payment methods if Stripe customer exists
    let paymentMethods = [];
    if (user.stripeCustomerId) {
      paymentMethods = await StripeService.getPaymentMethods(user);
    }

    // Get upcoming invoice if subscribed
    let upcomingInvoice = null;
    if (subscription?.status === 'active' && subscription?.paymentMethod === 'stripe') {
      upcomingInvoice = await StripeService.getUpcomingInvoice(user);
    }

    res.json({
      success: true,
      data: {
        subscription: subscription ? {
          status: subscription.status,
          planType: subscription.planType,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          autoRenew: subscription.autoRenew,
          paymentMethod: subscription.paymentMethod,
          features: subscription.features,
        } : null,
        paymentMethods,
        upcomingInvoice,
        balances: {
          superLikes: user.superLikesBalance || 0,
          boosts: user.boostsBalance || 0,
          rewinds: user.rewindsBalance || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment status',
    });
  }
};

// ==================== STRIPE ENDPOINTS ====================

/**
 * Create Stripe checkout session for subscription
 */
const createStripeCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType } = req.body;

    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type',
      });
    }

    const user = await User.findById(userId);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await StripeService.createSubscriptionCheckout(
      user,
      planType,
      `${baseUrl}/payment/success`,
      `${baseUrl}/payment/cancel`
    );

    // Save Stripe customer ID if new
    if (!user.stripeCustomerId && session.customer) {
      user.stripeCustomerId = session.customer;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session',
    });
  }
};

/**
 * Create payment intent for one-time purchase
 */
const createStripePaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productType, productId, quantity = 1 } = req.body;

    const user = await User.findById(userId);

    const result = await StripeService.createPaymentIntent(
      user,
      productType,
      productId,
      quantity
    );

    // Save Stripe customer ID if new
    if (!user.stripeCustomerId) {
      const customer = await StripeService.getOrCreateCustomer(user);
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
    });
  }
};

/**
 * Create setup intent for saving payment method
 */
const createStripeSetupIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const result = await StripeService.createSetupIntent(user);

    if (!user.stripeCustomerId) {
      const customer = await StripeService.getOrCreateCustomer(user);
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating setup intent',
    });
  }
};

/**
 * Get Stripe customer portal URL
 */
const getStripePortal = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No billing information found',
      });
    }

    const portalUrl = await StripeService.createPortalSession(
      user,
      `${baseUrl}/settings/billing`
    );

    res.json({
      success: true,
      data: { url: portalUrl },
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      success: false,
      message: 'Error accessing billing portal',
    });
  }
};

/**
 * Get billing history
 */
const getBillingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Get Stripe history
    let stripeHistory = [];
    if (user.stripeCustomerId) {
      stripeHistory = await StripeService.getBillingHistory(user);
    }

    // Get all transactions from database
    const transactions = await PaymentTransaction.getUserTransactions(userId, {
      limit: 50,
    });

    res.json({
      success: true,
      data: {
        invoices: stripeHistory,
        transactions,
      },
    });
  } catch (error) {
    console.error('Error getting billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving billing history',
    });
  }
};

// ==================== PAYPAL ENDPOINTS ====================

/**
 * Create PayPal subscription
 */
const createPayPalSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType } = req.body;

    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type',
      });
    }

    const user = await User.findById(userId);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const result = await PayPalService.createSubscription(
      user,
      planType,
      `${baseUrl}/payment/paypal/success`,
      `${baseUrl}/payment/paypal/cancel`
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating PayPal subscription',
    });
  }
};

/**
 * Activate PayPal subscription after approval
 */
const activatePayPalSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const result = await PayPalService.activateSubscription(subscriptionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error activating PayPal subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating subscription',
    });
  }
};

/**
 * Create PayPal order for one-time purchase
 */
const createPayPalOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productType, productId, quantity = 1 } = req.body;

    const user = await User.findById(userId);

    const result = await PayPalService.createOrder(
      user,
      productType,
      productId,
      quantity
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating PayPal order',
    });
  }
};

/**
 * Capture PayPal order
 */
const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const result = await PayPalService.captureOrder(orderId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({
      success: false,
      message: 'Error capturing payment',
    });
  }
};

// ==================== APPLE IAP ENDPOINTS ====================

/**
 * Validate Apple receipt and process purchase
 */
const validateAppleReceipt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiptData, productId } = req.body;

    if (!receiptData) {
      return res.status(400).json({
        success: false,
        message: 'Receipt data is required',
      });
    }

    const result = await AppleIAPService.processPurchase(
      userId,
      receiptData,
      productId
    );

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Error validating Apple receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating purchase',
    });
  }
};

/**
 * Restore Apple purchases
 */
const restoreApplePurchases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiptData } = req.body;

    if (!receiptData) {
      return res.status(400).json({
        success: false,
        message: 'Receipt data is required',
      });
    }

    const result = await AppleIAPService.restorePurchases(userId, receiptData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error restoring Apple purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring purchases',
    });
  }
};

// ==================== GOOGLE PLAY ENDPOINTS ====================

/**
 * Validate Google Play purchase
 */
const validateGooglePurchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { purchaseToken, productId, isSubscription } = req.body;

    if (!purchaseToken || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Purchase token and product ID are required',
      });
    }

    let result;
    if (isSubscription) {
      result = await GooglePlayService.processSubscriptionPurchase(
        userId,
        purchaseToken,
        productId
      );
    } else {
      result = await GooglePlayService.processProductPurchase(
        userId,
        purchaseToken,
        productId
      );
    }

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Error validating Google purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating purchase',
    });
  }
};

/**
 * Restore Google Play purchases
 */
const restoreGooglePurchases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { purchases } = req.body;

    if (!purchases || !Array.isArray(purchases)) {
      return res.status(400).json({
        success: false,
        message: 'Purchases array is required',
      });
    }

    const result = await GooglePlayService.restorePurchases(userId, purchases);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error restoring Google purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring purchases',
    });
  }
};

// ==================== SUBSCRIPTION MANAGEMENT ====================

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { immediately = false } = req.body;

    const result = await RefundService.cancelSubscription(userId, !immediately);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
    });
  }
};

/**
 * Resume cancelled subscription
 */
const resumeSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await RefundService.resumeSubscription(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming subscription',
    });
  }
};

// ==================== REFUND ENDPOINTS ====================

/**
 * Request refund
 */
const requestRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId, reason, amount } = req.body;

    if (!transactionId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and reason are required',
      });
    }

    const result = await RefundService.requestRefund(
      userId,
      transactionId,
      reason,
      amount
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund request',
    });
  }
};

// ==================== WEBHOOK ENDPOINTS ====================

/**
 * Stripe webhook handler
 */
const stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = StripeService.verifyWebhookSignature(req.body, sig);

    await StripeService.processWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * PayPal webhook handler
 */
const paypalWebhook = async (req, res) => {
  try {
    const isValid = await PayPalService.verifyWebhookSignature(
      req.headers,
      req.body
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    await PayPalService.processWebhookEvent(req.body);

    res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Apple App Store Server Notification handler
 */
const appleWebhook = async (req, res) => {
  try {
    const { signedPayload } = req.body;

    if (!signedPayload) {
      return res.status(400).json({ error: 'Missing signed payload' });
    }

    await AppleIAPService.processServerNotification(signedPayload);

    res.json({ received: true });
  } catch (error) {
    console.error('Apple webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Google Play Real-time Developer Notification handler
 */
const googleWebhook = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    await GooglePlayService.processRTDN(message);

    // Acknowledge the message
    res.status(200).send();
  } catch (error) {
    console.error('Google webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  // Tiers & Status
  getSubscriptionTiers,
  getPaymentStatus,
  getBillingHistory,
  
  // Stripe
  createStripeCheckout,
  createStripePaymentIntent,
  createStripeSetupIntent,
  getStripePortal,
  
  // PayPal
  createPayPalSubscription,
  activatePayPalSubscription,
  createPayPalOrder,
  capturePayPalOrder,
  
  // Apple
  validateAppleReceipt,
  restoreApplePurchases,
  
  // Google
  validateGooglePurchase,
  restoreGooglePurchases,
  
  // Subscription Management
  cancelSubscription,
  resumeSubscription,
  
  // Refunds
  requestRefund,
  
  // Webhooks
  stripeWebhook,
  paypalWebhook,
  appleWebhook,
  googleWebhook,
};
