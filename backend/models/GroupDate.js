const mongoose = require('mongoose');

const groupDateSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  eventType: {
    type: String,
    enum: ['dinner', 'drinks', 'activity', 'game_night', 'movie', 'sports', 'cultural', 'other'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  locationName: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },
  currentParticipants: [{
    userId: mongoose.Schema.Types.ObjectId,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['interested', 'going', 'not_going', 'attended', 'no_show'],
      default: 'interested'
    }
  }],
  requiredCriteria: {
    ageRange: {
      min: Number,
      max: Number
    },
    genders: [String]
  },
  status: {
    type: String,
    enum: ['planning', 'open', 'full', 'cancelled', 'completed'],
    default: 'planning'
  },
  coverImage: {
    type: String // URL to group date cover image
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  isFriendsOnly: {
    type: Boolean,
    default: false
  },
  reviews: [{
    userId: mongoose.Schema.Types.ObjectId,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  chatGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatGroup' // For group messaging
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Geospatial index for location-based queries
groupDateSchema.index({ 'location': '2dsphere' });
groupDateSchema.index({ hostId: 1 });
groupDateSchema.index({ status: 1 });
groupDateSchema.index({ startTime: 1 });
groupDateSchema.index({ 'currentParticipants.userId': 1 });

groupDateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GroupDate', groupDateSchema);
