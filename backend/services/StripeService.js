/**
 * Stripe Payment Service
 *
 * Handles all Stripe payment operations including:
 * - Customer management
 * - Subscription creation and management
 * - One-time payments
 * - Payment intent creation
 * - Webhook event processing
 */

const Stripe = require('stripe');
const paymentConfig = require('../config/payment');
const Subscription = require('../models/Subscription');
const PaymentTransaction = require('../models/PaymentTransaction');

// Initialize Stripe with secret key (only if configured)
let stripe = null;
if (paymentConfig.stripe.secretKey) {
  stripe = new Stripe(paymentConfig.stripe.secretKey, {
    apiVersion: '2023-10-16',
  });
} else {
  console.warn('Stripe not configured - payment features disabled');
}

class StripeService {
  /**
   * Check if Stripe is configured
   */
  static isConfigured() {
    return stripe !== null;
  }

  /**
   * Create or retrieve a Stripe customer for a user
   */
  static async getOrCreateCustomer(user) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    try {
      // Check if user already has a Stripe customer ID
      if (user.stripeCustomerId) {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!customer.deleted) {
          return customer;
        }
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
          platform: 'dating-app',
        },
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription checkout session
   */
  static async createSubscriptionCheckout(user, planType, successUrl, cancelUrl) {
    try {
      const customer = await this.getOrCreateCustomer(user);
      const priceId = paymentConfig.stripe.prices[planType];

      if (!priceId) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            userId: user._id.toString(),
            planType,
          },
          trial_period_days: user.hasUsedTrial ? 0 : 7,
        },
        metadata: {
          userId: user._id.toString(),
          planType,
          type: 'subscription',
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for one-time purchases
   */
  static async createPaymentIntent(user, productType, productId, quantity = 1) {
    try {
      const customer = await this.getOrCreateCustomer(user);

      // Get product pricing
      const products = paymentConfig.consumableProducts[productType];
      if (!products || !products[productId]) {
        throw new Error(`Invalid product: ${productType}/${productId}`);
      }

      const product = products[productId];
      const amount = Math.round(product.price * quantity * 100); // Convert to cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: paymentConfig.stripe.currency,
        customer: customer.id,
        metadata: {
          userId: user._id.toString(),
          productType,
          productId,
          quantity: quantity.toString(),
          type: 'one_time',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: product.price * quantity,
        currency: product.currency,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a setup intent for saving payment methods
   */
  static async createSetupIntent(user) {
    try {
      const customer = await this.getOrCreateCustomer(user);

      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
        metadata: {
          userId: user._id.toString(),
        },
      });

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      };
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw error;
    }
  }

  /**
   * Get customer payment methods
   */
  static async getPaymentMethods(user) {
    try {
      if (!user.stripeCustomerId) {
        return [];
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      return paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: pm.id === user.defaultPaymentMethodId,
      }));
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(user, paymentMethodId) {
    try {
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }

  /**
   * Delete a payment method
   */
  static async deletePaymentMethod(paymentMethodId) {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  /**
   * Get active subscription
   */
  static async getActiveSubscription(user) {
    try {
      if (!user.stripeCustomerId) {
        return null;
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return null;
      }

      const sub = subscriptions.data[0];
      return {
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        planType: sub.metadata.planType,
        priceId: sub.items.data[0]?.price.id,
      };
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId, immediately = false) {
    try {
      if (immediately) {
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        return subscription;
      } else {
        // Cancel at period end
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        return subscription;
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Resume cancelled subscription (if not yet expired)
   */
  static async resumeSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      return subscription;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }

  /**
   * Change subscription plan
   */
  static async changeSubscriptionPlan(
    subscriptionId,
    newPriceId,
    prorationBehavior = 'create_prorations'
  ) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: prorationBehavior,
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error changing subscription plan:', error);
      throw error;
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
        reason,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundData);

      return {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        currency: refund.currency,
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Get upcoming invoice
   */
  static async getUpcomingInvoice(user) {
    try {
      if (!user.stripeCustomerId) {
        return null;
      }

      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: user.stripeCustomerId,
      });

      return {
        amountDue: invoice.amount_due / 100,
        currency: invoice.currency,
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        nextPaymentAttempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : null,
      };
    } catch (error) {
      if (error.code === 'invoice_upcoming_none') {
        return null;
      }
      console.error('Error getting upcoming invoice:', error);
      throw error;
    }
  }

  /**
   * Get billing history
   */
  static async getBillingHistory(user, limit = 10) {
    try {
      if (!user.stripeCustomerId) {
        return [];
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit,
      });

      return invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        pdfUrl: invoice.invoice_pdf,
        hostedUrl: invoice.hosted_invoice_url,
      }));
    } catch (error) {
      console.error('Error getting billing history:', error);
      throw error;
    }
  }

  /**
   * Create customer portal session
   */
  static async createPortalSession(user, returnUrl) {
    try {
      if (!user.stripeCustomerId) {
        throw new Error('No Stripe customer found for user');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        paymentConfig.stripe.webhookSecret
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  /**
   * Process webhook event
   */
  static async processWebhookEvent(event) {
    const handlers = {
      // Checkout events
      'checkout.session.completed': this.handleCheckoutComplete,
      'checkout.session.expired': this.handleCheckoutExpired,

      // Subscription events
      'customer.subscription.created': this.handleSubscriptionCreated,
      'customer.subscription.updated': this.handleSubscriptionUpdated,
      'customer.subscription.deleted': this.handleSubscriptionDeleted,
      'customer.subscription.trial_will_end': this.handleTrialWillEnd,

      // Invoice events
      'invoice.paid': this.handleInvoicePaid,
      'invoice.payment_failed': this.handleInvoicePaymentFailed,
      'invoice.upcoming': this.handleInvoiceUpcoming,

      // Payment events
      'payment_intent.succeeded': this.handlePaymentIntentSucceeded,
      'payment_intent.payment_failed': this.handlePaymentIntentFailed,

      // Refund events
      'charge.refunded': this.handleChargeRefunded,
      'charge.refund.updated': this.handleRefundUpdated,
    };

    const handler = handlers[event.type];
    if (handler) {
      await handler.call(this, event.data.object, event);
    } else {
      console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true, type: event.type };
  }

  /**
   * Handle checkout completion
   */
  static async handleCheckoutComplete(session, event) {
    const userId = session.metadata.userId;
    const planType = session.metadata.planType;

    if (session.mode === 'subscription') {
      // Update local subscription record
      await Subscription.upgradeToPremium(userId, planType, {
        method: 'stripe',
        paymentId: session.subscription,
        transactionId: session.id,
      });
    }

    // Log transaction
    await PaymentTransaction.create({
      userId,
      provider: 'stripe',
      type: session.mode === 'subscription' ? 'subscription' : 'one_time',
      status: 'completed',
      amount: session.amount_total / 100,
      currency: session.currency,
      providerTransactionId: session.id,
      metadata: session.metadata,
    });
  }

  /**
   * Handle checkout expiration
   */
  static async handleCheckoutExpired(session, event) {
    const userId = session.metadata.userId;

    await PaymentTransaction.create({
      userId,
      provider: 'stripe',
      type: 'checkout',
      status: 'expired',
      providerTransactionId: session.id,
      metadata: session.metadata,
    });
  }

  /**
   * Handle subscription creation
   */
  static async handleSubscriptionCreated(subscription, event) {
    console.log('Subscription created:', subscription.id);
    // Most handling done in checkout.session.completed
  }

  /**
   * Handle subscription update
   */
  static async handleSubscriptionUpdated(subscription, event) {
    const userId = subscription.metadata.userId;

    if (subscription.status === 'active') {
      const localSub = await Subscription.findOne({ userId });
      if (localSub) {
        localSub.status = 'active';
        localSub.endDate = new Date(subscription.current_period_end * 1000);
        localSub.renewalDate = new Date(subscription.current_period_end * 1000);
        localSub.autoRenew = !subscription.cancel_at_period_end;
        await localSub.save();
      }
    } else if (subscription.status === 'past_due') {
      // Handle payment failure
      const localSub = await Subscription.findOne({ userId });
      if (localSub) {
        localSub.status = 'past_due';
        await localSub.save();
      }
    }
  }

  /**
   * Handle subscription deletion
   */
  static async handleSubscriptionDeleted(subscription, event) {
    const userId = subscription.metadata.userId;

    const localSub = await Subscription.findOne({ userId });
    if (localSub) {
      localSub.status = 'cancelled';
      localSub.features = {
        unlimitedSwipes: false,
        seeWhoLikedYou: false,
        passport: false,
        advancedFilters: false,
        priorityLikes: false,
        hideAds: false,
        profileBoostAnalytics: false,
      };
      await localSub.save();
    }
  }

  /**
   * Handle trial ending soon notification
   */
  static async handleTrialWillEnd(subscription, event) {
    const userId = subscription.metadata.userId;
    // Send notification to user about trial ending
    console.log(`Trial ending soon for user ${userId}`);
    // TODO: Send push notification / email
  }

  /**
   * Handle successful invoice payment
   */
  static async handleInvoicePaid(invoice, event) {
    const customerId = invoice.customer;

    // Find user by Stripe customer ID and update subscription
    const User = require('../models/User');
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      await PaymentTransaction.create({
        userId: user._id,
        provider: 'stripe',
        type: 'invoice',
        status: 'completed',
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        providerTransactionId: invoice.id,
      });
    }
  }

  /**
   * Handle failed invoice payment
   */
  static async handleInvoicePaymentFailed(invoice, event) {
    const customerId = invoice.customer;

    const User = require('../models/User');
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      // Update subscription status
      const subscription = await Subscription.findOne({ userId: user._id });
      if (subscription) {
        subscription.status = 'past_due';
        await subscription.save();
      }

      // Log failed transaction
      await PaymentTransaction.create({
        userId: user._id,
        provider: 'stripe',
        type: 'invoice',
        status: 'failed',
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        providerTransactionId: invoice.id,
        failureReason: invoice.last_payment_error?.message,
      });

      // TODO: Send payment failure notification
    }
  }

  /**
   * Handle upcoming invoice
   */
  static async handleInvoiceUpcoming(invoice, event) {
    // Send reminder notification about upcoming charge
    console.log('Upcoming invoice:', invoice.id);
    // TODO: Send notification
  }

  /**
   * Handle successful one-time payment
   */
  static async handlePaymentIntentSucceeded(paymentIntent, event) {
    const { userId, productType, productId, quantity } = paymentIntent.metadata;

    if (!userId || !productType) {
      return; // Not our payment
    }

    // Credit the user's account with purchased items
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (user && productType && productId) {
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
    await PaymentTransaction.create({
      userId,
      provider: 'stripe',
      type: 'one_time',
      status: 'completed',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      providerTransactionId: paymentIntent.id,
      metadata: paymentIntent.metadata,
    });
  }

  /**
   * Handle failed payment intent
   */
  static async handlePaymentIntentFailed(paymentIntent, event) {
    const { userId, productType, productId } = paymentIntent.metadata;

    if (userId) {
      await PaymentTransaction.create({
        userId,
        provider: 'stripe',
        type: 'one_time',
        status: 'failed',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        providerTransactionId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message,
        metadata: paymentIntent.metadata,
      });
    }
  }

  /**
   * Handle charge refund
   */
  static async handleChargeRefunded(charge, event) {
    await PaymentTransaction.findOneAndUpdate(
      { providerTransactionId: charge.payment_intent },
      {
        $set: {
          refundStatus: charge.refunded ? 'refunded' : 'partial_refund',
          refundAmount: charge.amount_refunded / 100,
          refundedAt: new Date(),
        },
      }
    );
  }

  /**
   * Handle refund status update
   */
  static async handleRefundUpdated(refund, event) {
    console.log('Refund updated:', refund.id, refund.status);
  }
}

module.exports = StripeService;
