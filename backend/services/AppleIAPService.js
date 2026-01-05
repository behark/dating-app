/**
 * Apple In-App Purchase Service
 *
 * Handles Apple App Store IAP operations including:
 * - Receipt validation
 * - Subscription management
 * - Server-to-server notifications (App Store Server Notifications v2)
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const paymentConfig = require('../config/payment');
const Subscription = require('../models/Subscription');
const PaymentTransaction = require('../models/PaymentTransaction');

class AppleIAPService {
  /**
   * Validate receipt with Apple's servers
   */
  static async validateReceipt(receiptData, excludeOldTransactions = false) {
    try {
      const payload = {
        'receipt-data': receiptData,
        password: paymentConfig.apple.sharedSecret,
        'exclude-old-transactions': excludeOldTransactions,
      };

      // Try production first
      let response = await axios.post(paymentConfig.apple.verifyReceiptUrl.production, payload);

      // If sandbox receipt, retry with sandbox URL
      if (response.data.status === 21007) {
        response = await axios.post(paymentConfig.apple.verifyReceiptUrl.sandbox, payload);
      }

      return this.parseReceiptResponse(response.data);
    } catch (error) {
      console.error('Error validating Apple receipt:', error);
      throw error;
    }
  }

  /**
   * Parse receipt validation response
   */
  static parseReceiptResponse(data) {
    if (data.status !== 0) {
      return {
        valid: false,
        status: data.status,
        error: this.getStatusMessage(data.status),
      };
    }

    const receipt = data.receipt;
    const latestReceiptInfo = data.latest_receipt_info || [];
    const pendingRenewalInfo = data.pending_renewal_info || [];

    // Get the most recent subscription
    const sortedSubscriptions = latestReceiptInfo
      .filter((item) => this.isSubscriptionProduct(item.product_id))
      .sort((a, b) => parseInt(b.expires_date_ms) - parseInt(a.expires_date_ms));
    const activeSubscription = sortedSubscriptions.length > 0 ? sortedSubscriptions[0] : null;

    // Get consumable purchases
    const consumables = (receipt.in_app || []).filter(
      (item) => !this.isSubscriptionProduct(item.product_id)
    );

    return {
      valid: true,
      status: 0,
      bundleId: receipt.bundle_id,
      originalApplicationVersion: receipt.original_application_version,
      subscription: activeSubscription
        ? {
            productId: activeSubscription.product_id,
            transactionId: activeSubscription.transaction_id,
            originalTransactionId: activeSubscription.original_transaction_id,
            purchaseDate: new Date(parseInt(activeSubscription.purchase_date_ms)),
            expiresDate: new Date(parseInt(activeSubscription.expires_date_ms)),
            isTrialPeriod: activeSubscription.is_trial_period === 'true',
            isInIntroOfferPeriod: activeSubscription.is_in_intro_offer_period === 'true',
            isActive: parseInt(activeSubscription.expires_date_ms) > Date.now(),
            cancellationDate: activeSubscription.cancellation_date_ms
              ? new Date(parseInt(activeSubscription.cancellation_date_ms))
              : null,
          }
        : null,
      pendingRenewal: (pendingRenewalInfo.length > 0 && pendingRenewalInfo[0])
        ? {
            productId: pendingRenewalInfo[0].product_id,
            autoRenewStatus: pendingRenewalInfo[0].auto_renew_status === '1',
            expirationIntent: pendingRenewalInfo[0].expiration_intent,
            gracePeriodExpiresDate: pendingRenewalInfo[0].grace_period_expires_date_ms
              ? new Date(parseInt(pendingRenewalInfo[0].grace_period_expires_date_ms))
              : null,
          }
        : null,
      consumables: consumables.map((item) => ({
        productId: item.product_id,
        transactionId: item.transaction_id,
        purchaseDate: new Date(parseInt(item.purchase_date_ms)),
        quantity: parseInt(item.quantity),
      })),
      latestReceipt: data.latest_receipt,
    };
  }

  /**
   * Check if product is a subscription
   */
  static isSubscriptionProduct(productId) {
    const subscriptionProducts = [
      paymentConfig.apple.products.monthlySubscription,
      paymentConfig.apple.products.yearlySubscription,
    ];
    return subscriptionProducts.includes(productId);
  }

  /**
   * Get status message from status code
   */
  static getStatusMessage(status) {
    const messages = {
      21000: 'The request to the App Store was not made using HTTP POST.',
      21001: 'This status code is no longer sent by the App Store.',
      21002: 'The data in the receipt-data property was malformed or missing.',
      21003: 'The receipt could not be authenticated.',
      21004: 'The shared secret you provided does not match the shared secret on file.',
      21005: 'The receipt server is temporarily unable to provide the receipt.',
      21006: 'This receipt is valid but the subscription has expired.',
      21007: 'This receipt is from the test environment.',
      21008: 'This receipt is from the production environment.',
      21009: 'Internal data access error.',
      21010: 'The user account cannot be found or has been deleted.',
    };
    return messages[status] || `Unknown error (status: ${status})`;
  }

  /**
   * Process purchase and update user subscription
   */
  static async processPurchase(userId, receiptData, productId) {
    try {
      const validation = await this.validateReceipt(receiptData, true);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Check bundle ID
      if (validation.bundleId !== paymentConfig.apple.bundleId) {
        return {
          success: false,
          error: 'Invalid bundle ID',
        };
      }

      // Handle subscription
      if (this.isSubscriptionProduct(productId) && validation.subscription) {
        const planType = this.getPlanTypeFromProductId(productId);

        await Subscription.upgradeToPremium(userId, planType, {
          method: 'apple',
          paymentId: validation.subscription.originalTransactionId,
          transactionId: validation.subscription.transactionId,
        });

        // Update subscription end date
        const subscription = await Subscription.findOne({ userId });
        if (subscription) {
          subscription.endDate = validation.subscription.expiresDate;
          subscription.autoRenew = validation.pendingRenewal?.autoRenewStatus ?? true;
          await subscription.save();
        }

        // Log transaction
        await PaymentTransaction.create({
          userId,
          provider: 'apple',
          type: 'subscription',
          status: 'completed',
          providerTransactionId: validation.subscription.transactionId,
          subscriptionPlan: planType,
          metadata: {
            originalTransactionId: validation.subscription.originalTransactionId,
            isTrialPeriod: validation.subscription.isTrialPeriod,
            expiresDate: validation.subscription.expiresDate,
          },
          platform: 'ios',
        });

        return {
          success: true,
          subscription: validation.subscription,
        };
      }

      // Handle consumable purchase
      const consumable = validation.consumables.find((c) => c.productId === productId);
      if (consumable) {
        await this.processConsumable(userId, consumable);

        return {
          success: true,
          consumable,
        };
      }

      return {
        success: false,
        error: 'Product not found in receipt',
      };
    } catch (error) {
      console.error('Error processing Apple purchase:', error);
      throw error;
    }
  }

  /**
   * Get plan type from Apple product ID
   */
  static getPlanTypeFromProductId(productId) {
    const products = paymentConfig.apple.products;
    if (productId === products.monthlySubscription) return 'monthly';
    if (productId === products.yearlySubscription) return 'yearly';
    return 'monthly';
  }

  /**
   * Process consumable purchase
   */
  static async processConsumable(userId, consumable) {
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const products = paymentConfig.apple.products;
    const quantity = consumable.quantity;

    switch (consumable.productId) {
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

    // Log transaction
    await PaymentTransaction.create({
      userId,
      provider: 'apple',
      type: 'one_time',
      status: 'completed',
      providerTransactionId: consumable.transactionId,
      productId: consumable.productId,
      quantity: consumable.quantity,
      platform: 'ios',
    });
  }

  /**
   * Restore purchases for user
   */
  static async restorePurchases(userId, receiptData) {
    try {
      const validation = await this.validateReceipt(receiptData, false);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      const restored = {
        subscription: null,
        consumables: [],
      };

      // Restore active subscription
      if (validation.subscription && validation.subscription.isActive) {
        const planType = this.getPlanTypeFromProductId(validation.subscription.productId);

        await Subscription.upgradeToPremium(userId, planType, {
          method: 'apple',
          paymentId: validation.subscription.originalTransactionId,
          transactionId: validation.subscription.transactionId,
        });

        const subscription = await Subscription.findOne({ userId });
        if (subscription) {
          subscription.endDate = validation.subscription.expiresDate;
          await subscription.save();
        }

        restored.subscription = validation.subscription;
      }

      return {
        success: true,
        restored,
        latestReceipt: validation.latestReceipt,
      };
    } catch (error) {
      console.error('Error restoring Apple purchases:', error);
      throw error;
    }
  }

  /**
   * Generate JWT for App Store Server API
   */
  static generateAppStoreJWT() {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: paymentConfig.apple.issuerId,
      iat: now,
      exp: now + 3600, // 1 hour
      aud: 'appstoreconnect-v1',
      bid: paymentConfig.apple.bundleId,
    };

    const header = {
      alg: 'ES256',
      kid: paymentConfig.apple.keyId,
      typ: 'JWT',
    };

    return jwt.sign(payload, paymentConfig.apple.privateKey, {
      algorithm: 'ES256',
      header,
    });
  }

  /**
   * Get subscription status from App Store Server API
   */
  static async getSubscriptionStatus(originalTransactionId) {
    try {
      const token = this.generateAppStoreJWT();
      const environment =
        paymentConfig.apple.environment === 'production'
          ? 'api.storekit.itunes.apple.com'
          : 'api.storekit-sandbox.itunes.apple.com';

      const response = await axios.get(
        `https://${environment}/inApps/v1/subscriptions/${originalTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : error;
      console.error('Error getting subscription status:', errorData || error);
      throw error;
    }
  }

  /**
   * Request refund (for customer support)
   */
  static async lookupOrder(orderId) {
    try {
      const token = this.generateAppStoreJWT();
      const environment =
        paymentConfig.apple.environment === 'production'
          ? 'api.storekit.itunes.apple.com'
          : 'api.storekit-sandbox.itunes.apple.com';

      const response = await axios.get(`https://${environment}/inApps/v1/lookup/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      const errorData = error && typeof error === 'object' && 'response' in error ? error.response?.data : error;
      console.error('Error looking up order:', errorData || error);
      throw error;
    }
  }

  /**
   * Verify and process App Store Server Notification v2
   */
  static async processServerNotification(signedPayload) {
    try {
      // Decode the JWS
      const parts = signedPayload.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWS format');
      }

      // Decode payload (in production, verify signature with Apple's certificate)
      if (parts.length < 2 || !parts[1]) {
        throw new Error('Invalid token format: missing payload');
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      const { notificationType, subtype, data } = payload;

      // Decode the transaction info
      const signedTransactionInfo = data?.signedTransactionInfo;
      const signedRenewalInfo = data?.signedRenewalInfo;

      let transactionInfo = null;
      let renewalInfo = null;

      if (signedTransactionInfo) {
        const txParts = signedTransactionInfo.split('.');
        transactionInfo = JSON.parse(Buffer.from(txParts[1], 'base64url').toString());
      }

      if (signedRenewalInfo) {
        const renewalParts = signedRenewalInfo.split('.');
        renewalInfo = JSON.parse(Buffer.from(renewalParts[1], 'base64url').toString());
      }

      // Process based on notification type
      await this.handleNotificationType(notificationType, subtype, {
        transactionInfo,
        renewalInfo,
        bundleId: data?.bundleId,
        environment: data?.environment,
      });

      return { success: true, notificationType };
    } catch (error) {
      console.error('Error processing Apple notification:', error);
      throw error;
    }
  }

  /**
   * Handle different notification types
   */
  static async handleNotificationType(type, subtype, data) {
    const { transactionInfo, renewalInfo } = data;

    if (!transactionInfo) return;

    // Find user by original transaction ID
    const transaction = await PaymentTransaction.findOne({
      provider: 'apple',
      'metadata.originalTransactionId': transactionInfo.originalTransactionId,
    });

    if (!transaction) {
      console.log('No matching transaction found for Apple notification');
      return;
    }

    const userId = transaction.userId;

    switch (type) {
      case 'SUBSCRIBED':
        // New subscription or resubscribe
        await this.handleSubscribed(userId, transactionInfo, subtype);
        break;

      case 'DID_RENEW':
        // Subscription renewed successfully
        await this.handleRenewal(userId, transactionInfo);
        break;

      case 'DID_FAIL_TO_RENEW':
        // Renewal failed
        await this.handleRenewalFailure(userId, transactionInfo, renewalInfo);
        break;

      case 'DID_CHANGE_RENEWAL_STATUS':
        // Auto-renew status changed
        await this.handleRenewalStatusChange(userId, renewalInfo, subtype);
        break;

      case 'DID_CHANGE_RENEWAL_PREF':
        // Subscription downgrade/upgrade
        await this.handleRenewalPrefChange(userId, renewalInfo);
        break;

      case 'EXPIRED':
        // Subscription expired
        await this.handleExpired(userId, transactionInfo, subtype);
        break;

      case 'GRACE_PERIOD_EXPIRED':
        // Grace period expired
        await this.handleGracePeriodExpired(userId);
        break;

      case 'REFUND':
        // Refund processed
        await this.handleRefund(userId, transactionInfo);
        break;

      case 'REVOKE':
        // Access revoked (e.g., family sharing removed)
        await this.handleRevoke(userId, transactionInfo);
        break;

      case 'CONSUMPTION_REQUEST':
        // Apple requesting consumption info for refund
        console.log('Consumption request received');
        break;

      default:
        console.log(`Unhandled Apple notification type: ${type}`);
    }
  }

  /**
   * Handle new subscription
   */
  static async handleSubscribed(userId, transactionInfo, subtype) {
    const planType = this.getPlanTypeFromProductId(transactionInfo.productId);

    await Subscription.upgradeToPremium(userId, planType, {
      method: 'apple',
      paymentId: transactionInfo.originalTransactionId,
      transactionId: transactionInfo.transactionId,
    });

    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.endDate = new Date(transactionInfo.expiresDate);
      await subscription.save();
    }

    await PaymentTransaction.create({
      userId,
      provider: 'apple',
      type: 'subscription',
      status: 'completed',
      providerTransactionId: transactionInfo.transactionId,
      subscriptionPlan: planType,
      metadata: {
        originalTransactionId: transactionInfo.originalTransactionId,
        subtype,
      },
    });
  }

  /**
   * Handle renewal
   */
  static async handleRenewal(userId, transactionInfo) {
    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.endDate = new Date(transactionInfo.expiresDate);
      subscription.status = 'active';
      await subscription.save();
    }

    await PaymentTransaction.create({
      userId,
      provider: 'apple',
      type: 'subscription',
      status: 'completed',
      providerTransactionId: transactionInfo.transactionId,
      metadata: {
        originalTransactionId: transactionInfo.originalTransactionId,
        type: 'renewal',
      },
    });
  }

  /**
   * Handle renewal failure
   */
  static async handleRenewalFailure(userId, transactionInfo, renewalInfo) {
    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.status = 'past_due';
      // Check if in grace period
      if (renewalInfo?.gracePeriodExpiresDate) {
        subscription.endDate = new Date(renewalInfo.gracePeriodExpiresDate);
      }
      await subscription.save();
    }

    await PaymentTransaction.create({
      userId,
      provider: 'apple',
      type: 'subscription',
      status: 'failed',
      providerTransactionId: transactionInfo?.transactionId,
      failureReason: 'Renewal payment failed',
    });
  }

  /**
   * Handle renewal status change
   */
  static async handleRenewalStatusChange(userId, renewalInfo, subtype) {
    const subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.autoRenew = renewalInfo?.autoRenewStatus === 1;
      await subscription.save();
    }
  }

  /**
   * Handle renewal preference change (upgrade/downgrade)
   */
  static async handleRenewalPrefChange(userId, renewalInfo) {
    // Log the change for analytics
    console.log(`User ${userId} changed renewal preference to ${renewalInfo?.autoRenewProductId}`);
  }

  /**
   * Handle subscription expiration
   */
  static async handleExpired(userId, transactionInfo, subtype) {
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
   * Handle grace period expired
   */
  static async handleGracePeriodExpired(userId) {
    await this.handleExpired(userId, null, 'GRACE_PERIOD_EXPIRED');
  }

  /**
   * Handle refund
   */
  static async handleRefund(userId, transactionInfo) {
    // Update transaction
    await PaymentTransaction.findOneAndUpdate(
      { providerTransactionId: transactionInfo.transactionId },
      {
        $set: {
          refundStatus: 'refunded',
          refundedAt: new Date(),
        },
      }
    );

    // If subscription refunded, cancel it
    if (this.isSubscriptionProduct(transactionInfo.productId)) {
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
    }
  }

  /**
   * Handle revoke (family sharing removed, etc.)
   */
  static async handleRevoke(userId, transactionInfo) {
    await this.handleExpired(userId, transactionInfo, 'REVOKE');
  }
}

module.exports = AppleIAPService;
