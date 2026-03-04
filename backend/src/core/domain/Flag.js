const mongoose = require('mongoose');

const flagSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentType: {
      type: String,
      enum: ['message', 'profile_photo', 'bio', 'profile'],
      required: true,
    },
    contentId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
flagSchema.index({ userId: 1 });
flagSchema.index({ contentType: 1, contentId: 1 });
flagSchema.index({ status: 1 });
flagSchema.index({ createdAt: -1 });

const FlagModel = mongoose.model('Flag', flagSchema);

module.exports = FlagModel;
