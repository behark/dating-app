const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // The match/room this message belongs to
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Swipe' // References the Swipe model that created the match
  },

  // The user who sent the message
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },

  // The user who should receive the message
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },

  // Message content
  content: {
    type: String,
    required: true,
    maxlength: 5000, // Increased for encrypted content
    trim: true
  },

  // Whether message content is encrypted (E2E)
  isEncrypted: {
    type: Boolean,
    default: false
  },

  // Encryption metadata
  encryptionMetadata: {
    algorithm: { type: String, default: 'aes-256-gcm' },
    keyVersion: Number,
    // Encrypted conversation key for each participant
    recipientKey: String // Conversation key encrypted for recipient
  },

  // Message type (text, image, etc.)
  type: {
    type: String,
    enum: ['text', 'image', 'gif', 'sticker', 'voice', 'video_call', 'system'],
    default: 'text'
  },

  // Media URL (for image, gif, sticker, voice types)
  mediaUrl: {
    type: String,
    default: null
  },

  // Media metadata
  mediaMetadata: {
    width: Number,
    height: Number,
    size: Number,
    mimeType: String,
    duration: Number, // For audio and video in seconds
    gifId: String, // For GIF providers like Giphy
    stickerPackId: String // For sticker packs
  },

  // Voice message specific fields
  voiceMessage: {
    duration: Number, // in seconds
    transcript: String, // AI-generated transcript (optional)
    isTranscribed: Boolean,
    language: String
  },

  // Video call specific fields
  videoCall: {
    callId: String,
    initiatedBy: mongoose.Schema.Types.ObjectId,
    duration: Number, // in seconds
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'missed', 'ended'],
      default: 'pending'
    },
    endedAt: Date
  },

  // Reactions to the message (emoji reactions)
  reactions: [{
    emoji: String,
    userId: mongoose.Schema.Types.ObjectId,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Read status
  isRead: {
    type: Boolean,
    default: false
  },

  // Timestamp when message was read
  readAt: {
    type: Date,
    default: null
  },

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
messageSchema.index({ matchId: 1, createdAt: -1 }); // Get messages for a match, ordered by newest first
messageSchema.index({ senderId: 1, createdAt: -1 }); // Get messages sent by a user
messageSchema.index({ receiverId: 1, isRead: 1 }); // Get unread messages for a user

// TD-003: Indexes for messaging metrics and analytics queries
// Index for message response rate aggregation queries
messageSchema.index({ matchId: 1, createdAt: 1 }, { name: 'matchId_createdAt_asc_metrics' });
// Index for date range queries on messages
messageSchema.index({ createdAt: -1, matchId: 1 }, { name: 'createdAt_matchId_metrics' });

// TTL index to automatically delete old messages after 1 year (optional)
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Virtual for message age
messageSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark message as read
messageSchema.methods.markAsRead = function(timestamp = new Date()) {
  this.isRead = true;
  this.readAt = timestamp;
  return this.save();
};

// Static method to get all messages for a match
messageSchema.statics.getMessagesForMatch = function(matchId, limit = 50, skip = 0) {
  return this.find({ matchId })
    .populate('senderId', 'name photos')
    .populate('receiverId', 'name photos')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get unread messages count for a user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiverId: userId,
    isRead: false
  });
};

// Static method to mark all messages as read for a match
messageSchema.statics.markMatchAsRead = function(matchId, userId) {
  return this.updateMany(
    {
      matchId,
      receiverId: userId,
      isRead: false
    },
    { isRead: true }
  );
};

// Pre-save middleware to ensure sender and receiver are different
messageSchema.pre('save', function(next) {
  if (this.senderId.toString() === this.receiverId.toString()) {
    const error = new Error('Sender and receiver cannot be the same user');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);