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
    maxlength: 1000,
    trim: true
  },

  // Message type (text, image, etc.)
  type: {
    type: String,
    enum: ['text', 'image', 'gif', 'system'],
    default: 'text'
  },

  // Image/GIF URL (for image and gif types)
  imageUrl: {
    type: String,
    default: null
  },

  // Image metadata
  imageMetadata: {
    width: Number,
    height: Number,
    size: Number,
    mimeType: String
  },

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