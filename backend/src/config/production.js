/**
 * Production Readiness Configuration
 * Centralized configuration for production deployment
 */

const productionConfig = {
  // Application Settings
  app: {
    name: 'Dating App',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
    host: process.env.HOST || '0.0.0.0',
  },

  // Security Settings
  security: {
    // JWT Settings
    jwt: {
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
      algorithm: 'HS256',
    },
    // CORS Settings
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:19000',
        'http://localhost:19006',
        'http://localhost:3000',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
    },
    // Rate Limiting
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS
        ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
        : 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
      standardHeaders: true,
      legacyHeaders: false,
    },
    // Helmet Configuration
    helmet: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", 'wss:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    },
    // Password Requirements
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      bcryptRounds: 12,
    },
  },

  // Database Settings
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        maxPoolSize: process.env.MONGODB_POOL_SIZE
          ? parseInt(process.env.MONGODB_POOL_SIZE, 10)
          : 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        w: 'majority',
      },
    },
    redis: {
      url: process.env.REDIS_URL,
      options: {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        reconnectOnError: () => true,
      },
    },
  },

  // Caching Settings
  cache: {
    defaultTTL: process.env.CACHE_DEFAULT_TTL ? parseInt(process.env.CACHE_DEFAULT_TTL, 10) : 300, // 5 minutes
    profileTTL: 600, // 10 minutes
    discoveryTTL: 60, // 1 minute
    staticTTL: 86400, // 24 hours
  },

  // File Upload Settings
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE
      ? parseInt(process.env.MAX_FILE_SIZE, 10)
      : 5 * 1024 * 1024, // 5MB
    maxPhotos: 6,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageQuality: 80,
    thumbnailSize: { width: 200, height: 200 },
    fullSize: { width: 1080, height: 1080 },
  },

  // Monitoring & Logging
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    },
    datadog: {
      apiKey: process.env.DD_API_KEY,
      appKey: process.env.DD_APP_KEY,
      site: process.env.DD_SITE || 'datadoghq.com',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
      maxFiles: 14, // Keep logs for 14 days
      maxSize: '100m',
    },
  },

  // Push Notifications
  notifications: {
    expo: {
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  },

  // Feature Flags (defaults)
  features: {
    premiumEnabled: process.env.FEATURE_PREMIUM === 'true',
    chatEnabled: process.env.FEATURE_CHAT !== 'false',
    videoCallsEnabled: process.env.FEATURE_VIDEO_CALLS === 'true',
    aiMatchingEnabled: process.env.FEATURE_AI_MATCHING === 'true',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  },

  // Health Check Thresholds
  healthCheck: {
    memoryThreshold: 0.9, // 90% memory usage triggers warning
    diskThreshold: 0.85, // 85% disk usage triggers warning
    responseTimeThreshold: 1000, // 1 second response time threshold
    dbConnectionTimeout: 5000, // 5 seconds to connect to DB
  },
};

// Validation function
function validateProductionConfig() {
  const errors = [];
  const warnings = [];

  // Critical validations for production
  if (productionConfig.app.environment === 'production') {
    // Database
    if (!productionConfig.database.mongodb.uri) {
      errors.push('MONGODB_URI is required in production');
    }

    // Security
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }

    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }

    // Monitoring
    if (!productionConfig.monitoring.sentry.dsn) {
      warnings.push('SENTRY_DSN not configured - error tracking disabled');
    }

    // CORS
    if (productionConfig.security.cors.origins.some((o) => o.includes('localhost'))) {
      warnings.push('CORS origins include localhost - review for production');
    }
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

// Export configuration
module.exports = {
  config: productionConfig,
  validateConfig: validateProductionConfig,
};
