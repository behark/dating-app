const mongoose = require('mongoose');

const betaSessionSchema = new mongoose.Schema(
  {
    // User ID
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },

    // Session start time
    startTime: {
      type: Date,
      required: true,
    },

    // Session end time
    endTime: {
      type: Date,
      default: null,
    },

    // Duration in milliseconds
    duration: {
      type: Number,
      default: 0,
    },

    // Screens visited
    screens: {
      type: [String],
      default: [],
    },

    // Actions performed
    actions: {
      type: [String],
      default: [],
    },

    // Errors encountered
    errors: {
      type: [
        {
          message: String,
          stack: String,
          screen: String,
          timestamp: Date,
        },
      ],
      default: [],
    },

    // Performance metrics
    performance: {
      loadTimes: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      crashes: {
        type: Number,
        default: 0,
      },
      networkErrors: {
        type: Number,
        default: 0,
      },
    },

    // Features used
    featuresUsed: {
      type: [String],
      default: [],
    },

    // Device info
    device: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // App version
    appVersion: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
betaSessionSchema.index({ userId: 1, startTime: -1 });
betaSessionSchema.index({ startTime: -1 });

module.exports = mongoose.model('BetaSession', betaSessionSchema);
