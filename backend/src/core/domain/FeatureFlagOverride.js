const mongoose = require('mongoose');

const featureFlagOverrideSchema = new mongoose.Schema(
  {
    // User ID
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },

    // Flag name
    flagName: {
      type: String,
      required: true,
      index: true,
    },

    // Override enabled status
    enabled: {
      type: Boolean,
      required: true,
    },

    // Admin who set the override
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Reason for override
    reason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
featureFlagOverrideSchema.index({ userId: 1, flagName: 1 }, { unique: true });

module.exports = mongoose.model('FeatureFlagOverride', featureFlagOverrideSchema);
