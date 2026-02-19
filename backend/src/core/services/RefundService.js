/**
 * Refund Service
 *
 * Handles refund processing for all payment providers
 * including automatic approvals and manual review queue
 */

const paymentConfig = require('../../config/payment');
const PaymentTransaction = require('../domain/PaymentTransaction');
const Subscription = require('../domain/Subscription');
const StripeService = require('./StripeService');
const PayPalService = require('./PayPalService');
const { logger } = require('../../infrastructure/external/LoggingService');

class RefundService {
  /**
   * Request a refund
   */
  static async requestRefund(userId, transactionId, reason, requestedAmount = null) {
    try {
      const transaction = await PaymentTransaction.findOne({
        _id: transactionId,
        userId,
        status: 'completed',
        refundStatus: 'none',
      });

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found or already refunded',
        };
      }

      // Check if eligible for automatic refund
      const eligibility = await this.checkAutoRefundEligibility(transaction, requestedAmount);

      if (eligibility.autoApprove) {
        // Process automatic refund
        return await this.processRefund(
          transaction,
          requestedAmount || transaction.amount,
          reason,
          true
        );
      } else {
        // Queue for manual review
        transaction.refundStatus = 'pending';
        transaction.refundReason = reason;
        transaction.refundRequestedAt = new Date();
        transaction.metadata = {
          ...transaction.metadata,
          requestedRefundAmount: requestedAmount,
          ineligibilityReason: eligibility.reason,
        };
        await transaction.save();

        return {
          success: true,
          status: 'pending_review',
          message: 'Refund request submitted for review',
          estimatedReviewTime: '24-48 hours',
        };
      }
    } catch (/** @type {any} */ error) {
      console.error('Error requesting refund:', error);
      throw error;
    }
  }

  /**
   * Check if transaction is eligible for automatic refund
   */
  static async checkAutoRefundEligibility(transaction, requestedAmount) {
    const { autoApproveWindow, maxAutoRefundAmount } = paymentConfig.refund;
    const amount = requestedAmount || transaction.amount;

    // Check refund window (hours)
    const purchaseTime = transaction.createdAt;
    const hoursSincePurchase = (Date.now() - purchaseTime.getTime()) / (1000 * 60 * 60);

    if (hoursSincePurchase > autoApproveWindow) {
      return {
        autoApprove: false,
        reason: `Purchase made ${Math.floor(hoursSincePurchase)} hours ago. Auto-refund window is ${autoApproveWindow} hours.`,
      };
    }

    // Check amount limit
    if (amount > maxAutoRefundAmount) {
      return {
        autoApprove: false,
        reason: `Refund amount $${amount} exceeds auto-approval limit of $${maxAutoRefundAmount}`,
      };
    }

    // Check if user has had recent refunds (fraud prevention)
    const recentRefunds = await PaymentTransaction.countDocuments({
      userId: transaction.userId,
      refundStatus: { $in: ['refunded', 'partial_refund'] },
      refundedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    if (recentRefunds >= 3) {
      return {
        autoApprove: false,
        reason: 'User has reached maximum auto-refunds this month',
      };
    }

    return { autoApprove: true };
  }

  /**
   * Process refund with payment provider
   */
  static async processRefund(transaction, amount, reason, isAutomatic = false) {
    try {
      let refundResult;

      switch (transaction.provider) {
        case 'stripe':
          refundResult = await this.processStripeRefund(transaction, amount, reason);
          break;

        case 'paypal':
          refundResult = await this.processPayPalRefund(transaction, amount, reason);
          break;

        case 'apple':
          // Apple doesn't support direct refunds via API
          // User must request through Apple
          return {
            success: false,
            error: 'Apple purchases must be refunded through Apple Support',
            appleRefundUrl: 'https://reportaproblem.apple.com',
          };

        case 'google':
          refundResult = await this.processGoogleRefund(transaction, amount, reason);
          break;

        default:
          return {
            success: false,
            error: `Unknown payment provider: ${transaction.provider}`,
          };
      }

      if (refundResult.success) {
        // Update transaction
        transaction.refundStatus = amount >= transaction.amount ? 'refunded' : 'partial_refund';
        transaction.refundAmount = amount;
        transaction.refundReason = reason;
        transaction.refundedAt = new Date();
        transaction.refundId = refundResult.refundId;
        transaction.status = transaction.refundStatus;
        await transaction.save();

        // Handle subscription cancellation if needed
        if (transaction.type === 'subscription') {
          await this.handleSubscriptionRefund(transaction.userId, transaction);
        }

        // Handle consumable clawback if needed
        if (transaction.type === 'one_time' && transaction.productType) {
          await this.handleConsumableRefund(transaction.userId, transaction);
        }

        return {
          success: true,
          refundId: refundResult.refundId,
          amount: refundResult.amount,
          status: transaction.refundStatus,
          isAutomatic,
        };
      }

      return refundResult;
    } catch (/** @type {any} */ error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Process Stripe refund
   */
  static async processStripeRefund(transaction, amount, reason) {
    try {
      const refund = await StripeService.createRefund(
        transaction.providerTransactionId,
        amount,
        this.mapReasonToStripe(reason)
      );

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (/** @type {any} */ error) {
      console.error('Stripe refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Map refund reason to Stripe reason
   */
  static mapReasonToStripe(reason) {
    const reasonMap = {
      duplicate: 'duplicate',
      fraudulent: 'fraudulent',
      requested_by_customer: 'requested_by_customer',
    };
    return reasonMap[reason] || 'requested_by_customer';
  }

  /**
   * Process PayPal refund
   */
  static async processPayPalRefund(transaction, amount, reason) {
    try {
      // For PayPal, we need the capture ID, not the order ID
      const refund = await PayPalService.createRefund(
        transaction.metadata?.captureId || transaction.providerTransactionId,
        amount,
        reason
      );

      return {
        success: true,
        refundId: refund.refundId,
        amount: parseFloat(refund.amount),
        status: refund.status,
      };
    } catch (/** @type {any} */ error) {
      console.error('PayPal refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process Google Play refund
   */
  static async processGoogleRefund(transaction, amount, reason) {
    try {
      const GooglePlayService = require('./GooglePlayService');

      // For subscriptions
      if (transaction.type === 'subscription') {
        await GooglePlayService.refundSubscription(
          transaction.metadata?.purchaseToken,
          transaction.metadata?.productId
        );
      } else {
        // For one-time products, Google doesn't support programmatic refunds
        // Must be done via Google Play Console
        return {
          success: false,
          error: 'Google Play one-time purchases must be refunded via Google Play Console',
        };
      }

      return {
        success: true,
        refundId: `google_refund_${Date.now()}`,
        amount,
        status: 'refunded',
      };
    } catch (/** @type {any} */ error) {
      console.error('Google refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Handle subscription after refund
   */
  static async handleSubscriptionRefund(userId, transaction) {
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) return;

    // Cancel subscription and revoke access
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
    subscription.endDate = new Date(); // Immediate termination

    await subscription.save();
  }

  /**
   * Handle consumable clawback after refund
   */
  static async handleConsumableRefund(userId, transaction) {
    const User = require('../domain/User');
    const user = await User.findById(userId);

    if (!user) return;

    const quantity = transaction.quantity || 1;

    switch (transaction.productType) {
      case 'superLikes':
        user.superLikesBalance = Math.max(0, (user.superLikesBalance || 0) - quantity);
        break;
      case 'boosts':
        user.boostsBalance = Math.max(0, (user.boostsBalance || 0) - quantity);
        break;
      case 'rewinds':
        user.rewindsBalance = Math.max(0, (user.rewindsBalance || 0) - quantity);
        break;
    }

    await user.save();
  }

  /**
   * Get pending refund requests (for admin)
   */
  static async getPendingRefunds(options = {}) {
    const { skip = 0, limit = 50 } = options;

    return PaymentTransaction.find({
      refundStatus: 'pending',
    })
      .sort({ refundRequestedAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');
  }

  /**
   * Approve refund request (admin action)
   */
  static async approveRefund(transactionId, adminId, approvedAmount = null) {
    const transaction = await PaymentTransaction.findOne({
      _id: transactionId,
      refundStatus: 'pending',
    });

    if (!transaction) {
      return {
        success: false,
        error: 'Pending refund request not found',
      };
    }

    const amount =
      approvedAmount || transaction.metadata?.requestedRefundAmount || transaction.amount;

    const result = await this.processRefund(transaction, amount, transaction.refundReason, false);

    if (result.success) {
      transaction.metadata = {
        ...transaction.metadata,
        approvedBy: adminId,
        approvedAt: new Date(),
      };
      await transaction.save();
    }

    return result;
  }

  /**
   * Deny refund request (admin action)
   */
  static async denyRefund(transactionId, adminId, denialReason) {
    const transaction = await PaymentTransaction.findOne({
      _id: transactionId,
      refundStatus: 'pending',
    });

    if (!transaction) {
      return {
        success: false,
        error: 'Pending refund request not found',
      };
    }

    transaction.refundStatus = 'denied';
    transaction.metadata = {
      ...transaction.metadata,
      deniedBy: adminId,
      deniedAt: new Date(),
      denialReason,
    };
    await transaction.save();

    // Send notification to user about refund denial
    try {
      const Notification = require('../domain/Notification');
      await Notification.create({
        userId: transaction.userId,
        type: 'system',
        title: 'Refund Request Update',
        message: `Your refund request has been reviewed and could not be approved. ${denialReason ? `Reason: ${denialReason}` : 'Please contact support for more information.'}`,
        data: {
          transactionId: transaction._id,
          status: 'denied',
        },
        priority: 'high',
      });
    } catch (/** @type {any} */ notifError) {
      // Log but don't fail the denial
      const { logger } = require('../../infrastructure/external/LoggingService');
      logger.error('Failed to send refund denial notification', {
        userId: transaction.userId,
        error: notifError.message,
      });
    }

    return {
      success: true,
      message: 'Refund request denied',
    };
  }

  /**
   * Get refund statistics
   */
  static async getRefundStats(startDate, endDate) {
    return PaymentTransaction.aggregate([
      {
        $match: {
          refundStatus: { $in: ['refunded', 'partial_refund'] },
          refundedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            provider: '$provider',
            status: '$refundStatus',
          },
          totalAmount: { $sum: '$refundAmount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.provider': 1 },
      },
    ]);
  }

  /**
   * Handle subscription cancellation (without refund)
   */
  static async cancelSubscription(userId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        logger.error('Subscription cancellation failed: No subscription found', {
          userId,
          action: 'cancelSubscription',
          cancelAtPeriodEnd,
        });
        return { success: false, message: 'User not found', statusCode: 404 };
      }

      if (!subscription || subscription.status !== 'active') {
        return {
          success: false,
          error: 'No active subscription found',
        };
      }

      let result;

      switch (subscription.paymentMethod) {
        case 'stripe': {
          // Get Stripe subscription ID
          const User = require('../domain/User');
          const user = await User.findById(userId);
          const stripeSubscription = await StripeService.getActiveSubscription(user);

          if (stripeSubscription) {
            result = await StripeService.cancelSubscription(
              stripeSubscription.id,
              !cancelAtPeriodEnd
            );
          }
          break;
        }

        case 'paypal':
          result = await PayPalService.cancelSubscription(
            subscription.paymentId,
            'Customer requested cancellation'
          );
          break;

        case 'google': {
          const GooglePlayService = require('./GooglePlayService');
          // For Google, cancellation is done client-side
          // We just update our records
          break;
        }

        case 'apple':
          // For Apple, cancellation is done by user in Settings
          // We just update our records based on notifications
          break;
      }

      // Update local subscription
      if (cancelAtPeriodEnd) {
        subscription.autoRenew = false;
        // Keep status active until end date
      } else {
        subscription.status = 'cancelled';
        subscription.endDate = new Date();
        subscription.features = {
          unlimitedSwipes: false,
          seeWhoLikedYou: false,
          passport: false,
          advancedFilters: false,
          priorityLikes: false,
          hideAds: false,
          profileBoostAnalytics: false,
        };
      }

      await subscription.save();

      return {
        success: true,
        message: cancelAtPeriodEnd
          ? `Subscription will be cancelled at the end of billing period (${subscription.endDate})`
          : 'Subscription cancelled immediately',
        endDate: subscription.endDate,
      };
    } catch (/** @type {any} */ error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Resume cancelled subscription (if not yet expired)
   */
  static async resumeSubscription(userId) {
    try {
      const subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        return {
          success: false,
          error: 'No subscription found',
        };
      }

      if (
        subscription.status !== 'active' ||
        !subscription.endDate ||
        subscription.endDate <= new Date()
      ) {
        return {
          success: false,
          error: 'Subscription cannot be resumed. Please start a new subscription.',
        };
      }

      switch (subscription.paymentMethod) {
        case 'stripe': {
          const User = require('../domain/User');
          const user = await User.findById(userId);
          const stripeSubscription = await StripeService.getActiveSubscription(user);

          if (stripeSubscription && stripeSubscription.cancelAtPeriodEnd) {
            await StripeService.resumeSubscription(stripeSubscription.id);
          }
          break;
        }

        case 'paypal':
          await PayPalService.reactivateSubscription(subscription.paymentId);
          break;
      }

      subscription.autoRenew = true;
      await subscription.save();

      return {
        success: true,
        message: 'Subscription resumed successfully',
      };
    } catch (/** @type {any} */ error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }
}

module.exports = RefundService;
