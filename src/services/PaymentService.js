/**
 * Payment Service (Frontend)
 *
 * Handles all payment operations on the client side including:
 * - Subscription management
 * - In-app purchases (iOS/Android)
 * - Stripe/PayPal web payments
 */

import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { ERROR_MESSAGES } from '../constants/constants';
import { handleApiResponse } from '../utils/apiResponseHandler';
import logger from '../utils/logger';
import api from './api';

export class PaymentService {
  // ==================== SUBSCRIPTION TIERS ====================

  /**
   * Get available subscription tiers
   */
  static async getSubscriptionTiers() {
    try {
      const response = await api.get('/payment/tiers');
      const handled = handleApiResponse(response, 'Get subscription tiers');
      return handled.data || { tiers: [], consumables: {} };
    } catch (error) {
      logger.error('Error getting subscription tiers:', error);
      return { tiers: [], consumables: {} };
    }
  }

  /**
   * Get current payment status
   */
  static async getPaymentStatus(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      const response = await api.get('/payment/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const handled = handleApiResponse(response, 'Get payment status');
      return handled.data || null;
    } catch (error) {
      logger.error('Error getting payment status:', error);
      return null;
    }
  }

  /**
   * Get billing history
   */
  static async getBillingHistory(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      const response = await api.get('/payment/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const handled = handleApiResponse(response, 'Get billing history');
      return handled.data || { invoices: [], transactions: [] };
    } catch (error) {
      logger.error('Error getting billing history:', error);
      return { invoices: [], transactions: [] };
    }
  }

  // ==================== STRIPE PAYMENTS ====================

  /**
   * Create Stripe checkout session for subscription
   */
  static async createStripeCheckout(planType, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!['monthly', 'yearly'].includes(planType)) {
        throw new Error('Plan type must be monthly or yearly');
      }
      const response = await api.post(
        '/payment/stripe/checkout',
        { planType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Create Stripe checkout');

      if (handled.success && handled.data?.url) {
        await Linking.openURL(handled.data.url);
      }

      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error creating Stripe checkout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create payment intent for one-time purchase (web)
   */
  static async createStripePaymentIntent(productType, productId, quantity, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!productType || !productId) {
        throw new Error('Product type and product ID are required');
      }
      const safeQuantity = Number.isFinite(quantity) ? quantity : 1;
      if (safeQuantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      const response = await api.post(
        '/payment/stripe/payment-intent',
        { productType, productId, quantity: safeQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Create Stripe payment intent');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Stripe customer portal URL
   */
  static async getStripePortal(token) {
    try {
      const response = await api.get('/payment/stripe/portal', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const handled = handleApiResponse(response, 'Get Stripe portal');

      if (handled.success && handled.data?.url) {
        await Linking.openURL(handled.data.url);
      }

      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error getting Stripe portal:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== PAYPAL PAYMENTS ====================

  /**
   * Create PayPal subscription
   */
  static async createPayPalSubscription(planType, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!['monthly', 'yearly'].includes(planType)) {
        throw new Error('Plan type must be monthly or yearly');
      }
      const response = await api.post(
        '/payment/paypal/subscription',
        { planType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Create PayPal subscription');

      if (handled.success && handled.data?.approvalUrl) {
        await Linking.openURL(handled.data.approvalUrl);
      }

      return handled;
    } catch (error) {
      logger.error('Error creating PayPal subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Activate PayPal subscription after approval
   */
  static async activatePayPalSubscription(subscriptionId, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }
      const response = await api.post(
        '/payment/paypal/subscription/activate',
        { subscriptionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Activate PayPal subscription');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error activating PayPal subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create PayPal order for one-time purchase
   */
  static async createPayPalOrder(productType, productId, quantity, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!productType || !productId) {
        throw new Error('Product type and product ID are required');
      }
      const safeQuantity = Number.isFinite(quantity) ? quantity : 1;
      if (safeQuantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      const response = await api.post(
        '/payment/paypal/order',
        { productType, productId, quantity: safeQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Create PayPal order');

      if (handled.success && handled.data?.approvalUrl) {
        await Linking.openURL(handled.data.approvalUrl);
      }

      return handled;
    } catch (error) {
      logger.error('Error creating PayPal order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Capture PayPal order after approval
   */
  static async capturePayPalOrder(orderId, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      const response = await api.post(
        '/payment/paypal/order/capture',
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Capture PayPal order');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error capturing PayPal order:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== APPLE IAP ====================

  /**
   * Validate Apple receipt
   */
  static async validateAppleReceipt(receiptData, productId, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!receiptData || !productId) {
        throw new Error('Receipt data and product ID are required');
      }
      const response = await api.post(
        '/payment/apple/validate',
        { receiptData, productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Validate Apple receipt');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error validating Apple receipt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore Apple purchases
   */
  static async restoreApplePurchases(receiptData, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!receiptData) {
        throw new Error('Receipt data is required');
      }
      const response = await api.post(
        '/payment/apple/restore',
        { receiptData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Restore Apple purchases');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error restoring Apple purchases:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== GOOGLE PLAY ====================

  /**
   * Validate Google Play purchase
   */
  static async validateGooglePurchase(purchaseToken, productId, isSubscription, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!purchaseToken || !productId) {
        throw new Error('Purchase token and product ID are required');
      }
      const response = await api.post(
        '/payment/google/validate',
        { purchaseToken, productId, isSubscription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Validate Google purchase');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error validating Google purchase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore Google Play purchases
   */
  static async restoreGooglePurchases(purchases, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!Array.isArray(purchases)) {
        throw new Error('Purchases must be an array');
      }
      const response = await api.post(
        '/payment/google/restore',
        { purchases },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Restore Google purchases');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error restoring Google purchases:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  /**
   * Cancel subscription
   */
  static async cancelSubscription(immediately, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      const response = await api.post(
        '/payment/subscription/cancel',
        { immediately },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Cancel subscription');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resume cancelled subscription
   */
  static async resumeSubscription(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      const response = await api.post(
        '/payment/subscription/resume',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Resume subscription');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error resuming subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== REFUNDS ====================

  /**
   * Request a refund
   */
  static async requestRefund(transactionId, reason, amount, token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication token is required');
      }
      if (!transactionId || !reason) {
        throw new Error('Transaction ID and reason are required');
      }
      if (amount !== undefined && !Number.isFinite(amount)) {
        throw new Error('Amount must be a number');
      }
      const response = await api.post(
        '/payment/refund/request',
        { transactionId, reason, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Request refund');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error requesting refund:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== PLATFORM-SPECIFIC HELPERS ====================

  /**
   * Get the appropriate payment method for current platform
   */
  static getRecommendedPaymentMethod() {
    if (Platform.OS === 'ios') {
      return 'apple';
    } else if (Platform.OS === 'android') {
      return 'google';
    }
    return 'stripe'; // Web
  }

  /**
   * Check if in-app purchases are available
   */
  static isIAPAvailable() {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Open platform-specific subscription management
   */
  static async openSubscriptionManagement() {
    if (Platform.OS === 'ios') {
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      await Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }
}

export default PaymentService;
