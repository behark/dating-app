const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique block relationships
blockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

// Index for efficient querying
blockSchema.index({ blockerId: 1 });
blockSchema.index({ blockedUserId: 1 });

/**
 * @typedef {import('../types/index').BlockDocument} BlockDocument
 * @typedef {import('../types/index').BlockModel} BlockModel
 */

/** @type {BlockModel} */
const BlockModel = mongoose.model('Block', blockSchema);

module.exports = BlockModel;
