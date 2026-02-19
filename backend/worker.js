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
    console.log('Worker connected to MongoDB');
  } catch (/** @type {any} */ error) {
    console.error(
      'Worker MongoDB connection failed:',
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

/**
 * Start the worker
 */
const startWorker = async () => {
  console.log('========================================');
  console.log('Starting Background Job Worker');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================');

  try {
    // Connect to databases using centralized connection
    await connectWorkerDB();
    await initRedis();

    console.log('Database connections established');

    // Initialize job processors
    initializeProcessors();

    // Schedule recurring jobs
    await scheduleRecurringJobs();

    console.log('Worker started successfully');
    console.log('Listening for jobs...');
  } catch (/** @type {any} */ error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close queue connections
    const QueueService = require('./src/infrastructure/queues/QueueService');
    await QueueService.closeAll();

    // Close Redis
    const { closeRedis } = require('./src/config/redis');
    await closeRedis();

    // Close MongoDB using centralized graceful shutdown
    await dbGracefulShutdown(signal);

    console.log('Worker shut down gracefully');
    process.exit(0);
  } catch (/** @type {any} */ error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start worker
startWorker();
