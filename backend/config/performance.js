/**
 * Performance Configuration
 * Centralized performance settings for the dating app backend
 */

// Response compression settings
const COMPRESSION_CONFIG = {
  // Minimum response size to compress (bytes)
  threshold: 1024,
  // Compression level (1-9, higher = better compression but slower)
  level: 6,
  // Content types to compress
  filter: (req, res) => {
    const contentType = res.getHeader('Content-Type');
    if (typeof contentType !== 'string') return true;
    // Don't compress already compressed formats
    const skip = ['image/', 'video/', 'audio/'].some(t => contentType.includes(t));
    return !skip;
  },
};

// Image processing settings
const IMAGE_CONFIG = {
  // Maximum file size (bytes)
  maxFileSize: 5 * 1024 * 1024, // 5MB
  // Output quality settings
  quality: {
    thumbnail: 70,
    small: 75,
    medium: 80,
    large: 85,
    original: 90,
  },
  // Output sizes
  sizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 400 },
    medium: { width: 600, height: 800 },
    large: { width: 1200, height: 1600 },
  },
  // WebP conversion enabled
  useWebP: true,
  // AVIF for modern browsers
  useAVIF: false, // Enable when browser support improves
  // Strip metadata for privacy
  stripMetadata: true,
  // Maximum concurrent processing
  maxConcurrency: 3,
};

// Pagination settings
const PAGINATION_CONFIG = {
  // Default page size
  defaultLimit: 20,
  // Maximum page size
  maxLimit: 100,
  // Discovery feed page size
  discoveryLimit: 15,
  // Chat messages page size
  messagesLimit: 50,
  // Matches page size
  matchesLimit: 30,
  // Use cursor-based pagination for these endpoints
  cursorBasedEndpoints: ['discovery', 'messages', 'matches', 'notifications'],
};

// Cache TTL settings (seconds)
const CACHE_CONFIG = {
  // User data
  userProfile: 300,           // 5 minutes
  userPreferences: 600,       // 10 minutes
  userOnlineStatus: 30,       // 30 seconds
  
  // Discovery
  discoveryProfiles: 60,      // 1 minute (changes frequently)
  discoveryExcluded: 3600,    // 1 hour
  topPicks: 3600,             // 1 hour
  
  // Social
  matches: 120,               // 2 minutes
  conversations: 180,         // 3 minutes
  messageHistory: 60,         // 1 minute
  
  // Gamification
  leaderboard: 300,           // 5 minutes
  achievements: 3600,         // 1 hour
  dailyRewards: 1800,         // 30 minutes
  
  // Static data
  interests: 86400,           // 24 hours
  prompts: 86400,             // 24 hours
  staticContent: 86400,       // 24 hours
};

// Database query optimization
const DB_CONFIG = {
  // Query timeout (ms)
  queryTimeout: 30000,
  // Maximum documents to scan
  maxScan: 10000,
  // Use lean queries for read-only operations
  useLean: true,
  // Fields to always select for discovery
  discoveryProjection: {
    name: 1,
    age: 1,
    gender: 1,
    bio: 1,
    photos: { $slice: 3 }, // Only first 3 photos
    interests: { $slice: 5 }, // Only first 5 interests
    location: 1,
    isVerified: 1,
    lastActive: 1,
    profileCompleteness: 1,
  },
  // Batch sizes for bulk operations
  batchSize: {
    read: 100,
    write: 50,
    delete: 100,
  },
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // General API rate limit
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // requests per window
  },
  // Discovery endpoint (prevent rapid swiping)
  discovery: {
    windowMs: 60 * 1000,
    max: 60,
  },
  // Swipe actions
  swipe: {
    windowMs: 60 * 1000,
    max: 50,
  },
  // Message sending
  messages: {
    windowMs: 60 * 1000,
    max: 30,
  },
  // Image uploads
  upload: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20,
  },
  // Authentication attempts
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
  },
};

// CDN and static asset configuration
const CDN_CONFIG = {
  // CloudFront/CDN domain
  cdnDomain: process.env.CDN_URL || process.env.CLOUDFRONT_URL || '',
  // S3 bucket for assets
  s3Bucket: process.env.S3_BUCKET_NAME || 'dating-app-assets',
  // Cache headers for different asset types
  cacheHeaders: {
    images: {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
      'Vary': 'Accept',
    },
    staticAssets: {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
    },
    html: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
    api: {
      'Cache-Control': 'private, no-cache',
    },
  },
  // Signed URLs expiration (seconds)
  signedUrlExpiry: 3600, // 1 hour
};

// Load time optimization targets
const PERFORMANCE_TARGETS = {
  // Target load times (ms)
  loadTime: {
    initial: 2000,          // First contentful paint
    interactive: 3000,      // Time to interactive
    apiResponse: 500,       // API response time
    imageLoad: 1000,        // Image load time
  },
  // Bundle size limits (KB)
  bundleSize: {
    main: 250,
    vendor: 500,
    total: 1000,
  },
  // Lighthouse score targets
  lighthouse: {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 90,
  },
};

// Connection pooling
const POOL_CONFIG = {
  // MongoDB connection pool
  mongodb: {
    maxPoolSize: 50,
    minPoolSize: 10,
    maxIdleTimeMS: 30000,
    waitQueueTimeoutMS: 10000,
  },
  // Redis connection pool
  redis: {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    keepAlive: 30000,
  },
};

// HTTP/2 and keep-alive settings
const HTTP_CONFIG = {
  keepAliveTimeout: 65000,
  headersTimeout: 66000,
  maxHeadersCount: 100,
};

module.exports = {
  COMPRESSION_CONFIG,
  IMAGE_CONFIG,
  PAGINATION_CONFIG,
  CACHE_CONFIG,
  DB_CONFIG,
  RATE_LIMIT_CONFIG,
  CDN_CONFIG,
  PERFORMANCE_TARGETS,
  POOL_CONFIG,
  HTTP_CONFIG,
};
