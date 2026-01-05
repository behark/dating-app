const mongoose = require('mongoose');

const rewindSchema = new mongoose.Schema(
  {
    // The user who used the rewind
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The original swipe that was undone
    originalSwipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Swipe',
      required: true,
    },

    // The user who was swiped on (stored for reference)
    swipedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Original swipe action (like, pass, superlike)
    originalAction: {
      type: String,
      enum: ['like', 'pass', 'superlike'],
      required: true,
    },

    // Whether the rewind was successful
    success: {
      type: Boolean,
      default: false,
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

// Index for finding rewinds by user
rewindSchema.index({ userId: 1, createdAt: -1 });

// Index for finding rewinds by original swipe
rewindSchema.index({ originalSwipeId: 1 });

// Static method to get remaining rewinds for today
rewindSchema.statics.getRemainingForToday = async function (userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await this.countDocuments({
    userId: userId,
    success: true,
    createdAt: { $gte: today, $lt: tomorrow },
  });

  return count;
};

// Static method to get total rewind count for user (all time)
rewindSchema.statics.getTotalRewindCount = async function (userId) {
  return await this.countDocuments({
    userId: userId,
    success: true,
  });
};

module.exports = mongoose.model('Rewind', rewindSchema);
