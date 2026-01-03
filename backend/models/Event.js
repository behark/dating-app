const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 150
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: [
      'networking',
      'singles_mixer',
      'social_party',
      'speed_dating',
      'activity',
      'workshop',
      'vacation',
      'challenge',
      'other'
    ],
    required: true
  },
  subcategory: {
    type: String,
    maxlength: 50
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
  registrationDeadline: {
    type: Date
  },
  maxAttendees: {
    type: Number,
    min: 1,
    max: 500
  },
  currentAttendeeCount: {
    type: Number,
    default: 0
  },
  attendees: [{
    userId: mongoose.Schema.Types.ObjectId,
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'checked_in', 'attended', 'no_show', 'cancelled'],
      default: 'registered'
    },
    notes: String
  }],
  ticketPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  ticketType: {
    type: String,
    enum: ['free', 'paid', 'vip'],
    default: 'free'
  },
  eventImages: [
    {
      url: String,
      caption: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  bannerImage: String,
  tags: [String],
  ageRestriction: {
    minAge: {
      type: Number,
      default: 18
    },
    maxAge: {
      type: Number,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'friends_only', 'premium_only'],
    default: 'public'
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
  totalReviews: {
    type: Number,
    default: 0
  },
  agenda: [
    {
      time: String,
      activity: String,
      description: String
    }
  ],
  sponsors: [
    {
      name: String,
      logo: String
    }
  ],
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    website: String
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

// Indexes for efficient queries
eventSchema.index({ 'location': '2dsphere' });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startTime: 1 });
eventSchema.index({ 'attendees.userId': 1 });
eventSchema.index({ visibility: 1, status: 1 });
eventSchema.index({ createdAt: -1 });

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema);
