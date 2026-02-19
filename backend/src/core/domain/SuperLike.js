const mongoose = require('mongoose');

const superLikeSchema = new mongoose.Schema(
  {
    // The user who sent the super like
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The user who received the super like
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Message with the super like (optional)
    message: {
      type: String,
      maxlength: 300,
      trim: true,
    },

    // Whether the recipient has seen it
    isViewed: {
      type: Boolean,
      default: false,
    },

    // When it was viewed
    viewedAt: {
      type: Date,
      default: null,
    },

    // Timestamp
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding super likes sent by a user
superLikeSchema.index({ senderId: 1, createdAt: -1 });

// Index for finding super likes received by a user
superLikeSchema.index({ recipientId: 1, isViewed: 1, createdAt: -1 });

// Prevent duplicate super likes between same users
superLikeSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existingSuper = await /** @type {any} */ (this.constructor).findOne({
      senderId: this.senderId,
      recipientId: this.recipientId,
    });

    if (existingSuper) {
      const error = new Error('You have already sent a super like to this user');
      // @ts-ignore
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

// Static method to get remaining super likes for today
superLikeSchema.statics.getRemainingForToday = async function (userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // @ts-ignore - Mongoose static method context
  return this.countDocuments({
    senderId: userId,
    createdAt: { $gte: today, $lt: tomorrow },
  });
};

/**
 * @typedef {import('../../../types/index').SuperLikeDocument} SuperLikeDocument
 * @typedef {import('../../../types/index').SuperLikeModel} SuperLikeModel
 */

/** @type {SuperLikeModel} */
// @ts-ignore
const SuperLikeModel = mongoose.model('SuperLike', superLikeSchema);

module.exports = SuperLikeModel;
