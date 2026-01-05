const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // User who receives the notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },

    // Notification type
    type: {
      type: String,
      required: true,
      enum: ['match', 'message', 'like', 'super_like', 'system', 'premium', 'safety'],
      index: true,
    },

    // Notification title
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    // Notification message/body
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Additional data (e.g., matchId, userId, etc.)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Whether notification has been read
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // When notification was read
    readAt: {
      type: Date,
      default: null,
    },

    // Priority level
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },

    // Action URL (if notification has an action)
    actionUrl: {
      type: String,
      default: null,
    },

    // Image/icon URL
    imageUrl: {
      type: String,
      default: null,
    },

    // Expiration date (for time-sensitive notifications)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired notifications

// Static method: Get unread count for user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    userId,
    isRead: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
};

// Static method: Mark all as read for user
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    {
      userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

// Instance method: Mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
