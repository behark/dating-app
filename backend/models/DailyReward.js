const mongoose = require('mongoose');

const dailyRewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rewardDate: {
    type: Date,
    required: true,
  },
  rewardType: {
    type: String,
    enum: ['login', 'swipe', 'match', 'message', 'profile_view'],
    required: true,
  },
  rewardValue: {
    type: Number,
    required: true, // Points or currency value
    min: 0,
  },
  rewardDescription: {
    type: String,
    required: true,
  },
  isClaimed: {
    type: Boolean,
    default: false,
  },
  claimedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date, // Daily rewards expire after 24 hours if not claimed
    required: true,
  },
  loginStreak: {
    type: Number,
    default: 1,
  },
  bonusMultiplier: {
    type: Number,
    default: 1.0, // Increases with consecutive logins
  },
  metadata: {
    source: String, // e.g., 'daily_login', 'achievement_bonus', 'streak_milestone'
    relatedId: mongoose.Schema.Types.ObjectId,
  },
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
dailyRewardSchema.index({ userId: 1, rewardDate: -1 });
dailyRewardSchema.index({ isClaimed: 1, expiresAt: 1 });
dailyRewardSchema.index({ rewardDate: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

dailyRewardSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * @typedef {import('../types/index').DailyRewardDocument} DailyRewardDocument
 * @typedef {import('../types/index').DailyRewardModel} DailyRewardModel
 */

/** @type {DailyRewardModel} */
const DailyRewardModel = mongoose.model('DailyReward', dailyRewardSchema);

module.exports = DailyRewardModel;
