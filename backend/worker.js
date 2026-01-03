/**
 * Background Job Worker
 * Processes queued jobs for notifications, matches, emails, etc.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { initRedis } = require('./config/redis');
const { initializeProcessors, scheduleRecurringJobs } = require('./services/JobProcessors');

// Graceful shutdown flag
let isShuttingDown = false;

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  // Support both MONGODB_URI and MONGODB_URL for compatibility
  const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL;
  
  if (!mongoURI) {
    throw new Error('MONGODB_URI or MONGODB_URL is required');
  }

  await mongoose.connect(mongoURI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });
  
  console.log('Worker connected to MongoDB');
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
    // Connect to databases
    await connectDB();
    await initRedis();
    
    console.log('Database connections established');

    // Initialize job processors
    initializeProcessors();
    
    // Schedule recurring jobs
    await scheduleRecurringJobs();
    
    console.log('Worker started successfully');
    console.log('Listening for jobs...');
    
  } catch (error) {
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
    const QueueService = require('./services/QueueService');
    await QueueService.closeAll();
    
    // Close Redis
    const { closeRedis } = require('./config/redis');
    await closeRedis();
    
    // Close MongoDB
    await mongoose.connection.close();
    
    console.log('Worker shut down gracefully');
    process.exit(0);
  } catch (error) {
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
