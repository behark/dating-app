const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema(
  {
    // Flag name (unique identifier)
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // Whether flag is globally enabled
    enabled: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Description of the feature
    description: {
      type: String,
      maxlength: 500,
    },

    // Rollout percentage (0-100)
    rolloutPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Allowed user groups
    allowedGroups: {
      type: [String],
      default: ['all'],
      enum: ['all', 'beta_testers', 'premium', 'vip', 'admin'],
    },

    // Whether this is an A/B test
    isABTest: {
      type: Boolean,
      default: false,
    },

    // A/B test variant (if applicable)
    variant: {
      type: String,
      default: null,
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
featureFlagSchema.index({ enabled: 1, rolloutPercentage: 1 });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
