/**
 * Request Validation Middleware
 * Centralized validation with reusable validators and schema-based validation
 * Implements TD-007
 */

const { body, param, query, validationResult, checkSchema } = require('express-validator');

/**
 * Handle validation errors uniformly
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Create validation middleware from schema
 * @param {Object} schema - Validation schema
 * @returns {Array} Array of middleware functions
 */
const validate = (schema) => {
  return [checkSchema(schema), handleValidationErrors];
};

// ============================================================
// Common Validators (Reusable)
// ============================================================

const validators = {
  // User identifiers
  userId: {
    in: ['params'],
    isMongoId: {
      errorMessage: 'Invalid user ID format'
    }
  },
  
  optionalUserId: {
    in: ['params'],
    optional: true,
    isMongoId: {
      errorMessage: 'Invalid user ID format'
    }
  },

  // Email validation
  email: {
    in: ['body'],
    isEmail: {
      errorMessage: 'Invalid email address'
    },
    normalizeEmail: true,
    trim: true
  },

  optionalEmail: {
    in: ['body'],
    optional: true,
    isEmail: {
      errorMessage: 'Invalid email address'
    },
    normalizeEmail: true,
    trim: true
  },

  // Password validation
  password: {
    in: ['body'],
    isLength: {
      options: { min: 8, max: 128 },
      errorMessage: 'Password must be between 8 and 128 characters'
    },
    matches: {
      options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      errorMessage: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    }
  },

  simplePassword: {
    in: ['body'],
    isLength: {
      options: { min: 8 },
      errorMessage: 'Password must be at least 8 characters'
    }
  },

  // Name validation
  name: {
    in: ['body'],
    trim: true,
    notEmpty: {
      errorMessage: 'Name is required'
    },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Name must be between 2 and 50 characters'
    },
    matches: {
      options: /^[a-zA-Z\s'-]+$/,
      errorMessage: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },

  optionalName: {
    in: ['body'],
    optional: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Name must be between 2 and 50 characters'
    }
  },

  // Age validation
  age: {
    in: ['body'],
    isInt: {
      options: { min: 18, max: 100 },
      errorMessage: 'Age must be between 18 and 100'
    },
    toInt: true
  },

  optionalAge: {
    in: ['body'],
    optional: true,
    isInt: {
      options: { min: 18, max: 100 },
      errorMessage: 'Age must be between 18 and 100'
    },
    toInt: true
  },

  // Gender validation
  gender: {
    in: ['body'],
    isIn: {
      options: [['male', 'female', 'other', 'non-binary', 'prefer-not-to-say']],
      errorMessage: 'Invalid gender value'
    }
  },

  optionalGender: {
    in: ['body'],
    optional: true,
    isIn: {
      options: [['male', 'female', 'other', 'non-binary', 'prefer-not-to-say']],
      errorMessage: 'Invalid gender value'
    }
  },

  // Bio validation
  bio: {
    in: ['body'],
    optional: true,
    trim: true,
    isLength: {
      options: { max: 500 },
      errorMessage: 'Bio must not exceed 500 characters'
    }
  },

  // Interests validation
  interests: {
    in: ['body'],
    optional: true,
    isArray: {
      options: { max: 20 },
      errorMessage: 'Maximum 20 interests allowed'
    }
  },

  // Photo URL validation
  photoUrl: {
    in: ['body'],
    isURL: {
      errorMessage: 'Invalid photo URL'
    }
  },

  // Pagination
  page: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: 'Page must be a positive integer'
    },
    toInt: true
  },

  limit: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: 'Limit must be between 1 and 100'
    },
    toInt: true
  },

  // Token validation
  token: {
    in: ['body'],
    notEmpty: {
      errorMessage: 'Token is required'
    },
    isString: true
  },

  // Match ID validation
  matchId: {
    in: ['params'],
    isMongoId: {
      errorMessage: 'Invalid match ID format'
    }
  },

  // Message validation
  messageContent: {
    in: ['body'],
    trim: true,
    notEmpty: {
      errorMessage: 'Message content is required'
    },
    isLength: {
      options: { max: 5000 },
      errorMessage: 'Message must not exceed 5000 characters'
    }
  },

  // Location validation
  latitude: {
    in: ['body'],
    isFloat: {
      options: { min: -90, max: 90 },
      errorMessage: 'Latitude must be between -90 and 90'
    },
    toFloat: true
  },

  longitude: {
    in: ['body'],
    isFloat: {
      options: { min: -180, max: 180 },
      errorMessage: 'Longitude must be between -180 and 180'
    },
    toFloat: true
  },

  optionalLatitude: {
    in: ['body'],
    optional: true,
    isFloat: {
      options: { min: -90, max: 90 },
      errorMessage: 'Latitude must be between -90 and 90'
    },
    toFloat: true
  },

  optionalLongitude: {
    in: ['body'],
    optional: true,
    isFloat: {
      options: { min: -180, max: 180 },
      errorMessage: 'Longitude must be between -180 and 180'
    },
    toFloat: true
  },

  // Distance/radius validation
  radius: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1, max: 500 },
      errorMessage: 'Radius must be between 1 and 500 km'
    },
    toInt: true
  },

  // Sort validation
  sortBy: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['createdAt', 'updatedAt', 'name', 'distance', 'compatibility']],
      errorMessage: 'Invalid sort field'
    }
  },

  sortOrder: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['asc', 'desc', '1', '-1']],
      errorMessage: 'Sort order must be asc or desc'
    }
  },

  // Report reason
  reportReason: {
    in: ['body'],
    isIn: {
      options: [['inappropriate', 'spam', 'harassment', 'fake_profile', 'underage', 'other']],
      errorMessage: 'Invalid report reason'
    }
  },

  reportDescription: {
    in: ['body'],
    optional: true,
    trim: true,
    isLength: {
      options: { max: 1000 },
      errorMessage: 'Description must not exceed 1000 characters'
    }
  }
};

// ============================================================
// Predefined Validation Schemas
// ============================================================

const schemas = {
  // Auth schemas
  register: {
    email: validators.email,
    password: validators.simplePassword,
    name: validators.name,
    age: validators.optionalAge,
    gender: validators.optionalGender
  },

  login: {
    email: validators.email,
    password: {
      in: ['body'],
      notEmpty: {
        errorMessage: 'Password is required'
      }
    }
  },

  forgotPassword: {
    email: validators.email
  },

  resetPassword: {
    token: validators.token,
    newPassword: {
      ...validators.simplePassword,
      in: ['body']
    }
  },

  // Profile schemas
  updateProfile: {
    name: validators.optionalName,
    age: validators.optionalAge,
    gender: validators.optionalGender,
    bio: validators.bio,
    interests: validators.interests
  },

  uploadPhotos: {
    'photos': {
      in: ['body'],
      isArray: {
        options: { min: 1, max: 6 },
        errorMessage: 'Photos array must have 1-6 items'
      }
    },
    'photos.*.url': validators.photoUrl
  },

  // Discovery schemas
  discovery: {
    page: validators.page,
    limit: validators.limit,
    radius: validators.radius,
    minAge: {
      in: ['query'],
      optional: true,
      isInt: {
        options: { min: 18, max: 100 },
        errorMessage: 'Minimum age must be between 18 and 100'
      },
      toInt: true
    },
    maxAge: {
      in: ['query'],
      optional: true,
      isInt: {
        options: { min: 18, max: 100 },
        errorMessage: 'Maximum age must be between 18 and 100'
      },
      toInt: true
    },
    gender: {
      in: ['query'],
      optional: true,
      isIn: {
        options: [['male', 'female', 'other', 'all']],
        errorMessage: 'Invalid gender filter'
      }
    }
  },

  // Swipe schemas
  swipe: {
    targetUserId: {
      in: ['body'],
      isMongoId: {
        errorMessage: 'Invalid target user ID'
      }
    },
    direction: {
      in: ['body'],
      isIn: {
        options: [['left', 'right', 'superlike']],
        errorMessage: 'Direction must be left, right, or superlike'
      }
    }
  },

  // Chat schemas
  sendMessage: {
    matchId: validators.matchId,
    content: validators.messageContent
  },

  // Report schemas
  reportUser: {
    reason: validators.reportReason,
    description: validators.reportDescription
  },

  // Location update
  updateLocation: {
    latitude: validators.latitude,
    longitude: validators.longitude
  },

  // Pagination (reusable for list endpoints)
  pagination: {
    page: validators.page,
    limit: validators.limit,
    sortBy: validators.sortBy,
    sortOrder: validators.sortOrder
  }
};

// ============================================================
// Utility Functions
// ============================================================

/**
 * Create custom validation schema by merging base schema with custom fields
 * @param {string} baseName - Name of base schema
 * @param {Object} customFields - Custom fields to add/override
 * @returns {Object} Merged schema
 */
const extendSchema = (baseName, customFields = {}) => {
  const baseSchema = schemas[baseName] || {};
  return { ...baseSchema, ...customFields };
};

/**
 * Sanitize input string to prevent XSS
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Middleware to sanitize all string fields in request body
 */
const sanitizeBody = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to validate MongoDB ObjectId in params
 * @param {string} paramName - Name of the parameter to validate
 */
const validateObjectId = (paramName = 'id') => {
  return [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
    handleValidationErrors
  ];
};

/**
 * Middleware to validate query parameters for pagination
 */
const validatePagination = validate(schemas.pagination);

module.exports = {
  // Core functions
  validate,
  handleValidationErrors,
  extendSchema,
  
  // Reusable validators
  validators,
  
  // Predefined schemas
  schemas,
  
  // Utility middleware
  sanitizeBody,
  validateObjectId,
  validatePagination,
  sanitizeString
};
