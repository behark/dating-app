/**
 * Google Play Billing Service
 *
 * Handles Google Play Store IAP operations including:
 * - Receipt validation
 * - Subscription management
 * - Real-time Developer Notifications (RTDN)
 */

const { google } = require('googleapis');
const paymentConfig = require('../../config/payment');
const Subscription = require('../domain/Subscription');
const PaymentTransaction = require('../domain/PaymentTransaction');

class GooglePlayService {
  /** @type {import('googleapis').androidpublisher_v3.Androidpublisher | null} */
  static androidPublisher = null;

  /**
   * Initialize Google Play API client
   */
  static async getAndroidPublisher() {
    if (this.androidPublisher) {
      return this.androidPublisher;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: paymentConfig.google.serviceAccountEmail,
        private_key: paymentConfig.google.serviceAccountPrivateKey?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    this.androidPublisher = google.androidpublisher({
      version: 'v3',
      auth,
    });

    return this.androidPublisher;
  }

  /**
   * Validate subscription purchase
   */
  static async validateSubscription(purchaseToken, productId) {
    try {
      const publisher = /** @type {NonNullable<typeof GooglePlayService.androidPublisher>} */ (
        await this.getAndroidPublisher()
      );

      const response = await publisher.purchases.subscriptions.get({
        packageName: paymentConfig.google.packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      const subscription = response.data;

      return {
        valid: true,
        orderId: subscription.orderId,
        purchaseTime: new Date(parseInt(subscription.startTimeMillis || '0')),
        expiryTime: new Date(parseInt(subscription.expiryTimeMillis || '0')),
        autoRenewing: subscription.autoRenewing,
        paymentState: subscription.paymentState,
        cancelReason: subscription.cancelReason,
        priceInfo: {
          priceCurrencyCode: subscription.priceAmountMicros ? subscription.priceCurrencyCode : null,
          priceAmount: subscription.priceAmountMicros
            ? parseInt(subscription.priceAmountMicros) / 1000000
            : null,
        },
        acknowledgementState: subscription.acknowledgementState,
        linkedPurchaseToken: subscription.linkedPurchaseToken,
        isActive: parseInt(subscription.expiryTimeMillis || '0') > Date.now(),
      };
    } catch (error) {
      console.error('Error validating Google subscription:', error);

      if ((error instanceof Error && 'code' in error ? error.code : 'UNKNOWN_ERROR') === 410) {
        return {
          valid: false,
          error: 'Purchase token is no longer valid',
        };
      }

      throw error;
    }
  }

  /**
   * Validate one-time product purchase
   */
  static async validateProduct(purchaseToken, productId) {
    try {
      const publisher = /** @type {NonNullable<typeof GooglePlayService.androidPublisher>} */ (
        await this.getAndroidPublisher()
      );

      const response = await publisher.purchases.products.get({
        packageName: paymentConfig.google.packageName,
        productId,
        token: purchaseToken,
      });

      const purchase = response.data;

      return {
        valid: true,
        orderId: purchase.orderId,
        purchaseTime: new Date(parseInt(purchase.purchaseTimeMillis || '0')),
        purchaseState: purchase.purchaseState,
        consumptionState: purchase.consumptionState,
        developerPayload: purchase.developerPayload,
        acknowledgementState: purchase.acknowledgementState,
        quantity: purchase.quantity || 1,
      };
    } catch (error) {
      console.error('Error validating Google product:', error);
      throw error;
    }
  }

  /**
   * Acknowledge subscription purchase
   */
  static async acknowledgeSubscription(purchaseToken, productId, developerPayload) {
    try {
      const publisher = /** @type {NonNullable<typeof GooglePlayService.androidPublisher>} */ (
        await this.getAndroidPublisher()
      );

      await publisher.purchases.subscriptions.acknowledge({
        packageName: paymentConfig.google.packageName,
        subscriptionId: productId,
        token: purchaseToken,
        requestBody: {
          developerPayload,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error acknowledging Google subscription:', error);
      throw error;
    }
  }

  /**
   * Acknowledge product purchase
   */
  static async acknowledgeProduct(purchaseToken, productId, developerPayload) {
    try {
      const publisher = /** @type {NonNullable<typeof GooglePlayService.androidPublisher>} */ (
        await this.getAndroidPublisher()
      );

      await publisher.purchases.products.acknowledge({
        packageName: paymentConfig.google.packageName,
        productId,
        token: purchaseToken,
        requestBody: {
          developerPayload,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error acknowledging Google product:', error);
      throw error;
    }
  }

  /**
   * Consume product purchase (for consumables)
   */
  static async consumeProduct(purchaseToken, productId) {
    try {
      const publisher = /** @type {NonNullable<typeof GooglePlayService.androidPublisher>} */ (
        await this.getAndroidPublisher()
      );

      await publisher.purchases.products.consume({
        packageName: paymentConfig.google.packageName,
        productId,
        token: purchaseToken,
      });

      return { success: true };
    } catch (error) {
      console.error('Error consuming Google product:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(purchaseToken, productId) {
    try {
      const publisher = /** @type {NonNullable<typeof GooglePlayService.androidPublisher>} */ (
        await this.getAndroidPublisher()
      );

      await publisher.purchases.subscriptions.cancel({
        packageName: paymentConfig.google.packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling Google subscription:', error);
      throw error;
    }
  }

  /**
   * Refund subscription
   */
  static async refundSubscription(purchaseToken, productId) {
    try {
      const publisher = /** @type {NonNullable<typeof GooglePlayService.androidPublisher>} */ (
        await this.getAndroidPublisher()
      );

      await publisher.purchases.subscriptions.refund({
        packageName: paymentConfig.google.packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      return { success: true };
    } catch (error) {
      console.error('Error refunding Google subscription:', error);
      throw error;
    }
  }

  /**
   * Revoke subscription
   */
  static async revokeSubscription(purchaseToken, productId) {
    try {
      const publisher = /** @type {NonNullable<typeof GooglePlayService.androidPublisher>} */ (
        await this.getAndroidPublisher()
      );

      await publisher.purchases.subscriptions.revoke({
        packageName: paymentConfig.google.packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      return { success: true };
    } catch (error) {
      console.error('Error revoking Google subscription:', error);
      throw error;
    }
  }

  /**
   * Process subscription purchase
   */
  static async processSubscriptionPurchase(userId, purchaseToken, productId) {
    try {
      const validation = await this.validateSubscription(purchaseToken, productId);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Acknowledge if not already acknowledged
      if (validation.acknowledgementState !== 1) {
        await this.acknowledgeSubscription(purchaseToken, productId, userId);
      }

      const planType = this.getPlanTypeFromProductId(productId);

      // Update subscription
      await Subscription.upgradeToPremium(userId, planType, {
        method: 'google',
        paymentId: purchaseToken,
        transactionId: validation.orderId,
      });

      const subscription = await Subscription.findOne({ userId });
      if (subscription) {
        subscription.endDate = validation.expiryTime;
        subscription.autoRenew = validation.autoRenewing ?? false;
        await subscription.save();
      }

      // Log transaction
      await PaymentTransaction.create({
        userId,
        provider: 'google',
        type: 'subscription',
        status: 'completed',
        amount: validation?.priceInfo?.priceAmount,
        currency: validation?.priceInfo?.priceCurrencyCode,
        providerTransactionId: validation.orderId,
        subscriptionPlan: planType,
        metadata: {
          purchaseToken,
          productId,
          expiryTime: validation.expiryTime,
        },
        platform: 'android',
      });

      return {
        success: true,
        subscription: validation,
      };
    } catch (error) {
      console.error('Error processing Google subscription:', error);
      throw error;
    }
  }

  /**
   * Process product purchase
   */
  static async processProductPurchase(userId, purchaseToken, productId) {
    try {
      const validation = await this.validateProduct(purchaseToken, productId);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Check if purchase is valid
      if (validation.purchaseState !== 0) {
        return {
          success: false,
          error: 'Purchase is not completed',
        };
      }

      // Acknowledge if not already acknowledged
      if (validation.acknowledgementState !== 1) {
        await this.acknowledgeProduct(purchaseToken, productId, userId);
      }

      // Credit user account
      await this.processConsumable(userId, productId, validation.quantity);

      // Consume the purchase
      await this.consumeProduct(purchaseToken, productId);

      // Log transaction
      await PaymentTransaction.create({
        userId,
        provider: 'google',
        type: 'one_time',
        status: 'completed',
        providerTransactionId: validation.orderId,
        productId,
        quantity: validation.quantity,
        metadata: {
          purchaseToken,
        },
        platform: 'android',
      });

      return {
        success: true,
        purchase: validation,
      };
    } catch (error) {
      console.error('Error processing Google product:', error);
      throw error;
    }
  }

  /**
   * Process consumable and credit user
   */
  static async processConsumable(userId, productId, quantity = 1) {
    const User = require('../domain/User');
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const products = paymentConfig.google.products;

    switch (productId) {
      case products.superLikePack5:
        user.superLikesBalance = (user.superLikesBalance || 0) + 5 * quantity;
        break;
      case products.superLikePack15:
        user.superLikesBalance = (user.superLikesBalance || 0) + 15 * quantity;
        break;
      case products.boostPack1:
        user.boostsBalance = (user.boostsBalance || 0) + 1 * quantity;
        break;
      case products.boostPack5:
        user.boostsBalance = (user.boostsBalance || 0) + 5 * quantity;
        break;
    }

    await user.save();
  }

  /**
   * Get plan type from Google product ID
   */
  static getPlanTypeFromProductId(productId) {
    const products = paymentConfig.google.products;
    if (productId === products.monthlySubscription) return 'monthly';
    if (productId === products.yearlySubscription) return 'yearly';
    return 'monthly';
  }

  /**
   * Restore purchases
   */
  static async restorePurchases(userId, purchases) {
    /** @type {{ subscriptions: any[], products: any[] }} */
    const restored = {
      subscriptions: [],
      products: [],
    };

    for (const purchase of purchases) {
      try {
        if (this.isSubscriptionProduct(purchase.productId)) {
          const result = await this.processSubscriptionPurchase(
            userId,
            purchase.purchaseToken,
            purchase.productId
          );
          if (result.success && result?.subscription?.isActive) {
            restored.subscriptions.push(result.subscription);
          }
        }
      } catch (error) {
        console.error('Error restoring purchase:', error);
      }
    }

    return { success: true, restored };
  }

  /**
   * Check if product is a subscription
   */
  static isSubscriptionProduct(productId) {
    const products = paymentConfig.google.products;
    return [products.monthlySubscription, products.yearlySubscription].includes(productId);
  }

  /**
   * Process Real-time Developer Notification
   */
  static async processRTDN(message) {
    try {
      // Decode the message data (base64 encoded)
      const data = JSON.parse(Buffer.from(message.data, 'base64').toString());

      const { subscriptionNotification, oneTimeProductNotification, testNotification } = data;

      if (testNotification) {
        console.log('Received Google Play test notification');
        return { success: true, type: 'test' };
      }

      if (subscriptionNotification) {
        return await this.handleSubscriptionNotification(subscriptionNotification);
      }

      if (oneTimeProductNotification) {
        return await this.handleProductNotification(oneTimeProductNotification);
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing Google RTDN:', error);
      throw error;
    }
  }

  /**
   * Handle subscription notification
   */
  static async handleSubscriptionNotification(notification) {
    const { notificationType, purchaseToken, subscriptionId } = notification;

    // Find existing transaction
    const transaction = await PaymentTransaction.findOne({
      provider: 'google',
      'metadata.purchaseToken': purchaseToken,
    });

    const userId = transaction?.userId;

    switch (notificationType) {
      case 1: // SUBSCRIPTION_RECOVERED
        await this.handleSubscriptionRecovered(userId, purchaseToken, subscriptionId);
        break;

      case 2: // SUBSCRIPTION_RENEWED
        await this.handleSubscriptionRenewed(userId, purchaseToken, subscriptionId);
        break;

      case 3: // SUBSCRIPTION_CANCELED
        await this.handleSubscriptionCanceled(userId, purchaseToken, subscriptionId);
        break;

      case 4: // SUBSCRIPTION_PURCHASED
        // New subscription - would be handled by client-side flow
        break;

      case 5: // SUBSCRIPTION_ON_HOLD
        await this.handleSubscriptionOnHold(userId, purchaseToken, subscriptionId);
        break;

      case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
        await this.handleSubscriptionGracePeriod(userId, purchaseToken, subscriptionId);
        break;

      case 7: // SUBSCRIPTION_RESTARTED
        await this.handleSubscriptionRestarted(userId, purchaseToken, subscriptionId);
        break;

      case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
        console.log('Price change confirmed');
        break;

      case 9: // SUBSCRIPTION_DEFERRED
        await this.handleSubscriptionDeferred(userId, purchaseToken, subscriptionId);
        break;

      case 10: // SUBSCRIPTION_PAUSED
        await this.handleSubscriptionPaused(userId, purchaseToken, subscriptionId);
        break;

      case 11: // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
        console.log('Pause schedule changed');
        break;

      case 12: // SUBSCRIPTION_REVOKED
        await this.handleSubscriptionRevoked(userId, purchaseToken, subscriptionId);
        break;

      case 13: // SUBSCRIPTION_EXPIRED
        await this.handleSubscriptionExpired(userId, purchaseToken, subscriptionId);
        break;

      default:
        console.log(`Unknown Google subscription notification type: ${notificationType}`);
    }

    return { success: true, notificationType };
  }

  /**
   * Handle subscription recovered (from hold)
   */
  static async handleSubscriptionRecovered(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const validation = await this.validateSubscription(purchaseToken, subscriptionId);

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.status = 'active';
      subscription.endDate = validation.expiryTime;
      await subscription.save();
    }
  }

  /**
   * Handle subscription renewed
   */
  static async handleSubscriptionRenewed(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const validation = await this.validateSubscription(purchaseToken, subscriptionId);

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.status = 'active';
      subscription.endDate = validation.expiryTime;
      await subscription.save();
    }

    await PaymentTransaction.create({
      userId,
      provider: 'google',
      type: 'subscription',
      status: 'completed',
      providerTransactionId: validation.orderId,
      metadata: {
        purchaseToken,
        type: 'renewal',
      },
    });
  }

  /**
   * Handle subscription canceled
   */
  static async handleSubscriptionCanceled(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.autoRenew = false;
      // Keep active until expiry
      await subscription.save();
    }
  }

  /**
   * Handle subscription on hold (payment failed)
   */
  static async handleSubscriptionOnHold(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.status = 'past_due';
      await subscription.save();
    }
  }

  /**
   * Handle subscription in grace period
   */
  static async handleSubscriptionGracePeriod(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const validation = await this.validateSubscription(purchaseToken, subscriptionId);

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      /** @type {any} */
      const status = 'grace_period';
      subscription.status = status;
      // Still allow access during grace period
      await subscription.save();
    }
  }

  /**
   * Handle subscription restarted
   */
  static async handleSubscriptionRestarted(userId, purchaseToken, subscriptionId) {
    await this.handleSubscriptionRecovered(userId, purchaseToken, subscriptionId);
  }

  /**
   * Handle subscription deferred (billing deferred)
   */
  static async handleSubscriptionDeferred(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const validation = await this.validateSubscription(purchaseToken, subscriptionId);

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.endDate = validation.expiryTime;
      await subscription.save();
    }
  }

  /**
   * Handle subscription paused
   */
  static async handleSubscriptionPaused(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      /** @type {any} */
      const pausedStatus = 'paused';
      subscription.status = pausedStatus;
      subscription.features = {
        unlimitedSwipes: false,
        seeWhoLikedYou: false,
        passport: false,
        advancedFilters: false,
        priorityLikes: false,
        hideAds: false,
        profileBoostAnalytics: false,
      };
      await subscription.save();
    }
  }

  /**
   * Handle subscription revoked (refund)
   */
  static async handleSubscriptionRevoked(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.status = 'cancelled';
      subscription.features = {
        unlimitedSwipes: false,
        seeWhoLikedYou: false,
        passport: false,
        advancedFilters: false,
        priorityLikes: false,
        hideAds: false,
        profileBoostAnalytics: false,
      };
      await subscription.save();
    }

    // Update transaction as refunded
    await PaymentTransaction.findOneAndUpdate(
      { provider: 'google', 'metadata.purchaseToken': purchaseToken },
      { $set: { refundStatus: 'refunded', refundedAt: new Date() } }
    );
  }

  /**
   * Handle subscription expired
   */
  static async handleSubscriptionExpired(userId, purchaseToken, subscriptionId) {
    if (!userId) return;

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.status = 'expired';
      subscription.features = {
        unlimitedSwipes: false,
        seeWhoLikedYou: false,
        passport: false,
        advancedFilters: false,
        priorityLikes: false,
        hideAds: false,
        profileBoostAnalytics: false,
      };
      await subscription.save();
    }
  }

  /**
   * Handle one-time product notification
   */
  static async handleProductNotification(notification) {
    const { notificationType, purchaseToken, sku } = notification;

    // One-time product notifications (usually refunds)
    if (notificationType === 2) {
      // PURCHASE_REFUNDED
      await PaymentTransaction.findOneAndUpdate(
        { provider: 'google', 'metadata.purchaseToken': purchaseToken },
        { $set: { refundStatus: 'refunded', refundedAt: new Date() } }
      );
    }

    return { success: true, notificationType };
  }
}

module.exports = GooglePlayService;
