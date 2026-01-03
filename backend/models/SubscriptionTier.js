/**
 * Subscription Tier Model
 * 
 * Defines subscription tier configurations and features
 */

const mongoose = require('mongoose');

const subscriptionTierSchema = new mongoose.Schema({
  // Tier identifier
  tierId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Tier name
  name: {
    type: String,
    required: true,
  },

  // Tier level (for comparison)
  level: {
    type: Number,
    required: true,
    default: 0,
  },

  // Description
  description: String,

  // Pricing
  pricing: {
    monthly: {
      price: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      stripePriceId: String,
      paypalPlanId: String,
      appleProductId: String,
      googleProductId: String,
    },
    yearly: {
      price: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      savingsPercent: { type: Number, default: 0 },
      stripePriceId: String,
      paypalPlanId: String,
      appleProductId: String,
      googleProductId: String,
    },
  },

  // Features
  features: {
    // Swipes
    dailyLikes: { type: Number, default: 50 }, // -1 for unlimited
    unlimitedSwipes: { type: Boolean, default: false },
    
    // Super Likes
    superLikesPerDay: { type: Number, default: 0 },
    
    // Rewinds
    rewindsPerDay: { type: Number, default: 0 }, // -1 for unlimited
    
    // See who liked you
    seeWhoLikedYou: { type: Boolean, default: false },
    
    // Passport (location change)
    passport: { type: Boolean, default: false },
    
    // Advanced filters
    advancedFilters: { type: Boolean, default: false },
    
    // Priority likes
    priorityLikes: { type: Boolean, default: false },
    
    // Ads
    hideAds: { type: Boolean, default: false },
    
    // Profile boosts
    profileBoostsPerMonth: { type: Number, default: 0 },
    profileBoostAnalytics: { type: Boolean, default: false },
    
    // Messaging
    messageBeforeMatch: { type: Boolean, default: false },
    readReceipts: { type: Boolean, default: false },
    
    // Privacy
    incognitoMode: { type: Boolean, default: false },
    hideAge: { type: Boolean, default: false },
    hideDistance: { type: Boolean, default: false },
    
    // Spotlight
    weeklySpotlight: { type: Boolean, default: false },
  },

  // Display
  display: {
    order: { type: Number, default: 0 },
    badgeColor: { type: String, default: '#888' },
    highlighted: { type: Boolean, default: false },
    highlightText: String,
    icon: String,
  },

  // Trial
  trial: {
    available: { type: Boolean, default: false },
    durationDays: { type: Number, default: 7 },
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
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

// Update timestamp
subscriptionTierSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method: Get all active tiers
subscriptionTierSchema.statics.getActiveTiers = function() {
  return this.find({ isActive: true }).sort({ level: 1 });
};

// Static method: Get tier by ID
subscriptionTierSchema.statics.getTierById = function(tierId) {
  return this.findOne({ tierId, isActive: true });
};

// Static method: Compare tiers
subscriptionTierSchema.statics.compareTiers = function(tier1Id, tier2Id) {
  return this.find({ tierId: { $in: [tier1Id, tier2Id] }, isActive: true });
};

// Static method: Initialize default tiers
subscriptionTierSchema.statics.initializeDefaultTiers = async function() {
  const defaultTiers = [
    {
      tierId: 'free',
      name: 'Free',
      level: 0,
      description: 'Basic dating experience',
      pricing: {
        monthly: { price: 0 },
        yearly: { price: 0 },
      },
      features: {
        dailyLikes: 50,
        unlimitedSwipes: false,
        superLikesPerDay: 1,
        rewindsPerDay: 0,
        seeWhoLikedYou: false,
        passport: false,
        advancedFilters: false,
        priorityLikes: false,
        hideAds: false,
        profileBoostsPerMonth: 0,
        profileBoostAnalytics: false,
        messageBeforeMatch: false,
        readReceipts: false,
        incognitoMode: false,
      },
      display: {
        order: 0,
        badgeColor: '#888888',
      },
      trial: { available: false },
    },
    {
      tierId: 'premium',
      name: 'Premium',
      level: 1,
      description: 'Enhanced dating features',
      pricing: {
        monthly: { price: 14.99, currency: 'USD' },
        yearly: { price: 99.99, currency: 'USD', savingsPercent: 44 },
      },
      features: {
        dailyLikes: -1,
        unlimitedSwipes: true,
        superLikesPerDay: 5,
        rewindsPerDay: 5,
        seeWhoLikedYou: true,
        passport: true,
        advancedFilters: true,
        priorityLikes: true,
        hideAds: true,
        profileBoostsPerMonth: 1,
        profileBoostAnalytics: true,
        messageBeforeMatch: false,
        readReceipts: true,
        incognitoMode: false,
      },
      display: {
        order: 1,
        badgeColor: '#FFD700',
        highlighted: true,
        highlightText: 'Most Popular',
        icon: '⭐',
      },
      trial: { available: true, durationDays: 7 },
    },
    {
      tierId: 'platinum',
      name: 'Platinum',
      level: 2,
      description: 'Ultimate dating experience',
      pricing: {
        monthly: { price: 29.99, currency: 'USD' },
        yearly: { price: 179.99, currency: 'USD', savingsPercent: 50 },
      },
      features: {
        dailyLikes: -1,
        unlimitedSwipes: true,
        superLikesPerDay: -1,
        rewindsPerDay: -1,
        seeWhoLikedYou: true,
        passport: true,
        advancedFilters: true,
        priorityLikes: true,
        hideAds: true,
        profileBoostsPerMonth: 5,
        profileBoostAnalytics: true,
        messageBeforeMatch: true,
        readReceipts: true,
        incognitoMode: true,
        hideAge: true,
        hideDistance: true,
        weeklySpotlight: true,
      },
      display: {
        order: 2,
        badgeColor: '#E5E4E2',
        highlighted: false,
        icon: '💎',
      },
      trial: { available: false },
    },
  ];

  for (const tier of defaultTiers) {
    await this.findOneAndUpdate(
      { tierId: tier.tierId },
      tier,
      { upsert: true, new: true }
    );
  }

  console.log('Default subscription tiers initialized');
};

// Instance method: Check if tier has feature
subscriptionTierSchema.methods.hasFeature = function(featureName) {
  const value = this.features[featureName];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return false;
};

// Instance method: Get feature value
subscriptionTierSchema.methods.getFeatureValue = function(featureName) {
  return this.features[featureName];
};

module.exports = mongoose.model('SubscriptionTier', subscriptionTierSchema);
