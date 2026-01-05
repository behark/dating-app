const mongoose = require('mongoose');

const boostProfileSchema = new mongoose.Schema(
  {
    // The user whose profile is boosted
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Duration in minutes (typically 30)
    durationMinutes: {
      type: Number,
      default: 30,
      min: 1,
      max: 1440, // Max 24 hours
    },

    // When the boost started
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // When the boost ends
    endsAt: {
      type: Date,
      required: true,
      index: true,
    },

    // Whether the boost is still active
    isActive: {
      type: Boolean,
      default: true,
    },

    // Boost tier (free, premium, etc.)
    tier: {
      type: String,
      enum: ['free', 'premium', 'vip'],
      default: 'free',
    },

    // Extra visibility multiplier
    visibilityMultiplier: {
      type: Number,
      default: 3, // Appears 3x more in discovery
      min: 1,
      max: 10,
    },

    // Metrics
    impressions: {
      type: Number,
      default: 0,
    },

    // Timestamp
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active boosts for a user
boostProfileSchema.index({ userId: 1, isActive: 1, endsAt: -1 });

// Index for finding all active boosts (for discovery sorting)
boostProfileSchema.index({ isActive: 1, endsAt: 1 });

// Pre-save middleware to set endsAt based on duration
boostProfileSchema.pre('save', function (next) {
  if (this.isNew) {
    this.endsAt = new Date(this.startedAt.getTime() + this.durationMinutes * 60000);
  }
  next();
});

// Static method to get remaining boosts for today
boostProfileSchema.statics.getRemainingForToday = async function (userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await this.countDocuments({
    userId: userId,
    startedAt: { $gte: today, $lt: tomorrow },
  });
};

// Static method to get active boost for a user
boostProfileSchema.statics.getActiveBoost = async function (userId) {
  return await this.findOne({
    userId: userId,
    isActive: true,
    endsAt: { $gt: new Date() },
  });
};

// Static method to deactivate expired boosts
boostProfileSchema.statics.deactivateExpired = async function () {
  return await this.updateMany(
    {
      isActive: true,
      endsAt: { $lte: new Date() },
    },
    { isActive: false }
  );
};

// Instance method to deactivate this boost
boostProfileSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

// Instance method to check if boost is still active
boostProfileSchema.methods.checkActive = function () {
  if (this.endsAt <= new Date()) {
    this.isActive = false;
    return false;
  }
  return true;
};

module.exports = mongoose.model('BoostProfile', boostProfileSchema);
