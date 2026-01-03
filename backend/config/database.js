/**
 * Database Configuration
 * Enhanced MongoDB connection with connection pooling and retry logic
 */

const mongoose = require('mongoose');

// Connection state
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4
  retryWrites: true,
  w: 'majority',
};

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return mongoose.connection;
  }

  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    console.warn('MONGODB_URI not set - database features will be unavailable');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoURI, mongoOptions);
    
    isConnected = true;
    connectionRetries = 0;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Setup event handlers
    setupConnectionHandlers();
    
    return conn.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    isConnected = false;
    
    // Retry logic
    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
      console.log(`Retrying connection in ${delay}ms (attempt ${connectionRetries}/${MAX_RETRIES})`);
      
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
    console.error('MongoDB connection error:', error);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
    
    // Attempt reconnection
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(connectDB, 5000);
    }
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
    isConnected = true;
  });
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
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
});

/**
 * Create indexes for all models
 * Call this after initial connection
 */
const createIndexes = async () => {
  try {
    // User indexes
    await mongoose.connection.db.collection('users').createIndexes([
      { key: { location: '2dsphere' } },
      { key: { email: 1 }, unique: true },
      { key: { phoneNumber: 1 }, unique: true, sparse: true },
      { key: { googleId: 1 }, unique: true, sparse: true },
      { key: { 'subscription.tier': 1 } },
      { key: { lastActive: -1 } },
      { key: { createdAt: -1 } },
      { key: { isActive: 1, isVerified: 1 } },
    ]);

    // Swipes indexes for match queries
    await mongoose.connection.db.collection('swipes').createIndexes([
      { key: { swiperId: 1, swipedId: 1 }, unique: true },
      { key: { swiperId: 1, action: 1, createdAt: -1 } },
      { key: { swipedId: 1, action: 1, createdAt: -1 } },
      { key: { isMatch: 1, createdAt: -1 } },
    ]);

    // Messages indexes
    await mongoose.connection.db.collection('messages').createIndexes([
      { key: { matchId: 1, createdAt: -1 } },
      { key: { senderId: 1, receiverId: 1 } },
      { key: { receiverId: 1, isRead: 1 } },
    ]);

    // Reports and blocks
    await mongoose.connection.db.collection('reports').createIndexes([
      { key: { reportedUserId: 1, status: 1 } },
      { key: { reporterId: 1, createdAt: -1 } },
    ]);

    await mongoose.connection.db.collection('blocks').createIndexes([
      { key: { blockerId: 1, blockedId: 1 }, unique: true },
    ]);

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = {
  connectDB,
  gracefulShutdown,
  getConnectionStatus,
  createIndexes,
  mongoose,
};
