/**
 * Payment Service (Frontend)
 * 
 * Handles all payment operations on the client side including:
 * - Subscription management
 * - In-app purchases (iOS/Android)
 * - Stripe/PayPal web payments
 */

import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export class PaymentService {
  // ==================== SUBSCRIPTION TIERS ====================

  /**
   * Get available subscription tiers
   */
  static async getSubscriptionTiers() {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/tiers`);
      const data = await response.json();
      return data.data || { tiers: [], consumables: {} };
    } catch (error) {
      console.error('Error getting subscription tiers:', error);
      return { tiers: [], consumables: {} };
    }
  }

  /**
   * Get current payment status
   */
  static async getPaymentStatus(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error getting payment status:', error);
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
      const data = await response.json();
      return data.data || { invoices: [], transactions: [] };
    } catch (error) {
      console.error('Error getting billing history:', error);
      return { invoices: [], transactions: [] };
    }
  }

  // ==================== STRIPE PAYMENTS ====================

  /**
   * Create Stripe checkout session for subscription
   */
  static async createStripeCheckout(planType, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planType }),
      });
      const data = await response.json();
      
      if (data.success && data.data.url) {
        // Open Stripe checkout in browser
        await Linking.openURL(data.data.url);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating Stripe checkout:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: error.message };
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
      const data = await response.json();
      
      if (data.success && data.data.url) {
        await Linking.openURL(data.data.url);
      }
      
      return data;
    } catch (error) {
      console.error('Error getting Stripe portal:', error);
      return { success: false, error: error.message };
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
      const data = await response.json();
      
      if (data.success && data.data.approvalUrl) {
        await Linking.openURL(data.data.approvalUrl);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating PayPal subscription:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error activating PayPal subscription:', error);
      return { success: false, error: error.message };
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
      const data = await response.json();
      
      if (data.success && data.data.approvalUrl) {
        await Linking.openURL(data.data.approvalUrl);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error validating Apple receipt:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error restoring Apple purchases:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error validating Google purchase:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error restoring Google purchases:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      return { success: false, error: error.message };
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
      return await response.json();
    } catch (error) {
      console.error('Error requesting refund:', error);
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
