/**
 * Payment Service (Frontend) - TypeScript
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

// ==================== TYPES ====================

export type PaymentProvider = 'stripe' | 'paypal' | 'apple' | 'google';
export type PlanType = 'monthly' | 'yearly';
export type ProductType = 'super_likes' | 'boost' | 'rewind' | 'consumable';

export interface SubscriptionTier {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  currency: string;
  features: string[];
  savings?: number;
  popular?: boolean;
}

export interface SubscriptionTiersResponse {
  tiers: SubscriptionTier[];
  consumables: Record<string, any>;
}

export interface PaymentStatus {
  subscriptionActive: boolean;
  tier?: string;
  expiresAt?: string;
  cancelAtPeriodEnd?: boolean;
  provider?: PaymentProvider;
}

export interface BillingHistory {
  invoices: Invoice[];
  transactions: Transaction[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  pdfUrl?: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  provider: PaymentProvider;
}

export interface PaymentResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface StripeCheckoutResponse extends PaymentResponse {
  data?: {
    url?: string;
    sessionId?: string;
  };
}

export interface PayPalSubscriptionResponse extends PaymentResponse {
  data?: {
    approvalUrl?: string;
    subscriptionId?: string;
  };
}

export interface AppleReceiptValidation extends PaymentResponse {
  data?: {
    verified: boolean;
    subscription?: PaymentStatus;
  };
}

export interface GooglePurchaseValidation extends PaymentResponse {
  data?: {
    verified: boolean;
    subscription?: PaymentStatus;
  };
}

// ==================== PAYMENT SERVICE ====================

export class PaymentService {
  // ==================== SUBSCRIPTION TIERS ====================

  /**
   * Get available subscription tiers
   */
  static async getSubscriptionTiers(): Promise<SubscriptionTiersResponse> {
    try {
      const response = await api.get('/payment/tiers');
      const handled = handleApiResponse(response, 'Get subscription tiers');
      return handled.data || { tiers: [], consumables: {} };
    } catch (error) {
      logger.error('Error getting subscription tiers:', error as Error);
      return { tiers: [], consumables: {} };
    }
  }

  /**
   * Get current payment status
   */
  static async getPaymentStatus(token: string): Promise<PaymentStatus | null> {
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
      logger.error('Error getting payment status:', error as Error);
      return null;
    }
  }

  /**
   * Get billing history
   */
  static async getBillingHistory(token: string): Promise<BillingHistory> {
    try {
      const response = await api.get('/payment/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const handled = handleApiResponse(response, 'Get billing history');
      return handled.data || { invoices: [], transactions: [] };
    } catch (error) {
      logger.error('Error getting billing history:', error as Error);
      return { invoices: [], transactions: [] };
    }
  }

  // ==================== STRIPE PAYMENTS ====================

  /**
   * Create Stripe checkout session for subscription
   */
  static async createStripeCheckout(
    planType: PlanType,
    token: string
  ): Promise<StripeCheckoutResponse> {
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
      logger.error('Error creating Stripe checkout:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create payment intent for one-time purchase (web)
   */
  static async createStripePaymentIntent(
    productType: ProductType,
    productId: string,
    quantity: number,
    token: string
  ): Promise<PaymentResponse> {
    try {
      const response = await api.post(
        '/payment/stripe/payment-intent',
        { productType, productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Create Stripe payment intent');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error creating payment intent:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get Stripe customer portal URL
   */
  static async getStripePortal(token: string): Promise<PaymentResponse> {
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
      logger.error('Error getting Stripe portal:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== PAYPAL PAYMENTS ====================

  /**
   * Create PayPal subscription
   */
  static async createPayPalSubscription(
    planType: PlanType,
    token: string
  ): Promise<PayPalSubscriptionResponse> {
    try {
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
      logger.error('Error creating PayPal subscription:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Activate PayPal subscription after approval
   */
  static async activatePayPalSubscription(
    subscriptionId: string,
    token: string
  ): Promise<PaymentResponse> {
    try {
      const response = await api.post(
        '/payment/paypal/subscription/activate',
        { subscriptionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Activate PayPal subscription');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error activating PayPal subscription:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create PayPal order for one-time purchase
   */
  static async createPayPalOrder(
    productType: ProductType,
    productId: string,
    quantity: number,
    token: string
  ): Promise<PayPalSubscriptionResponse> {
    try {
      const response = await api.post(
        '/payment/paypal/order',
        { productType, productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Create PayPal order');

      if (handled.success && handled.data?.approvalUrl) {
        await Linking.openURL(handled.data.approvalUrl);
      }

      return handled;
    } catch (error) {
      logger.error('Error creating PayPal order:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Capture PayPal order after approval
   */
  static async capturePayPalOrder(orderId: string, token: string): Promise<PaymentResponse> {
    try {
      const response = await api.post(
        '/payment/paypal/order/capture',
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Capture PayPal order');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error capturing PayPal order:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== APPLE IAP ====================

  /**
   * Validate Apple receipt
   */
  static async validateAppleReceipt(
    receiptData: string,
    productId: string,
    token: string
  ): Promise<AppleReceiptValidation> {
    try {
      const response = await api.post(
        '/payment/apple/validate',
        { receiptData, productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Validate Apple receipt');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error validating Apple receipt:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Restore Apple purchases
   */
  static async restoreApplePurchases(receiptData: string, token: string): Promise<PaymentResponse> {
    try {
      const response = await api.post(
        '/payment/apple/restore',
        { receiptData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Restore Apple purchases');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error restoring Apple purchases:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== GOOGLE PLAY ====================

  /**
   * Validate Google Play purchase
   */
  static async validateGooglePurchase(
    purchaseToken: string,
    productId: string,
    isSubscription: boolean,
    token: string
  ): Promise<GooglePurchaseValidation> {
    try {
      const response = await api.post(
        '/payment/google/validate',
        { purchaseToken, productId, isSubscription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Validate Google purchase');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error validating Google purchase:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Restore Google Play purchases
   */
  static async restoreGooglePurchases(
    purchases: any[],
    token: string
  ): Promise<PaymentResponse> {
    try {
      const response = await api.post(
        '/payment/google/restore',
        { purchases },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Restore Google purchases');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error restoring Google purchases:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  /**
   * Cancel subscription
   */
  static async cancelSubscription(immediately: boolean, token: string): Promise<PaymentResponse> {
    try {
      const response = await api.post(
        '/payment/subscription/cancel',
        { immediately },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Cancel subscription');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error cancelling subscription:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Resume cancelled subscription
   */
  static async resumeSubscription(token: string): Promise<PaymentResponse> {
    try {
      const response = await api.post(
        '/payment/subscription/resume',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Resume subscription');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error resuming subscription:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== REFUNDS ====================

  /**
   * Request a refund
   */
  static async requestRefund(
    transactionId: string,
    reason: string,
    amount: number,
    token: string
  ): Promise<PaymentResponse> {
    try {
      const response = await api.post(
        '/payment/refund/request',
        { transactionId, reason, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const handled = handleApiResponse(response, 'Request refund');
      return handled || { success: false, error: ERROR_MESSAGES.NO_RESPONSE_FROM_SERVER };
    } catch (error) {
      logger.error('Error requesting refund:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== PLATFORM-SPECIFIC HELPERS ====================

  /**
   * Get the appropriate payment method for current platform
   */
  static getRecommendedPaymentMethod(): PaymentProvider {
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
  static isIAPAvailable(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Open platform-specific subscription management
   */
  static async openSubscriptionManagement(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      await Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }
}

export default PaymentService;
