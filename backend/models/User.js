const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Basic user information
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 18,
      max: 100,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    photos: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        url: String,
        order: Number,
        moderationStatus: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    interests: [
      {
        type: String,
        trim: true,
      },
    ],

    // Enhanced Profile Fields (Tier 2)
    videos: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        url: String,
        thumbnailUrl: String,
        duration: Number, // in seconds (6-15)
        order: Number,
        moderationStatus: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    profilePrompts: [
      {
        promptId: String,
        answer: String,
      },
    ],

    education: {
      school: String,
      degree: String,
      fieldOfStudy: String,
      graduationYear: Number,
    },

    occupation: {
      jobTitle: String,
      company: String,
      industry: String,
    },

    height: {
      value: Number, // in cm
      unit: {
        type: String,
        enum: ['cm', 'ft'],
        default: 'cm',
      },
    },

    ethnicity: [
      {
        type: String,
        trim: true,
      },
    ],

    // Social Media Integration
    socialMedia: {
      spotify: {
        id: String,
        username: String,
        profileUrl: String,
        isVerified: { type: Boolean, default: false },
      },
      instagram: {
        id: String,
        username: String,
        profileUrl: String,
        isVerified: { type: Boolean, default: false },
      },
    },
    password: {
      type: String,
      minlength: 8,
    },
    passwordResetToken: String,
    passwordResetTokenExpiry: Date,

    // Phone verification
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerificationCode: String,
    phoneVerificationCodeExpiry: Date,

    // OAuth providers
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    oauthProviders: [String], // Array of provider names: ['google', 'facebook', 'apple']

    // Location field with 2dsphere index for geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (v) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 && // longitude
              v[1] >= -90 &&
              v[1] <= 90
            ); // latitude
          },
          message: 'Coordinates must be [longitude, latitude] within valid ranges',
        },
      },
    },

    // Preferences for matching
    preferredGender: {
      type: String,
      enum: ['male', 'female', 'other', 'any'],
      default: 'any',
    },
    preferredAgeRange: {
      min: {
        type: Number,
        default: 18,
        min: 18,
      },
      max: {
        type: Number,
        default: 100,
        max: 100,
      },
    },
    preferredDistance: {
      type: Number,
      default: 50, // kilometers
      min: 1,
      max: 50000,
    },

    // Location and privacy settings
    locationPrivacy: {
      type: String,
      enum: ['hidden', 'visible_to_matches', 'visible_to_all'],
      default: 'visible_to_matches',
    },
    lastLocationUpdate: {
      type: Date,
    },
    locationHistoryEnabled: {
      type: Boolean,
      default: false,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationTokenExpiry: Date,

    // Account safety & moderation
    suspended: {
      type: Boolean,
      default: false,
      index: true, // Index for efficient filtering in discovery queries
    },
    suspendedAt: {
      type: Date,
    },
    suspendReason: {
      type: String,
    },
    suspensionType: {
      type: String,
      enum: ['manual', 'auto', null],
      default: null,
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
    appealReason: {
      type: String,
    },
    appealedAt: {
      type: Date,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    blockedCount: {
      type: Number,
      default: 0,
    },

    // Activity & Engagement (Tier 2)
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastOnlineAt: {
      type: Date,
    },
    profileViewCount: {
      type: Number,
      default: 0,
    },
    profileViewedBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: Date,

    // Feature 12: Advanced Interactions
    // Super like tracking
    superLikeUsageToday: {
      type: Number,
      default: 0,
    },
    superLikeResetTime: Date,

    // Rewind tracking
    rewindUsageToday: {
      type: Number,
      default: 0,
    },
    rewindResetTime: Date,

    // Boost profile tracking
    boostUsageToday: {
      type: Number,
      default: 0,
    },
    boostResetTime: Date,
    activeBoostId: mongoose.Schema.Types.ObjectId, // Reference to active boost

    // Feature 13: Discovery Enhancements
    // Profile verification
    isProfileVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    verificationMethod: {
      type: String,
      enum: ['photo', 'video', 'id', 'none'],
      default: 'none',
    },
    verificationDate: Date,

    // Recently active tracking
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Activity score for top picks algorithm
    activityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Engagement metrics
    totalSwipes: {
      type: Number,
      default: 0,
    },
    totalMatches: {
      type: Number,
      default: 0,
    },
    totalConversations: {
      type: Number,
      default: 0,
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100, // percentage
    },

    // ========== PREMIUM FEATURES ==========
    // See Who Liked You
    receivedLikes: [
      {
        fromUserId: mongoose.Schema.Types.ObjectId,
        action: {
          type: String,
          enum: ['like', 'superlike'],
          default: 'like',
        },
        receivedAt: {
          type: Date,
          default: Date.now,
          expires: 2592000, // 30 days
        },
      },
    ],

    // Passport (Location Override)
    passportMode: {
      enabled: { type: Boolean, default: false },
      currentLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number], // [longitude, latitude]
        city: String,
        country: String,
      },
      lastChanged: Date,
      changeHistory: [
        {
          location: {
            type: {
              type: String,
              enum: ['Point'],
            },
            coordinates: [Number],
          },
          city: String,
          country: String,
          changedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
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
      pets: [
        {
          type: String, // dog, cat, bird, reptile, other
          description: String,
        },
      ],
      travelFrequency: String, // never, rarely, sometimes, frequently
    },

    // Priority Likes
    priorityLikesReceived: {
      type: Number,
      default: 0,
    },
    priorityLikesSent: {
      type: Number,
      default: 0,
    },

    // Ads Control
    adsPreferences: {
      showAds: { type: Boolean, default: true },
      adCategories: [String],
      lastAdUpdate: Date,
    },

    // Profile Boost Analytics
    boostAnalytics: {
      totalBoosts: { type: Number, default: 0 },
      totalProfileViews: { type: Number, default: 0 },
      totalLikesReceivedDuringBoosts: { type: Number, default: 0 },
      boostHistory: [
        {
          startTime: Date,
          endTime: Date,
          duration: Number, // in minutes
          viewsGained: { type: Number, default: 0 },
          likesGained: { type: Number, default: 0 },
          matches: { type: Number, default: 0 },
        },
      ],
      averageViewsPerBoost: {
        type: Number,
        default: 0,
      },
      averageLikesPerBoost: {
        type: Number,
        default: 0,
      },
    },

    // Unlimited Swipes - daily swipe tracking
    swipeStats: {
      dailySwipeCount: { type: Number, default: 0 },
      swipeResetTime: Date,
      totalSwipesAllTime: { type: Number, default: 0 },
    },

    // Notifications
    expoPushToken: {
      type: String,
      sparse: true,
      select: false, // Don't return by default for security
    },
    notificationPreferences: {
      matchNotifications: { type: Boolean, default: true },
      messageNotifications: { type: Boolean, default: true },
      likeNotifications: { type: Boolean, default: true },
      systemNotifications: { type: Boolean, default: true },
      updatedAt: Date,
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
        default: '2years',
      },

      // Consent tracking
      hasConsented: { type: Boolean, default: false },
      consentDate: Date,
      consentVersion: { type: String, default: '1.0' },

      // Consent history for audit trail
      consentHistory: [
        {
          timestamp: { type: Date, default: Date.now },
          action: String, // 'consent_given', 'consent_withdrawn', 'settings_updated'
          version: String,
          purposes: mongoose.Schema.Types.Mixed,
          ipAddress: String,
          userAgent: String,
          changes: mongoose.Schema.Types.Mixed,
        },
      ],

      lastUpdated: { type: Date, default: Date.now },
    },

    // ========== END-TO-END ENCRYPTION ==========
    // User's public key for E2E encrypted messaging
    encryptionPublicKey: String,
    // Encrypted private key (encrypted with user's password-derived key)
    encryptionPrivateKeyEncrypted: String,
    // Key version for rotation support
    encryptionKeyVersion: { type: Number, default: 1 },

    // ========== GAMIFICATION ==========
    gamification: {
      // XP and Level
      xp: { type: Number, default: 0 },
      totalXPEarned: { type: Number, default: 0 },
      lastXPAction: String,
      lastXPDate: Date,

      // Daily Challenges
      dailyChallenges: [
        {
          challengeId: String,
          id: String,
          type: String,
          title: String,
          description: String,
          icon: String,
          targetCount: Number,
          currentProgress: { type: Number, default: 0 },
          xpReward: Number,
          difficulty: String,
          completed: { type: Boolean, default: false },
          claimed: { type: Boolean, default: false },
          claimedAt: Date,
          expiresAt: Date,
          order: Number,
        },
      ],
      lastChallengeDate: Date,
      dailyBonusClaimed: { type: Boolean, default: false },
      lastBonusDate: Date,

      // Achievement Progress Tracking
      achievementProgress: {
        matchCount: { type: Number, default: 0 },
        messagesSent: { type: Number, default: 0 },
        conversationsStarted: { type: Number, default: 0 },
        superLikesSent: { type: Number, default: 0 },
        datesScheduled: { type: Number, default: 0 },
      },
    },

    // Timestamps
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  if (!this.password) {
    return next(new Error('Password is required'));
  }

  try {
    // Use 12 rounds for production security (industry standard 2024+)
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    // @ts-ignore
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  const jwt = require('jsonwebtoken');

  // Ensure JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET environment variable is not set. This is required for authentication.'
    );
  }

  return jwt.sign({ userId: this._id, email: this.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  const jwt = require('jsonwebtoken');

  // Ensure JWT_REFRESH_SECRET is set
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_REFRESH_SECRET environment variable is not set. This is required for authentication.'
    );
  }

  return jwt.sign({ userId: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });
};

// Create 2dsphere index on location for geospatial queries
userSchema.index({ location: '2dsphere' });

// Compound index for efficient discovery queries
userSchema.index({
  location: '2dsphere',
  gender: 1,
  age: 1,
  isActive: 1,
  isVerified: 1,
});

// TD-003: Indexes for retention queries
// FIX: Removed { name: 'createdAt_desc' } to avoid conflict with existing DB index
userSchema.index({ createdAt: -1 });

// Compound index for retention eligible users query
userSchema.index({ createdAt: 1, _id: 1 }, { name: 'createdAt_id_retention' });

// Virtual for profile completeness score
userSchema.virtual('profileCompleteness').get(function () {
  let score = 0;
  // Check each field explicitly to avoid object injection warnings
  // Safe: All field names are hardcoded, not user input
  if (this.name) score += 1;
  if (this.age) score += 1;
  if (this.gender) score += 1;
  if (this.bio) score += 1;
  if (this.photos && Array.isArray(this.photos) && this.photos.length > 0) score += 1;
  if (this.interests && Array.isArray(this.interests) && this.interests.length > 0) score += 1;
  if (this.location) score += 1;

  return Math.round((score / 7) * 100);
});

// Method to update location
// Instance method to update user's location
userSchema.methods.updateLocation = function (longitude, latitude) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  this.lastActive = new Date();
  // @ts-ignore - 'this' refers to the document instance with save method
  return this.save();
};

// Static method to find users near a location
/** @this {import('../types/index').UserModel} */
// @ts-ignore
userSchema.statics.findNearby = function (longitude, latitude, maxDistance, options = {}) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
    // Exclude suspended users - prevents shadow-locking from hiding profiles
    suspended: { $ne: true },
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

  // @ts-ignore - Mongoose static method context
  return this.find(query);
};

/**
 * @typedef {import('../types/index').UserDocument} UserDocument
 * @typedef {import('../types/index').UserModel} UserModel
 */

/** @type {UserModel} */
// @ts-ignore
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
