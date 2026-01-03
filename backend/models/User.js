const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 18,
    max: 100
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bio: {
    type: String,
    maxlength: 500
  },
  photos: [{
    _id: mongoose.Schema.Types.ObjectId,
    url: String,
    order: Number,
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  interests: [{
    type: String,
    trim: true
  }],

  // Enhanced Profile Fields (Tier 2)
  videos: [{
    _id: mongoose.Schema.Types.ObjectId,
    url: String,
    thumbnailUrl: String,
    duration: Number, // in seconds (6-15)
    order: Number,
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  profilePrompts: [{
    promptId: String,
    answer: String
  }],

  education: {
    school: String,
    degree: String,
    fieldOfStudy: String,
    graduationYear: Number
  },

  occupation: {
    jobTitle: String,
    company: String,
    industry: String
  },

  height: {
    value: Number, // in cm
    unit: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    }
  },

  ethnicity: [{
    type: String,
    trim: true
  }],

  // Social Media Integration
  socialMedia: {
    spotify: {
      id: String,
      username: String,
      profileUrl: String,
      isVerified: { type: Boolean, default: false }
    },
    instagram: {
      id: String,
      username: String,
      profileUrl: String,
      isVerified: { type: Boolean, default: false }
    }
  },
  password: {
    type: String,
    minlength: 8
  },
  passwordResetToken: String,
  passwordResetTokenExpiry: Date,

  // Phone verification
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationCode: String,
  phoneVerificationCodeExpiry: Date,

  // OAuth providers
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  appleId: {
    type: String,
    unique: true,
    sparse: true
  },
  oauthProviders: [String], // Array of provider names: ['google', 'facebook', 'apple']

  // Location field with 2dsphere index for geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 &&
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Coordinates must be [longitude, latitude] within valid ranges'
      }
    }
  },

  // Preferences for matching
  preferredGender: {
    type: String,
    enum: ['male', 'female', 'other', 'any'],
    default: 'any'
  },
  preferredAgeRange: {
    min: {
      type: Number,
      default: 18,
      min: 18
    },
    max: {
      type: Number,
      default: 100,
      max: 100
    }
  },
  preferredDistance: {
    type: Number,
    default: 50, // kilometers
    min: 1,
    max: 50000
  },

  // Location and privacy settings
  locationPrivacy: {
    type: String,
    enum: ['hidden', 'visible_to_matches', 'visible_to_all'],
    default: 'visible_to_matches'
  },
  lastLocationUpdate: {
    type: Date
  },
  locationHistoryEnabled: {
    type: Boolean,
    default: false
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationTokenExpiry: Date,

  // Activity & Engagement (Tier 2)
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  lastOnlineAt: {
    type: Date
  },
  profileViewCount: {
    type: Number,
    default: 0
  },
  profileViewedBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiresAt: Date,

  // Feature 12: Advanced Interactions
  // Super like tracking
  superLikeUsageToday: {
    type: Number,
    default: 0
  },
  superLikeResetTime: Date,

  // Rewind tracking
  rewindUsageToday: {
    type: Number,
    default: 0
  },
  rewindResetTime: Date,

  // Boost profile tracking
  boostUsageToday: {
    type: Number,
    default: 0
  },
  boostResetTime: Date,
  activeBoostId: mongoose.Schema.Types.ObjectId, // Reference to active boost

  // Feature 13: Discovery Enhancements
  // Profile verification
  isProfileVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationMethod: {
    type: String,
    enum: ['photo', 'video', 'id', 'none'],
    default: 'none'
  },
  verificationDate: Date,

  // Recently active tracking
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Activity score for top picks algorithm
  activityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Engagement metrics
  totalSwipes: {
    type: Number,
    default: 0
  },
  totalMatches: {
    type: Number,
    default: 0
  },
  totalConversations: {
    type: Number,
    default: 0
  },
  responseRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },

  // ========== PREMIUM FEATURES ==========
  // See Who Liked You
  receivedLikes: [{
    fromUserId: mongoose.Schema.Types.ObjectId,
    action: {
      type: String,
      enum: ['like', 'superlike'],
      default: 'like'
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 days
    }
  }],

  // Passport (Location Override)
  passportMode: {
    enabled: { type: Boolean, default: false },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number], // [longitude, latitude]
      city: String,
      country: String
    },
    lastChanged: Date,
    changeHistory: [{
      location: {
        type: {
          type: String,
          enum: ['Point']
        },
        coordinates: [Number]
      },
      city: String,
      country: String,
      changedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Advanced Filters
  advancedFilters: {
    minIncome: Number,
    maxIncome: Number,
    educationLevel: [String], // high_school, bachelor, masters, phd
    bodyType: [String],
    drinkingFrequency: String, // never, rarely, socially, regularly
    smokingStatus: String, // never, rarely, sometimes, regularly
    maritalStatus: [String],
    hasChildren: Boolean,
    wantsChildren: String, // yes, no, maybe, unsure
    religion: [String],
    zodiacSign: [String],
    languages: [String],
    pets: [{
      type: String, // dog, cat, bird, reptile, other
      description: String
    }],
    travelFrequency: String, // never, rarely, sometimes, frequently
  },

  // Priority Likes
  priorityLikesReceived: {
    type: Number,
    default: 0
  },
  priorityLikesSent: {
    type: Number,
    default: 0
  },

  // Ads Control
  adsPreferences: {
    showAds: { type: Boolean, default: true },
    adCategories: [String],
    lastAdUpdate: Date
  },

  // Profile Boost Analytics
  boostAnalytics: {
    totalBoosts: { type: Number, default: 0 },
    totalProfileViews: { type: Number, default: 0 },
    totalLikesReceivedDuringBoosts: { type: Number, default: 0 },
    boostHistory: [{
      startTime: Date,
      endTime: Date,
      duration: Number, // in minutes
      viewsGained: { type: Number, default: 0 },
      likesGained: { type: Number, default: 0 },
      matches: { type: Number, default: 0 }
    }],
    averageViewsPerBoost: {
      type: Number,
      default: 0
    },
    averageLikesPerBoost: {
      type: Number,
      default: 0
    }
  },

  // Unlimited Swipes - daily swipe tracking
  swipeStats: {
    dailySwipeCount: { type: Number, default: 0 },
    swipeResetTime: Date,
    totalSwipesAllTime: { type: Number, default: 0 }
  },

  // ========== PRIVACY & COMPLIANCE (GDPR/CCPA) ==========
  privacySettings: {
    // Data sharing preferences
    dataSharing: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    thirdPartySharing: { type: Boolean, default: false },
    analyticsTracking: { type: Boolean, default: true },
    
    // CCPA: Do Not Sell
    doNotSell: { type: Boolean, default: false },
    doNotSellDate: Date,
    
    // Data retention
    dataRetentionPeriod: {
      type: String,
      enum: ['1year', '2years', '5years', 'indefinite'],
      default: '2years'
    },
    
    // Consent tracking
    hasConsented: { type: Boolean, default: false },
    consentDate: Date,
    consentVersion: { type: String, default: '1.0' },
    
    // Consent history for audit trail
    consentHistory: [{
      timestamp: { type: Date, default: Date.now },
      action: String, // 'consent_given', 'consent_withdrawn', 'settings_updated'
      version: String,
      purposes: mongoose.Schema.Types.Mixed,
      ipAddress: String,
      userAgent: String,
      changes: mongoose.Schema.Types.Mixed
    }],
    
    lastUpdated: { type: Date, default: Date.now }
  },

  // ========== END-TO-END ENCRYPTION ==========
  // User's public key for E2E encrypted messaging
  encryptionPublicKey: String,
  // Encrypted private key (encrypted with user's password-derived key)
  encryptionPrivateKeyEncrypted: String,
  // Key version for rotation support
  encryptionKeyVersion: { type: Number, default: 1 },

  // Timestamps
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: this._id, email: this.email },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
  return token;
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: this._id },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    { expiresIn: '30d' }
  );
  return token;
};

// Create 2dsphere index on location for geospatial queries
userSchema.index({ location: '2dsphere' });

// Compound index for efficient discovery queries
userSchema.index({
  location: '2dsphere',
  gender: 1,
  age: 1,
  isActive: 1,
  isVerified: 1
});

// TD-003: Indexes for retention queries
// Index for cohort registration date queries
userSchema.index({ createdAt: -1 }, { name: 'createdAt_desc' });
// Compound index for retention eligible users query
userSchema.index({ createdAt: 1, _id: 1 }, { name: 'createdAt_id_retention' });

// Virtual for profile completeness score
userSchema.virtual('profileCompleteness').get(function() {
  let score = 0;
  const fields = ['name', 'age', 'gender', 'bio', 'photos', 'interests', 'location'];

  fields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      score += 1;
    }
  });

  return Math.round((score / fields.length) * 100);
});

// Method to update location
userSchema.methods.updateLocation = function(longitude, latitude) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
  this.lastActive = new Date();
  return this.save();
};

// Static method to find users near a location
userSchema.statics.findNearby = function(longitude, latitude, maxDistance, options = {}) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  };

  // Add additional filters
  if (options.preferredGender && options.preferredGender !== 'any') {
    query.gender = options.preferredGender;
  }

  if (options.minAge || options.maxAge) {
    query.age = {};
    if (options.minAge) query.age.$gte = options.minAge;
    if (options.maxAge) query.age.$lte = options.maxAge;
  }

  if (options.excludeIds && options.excludeIds.length > 0) {
    query._id = { $nin: options.excludeIds };
  }

  return this.find(query);
};

module.exports = mongoose.model('User', userSchema);