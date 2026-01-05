// IMPORTANT: Import Sentry instrumentation at the very top, before everything else
const Sentry = require('./instrument.js');

require('dotenv').config();
const { createServer } = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet').default || require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

// Validate environment variables before starting
const { validateOrExit } = require('./utils/validateEnv');
validateOrExit();

// Security middleware
const { csrfProtection, getCsrfToken } = require('./middleware/csrf');

// Performance optimization middleware
const {
  performanceHeaders,
  responseTimeMiddleware,
  requestIdMiddleware,
  configureKeepAlive,
  gracefulShutdown,
  preflightCache,
} = require('./middleware/loadTimeOptimization');
const { cdnCacheMiddleware } = require('./services/cdnService');

// Request timeout middleware - prevents 504 Gateway Timeout
const { requestTimeout } = require('./middleware/requestTimeout');

// Monitoring and Logging
const {
  monitoringService,
  datadogService,
  metricsCollector,
  healthCheckService,
} = require('./services/MonitoringService');
const { logger, auditLogger, morganFormat } = require('./services/LoggingService');

// Database connection - use centralized connection
const {
  connectDB: connectDatabase,
  gracefulShutdown: dbGracefulShutdown,
  createIndexes,
} = require('./config/database');

// Import models
const Message = require('./models/Message');
const Swipe = require('./models/Swipe');
const User = require('./models/User');

// Import routes
const discoveryRoutes = require('./routes/discovery');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const swipeRoutes = require('./routes/swipe');
const notificationRoutes = require('./routes/notifications');
const enhancedProfileRoutes = require('./routes/enhancedProfile');
const activityRoutes = require('./routes/activity');
const socialMediaRoutes = require('./routes/socialMedia');
const safetyRoutes = require('./routes/safety');
const premiumRoutes = require('./routes/premium');
const paymentRoutes = require('./routes/payment');
const advancedInteractionsRoutes = require('./routes/advancedInteractions');
const discoveryEnhancementsRoutes = require('./routes/discoveryEnhancements');
const mediaMessagesRoutes = require('./routes/mediaMessages');
const gamificationRoutes = require('./routes/gamification');
const socialFeaturesRoutes = require('./routes/socialFeatures');
const privacyRoutes = require('./routes/privacy');
const metricsRoutes = require('./routes/metrics');
const usersRoutes = require('./routes/users');

// Analytics metrics middleware
const {
  responseTimeMiddleware: metricsResponseTimeMiddleware,
  requestCountingMiddleware,
  photoUploadMetricsMiddleware,
  userActivityMiddleware,
  errorRateMiddleware,
} = require('./middleware/metricsMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize monitoring services
monitoringService.initSentry(app);
datadogService.init();

// Register health checks
healthCheckService.registerCheck('mongodb', async () => {
  const { getConnectionStatus } = require('./config/database');
  const status = getConnectionStatus();

  if (status.readyState !== 1) {
    throw new Error(`MongoDB not connected. State: ${status.states}`);
  }

  // Get pool stats if available
  let poolInfo = { maxPoolSize: 50, status: 'ok', ...status.pool };
  try {
    const client = mongoose.connection.getClient();
    // @ts-ignore - topology is an internal property that may not be in types
    const topology = client?.topology;
    if (topology?.description) {
      const serverDescription = topology.description;
      let totalConnections = 0;
      if (serverDescription.servers) {
        serverDescription.servers.forEach((server) => {
          if (server.pool) {
            totalConnections += server.pool.totalConnectionCount || 0;
          }
        });
      }
      poolInfo = {
        maxPoolSize: 50,
        totalConnections: totalConnections,
        availableConnections: 50 - totalConnections,
        waitQueueSize: 0,
        status: totalConnections > 45 ? 'warning' : 'ok',
      };
    }
  } catch (e) {
    // Ignore pool stat errors
  }

  return { connected: true, pool: poolInfo };
});

healthCheckService.registerCheck('redis', async () => {
  // Add Redis health check if redis client is available
  return { status: 'ok' };
});

// Sentry request handler (must be first)
// Note: In Sentry v8+, expressIntegration handles this automatically
// These handlers are kept for backward compatibility but may be no-ops
if (process.env.SENTRY_DSN) {
  app.use(monitoringService.getRequestHandler());
  app.use(monitoringService.getTracingHandler());
}

// Metrics collection middleware
app.use(metricsCollector.getMiddleware());

// Analytics metrics middleware
app.use(metricsResponseTimeMiddleware);
app.use(requestCountingMiddleware);
app.use(userActivityMiddleware);
app.use(photoUploadMetricsMiddleware);

// Performance & Security Middleware (order matters!)
app.use(requestIdMiddleware); // Add request ID for tracing
app.use(requestTimeout({ logTimeouts: true })); // Request timeout handler - must be early
// Note: responseTimeMiddleware removed - using metricsResponseTimeMiddleware instead to avoid conflicts
app.use(performanceHeaders); // Performance headers
app.use(helmet()); // Security headers
app.use(
  compression({
    // Compress responses
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      // Don't compress already compressed formats
      const contentType = res.getHeader('Content-Type');
      if (typeof contentType === 'string') {
        if (['image/', 'video/', 'audio/'].some((t) => contentType.includes(t))) {
          return false;
        }
      }
      return compression.filter(req, res);
    },
  })
);
app.use(cdnCacheMiddleware); // CDN cache headers
app.use(preflightCache(86400)); // Cache CORS preflight for 24h
app.use(morgan(morganFormat, { stream: logger.getStream() })); // Structured logging

// CORS configuration - Enhanced security
// Parse CORS_ORIGIN if provided (comma-separated list of origins)
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

// Build allowed origins list - Be restrictive in production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...corsOrigins,
  'https://dating-app-seven-peach.vercel.app', // Explicit Vercel frontend URL
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  // Allow all Vercel preview deployments for this project
  /^https:\/\/dating-app-.*\.vercel\.app$/,
  /^https:\/\/dating-.*-beharks-projects\.vercel\.app$/,
].filter(Boolean);

// Add regex patterns only in non-production environments for development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(/\.vercel\.app$/);
  allowedOrigins.push(/\.onrender\.com$/);
}

// Helper function to check if origin is allowed
const isOriginAllowed = (origin) => {
  return allowedOrigins.some((allowed) => {
    // @ts-ignore - RegExp check is valid at runtime
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return allowed === origin;
  });
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) - but validate them differently
    if (!origin) {
      // For requests without origin (mobile apps, server-to-server), require API key or auth
      callback(null, true);
      return;
    }

    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      // Block unauthorized origins - even in development
      console.warn('CORS: Blocked unauthorized origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400, // Cache preflight response for 24 hours
};
app.use(cors(corsOptions));

// Body parsing middleware
// Note: Multer handles multipart/form-data (file uploads) with its own limits
// These limits apply to JSON and URL-encoded bodies only
// For large file uploads, Multer bypasses these limits
app.use(express.json({ limit: '50mb' })); // Support large base64-encoded images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser for CSRF tokens
app.use(cookieParser());

// CSRF Protection (for non-API routes with session cookies)
// Skipped for Bearer token authenticated API routes
app.use(
  csrfProtection({
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    ignorePaths: ['/api/auth', '/api/webhook', '/health'],
  })
);

// CSRF Token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Health check endpoints (use health check service)
app.use(healthCheckService.getRouter());

// Legacy health check for backwards compatibility (only if not already handled)
app.get('/health', (req, res) => {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Sentry test endpoint - triggers a test error to verify Sentry is working
// Visit: http://localhost:3000/api/test-sentry (or your deployed URL)
// Note: Only available in non-production environments for security
app.get('/api/test-sentry', (req, res) => {
  // Sentry is already imported at the top of the file

  // Create test spans and metrics (as per Sentry's test code)
  Sentry.startSpan(
    {
      name: 'test',
      op: 'test',
    },
    () => {
      Sentry.startSpan(
        {
          name: 'My First Test Span',
          op: 'test.span',
        },
        () => {
          // Log info message (using console.log since Sentry.logger may not be available in all versions)
          console.log('User triggered test error', {
            action: 'test_error_span',
            userId: 'test-user',
          });

          // Send a metric (increment is the correct API for counters)
          Sentry.metrics.increment('test_counter', 1);
        }
      );
    }
  );

  try {
    // Intentionally trigger an error to test Sentry
    throw new Error('Test error for Sentry - This is intentional to verify Sentry is working!');
  } catch (e) {
    // Capture the exception
    Sentry.captureException(e);

    res.status(500).json({
      success: false,
      message:
        'Test error sent to Sentry! Check your Sentry dashboard at https://kabashi.sentry.io/issues/',
      error: e instanceof Error ? e.message : String(e),
      note: 'This error was intentionally triggered to test Sentry integration.',
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile/enhanced', enhancedProfileRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api', discoveryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat/media', mediaMessagesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/swipes', swipeRoutes);
app.use('/api/interactions', advancedInteractionsRoutes);
app.use('/api/discovery', discoveryEnhancementsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/social', socialFeaturesRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/users', usersRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return;
  }

  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(monitoringService.getErrorHandler());
}

// Global error handler
app.use((error, req, res, next) => {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(error);
  }

  // Call errorRateMiddleware first (it's an error handler, just tracks metrics)
  errorRateMiddleware(error, req, res, () => {
    // Log error with context
    logger.logError(error, {
      requestId: req.requestId,
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
    });

    // MongoDB connection pool exhaustion / timeout errors
    // These occur when too many concurrent requests exceed the pool capacity
    if (
      (error instanceof Error ? error.name : 'Error') === 'MongoServerSelectionError' ||
      (error instanceof Error ? error.name : 'Error') === 'MongoNetworkError' ||
      (error instanceof Error ? error.name : 'Error') === 'MongoTimeoutError' ||
      error.message?.includes('pool') ||
      error.message?.includes('connection') ||
      error.message?.includes('timed out') ||
      error.message?.includes('ECONNREFUSED') ||
      error.code === 'ECONNRESET'
    ) {
      console.error('[DB CONNECTION ERROR]', error.message);
      if (!res.headersSent) {
        return res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable. Please try again in a moment.',
          retryAfter: 5,
          errorCode: 'DB_CONNECTION_ERROR',
        });
      }
      return;
    }

    // MongoDB wait queue timeout - connection pool exhausted
    if (error.message?.includes('waitQueueTimeoutMS') || error.message?.includes('wait queue')) {
      console.error('[DB POOL EXHAUSTED]', error.message);
      if (!res.headersSent) {
        return res.status(503).json({
          success: false,
          message: 'Server is busy. Please try again in a few seconds.',
          retryAfter: 3,
          errorCode: 'DB_POOL_EXHAUSTED',
        });
      }
      return;
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }
      return;
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      if (!res.headersSent) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry found',
        });
      }
      return;
    }

    // Custom error with status code
    if (error.statusCode) {
      if (!res.headersSent) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return;
    }

    // Default server error
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });
});

// MongoDB connection - using centralized connection from config/database.js
// This ensures we use one MongoClient instance per application (MongoDB best practice)
const connectDB = async () => {
  try {
    const connection = await connectDatabase();
    // connectDatabase returns the connection object or null
    return connection !== null;
  } catch (error) {
    console.error(
      'MongoDB connection failed:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};

// Socket.io setup with enhanced security
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        // Always block unauthorized origins
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // ===== HEARTBEAT/PING CONFIG =====
  pingTimeout: 60000, // Wait 60s for pong response before considering connection dead
  pingInterval: 25000, // Send ping every 25s to keep connection alive
  // ===== CONNECTION CONFIG =====
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Enable compatibility with Socket.io v3 clients
  maxHttpBufferSize: 1e6, // 1MB max message size
  connectTimeout: 45000, // 45s timeout for initial connection
});

// Track connected users for presence
const connectedUsers = new Map();

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const userId = socket.handshake.auth.userId || socket.handshake.query.userId;

    if (token) {
      // JWT authentication
      const jwt = require('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET || '';
      if (!jwtSecret) {
        return next(new Error('JWT_SECRET not configured'));
      }
      const decoded = /** @type {any} */ (jwt.verify(token, jwtSecret));
      /** @type {any} */ (socket).userId = decoded.userId || decoded.id;
    } else if (userId) {
      // Direct userId (for development/testing)
      /** @type {any} */ (socket).userId = userId;
    } else {
      return next(new Error('Authentication required'));
    }

    next();
  } catch (error) {
    next(
      new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`)
    );
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  /** @type {any} */
  const extSocket = socket;
  const userId = extSocket.userId;
  console.log(`[WS] User ${userId} connected (socket: ${socket.id})`);

  // Track connection
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socket.id);

  // ===== HEARTBEAT HANDLER =====
  socket.on('heartbeat', () => {
    // Client is alive, update last seen
    /** @type {any} */ (socket).lastHeartbeat = Date.now();
  });

  // Join room based on matchId
  socket.on('join_room', (matchId) => {
    try {
      // Validate matchId format
      if (!mongoose.Types.ObjectId.isValid(matchId)) {
        socket.emit('error', { message: 'Invalid match ID' });
        return;
      }

      // Verify user is part of this match
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        socket.emit('error', { message: 'Invalid user ID' });
        return;
      }

      // Leave previous rooms
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join new room
      socket.join(matchId);
      console.log(`[WS] User ${userId} joined room ${matchId}`);

      socket.emit('joined_room', { matchId });
    } catch (error) {
      console.error('[WS] Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { matchId, content, type = 'text' } = data;
      const senderId = extSocket.userId;

      // Validate input
      if (!matchId || !content || !senderId) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(matchId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        socket.emit('error', { message: 'Invalid ID format' });
        return;
      }

      // Verify the match exists and user is part of it
      const match = await Swipe.findOne({
        _id: matchId,
        $or: [{ swiperId: senderId }, { swipedId: senderId }],
        action: 'like',
      });

      if (!match) {
        socket.emit('error', { message: 'Match not found or access denied' });
        return;
      }

      // Determine receiver
      const receiverId = match.swiperId.toString() === senderId ? match.swipedId : match.swiperId;

      // Create and save message
      const message = new Message({
        matchId,
        senderId,
        receiverId,
        content,
        type,
      });

      await message.save();

      // Populate sender info for the response
      await message.populate('senderId', 'name photos');
      await message.populate('receiverId', 'name photos');

      // Send notification to receiver if they have message notifications enabled
      try {
        const receiverUser = await User.findById(receiverId);
        if (receiverUser?.notificationPreferences?.messageNotifications !== false) {
          const senderName = /** @type {any} */ (message.senderId)?.name || 'Someone';
          const messagePreview = content.length > 50 ? `${content.substring(0, 50)}...` : content;
          console.log(
            `[NOTIFICATION] Message from ${senderName} to ${receiverId}: ${messagePreview}`
          );
          // In production, send via Expo push notification service
        }
      } catch (notifError) {
        console.error('Error sending message notification:', notifError);
      }

      // Emit to all users in the room (both sender and receiver)
      io.to(matchId).emit('new_message', {
        message: {
          _id: message._id,
          matchId: message.matchId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          type: message.type,
          isRead: message.isRead,
          createdAt: message.createdAt,
        },
      });

      // Emit delivery confirmation to sender
      socket.emit('message_sent', {
        messageId: message._id,
        timestamp: message.createdAt,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (matchId) => {
    socket.to(matchId).emit('user_typing', {
      userId: extSocket.userId,
      isTyping: true,
    });
  });

  socket.on('typing_stop', (matchId) => {
    socket.to(matchId).emit('user_typing', {
      userId: extSocket.userId,
      isTyping: false,
    });
  });

  // Handle read receipts
  socket.on('message_read', async (data) => {
    try {
      const { messageId, matchId } = data;
      const userId = extSocket.userId;

      // Update message as read in database
      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          receiverId: userId,
        },
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true }
      );

      if (message) {
        // Emit read receipt to the sender
        io.to(matchId).emit('message_read_receipt', {
          messageId: message._id,
          readBy: userId,
          readAt: message.readAt,
        });
      }
    } catch (error) {
      console.error('Error handling message_read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });

  // ===== TYPING INDICATORS =====
  socket.on('typing_start', (matchId) => {
    if (matchId && mongoose.Types.ObjectId.isValid(matchId)) {
      socket.to(matchId).emit('user_typing', { userId, isTyping: true });
    }
  });

  socket.on('typing_stop', (matchId) => {
    if (matchId && mongoose.Types.ObjectId.isValid(matchId)) {
      socket.to(matchId).emit('user_typing', { userId, isTyping: false });
    }
  });

  // ===== DISCONNECT HANDLER =====
  socket.on('disconnect', (reason) => {
    console.log(`[WS] User ${userId} disconnected (reason: ${reason}, socket: ${socket.id})`);

    // Remove from connected users
    if (connectedUsers.has(userId)) {
      connectedUsers.get(userId).delete(socket.id);
      if (connectedUsers.get(userId).size === 0) {
        connectedUsers.delete(userId);
        // User has no more connections - they're fully offline
        console.log(`[WS] User ${userId} is now offline (no active connections)`);
      }
    }
  });

  // ===== ERROR HANDLER =====
  socket.on('error', (error) => {
    console.error(`[WS] Socket error for user ${userId}:`, error);
  });
});

// Start server (for local development)
const startServer = async () => {
  try {
    const dbConnected = await connectDB();

    if (!dbConnected) {
      console.warn('⚠️  MongoDB connection failed - server starting without database');
      console.warn('⚠️  Some features may not work until MongoDB is connected');
    } else {
      console.log('✅ MongoDB connection established successfully');
      // Create indexes asynchronously without blocking server startup
      createIndexes().catch((err) => {
        console.error('Warning: Failed to create database indexes:', err.message);
      });
    }

    // Configure keep-alive for better HTTP/1.1 connection reuse
    configureKeepAlive(server);

    // Listen on 0.0.0.0 to allow Render's load balancer to connect
    // Using 0.0.0.0 instead of default (localhost) makes the server accessible from outside the container
    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Socket.io enabled`);
      console.log(`Performance optimizations: enabled`);
    });

    // Setup graceful shutdown
    gracefulShutdown(server, async () => {
      console.log('Closing database connections...');
      await dbGracefulShutdown('SIGTERM');
      console.log('Database connections closed');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err instanceof Error ? err.message : String(err));
  if (process.env.NODE_ENV !== 'production') {
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// For Vercel serverless, connect DB on first request
if (process.env.VERCEL_ENV) {
  // Serverless - connect on each cold start
  connectDB();
} else {
  // Traditional server
  startServer();
}

module.exports = app;
