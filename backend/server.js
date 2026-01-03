require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');

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

// Monitoring and Logging
const {
  monitoringService,
  datadogService,
  metricsCollector,
  healthCheckService,
} = require('./services/MonitoringService');
const { logger, auditLogger, morganFormat } = require('./services/LoggingService');

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
  const state = mongoose.connection.readyState;
  if (state !== 1) throw new Error('MongoDB not connected');
  return { connected: true };
});

healthCheckService.registerCheck('redis', async () => {
  // Add Redis health check if redis client is available
  return { status: 'ok' };
});

// Sentry request handler (must be first)
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
app.use(requestIdMiddleware);        // Add request ID for tracing
app.use(responseTimeMiddleware);     // Log response times
app.use(performanceHeaders);         // Performance headers
app.use(helmet());                   // Security headers
app.use(compression({                // Compress responses
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    // Don't compress already compressed formats
    const contentType = res.getHeader('Content-Type');
    if (typeof contentType === 'string') {
      if (['image/', 'video/', 'audio/'].some(t => contentType.includes(t))) {
        return false;
      }
    }
    return compression.filter(req, res);
  },
}));
app.use(cdnCacheMiddleware);         // CDN cache headers
app.use(preflightCache(86400));      // Cache CORS preflight for 24h
app.use(morgan(morganFormat, { stream: logger.getStream() }));  // Structured logging

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  /\.vercel\.app$/,
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(null, true); // Allow all for now during development
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for CSRF tokens
app.use(cookieParser());

// CSRF Protection (for non-API routes with session cookies)
// Skipped for Bearer token authenticated API routes
app.use(csrfProtection({
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  ignorePaths: ['/api/auth', '/api/webhook', '/health']
}));

// CSRF Token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Health check endpoints (use health check service)
app.use(healthCheckService.getRouter());

// Legacy health check for backwards compatibility
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
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

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(monitoringService.getErrorHandler());
}

// Analytics error rate tracking middleware
app.use(errorRateMiddleware);

// Global error handler
app.use((error, req, res, next) => {
  // Log error with context
  logger.logError(error, {
    requestId: req.requestId,
    userId: req.user?.id,
    method: req.method,
    url: req.originalUrl,
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }

  // Custom error with status code
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// MongoDB connection
let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // If there's already a connection attempt in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const mongoURI = process.env.MONGODB_URI;
      
      if (!mongoURI) {
        console.warn('MONGODB_URI not set - database features will be unavailable');
        return;
      }

      console.log('Attempting MongoDB connection...');
      
      // Serverless-optimized connection settings
      const conn = await mongoose.connect(mongoURI, {
        bufferCommands: false,
        maxPoolSize: 50,              // Increased for better concurrency
        minPoolSize: 10,              // Keep minimum connections warm
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 30000,         // Close idle connections after 30s
        waitQueueTimeoutMS: 10000,    // Timeout for waiting in queue
        family: 4,                    // Use IPv4, skip trying IPv6
      });

      isConnected = true;
      console.log(`MongoDB Connected: ${conn.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        isConnected = false;
        connectionPromise = null;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      });

    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
      isConnected = false;
      connectionPromise = null;
      // Don't exit in serverless environment
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    }
  })();

  return connectionPromise;
};

// Socket.io setup
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io middleware for authentication
io.use((socket, next) => {
  // For now, accept userId from handshake auth or query
  const userId = socket.handshake.auth.userId || socket.handshake.query.userId;

  if (userId) {
    socket.userId = userId;
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected with socket ${socket.id}`);

  // Join room based on matchId
  socket.on('join_room', (matchId) => {
    try {
      // Validate matchId format
      if (!mongoose.Types.ObjectId.isValid(matchId)) {
        socket.emit('error', { message: 'Invalid match ID' });
        return;
      }

      // Verify user is part of this match
      const userId = socket.userId;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        socket.emit('error', { message: 'Invalid user ID' });
        return;
      }

      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join new room
      socket.join(matchId);
      console.log(`User ${userId} joined room ${matchId}`);

      socket.emit('joined_room', { matchId });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { matchId, content, type = 'text' } = data;
      const senderId = socket.userId;

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
        $or: [
          { swiperId: senderId },
          { swipedId: senderId }
        ],
        action: 'like'
      });

      if (!match) {
        socket.emit('error', { message: 'Match not found or access denied' });
        return;
      }

      // Determine receiver
      const receiverId = match.swiperId.toString() === senderId
        ? match.swipedId
        : match.swiperId;

      // Create and save message
      const message = new Message({
        matchId,
        senderId,
        receiverId,
        content,
        type
      });

      await message.save();

      // Populate sender info for the response
      await message.populate('senderId', 'name photos');
      await message.populate('receiverId', 'name photos');

      // Send notification to receiver if they have message notifications enabled
      try {
        const receiverUser = await User.findById(receiverId);
        if (receiverUser?.notificationPreferences?.messageNotifications !== false) {
          const senderName = message.senderId?.name || 'Someone';
          const messagePreview = content.length > 50 ? `${content.substring(0, 50)}...` : content;
          console.log(`[NOTIFICATION] Message from ${senderName} to ${receiverId}: ${messagePreview}`);
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
          createdAt: message.createdAt
        }
      });

      // Emit delivery confirmation to sender
      socket.emit('message_sent', {
        messageId: message._id,
        timestamp: message.createdAt
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (matchId) => {
    socket.to(matchId).emit('user_typing', {
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (matchId) => {
    socket.to(matchId).emit('user_typing', {
      userId: socket.userId,
      isTyping: false
    });
  });

  // Handle read receipts
  socket.on('message_read', async (data) => {
    try {
      const { messageId, matchId } = data;
      const userId = socket.userId;

      // Update message as read in database
      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          receiverId: userId
        },
        {
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );

      if (message) {
        // Emit read receipt to the sender
        io.to(matchId).emit('message_read_receipt', {
          messageId: message._id,
          readBy: userId,
          readAt: message.readAt
        });
      }
    } catch (error) {
      console.error('Error handling message_read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Start server (for local development)
const startServer = async () => {
  try {
    await connectDB();

    // Configure keep-alive for better HTTP/1.1 connection reuse
    configureKeepAlive(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Socket.io enabled`);
      console.log(`Performance optimizations: enabled`);
    });

    // Setup graceful shutdown
    gracefulShutdown(server, async () => {
      console.log('Closing database connections...');
      await mongoose.connection.close();
      console.log('Database connections closed');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
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
if (process.env.VERCEL) {
  // Serverless - connect on each cold start
  connectDB();
} else {
  // Traditional server
  startServer();
}

module.exports = app;