/**
 * Background Job Worker
 * Processes queued jobs for notifications, matches, emails, etc.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, gracefulShutdown: dbGracefulShutdown } = require('./src/config/database');
const { initRedis } = require('./src/config/redis');
const {
  initializeProcessors,
  scheduleRecurringJobs,
} = require('./src/core/services/JobProcessors');
const { logger } = require('./src/infrastructure/external/LoggingService');

// Graceful shutdown flag
let isShuttingDown = false;

/**
 * Connect to MongoDB
 * Uses centralized connection from config/database.js
 * This ensures we use one MongoClient instance per application (MongoDB best practice)
 */
const connectWorkerDB = async () => {
  try {
    const connection = await connectDB();
    if (!connection) {
      throw new Error('Failed to connect to MongoDB');
    }
    logger.info('Worker connected to MongoDB');
  } catch (/** @type {any} */ error) {
    logger.error('Worker MongoDB connection failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Start the worker
 */
const startWorker = async () => {
  logger.info('========================================');
  logger.info('Starting Background Job Worker');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Time: ${new Date().toISOString()}`);
  logger.info('========================================');

  try {
    // Connect to databases using centralized connection
    await connectWorkerDB();
    await initRedis();

    logger.info('Database connections established');

    // Initialize job processors
    initializeProcessors();

    // Schedule recurring jobs
    await scheduleRecurringJobs();

    logger.info('Worker started successfully');
    logger.info('Listening for jobs...');
  } catch (/** @type {any} */ error) {
    logger.error('Failed to start worker', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Close queue connections
    const QueueService = require('./src/infrastructure/queues/QueueService');
    await QueueService.closeAll();

    // Close Redis
    const { closeRedis } = require('./src/config/redis');
    await closeRedis();

    // Close MongoDB using centralized graceful shutdown
    await dbGracefulShutdown(signal);

    logger.info('Worker shut down gracefully');
    process.exit(0);
  } catch (/** @type {any} */ error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: String(reason) });
});

// Start worker
startWorker();
