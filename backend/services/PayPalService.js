/**
 * PayPal Payment Service
 *
 * Handles all PayPal payment operations including:
 * - Subscription creation and management
 * - One-time payments
 * - Webhook event processing
 * - Refund processing
 */

/** @type {any} */
const axios = require('axios');
const paymentConfig = require('../config/payment');
const Subscription = require('../models/Subscription');
const PaymentTransaction = require('../models/PaymentTransaction');

class PayPalService {
  static baseUrl =
    paymentConfig.paypal.mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  /**
   * Get PayPal access token
   */
  static async getAccessToken() {
    try {
      const auth = Buffer.from(
        `${paymentConfig.paypal.clientId}:${paymentConfig.paypal.clientSecret}`
      ).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error getting PayPal access token:', errorMessage);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  static async createSubscription(user, planType, returnUrl, cancelUrl) {
    try {
      const accessToken = await this.getAccessToken();
      const planId = paymentConfig.paypal.plans[planType];

      if (!planId) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      const response = await axios.post(
        `${this.baseUrl}/v1/billing/subscriptions`,
        {
          plan_id: planId,
          subscriber: {
            name: {
              given_name: user.name?.split(' ')[0] || 'User',
              surname: user.name?.split(' ').slice(1).join(' ') || '',
            },
            email_address: user.email,
          },
          application_context: {
            brand_name: 'Dating App',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
          custom_id: JSON.stringify({
            userId: user._id.toString(),
            planType,
          }),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const approvalUrl = response.data.links.find((link) => link.rel === 'approve')?.href;

      return {
        subscriptionId: response.data.id,
        approvalUrl,
        status: response.data.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error creating PayPal subscription:', errorData || errorMessage);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
        status: response.data.status.toLowerCase(),
        planId: response.data.plan_id,
        startTime: response.data.start_time,
        nextBillingTime: response.data.billing_info?.next_billing_time,
        customId: response.data.custom_id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error getting PayPal subscription:', errorData || errorMessage);
      throw error;
    }
  }

  /**
   * Activate subscription after approval
   */
  static async activateSubscription(subscriptionId) {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      if (subscription.status !== 'active') {
        throw new Error('Subscription is not active');
      }

      // Parse custom data
      const customData = JSON.parse(subscription.customId);
      const { userId, planType } = customData;

      // Update local subscription
      await Subscription.upgradeToPremium(userId, planType, {
        method: 'paypal',
        paymentId: subscriptionId,
        transactionId: subscriptionId,
      });

      // Log transaction
      await PaymentTransaction.create({
        userId,
        provider: 'paypal',
        type: 'subscription',
        status: 'completed',
        providerTransactionId: subscriptionId,
        metadata: customData,
      });

      return { success: true, subscription };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error activating PayPal subscription:', errorMessage);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId, reason = 'Customer requested cancellation') {
    try {
      const accessToken = await this.getAccessToken();

      await axios.post(
        `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error cancelling PayPal subscription:', errorData || errorMessage);
      throw error;
    }
  }

  /**
   * Suspend subscription
   */
  static async suspendSubscription(subscriptionId, reason = 'Suspended by request') {
    try {
      const accessToken = await this.getAccessToken();

      await axios.post(
        `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/suspend`,
        {
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error suspending PayPal subscription:', errorData || errorMessage);
      throw error;
    }
  }

  /**
   * Reactivate suspended subscription
   */
  static async reactivateSubscription(subscriptionId, reason = 'Reactivated by request') {
    try {
      const accessToken = await this.getAccessToken();

      await axios.post(
        `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/activate`,
        {
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error reactivating PayPal subscription:', errorData || errorMessage);
      throw error;
    }
  }

  /**
   * Create order for one-time payment
   */
  static async createOrder(user, productType, productId, quantity = 1) {
    try {
      const accessToken = await this.getAccessToken();

      // Get product pricing
      const products = paymentConfig.consumableProducts[productType];
      if (!products || !products[productId]) {
        throw new Error(`Invalid product: ${productType}/${productId}`);
      }

      const product = products[productId];
      const amount = (product.price * quantity).toFixed(2);

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: `${productType}_${productId}`,
              description: `${productType} pack - ${productId}`,
              custom_id: JSON.stringify({
                userId: user._id.toString(),
                productType,
                productId,
                quantity,
              }),
              amount: {
                currency_code: product.currency,
                value: amount,
              },
            },
          ],
          application_context: {
            brand_name: 'Dating App',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const approvalUrl = response.data.links.find((link) => link.rel === 'approve')?.href;

      return {
        orderId: response.data.id,
        approvalUrl,
        status: response.data.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error creating PayPal order:', errorData || errorMessage);
      throw error;
    }
  }

  /**
   * Capture order after approval
   */
  static async captureOrder(orderId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'COMPLETED') {
        // Parse custom data
        const customId = response.data.purchase_units[0].payments.captures[0].custom_id;
        const customData = JSON.parse(customId);
        const { userId, productType, productId, quantity } = customData;

        // Credit user's account
        const User = require('../models/User');
        const user = await User.findById(userId);

        if (user) {
          const qty = parseInt(quantity) || 1;

          switch (productType) {
            case 'superLikes':
              user.superLikesBalance = (user.superLikesBalance || 0) + qty;
              break;
            case 'boosts':
              user.boostsBalance = (user.boostsBalance || 0) + qty;
              break;
            case 'rewinds':
              user.rewindsBalance = (user.rewindsBalance || 0) + qty;
              break;
          }

          await user.save();
        }

        // Log transaction
        const capture = response.data.purchase_units[0].payments.captures[0];
        await PaymentTransaction.create({
          userId,
          provider: 'paypal',
          type: 'one_time',
          status: 'completed',
          amount: parseFloat(capture.amount.value),
          currency: capture.amount.currency_code,
          providerTransactionId: orderId,
          metadata: customData,
        });
      }

      return {
        success: response.data.status === 'COMPLETED',
        orderId: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error capturing PayPal order:', errorData || errorMessage);
      throw error;
    }
  }

  /**
   * Create refund
   */
  static async createRefund(captureId, amount = null, reason = 'Customer requested refund') {
    try {
      const accessToken = await this.getAccessToken();

      const refundData = {
        note_to_payer: reason,
      };

      if (amount) {
        refundData.amount = {
          value: amount.toFixed(2),
          currency_code: 'USD',
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        refundId: response.data.id,
        status: response.data.status,
        amount: response.data.amount?.value,
        currency: response.data.amount?.currency_code,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error creating PayPal refund:', errorData || errorMessage);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static async verifyWebhookSignature(headers, body) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: paymentConfig.paypal.webhookId,
          webhook_event: body,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.verification_status === 'SUCCESS';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : null;
      console.error('Error verifying PayPal webhook:', errorData || errorMessage);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  static async processWebhookEvent(event) {
    const handlers = {
      // Subscription events
      'BILLING.SUBSCRIPTION.CREATED': this.handleSubscriptionCreated,
      'BILLING.SUBSCRIPTION.ACTIVATED': this.handleSubscriptionActivated,
      'BILLING.SUBSCRIPTION.UPDATED': this.handleSubscriptionUpdated,
      'BILLING.SUBSCRIPTION.CANCELLED': this.handleSubscriptionCancelled,
      'BILLING.SUBSCRIPTION.SUSPENDED': this.handleSubscriptionSuspended,
      'BILLING.SUBSCRIPTION.PAYMENT.FAILED': this.handlePaymentFailed,

      // Payment events
      'PAYMENT.SALE.COMPLETED': this.handlePaymentCompleted,
      'PAYMENT.SALE.REFUNDED': this.handlePaymentRefunded,
      'PAYMENT.CAPTURE.COMPLETED': this.handleCaptureCompleted,
      'PAYMENT.CAPTURE.REFUNDED': this.handleCaptureRefunded,
    };

    const handler = handlers[event.event_type];
    if (handler) {
      await handler.call(this, event.resource, event);
    } else {
      console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    return { received: true, type: event.event_type };
  }

  /**
   * Handle subscription created
   */
  static async handleSubscriptionCreated(resource, event) {
    console.log('PayPal subscription created:', resource.id);
  }

  /**
   * Handle subscription activated
   */
  static async handleSubscriptionActivated(resource, event) {
    try {
      const customData = JSON.parse(resource.custom_id || '{}');
      const { userId, planType } = customData;

      if (userId) {
        await Subscription.upgradeToPremium(userId, planType, {
          method: 'paypal',
          paymentId: resource.id,
          transactionId: resource.id,
        });

        await PaymentTransaction.create({
          userId,
          provider: 'paypal',
          type: 'subscription',
          status: 'completed',
          providerTransactionId: resource.id,
          metadata: customData,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error handling subscription activated:', errorMessage);
    }
  }

  /**
   * Handle subscription updated
   */
  static async handleSubscriptionUpdated(resource, event) {
    try {
      const customData = JSON.parse(resource.custom_id || '{}');
      const { userId } = customData;

      if (userId) {
        const subscription = await Subscription.findOne({ userId });
        if (subscription) {
          subscription.status = resource.status.toLowerCase() === 'active' ? 'active' : 'expired';
          await subscription.save();
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error handling subscription updated:', errorMessage);
    }
  }

  /**
   * Handle subscription cancelled
   */
  static async handleSubscriptionCancelled(resource, event) {
    try {
      const customData = JSON.parse(resource.custom_id || '{}');
      const { userId } = customData;

      if (userId) {
        await Subscription.cancelSubscription(userId);
      }
    } catch (error) {
      console.error('Error handling subscription cancelled:', error);
    }
  }

  /**
   * Handle subscription suspended
   */
  static async handleSubscriptionSuspended(resource, event) {
    try {
      const customData = JSON.parse(resource.custom_id || '{}');
      const { userId } = customData;

      if (userId) {
        const subscription = await Subscription.findOne({ userId });
        if (subscription) {
          subscription.status = 'suspended';
          await subscription.save();
        }
      }
    } catch (error) {
      console.error('Error handling subscription suspended:', error);
    }
  }

  /**
   * Handle payment failed
   */
  static async handlePaymentFailed(resource, event) {
    try {
      const customData = JSON.parse(resource.custom_id || '{}');
      const { userId } = customData;

      if (userId) {
        const subscription = await Subscription.findOne({ userId });
        if (subscription) {
          subscription.status = 'past_due';
          await subscription.save();
        }

        await PaymentTransaction.create({
          userId,
          provider: 'paypal',
          type: 'subscription',
          status: 'failed',
          providerTransactionId: resource.id,
          failureReason: 'Payment failed',
          metadata: customData,
        });
      }
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  /**
   * Handle payment completed
   */
  static async handlePaymentCompleted(resource, event) {
    console.log('PayPal payment completed:', resource.id);
  }

  /**
   * Handle payment refunded
   */
  static async handlePaymentRefunded(resource, event) {
    await PaymentTransaction.findOneAndUpdate(
      { providerTransactionId: resource.parent_payment },
      {
        $set: {
          refundStatus: 'refunded',
          refundAmount: parseFloat(resource.amount?.total || 0),
          refundedAt: new Date(),
        },
      }
    );
  }

  /**
   * Handle capture completed
   */
  static async handleCaptureCompleted(resource, event) {
    console.log('PayPal capture completed:', resource.id);
  }

  /**
   * Handle capture refunded
   */
  static async handleCaptureRefunded(resource, event) {
    await PaymentTransaction.findOneAndUpdate(
      { providerTransactionId: resource.id },
      {
        $set: {
          refundStatus: 'refunded',
          refundAmount: parseFloat(resource.amount?.value || 0),
          refundedAt: new Date(),
        },
      }
    );
  }
}

module.exports = PayPalService;
