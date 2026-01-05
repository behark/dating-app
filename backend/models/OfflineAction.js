const mongoose = require('mongoose');

const offlineActionSchema = new mongoose.Schema(
  {
    // User who queued this action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },

    // Client-generated action ID (for deduplication)
    actionId: {
      type: String,
      required: true,
      index: true,
    },

    // Action type
    type: {
      type: String,
      required: true,
      enum: ['SEND_MESSAGE', 'SWIPE', 'UPDATE_PROFILE', 'SUPER_LIKE', 'REWIND'],
      index: true,
    },

    // Action data (varies by type)
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Timestamp when action was created (client-side)
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'synced', 'conflict', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },

    // Retry count
    retryCount: {
      type: Number,
      default: 0,
    },

    // When action was synced
    syncedAt: {
      type: Date,
      default: null,
    },

    // Conflict information
    conflict: {
      hasConflict: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
        enum: ['timestamp_mismatch', 'data_changed', 'resource_deleted', 'permission_changed'],
      },
      serverData: {
        type: mongoose.Schema.Types.Mixed,
      },
      resolved: {
        type: Boolean,
        default: false,
      },
      resolution: {
        type: String,
        enum: ['use_local', 'use_server', 'merge'],
      },
    },

    // Error information (if failed)
    error: {
      message: String,
      code: String,
      timestamp: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
offlineActionSchema.index({ userId: 1, status: 1, timestamp: -1 });
offlineActionSchema.index({ userId: 1, actionId: 1 }, { unique: true }); // Prevent duplicates

// Static method: Get pending actions for user
offlineActionSchema.statics.getPendingActions = async function (userId) {
  // @ts-ignore - Mongoose static method context
  return this.find({
    userId,
    status: 'pending',
  })
    .sort({ timestamp: 1 })
    .lean();
};

// Static method: Get conflicts for user
offlineActionSchema.statics.getConflicts = async function (userId) {
  // @ts-ignore - Mongoose static method context
  return this.find({
    userId,
    status: 'conflict',
    'conflict.resolved': false,
  })
    .sort({ timestamp: 1 })
    .lean();
};

module.exports = mongoose.model('OfflineAction', offlineActionSchema);
