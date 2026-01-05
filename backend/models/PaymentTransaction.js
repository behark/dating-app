/**
 * Payment Transaction Model
 *
 * Records all payment transactions including:
 * - Subscriptions
 * - One-time purchases
 * - Refunds
 * - Failed payments
 */

const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Payment provider
  provider: {
    type: String,
    enum: ['stripe', 'paypal', 'apple', 'google'],
    required: true,
  },

  // Transaction type
  type: {
    type: String,
    enum: ['subscription', 'one_time', 'invoice', 'checkout', 'refund'],
    required: true,
  },

  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'expired', 'refunded', 'partial_refund'],
    default: 'pending',
  },

  // Amount
  amount: {
    type: Number,
    min: 0,
  },

  // Currency
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },

  // Provider-specific transaction ID
  providerTransactionId: {
    type: String,
    index: true,
  },

  // Provider subscription ID (for recurring)
  providerSubscriptionId: String,

  // Product information
  productType: {
    type: String,
    enum: ['subscription', 'superLikes', 'boosts', 'rewinds', 'other'],
  },
  productId: String,
  quantity: {
    type: Number,
    default: 1,
  },

  // Subscription details
  subscriptionPlan: {
    type: String,
    enum: [
      'trial',
      'monthly',
      'yearly',
      'premium_monthly',
      'premium_yearly',
      'platinum_monthly',
      'platinum_yearly',
    ],
  },

  // Failure information
  failureReason: String,
  failureCode: String,

  // Refund information
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'partial_refund', 'refunded', 'denied'],
    default: 'none',
  },
  refundAmount: Number,
  refundReason: String,
  refundRequestedAt: Date,
  refundedAt: Date,
  refundId: String,

  // Receipt/Invoice
  receiptUrl: String,
  invoiceId: String,
  invoiceUrl: String,

  // Original transaction (for refunds)
  originalTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentTransaction',
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // IP and device info
  ipAddress: String,
  userAgent: String,
  deviceId: String,
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

// Indexes
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ provider: 1, providerTransactionId: 1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });
paymentTransactionSchema.index({ type: 1, status: 1 });

// Update timestamp before saving
paymentTransactionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Static method: Get user transaction history
paymentTransactionSchema.statics.getUserTransactions = async function (userId, options = {}) {
  const { limit = 50, skip = 0, type, status, startDate, endDate } = options;

  const query = { userId };

  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  // @ts-ignore - Mongoose static method context
  return this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

// Static method: Get transaction by provider ID
// @ts-ignore - Mongoose static method context
paymentTransactionSchema.statics.findByProviderId = function (provider, providerTransactionId) {
  return this.findOne({ provider, providerTransactionId });
};

// Static method: Calculate user total spend
/**
 * @param {string} userId
 * @returns {Promise<{totalSpend: number, totalTransactions: number}>}
 */
// @ts-ignore - Mongoose static method context
paymentTransactionSchema.statics.getUserTotalSpend = async function (userId) {
  const mongoose = require('mongoose');
  const result = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : userId,
        status: 'completed',
        type: { $ne: 'refund' },
      },
    },
    {
      $group: {
        _id: null,
        totalSpend: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  /** @type {any[]} */
  const typedResult = result;
  if (typedResult.length > 0 && typedResult[0]) {
    return typedResult[0];
  }
  return { totalSpend: 0, totalTransactions: 0 };
};
// @ts-ignore - Mongoose static method context

// Static method: Get revenue analytics
paymentTransactionSchema.statics.getRevenueAnalytics = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        status: 'completed',
        type: { $in: ['subscription', 'one_time'] },
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          provider: '$provider',
          type: '$type',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);
  // @ts-ignore - Mongoose static method context
};

// Static method: Get refund statistics
paymentTransactionSchema.statics.getRefundStats = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        refundStatus: { $in: ['refunded', 'partial_refund'] },
        refundedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$provider',
        totalRefunded: { $sum: '$refundAmount' },
        count: { $sum: 1 },
      },
    },
  ]);
};

// Instance method: Mark as completed
paymentTransactionSchema.methods.markCompleted = function (additionalData = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  Object.assign(this, additionalData);
  return this.save();
};

// Instance method: Mark as failed
paymentTransactionSchema.methods.markFailed = function (reason, code) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failureCode = code;
  return this.save();
};

// Instance method: Process refund
paymentTransactionSchema.methods.processRefund = function (refundAmount, refundId, reason) {
  this.refundStatus = refundAmount >= this.amount ? 'refunded' : 'partial_refund';
  this.refundAmount = refundAmount;
  this.refundId = refundId;
  this.refundReason = reason;
  this.refundedAt = new Date();
  this.status = this.refundStatus;
  return this.save();
};

/**
 * @typedef {import('../types/index').PaymentTransactionDocument} PaymentTransactionDocument
 * @typedef {import('../types/index').PaymentTransactionModel} PaymentTransactionModel
 */

/** @type {PaymentTransactionModel} */
const PaymentTransactionModel = mongoose.model('PaymentTransaction', paymentTransactionSchema);

module.exports = PaymentTransactionModel;
