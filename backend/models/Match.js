const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // The two users in the match (stored in sorted order for consistency)
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  // Individual user references for easier querying
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Who initiated the final swipe that created the match
  matchInitiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Type of match (regular or superlike)
  matchType: {
    type: String,
    enum: ['regular', 'superlike'],
    default: 'regular'
  },

  // Match status
  status: {
    type: String,
    enum: ['active', 'unmatched', 'blocked'],
    default: 'active'
  },

  // Which user unmatched (if status is 'unmatched')
  unmatchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unmatchedAt: Date,

  // Conversation started flag
  conversationStarted: {
    type: Boolean,
    default: false
  },
  firstMessageAt: Date,
  firstMessageBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Last activity in this match
  lastActivityAt: {
    type: Date,
    default: Date.now
  },

  // Message count for quick stats
  messageCount: {
    type: Number,
    default: 0
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for finding matches between two specific users
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Index for finding all matches for a user
matchSchema.index({ users: 1, status: 1, createdAt: -1 });

// Index for recent matches
matchSchema.index({ createdAt: -1 });

// Index for active matches by user
matchSchema.index({ user1: 1, status: 1 });
matchSchema.index({ user2: 1, status: 1 });

// Index for matches with conversation activity
matchSchema.index({ lastActivityAt: -1, status: 1 });

// Pre-save middleware to ensure users array is sorted and user1/user2 are set correctly
matchSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('users')) {
    // Sort users array to ensure consistent ordering
    const sortedUsers = this.users.map(u => u.toString()).sort();
    this.users = sortedUsers.map(u => new mongoose.Types.ObjectId(u));
    this.user1 = this.users[0];
    this.user2 = this.users[1];
  }
  this.updatedAt = new Date();
  next();
});

// Static method to check if a match exists between two users
matchSchema.statics.matchExists = async function(userId1, userId2) {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return this.findOne({
    user1: sortedIds[0],
    user2: sortedIds[1],
    status: 'active'
  });
};

// Static method to create a new match
matchSchema.statics.createMatch = async function(userId1, userId2, initiatorId, matchType = 'regular') {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  
  // Check if match already exists
  const existingMatch = await this.findOne({
    user1: sortedIds[0],
    user2: sortedIds[1]
  });

  if (existingMatch) {
    // If match exists but was unmatched, reactivate it
    if (existingMatch.status === 'unmatched') {
      existingMatch.status = 'active';
      existingMatch.matchInitiator = initiatorId;
      existingMatch.matchType = matchType;
      existingMatch.unmatchedBy = undefined;
      existingMatch.unmatchedAt = undefined;
      await existingMatch.save();
      return { match: existingMatch, isNew: false, reactivated: true };
    }
    return { match: existingMatch, isNew: false, reactivated: false };
  }

  const match = new this({
    users: [userId1, userId2],
    matchInitiator: initiatorId,
    matchType: matchType
  });

  await match.save();
  return { match, isNew: true, reactivated: false };
};

// Static method to get all matches for a user
matchSchema.statics.getUserMatches = async function(userId, options = {}) {
  const {
    status = 'active',
    limit = 50,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;

  const query = {
    users: userId,
    status: status
  };

  const sort = {};
  sort[sortBy] = sortOrder;

  return this.find(query)
    .populate('users', 'name photos age bio lastActive isOnline')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to unmatch
matchSchema.statics.unmatch = async function(matchId, userId) {
  const match = await this.findById(matchId);
  
  if (!match) {
    throw new Error('Match not found');
  }

  if (!match.users.some(u => u.toString() === userId.toString())) {
    throw new Error('User is not part of this match');
  }

  match.status = 'unmatched';
  match.unmatchedBy = userId;
  match.unmatchedAt = new Date();
  await match.save();

  return match;
};

// Static method to get match count for a user
matchSchema.statics.getMatchCount = async function(userId, status = 'active') {
  return this.countDocuments({
    users: userId,
    status: status
  });
};

// Instance method to get the other user in the match
matchSchema.methods.getOtherUser = function(userId) {
  return this.users.find(u => u.toString() !== userId.toString());
};

// Instance method to update conversation status
matchSchema.methods.markConversationStarted = async function(messageBy) {
  if (!this.conversationStarted) {
    this.conversationStarted = true;
    this.firstMessageAt = new Date();
    this.firstMessageBy = messageBy;
  }
  this.lastActivityAt = new Date();
  this.messageCount += 1;
  await this.save();
};

module.exports = mongoose.model('Match', matchSchema);
