const mongoose = require('mongoose');

const topPicksSchema = new mongoose.Schema(
  {
    // The user who is a top pick
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The user for whom this is a top pick
    forUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Compatibility score (0-100)
    compatibilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Factors contributing to the score
    scoreBreakdown: {
      ageCompatibility: Number,
      locationCompatibility: Number,
      interestCompatibility: Number,
      heightCompatibility: Number,
      ethnicityCompatibility: Number,
      occupationCompatibility: Number,
      profileQuality: Number,
      engagementScore: Number,
    },

    // Ranking position for this user
    rankPosition: {
      type: Number,
      required: true,
      min: 1,
    },

    // Whether this top pick has been seen
    isSeen: {
      type: Boolean,
      default: false,
    },

    // When it was first seen
    seenAt: Date,

    // Validity of this ranking
    isActive: {
      type: Boolean,
      default: true,
    },

    // Algorithm version used
    algorithmVersion: {
      type: String,
      default: '1.0',
    },

    // When the score was calculated
    calculatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
topPicksSchema.index({ forUserId: 1, rankPosition: 1 });

// Index for finding top picks for a user sorted by score
topPicksSchema.index({ forUserId: 1, compatibilityScore: -1, createdAt: -1 });

// Index for finding if a user is in top picks for another user
topPicksSchema.index({ forUserId: 1, userId: 1 }, { unique: true });

// Static method to get top picks for a user
topPicksSchema.statics.getTopPicksForUser = function (userId, limit = 10) {
  // @ts-ignore - Mongoose static method context
  return this.find({
    forUserId: userId,
    isActive: true,
  })
    .populate(
      'userId',
      'name age gender photos bio interests location profileCompleteness lastActive isProfileVerified'
    )
    .sort({ rankPosition: 1 })
    .limit(limit)
    .lean();
};

// Static method to recalculate all top picks for a user
topPicksSchema.statics.recalculateForUser = async function (userId) {
  // This would be called by a background job or scheduled task
  // Implementation depends on your matching algorithm
  return true;
};

// Static method to mark as seen
/** @this {import('../types/index').TopPicksDocument} */
topPicksSchema.methods.markAsSeen = function () {
  this.isSeen = true;
  this.seenAt = new Date();
  return this.save();
};

/**
 * @typedef {import('../types/index').TopPicksDocument} TopPicksDocument
 * @typedef {import('../types/index').TopPicksModel} TopPicksModel
 */

/** @type {TopPicksModel} */
// @ts-ignore
const TopPicksModel = mongoose.model('TopPicks', topPicksSchema);

module.exports = TopPicksModel;
