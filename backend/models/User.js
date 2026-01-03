const mongoose = require('mongoose');

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
    required: true,
    min: 18,
    max: 100
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  bio: {
    type: String,
    maxlength: 500
  },
  photos: [{
    type: String, // URLs to photos
    required: true
  }],
  interests: [{
    type: String,
    trim: true
  }],

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

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

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