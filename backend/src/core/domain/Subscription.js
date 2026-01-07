const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // Subscription status
  status: {
    type: String,
    enum: ['free', 'trial', 'active', 'expired', 'cancelled'],
    default: 'free',
  },

  // Plan type
  planType: {
    type: String,
    enum: ['trial', 'monthly', 'yearly'],
    default: null,
  },

  // Trial information
  trial: {
    startDate: Date,
    endDate: Date,
    isUsed: {
      type: Boolean,
      default: false,
    },
  },

  // Subscription period
  startDate: Date,
  endDate: Date,
  renewalDate: Date,
  autoRenew: {
    type: Boolean,
    default: true,
  },

  // Payment information
  paymentMethod: {
    type: String,
    enum: ['stripe', 'apple', 'google', 'manual'],
    default: null,
  },
  paymentId: String,
  transactionId: String,

  // Premium features settings
  features: {
    unlimitedSwipes: { type: Boolean, default: false },
    seeWhoLikedYou: { type: Boolean, default: false },
    passport: { type: Boolean, default: false },
    advancedFilters: { type: Boolean, default: false },
    priorityLikes: { type: Boolean, default: false },
    hideAds: { type: Boolean, default: false },
    profileBoostAnalytics: { type: Boolean, default: false },
  },

  // Usage tracking
  superLikesUsedToday: {
    type: Number,
    default: 0,
  },
  lastSuperLikeDate: Date,
  dailyLikesLimit: {
    type: Number,
    default: 50,
  },
  profileBoostsUsedThisMonth: {
    type: Number,
    default: 0,
  },
  maxProfileBoostsPerMonth: {
    type: Number,
    default: 5,
  },

  // Ad settings
  showAds: {
    type: Boolean,
    default: true,
  },

  // Premium features usage
  lastPassportChange: Date,
  passportLocations: [
    {
      longitude: Number,
      latitude: Number,
      changedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Boost analytics
  boostAnalytics: {
    totalBoosts: { type: Number, default: 0 },
    totalProfileViews: { type: Number, default: 0 },
    totalLikesReceived: { type: Number, default: 0 },
    lastBoostDate: Date,
    boostHistory: [
      {
        startDate: Date,
        endDate: Date,
        viewsGained: Number,
        likesGained: Number,
      },
    ],
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
// Note: userId index is automatically created by unique: true, so we don't need to add it explicitly
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

// TD-003: Indexes for premium metrics queries
// Index for premium conversion rate queries
subscriptionSchema.index({ createdAt: -1, status: 1 }, { name: 'createdAt_status_premium' });
// Index for churn rate queries (cancelled subscriptions)
subscriptionSchema.index(
  { cancelledAt: -1, status: 1 },
  { name: 'cancelledAt_status_churn', sparse: true }
);

// Update timestamp before saving
subscriptionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if premium is active
subscriptionSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.status === 'active' && this.endDate && this.endDate > now;
});

// Method to check if trial is available
subscriptionSchema.methods.isTrialAvailable = function () {
  return !this.trial.isUsed && this.status === 'free';
};

// Method to check if premium features are available
/** @this {import('../types/index').SubscriptionDocument} */
subscriptionSchema.methods.hasFeature = function (featureName) {
  if (this.status !== 'active' || (this.endDate && this.endDate <= new Date())) {
    return false;
  }
  // @ts-ignore
  return this.features[featureName] === true;
};

// Static method to get or create subscription for user
/**
 * @this {import('../types/index').SubscriptionModel}
 * @param {string} userId
 * @returns {Promise<import('../types/index').SubscriptionDocument>}
 */
// @ts-ignore
subscriptionSchema.statics.getOrCreate = async function (userId) {
  let subscription = await this.findOne({ userId });
  if (!subscription) {
    subscription = new this({ userId });
    await subscription.save();
  }
  return subscription;
};

// Static method to activate trial
/**
 * @this {import('../types/index').SubscriptionModel}
 * @param {string} userId
 * @returns {Promise<{success: boolean, message?: string, subscription?: any}>}
 */
// @ts-ignore
subscriptionSchema.statics.activateTrial = async function (userId) {
  const subscription = await this.getOrCreate(userId);

  if (!subscription.isTrialAvailable()) {
    return { success: false, message: 'Trial already used or subscription active' };
  }

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

  subscription.status = 'trial';
  if (!subscription.trial) {
    subscription.trial = {};
  }
  if (subscription.trial) {
    subscription.trial.startDate = new Date();
    subscription.trial.endDate = trialEndDate;
    subscription.trial.isUsed = true;
  }
  subscription.startDate = new Date();
  subscription.endDate = trialEndDate;
  subscription.features = {
    unlimitedSwipes: true,
    seeWhoLikedYou: true,
    passport: true,
    advancedFilters: true,
    priorityLikes: true,
    hideAds: true,
    profileBoostAnalytics: true,
  };

  await subscription.save();
  return { success: true, subscription };
};

// Static method to upgrade to paid subscription
/**
 * @this {import('../types/index').SubscriptionModel}
 * @param {string} userId
 * @param {string} planType
 * @param {any} paymentData
 * @returns {Promise<{success: boolean, subscription?: any}>}
 */
// @ts-ignore
subscriptionSchema.statics.upgradeToPremium = async function (userId, planType, paymentData = {}) {
  const subscription = await this.getOrCreate(userId);

  const endDate = new Date();
  switch (planType) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }

  subscription.status = 'active';
  subscription.planType = planType;
  subscription.startDate = new Date();
  subscription.endDate = endDate;
  subscription.renewalDate = new Date(endDate);
  subscription.paymentMethod = paymentData.method || 'stripe';
  subscription.paymentId = paymentData.paymentId;
  subscription.transactionId = paymentData.transactionId;
  subscription.features = {
    unlimitedSwipes: true,
    seeWhoLikedYou: true,
    passport: true,
    advancedFilters: true,
    priorityLikes: true,
    hideAds: true,
    profileBoostAnalytics: true,
  };

  await subscription.save();
  return { success: true, subscription };
};

// Static method to cancel subscription
/**
 * @this {import('../types/index').SubscriptionModel}
 * @param {string} userId
 * @returns {Promise<{success: boolean, subscription?: any}>}
 */
// @ts-ignore
subscriptionSchema.statics.cancelSubscription = async function (userId) {
  const subscription = await this.getOrCreate(userId);

  subscription.status = 'cancelled';
  subscription.endDate = new Date();
  subscription.autoRenew = false;

  await subscription.save();
  return { success: true, subscription };
};

/**
 * @typedef {import('../types/index').SubscriptionDocument} SubscriptionDocument
 * @typedef {import('../types/index').SubscriptionModel} SubscriptionModel
 */

/** @type {SubscriptionModel} */
// @ts-ignore
const SubscriptionModel = mongoose.model('Subscription', subscriptionSchema);

module.exports = SubscriptionModel;
