/**
 * Database Configuration
 * Enhanced MongoDB connection with connection pooling, retry logic, and circuit breaker
 */

const mongoose = require('mongoose');
const { getCircuitBreaker, CIRCUIT_BREAKER_STATES } = require('../shared/utils/retryUtils');
const { logger } = require('../infrastructure/external/LoggingService');

// Enable bufferCommands globally to allow queuing before connection
mongoose.set('bufferCommands', true);
// Note: bufferMaxEntries is set in connection options, not via mongoose.set()

// Connection state
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

// Circuit breaker for database operations
const dbCircuitBreaker = getCircuitBreaker('database', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 10000,
});

// Pool monitoring stats
let poolStats = {
  totalConnections: 0,
  availableConnections: 0,
  waitQueueSize: 0,
};

// Detect serverless environment (Vercel)
const isServerless = !!process.env.VERCEL_ENV;

// MongoDB connection options - optimized for high concurrency (swiping traffic)
// In serverless environments, use smaller pool sizes to avoid connection leaks
// @ts-ignore - Mongoose ConnectOptions type doesn't include all valid options
const mongoOptions = {
  // Connection pool settings - smaller for serverless, larger for traditional server
  maxPoolSize: isServerless ? 5 : 50,
  minPoolSize: isServerless ? 1 : 10,

  // Timeout settings - prevent hanging requests
  serverSelectionTimeoutMS: isServerless ? 5000 : 10000,
  socketTimeoutMS: isServerless ? 30000 : 45000,
  maxIdleTimeMS: isServerless ? 10000 : 30000,
  waitQueueTimeoutMS: 10000, // Max wait for connection from pool
  connectTimeoutMS: 10000, // Initial connection timeout

  // Connection behavior
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true, // Retry failed writes
  retryReads: true, // Retry failed reads
  w: 'majority', // Write concern - majority ensures data durability
  bufferCommands: isServerless ? true : false, // Buffer in serverless (connection may be pending), fail fast otherwise

  // Heartbeat and monitoring
  heartbeatFrequencyMS: isServerless ? 30000 : 10000,
};

/**
 * Connect to MongoDB with retry logic and circuit breaker
 */
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info('Using existing MongoDB connection');
    return mongoose.connection;
  }

  // Support both MONGODB_URI and MONGODB_URL for compatibility
  const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL;

  if (!mongoURI) {
    logger.warn('MONGODB_URI or MONGODB_URL not set - database features will be unavailable');
    return null;
  }

  try {
    // Use circuit breaker for connection attempt
    return await dbCircuitBreaker.execute(async () => {
      // Add connection timeout to prevent hanging
      const connectionPromise = mongoose.connect(
        mongoURI,
        /** @type {mongoose.ConnectOptions} */ (mongoOptions)
      );
      const timeoutPromise = new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000);
      });

      // Race between connection and timeout
      const conn = await Promise.race([connectionPromise, timeoutPromise]);

      isConnected = true;
      connectionRetries = 0;
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      logger.info(`MongoDB Database: ${conn.connection.name}`);

      // Setup event handlers
      setupConnectionHandlers();

      // Set global query timeout to prevent hanging queries
      // This applies to all queries that don't have explicit maxTimeMS
      mongoose.set('maxTimeMS', 10000); // 10 seconds default timeout
      logger.info('MongoDB global query timeout set to 10s');

      return conn.connection;
    }, 'mongodb_connection');
  } catch (/** @type {any} */ error) {
    const err = /** @type {Error} */ (error);
    const errorMessage = err.message || String(err);
    logger.error('MongoDB connection failed', { error: errorMessage });
    isConnected = false;

    // Retry logic
    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
      logger.info(
        `Retrying connection in ${delay}ms (attempt ${connectionRetries}/${MAX_RETRIES})`
      );

      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(await connectDB());
        }, delay);
      });
    }

    throw error;
  }
};

/**
 * Setup MongoDB connection event handlers
 */
const setupConnectionHandlers = () => {
  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: error.message || String(error) });
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    isConnected = false;

    // Attempt reconnection
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(connectDB, 5000);
    }
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
    isConnected = true;
  });
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (/** @type {any} */ error) {
    const err = /** @type {Error} */ (error);
    const errorMessage = err.message || String(err);
    logger.error('Error closing MongoDB connection', { error: errorMessage });
  }
};

/**
 * Get connection status
 */
const getConnectionStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  states: {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }[mongoose.connection.readyState],
  pool: poolStats,
});

/**
 * Monitor connection pool health
 * Detects pool exhaustion before it causes 500 errors
 */
const monitorPoolHealth = () => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    return;
  }

  // Get pool stats from the MongoDB driver
  try {
    const client = mongoose.connection.getClient();
    /** @type {any} */
    const clientAny = client;
    if (client && clientAny.topology) {
      const serverDescription = clientAny.topology.description;
      if (serverDescription && serverDescription.servers) {
        let totalConnections = 0;
        serverDescription.servers.forEach((server) => {
          if (server.pool) {
            totalConnections += server.pool.totalConnectionCount || 0;
          }
        });

        poolStats = {
          totalConnections,
          maxPoolSize: mongoOptions.maxPoolSize,
          availableConnections: 0,
          waitQueueSize: 0,
          utilizationPercent: Math.round((totalConnections / mongoOptions.maxPoolSize) * 100),
          lastChecked: new Date().toISOString(),
        };

        // Warn if pool utilization is high (>80%)
        if (poolStats.utilizationPercent > 80) {
          logger.warn(
            `[DB POOL WARNING] High pool utilization: ${poolStats.utilizationPercent}% ` +
              `(${totalConnections}/${mongoOptions.maxPoolSize} connections)`
          );
        }

        // Critical warning if pool is nearly exhausted (>95%)
        if (poolStats.utilizationPercent > 95) {
          logger.error(
            `[DB POOL CRITICAL] Pool near exhaustion: ${poolStats.utilizationPercent}% ` +
              `- requests may start failing with 500 errors!`
          );
        }
      }
    }
  } catch (/** @type {any} */ error) {
    // Silently handle monitoring errors
  }
};

// Start pool monitoring in non-test, non-serverless environments
if (process.env.NODE_ENV !== 'test' && !isServerless) {
  setInterval(monitorPoolHealth, 30000); // Check every 30 seconds
}

/**
 * Enable MongoDB slow query profiling
 * Logs queries taking longer than the threshold
 * TD-004: Added for performance monitoring
 * Note: May not work on managed services like MongoDB Atlas
 */
const enableSlowQueryProfiling = async (thresholdMs = 100) => {
  try {
    if (!mongoose.connection.db) {
      logger.warn('Database not connected, skipping profiling setup');
      return;
    }

    // Set profiling level: 1 = log slow queries only
    // slowms: threshold in milliseconds
    await mongoose.connection.db.command({
      profile: 1,
      slowms: thresholdMs,
    });

    logger.info(`MongoDB slow query profiling enabled (threshold: ${thresholdMs}ms)`);

    // Optional: Set up periodic slow query log reader
    if (process.env.NODE_ENV !== 'test') {
      setInterval(async () => {
        try {
          if (!mongoose.connection.db) return;
          const slowQueries = await mongoose.connection.db
            .collection('system.profile')
            .find({ millis: { $gt: thresholdMs } })
            .sort({ ts: -1 })
            .limit(10)
            .toArray();

          if (slowQueries.length > 0) {
            logger.warn(`[SLOW QUERIES] Found ${slowQueries.length} slow queries in last check`);
            slowQueries.forEach((q) => {
              logger.warn(
                `  - ${q.op} on ${q.ns}: ${q.millis}ms ${q.command ? JSON.stringify(q.command).substring(0, 200) : ''}`
              );
            });
          }
        } catch (/** @type {any} */ err) {
          // Silently ignore profiling read errors
        }
      }, 60000); // Check every minute
    }
  } catch (/** @type {any} */ error) {
    const err = /** @type {Error} */ (error);
    const errorMessage = err.message || String(err);

    // MongoDB Atlas and other managed services often disable profiling
    if (errorMessage.includes('CMD_NOT_ALLOWED') || errorMessage.includes('profile')) {
      logger.info('Slow query profiling not available (normal for managed MongoDB services)');
    } else {
      logger.warn('Could not enable slow query profiling', { error: errorMessage });
    }
  }
};

/**
 * Create indexes for all models
 * Call this after initial connection
 * TD-004: Added optimized indexes for slow query fixes
 */
const createIndexes = async () => {
  try {
    if (!mongoose.connection.db) {
      logger.warn('Database not connected, skipping index creation');
      return;
    }

    // Add timeout to prevent hanging during index creation
    const indexCreationPromise = async () => {
      // Helper function to safely create indexes
      const safeCreateIndexes = async (collection, indexes) => {
        try {
          if (!mongoose.connection.db) {
            throw new Error('Database connection not available');
          }
          await mongoose.connection.db.collection(collection).createIndexes(indexes);
        } catch (/** @type {any} */ error) {
          const err = /** @type {Error} */ (error);
          if (err && err.message && err.message.includes('already exists')) {
            logger.info(`Some indexes for ${collection} already exist, skipping duplicates`);
          } else {
            throw error;
          }
        }
      };

      // User indexes
      await safeCreateIndexes('users', [
        { key: { location: '2dsphere' } },
        { key: { email: 1 }, unique: true },
        { key: { phoneNumber: 1 }, unique: true, sparse: true },
        { key: { googleId: 1 }, unique: true, sparse: true },
        { key: { 'subscription.tier': 1 } },
        { key: { lastActive: -1 } },
        { key: { createdAt: -1 } },
        { key: { isActive: 1, isVerified: 1 } },
        // TD-004: Compound index for discovery queries
        { key: { isActive: 1, gender: 1, age: 1, location: '2dsphere' } },
        // Token lookup indexes for auth flows
        { key: { emailVerificationToken: 1 }, sparse: true, name: 'emailVerificationToken_lookup' },
        { key: { passwordResetToken: 1 }, sparse: true, name: 'passwordResetToken_lookup' },
      ]);

      // Swipes indexes for match queries
      // TD-004: Added optimized indexes for match detection and "who liked me"
      await safeCreateIndexes('swipes', [
        { key: { swiperId: 1, swipedId: 1 }, unique: true },
        { key: { swiperId: 1, action: 1, createdAt: -1 } },
        { key: { swipedId: 1, action: 1, createdAt: -1 } },
        { key: { isMatch: 1, createdAt: -1 } },
        // TD-004: Reverse match lookup for efficient match detection
        { key: { swipedId: 1, swiperId: 1, action: 1 }, name: 'reverse_match_lookup' },
        // TD-004: Covering index for conversation queries
        { key: { swiperId: 1, action: 1 }, name: 'swiper_action_conv' },
        { key: { swipedId: 1, action: 1 }, name: 'swiped_action_conv' },
      ]);

      // Messages indexes
      // TD-004: Added composite index for unread count queries
      await safeCreateIndexes('messages', [
        { key: { matchId: 1, createdAt: -1 } },
        { key: { senderId: 1, receiverId: 1 } },
        { key: { receiverId: 1, isRead: 1 } },
        // TD-004: Composite index for unread messages in conversations
        { key: { matchId: 1, receiverId: 1, isRead: 1 }, name: 'match_receiver_unread' },
      ]);

      // Reports and blocks
      await safeCreateIndexes('reports', [
        { key: { reportedUserId: 1, status: 1 } },
        { key: { reporterId: 1, createdAt: -1 } },
      ]);

      await safeCreateIndexes('blocks', [{ key: { blockerId: 1, blockedId: 1 }, unique: true }]);

      // UserActivity indexes for analytics
      // TD-004: Optimized for DAU/retention queries
      await safeCreateIndexes('useractivities', [
        { key: { userId: 1, createdAt: -1 } },
        { key: { createdAt: -1, userId: 1 }, name: 'createdAt_userId_dau' },
        { key: { userId: 1, createdAt: 1 }, name: 'userId_createdAt_retention' },
      ]);
    };

    // Race between index creation and timeout (30 seconds)
    const timeoutPromise = new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error('Index creation timeout after 30 seconds')), 30000);
    });

    await Promise.race([indexCreationPromise(), timeoutPromise]);

    logger.info('Database indexes created successfully');

    // Enable slow query profiling after indexes are created
    await enableSlowQueryProfiling(100);
  } catch (/** @type {any} */ error) {
    const err = /** @type {Error} */ (error);
    const errorMessage = err.message || String(err);
    logger.error('Error creating indexes', { error: errorMessage });
  }
};

module.exports = {
  connectDB,
  gracefulShutdown,
  getConnectionStatus,
  createIndexes,
  enableSlowQueryProfiling,
  monitorPoolHealth,
  mongoOptions,
  mongoose,
};
