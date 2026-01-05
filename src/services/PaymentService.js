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
import { API_URL as API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import { validateNotEmpty } from '../utils/validators';

export class PaymentService {
  // ==================== SUBSCRIPTION TIERS ====================

  /**
   * Get available subscription tiers
   */
  static async getSubscriptionTiers() {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/tiers`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data.data || { tiers: [], consumables: {} };
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

      const response = await fetch(`${API_BASE_URL}/payment/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data.data || null;
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
      const response = await fetch(`${API_BASE_URL}/payment/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data.data || { invoices: [], transactions: [] };
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

      const response = await fetch(`${API_BASE_URL}/payment/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planType }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();

      if (data.success && data.data?.url) {
        // Open Stripe checkout in browser
        await Linking.openURL(data.data.url);
      }

      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error creating Stripe checkout:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  /**
   * Create payment intent for one-time purchase (web)
   */
  static async createStripePaymentIntent(productType, productId, quantity, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/stripe/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productType, productId, quantity }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  /**
   * Get Stripe customer portal URL
   */
  static async getStripePortal(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/stripe/portal`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();

      if (data.success && data.data?.url) {
        await Linking.openURL(data.data.url);
      }

      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error getting Stripe portal:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  // ==================== PAYPAL PAYMENTS ====================

  /**
   * Create PayPal subscription
   */
  static async createPayPalSubscription(planType, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/paypal/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planType }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();

      if (data.success && data.data?.approvalUrl) {
        await Linking.openURL(data.data.approvalUrl);
      }

      return data;
    } catch (error) {
      logger.error('Error creating PayPal subscription:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  /**
   * Activate PayPal subscription after approval
   */
  static async activatePayPalSubscription(subscriptionId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/paypal/subscription/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscriptionId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error activating PayPal subscription:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  /**
   * Create PayPal order for one-time purchase
   */
  static async createPayPalOrder(productType, productId, quantity, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/paypal/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productType, productId, quantity }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();

      if (data.success && data.data?.approvalUrl) {
        await Linking.openURL(data.data.approvalUrl);
      }

      return data;
    } catch (error) {
      logger.error('Error creating PayPal order:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  /**
   * Capture PayPal order after approval
   */
  static async capturePayPalOrder(orderId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/paypal/order/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error capturing PayPal order:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  // ==================== APPLE IAP ====================

  /**
   * Validate Apple receipt
   */
  static async validateAppleReceipt(receiptData, productId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/apple/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiptData, productId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error validating Apple receipt:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  /**
   * Restore Apple purchases
   */
  static async restoreApplePurchases(receiptData, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/apple/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiptData }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error restoring Apple purchases:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  // ==================== GOOGLE PLAY ====================

  /**
   * Validate Google Play purchase
   */
  static async validateGooglePurchase(purchaseToken, productId, isSubscription, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/google/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purchaseToken, productId, isSubscription }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error validating Google purchase:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  /**
   * Restore Google Play purchases
   */
  static async restoreGooglePurchases(purchases, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/google/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purchases }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error restoring Google purchases:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  /**
   * Cancel subscription
   */
  static async cancelSubscription(immediately, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ immediately }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  /**
   * Resume cancelled subscription
   */
  static async resumeSubscription(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/subscription/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error resuming subscription:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
    }
  }

  // ==================== REFUNDS ====================

  /**
   * Request a refund
   */
  static async requestRefund(transactionId, reason, amount, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/refund/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId, reason, amount }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }
      const data = await response.json();
      return data || { success: false, error: 'No response from server' };
    } catch (error) {
      logger.error('Error requesting refund:', error);
      return { success: false, error: getUserFriendlyMessage(error.message) };
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
