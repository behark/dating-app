/**
 * Enhanced WebSocket Service
 * Real-time communication with presence, reconnection, and typing indicators
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { cache, onlineStatus, CACHE_KEYS, CACHE_TTL } = require('../../config/redis');
const Message = require('../domain/Message');
const User = require('../domain/User');
const Swipe = require('../domain/Swipe');

/**
 * @typedef {import('socket.io').Socket & { userId: string; userName: string }} AuthenticatedSocket
 */

// Connected users map (in-memory for single server, use Redis for multiple servers)
const connectedUsers = new Map();

// Room subscriptions
const userRooms = new Map();

// Store io instance for access from other services
let ioInstance = null;

/**
 * Initialize WebSocket server
 */
const initializeWebSocket = (httpServer) => {
  // Parse CORS_ORIGIN if provided (comma-separated list of origins)
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [];

  // Allowed origins for CORS (same as main server.js)
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...corsOrigins,
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    /\.vercel\.app$/,
    /\.onrender\.com$/, // Support Render.com deployments
  ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check against allowed origins
        const isAllowed = allowedOrigins.some((allowed) => {
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return allowed === origin;
        });

        if (isAllowed) {
          callback(null, true);
        } else if (process.env.NODE_ENV !== 'production') {
          // In development, allow all origins
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      const userId = socket.handshake.auth.userId || socket.handshake.query.userId;

      if (token) {
        // JWT authentication (required in production)
        const jwtSecret = process.env.JWT_SECRET || '';
        if (!jwtSecret) {
          return next(new Error('JWT_SECRET not configured'));
        }
        const decoded = jwt.verify(token, jwtSecret);
        // @ts-ignore - Adding custom property to socket
        socket.userId = decoded.userId || decoded.id;
      } else if (userId && process.env.NODE_ENV !== 'production') {
        // Direct userId ONLY allowed in development/testing
        // SECURITY: This path is disabled in production
        console.warn(`[WS] Development-only auth used for userId: ${userId}`);
        // @ts-ignore - Adding custom property to socket
        socket.userId = userId;
      } else {
        return next(new Error('Authentication required - provide a valid JWT token'));
      }

      // Verify user exists
      // @ts-ignore - userId is set above
      const user = await User.findById(socket.userId).select('_id name isActive');
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // @ts-ignore - Adding custom property to socket
      socket.userName = user.name;
      next();
    } catch (error) {
      next(
        new Error(
          `Authentication failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });

  // Store io instance
  ioInstance = io;

  // Connection handling
  io.on('connection', async (socket) => {
    // @ts-ignore - userId is set in auth middleware
    const userId = socket.userId;
    console.log(`[WS] User ${userId} connected (socket: ${socket.id})`);

    // Track connection
    trackConnection(socket);

    // Set user online
    await onlineStatus.setOnline(userId);

    // Emit online status to user's matches
    broadcastPresenceUpdate(io, userId, true);

    // Load user's active conversations
    await loadUserConversations(socket);

    // ============= Room Management =============

    socket.on('join_room', async (matchId) => {
      await handleJoinRoom(socket, matchId);
    });

    socket.on('leave_room', (matchId) => {
      handleLeaveRoom(socket, matchId);
    });

    // ============= Messaging =============

    socket.on('send_message', async (data) => {
      await handleSendMessage(io, socket, data);
    });

    socket.on('message_read', async (data) => {
      await handleMessageRead(io, socket, data);
    });

    socket.on('mark_all_read', async (matchId) => {
      await handleMarkAllRead(io, socket, matchId);
    });

    // ============= Typing Indicators =============

    socket.on('typing_start', (matchId) => {
      handleTypingIndicator(socket, matchId, true);
    });

    socket.on('typing_stop', (matchId) => {
      handleTypingIndicator(socket, matchId, false);
    });

    // ============= Presence =============

    socket.on('get_online_status', async (userIds, callback) => {
      const statuses = await onlineStatus.getBulkOnlineStatus(userIds);
      if (callback) callback(statuses);
    });

    socket.on('heartbeat', async () => {
      await onlineStatus.setOnline(userId);
    });

    // ============= Notifications =============

    socket.on('subscribe_notifications', () => {
      socket.join(`notifications:${userId}`);
    });

    // ============= Event Room Management =============

    socket.on('join_event_room', async (data) => {
      await handleJoinEventRoom(socket, data);
    });

    socket.on('leave_event_room', (data) => {
      handleLeaveEventRoom(socket, data);
    });

    // ============= Disconnect =============

    socket.on('disconnect', async (reason) => {
      await handleDisconnect(io, socket, reason);
    });

    socket.on('error', (error) => {
      console.error(`[WS] Socket error for user ${userId}:`, error);
    });
  });

  return io;
};

/**
 * Track user connection
 */
const trackConnection = (socket) => {
  const userId = socket.userId;

  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socket.id);
};

/**
 * Load user's active conversations and join rooms
 */
const loadUserConversations = async (socket) => {
  try {
    const userId = socket.userId;

    // Get user's matches
    const matches = await Swipe.find({
      $or: [
        { swiperId: userId, isMatch: true },
        { swipedId: userId, isMatch: true },
      ],
    }).select('_id');

    // Join all match rooms
    matches.forEach((match) => {
      socket.join(match._id.toString());
    });

    // Track rooms for this user
    userRooms.set(
      socket.id,
      matches.map((m) => m._id.toString())
    );

    // Send initial data
    socket.emit('conversations_loaded', {
      matchIds: matches.map((m) => m._id.toString()),
    });
  } catch (error) {
    console.error('[WS] Error loading conversations:', error);
    socket.emit('error', { message: 'Failed to load conversations' });
  }
};

/**
 * Handle joining a specific room
 */
const handleJoinRoom = async (socket, matchId) => {
  try {
    const userId = socket.userId;

    // Validate matchId
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      socket.emit('error', { message: 'Invalid match ID' });
      return;
    }

    // Verify user is part of this match
    const match = await Swipe.findOne({
      _id: matchId,
      $or: [{ swiperId: userId }, { swipedId: userId }],
      isMatch: true,
    });

    if (!match) {
      socket.emit('error', { message: 'Match not found or access denied' });
      return;
    }

    // Join room
    socket.join(matchId);

    // Get recent messages
    const messages = await Message.find({ matchId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'name photos')
      .lean();

    socket.emit('joined_room', {
      matchId,
      messages: messages.reverse(),
    });

    console.log(`[WS] User ${userId} joined room ${matchId}`);
  } catch (error) {
    console.error('[WS] Error joining room:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
};

/**
 * Handle leaving a room
 */
const handleLeaveRoom = (socket, matchId) => {
  socket.leave(matchId);
  console.log(`[WS] User ${socket.userId} left room ${matchId}`);
};

/**
 * Handle sending a message
 */
const handleSendMessage = async (io, socket, data) => {
  try {
    const { matchId, content, type = 'text', mediaUrl, replyTo } = data;
    const senderId = socket.userId;

    // Validate
    if (!matchId || !content) {
      socket.emit('error', { message: 'Missing required fields' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      socket.emit('error', { message: 'Invalid match ID' });
      return;
    }

    // Verify match exists and user is part of it
    const match = await Swipe.findOne({
      _id: matchId,
      $or: [{ swiperId: senderId }, { swipedId: senderId }],
      isMatch: true,
    });

    if (!match) {
      socket.emit('error', { message: 'Match not found' });
      return;
    }

    // Determine receiver
    const receiverId = match.swiperId.toString() === senderId ? match.swipedId : match.swiperId;

    // Create message
    const message = new Message({
      matchId,
      senderId,
      receiverId,
      content,
      type,
      mediaUrl,
      replyTo,
    });

    await message.save();

    // Populate sender info
    await message.populate('senderId', 'name photos');

    const messageData = {
      _id: message._id,
      matchId: message.matchId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      // @ts-ignore - replyTo field exists in Message schema
      replyTo: message.replyTo,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };

    // Emit to all in room
    io.to(matchId).emit('new_message', { message: messageData });

    // Confirm to sender
    socket.emit('message_sent', {
      messageId: message._id,
      timestamp: message.createdAt,
    });

    // Send push notification if receiver is offline
    const receiverOnline = await onlineStatus.isOnline(receiverId);
    if (!receiverOnline) {
      // Queue push notification
      const QueueService = require('../../infrastructure/queues/QueueService');
      await QueueService.sendPushNotification(
        receiverId,
        `New message from ${socket.userName}`,
        content.length > 50 ? `${content.substring(0, 50)}...` : content,
        { type: 'message', matchId, senderId }
      );
    }

    // Clear typing indicator
    socket.to(matchId).emit('user_typing', {
      userId: senderId,
      isTyping: false,
    });
  } catch (error) {
    console.error('[WS] Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

/**
 * Handle message read receipt
 */
const handleMessageRead = async (io, socket, data) => {
  try {
    const { messageId, matchId } = data;
    const userId = socket.userId;

    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (message) {
      io.to(matchId).emit('message_read_receipt', {
        messageId: message._id,
        readBy: userId,
        readAt: message.readAt,
      });
    }
  } catch (error) {
    console.error('[WS] Error marking message read:', error);
  }
};

/**
 * Handle marking all messages as read
 */
const handleMarkAllRead = async (io, socket, matchId) => {
  try {
    const userId = socket.userId;

    const result = await Message.updateMany(
      {
        matchId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    if (result.modifiedCount > 0) {
      io.to(matchId).emit('all_messages_read', {
        matchId,
        readBy: userId,
        count: result.modifiedCount,
      });
    }
  } catch (error) {
    console.error('[WS] Error marking all messages read:', error);
  }
};

/**
 * Handle typing indicator
 */
const handleTypingIndicator = (socket, matchId, isTyping) => {
  socket.to(matchId).emit('user_typing', {
    userId: socket.userId,
    isTyping,
    matchId,
  });

  // Auto-clear typing after 10 seconds
  if (isTyping) {
    setTimeout(() => {
      socket.to(matchId).emit('user_typing', {
        userId: socket.userId,
        isTyping: false,
        matchId,
      });
    }, 10000);
  }
};

/**
 * Handle user disconnect
 */
const handleDisconnect = async (io, socket, reason) => {
  const userId = socket.userId;
  console.log(`[WS] User ${userId} disconnected (reason: ${reason})`);

  // Remove from connected users
  const userSockets = connectedUsers.get(userId);
  if (userSockets) {
    userSockets.delete(socket.id);

    // If no more connections, set offline
    if (userSockets.size === 0) {
      connectedUsers.delete(userId);
      await onlineStatus.setOffline(userId);

      // Update last active
      await User.updateOne({ _id: userId }, { $set: { lastActive: new Date() } });

      // Broadcast offline status
      broadcastPresenceUpdate(io, userId, false);
    }
  }

  // Clean up room subscriptions
  userRooms.delete(socket.id);
};

/**
 * Broadcast presence update to user's matches
 */
const broadcastPresenceUpdate = async (io, userId, isOnline) => {
  try {
    // Get user's matches
    const matches = await Swipe.find({
      $or: [
        { swiperId: userId, isMatch: true },
        { swipedId: userId, isMatch: true },
      ],
    });

    // Notify each matched user
    for (const match of matches) {
      const otherUserId =
        match.swiperId.toString() === userId
          ? match.swipedId.toString()
          : match.swiperId.toString();

      io.to(`notifications:${otherUserId}`).emit('presence_update', {
        userId,
        isOnline,
        lastSeen: isOnline ? null : new Date(),
      });
    }
  } catch (error) {
    console.error('[WS] Error broadcasting presence:', error);
  }
};

/**
 * Send notification to specific user
 */
const sendNotification = (io, userId, notification) => {
  io.to(`notifications:${userId}`).emit('notification', notification);
};

/**
 * Get connected user count
 */
const getConnectedUserCount = () => connectedUsers.size;

/**
 * Check if user is connected
 */
const isUserConnected = (userId) => connectedUsers.has(userId);

/**
 * Handle joining an event room
 */
const handleJoinEventRoom = async (socket, data) => {
  try {
    const { eventId } = data;
    const userId = socket.userId;

    if (!eventId) {
      socket.emit('error', { message: 'Event ID is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      socket.emit('error', { message: 'Invalid event ID format' });
      return;
    }

    // Verify event exists and user can access it
    const Event = require('../domain/Event');
    const event = await Event.findById(eventId);

    if (!event) {
      socket.emit('error', { message: 'Event not found' });
      return;
    }

    // Check if user can access event (basic check - can be enhanced)
    if (event.visibility === 'private' && event.organizerId.toString() !== userId) {
      socket.emit('error', { message: 'Access denied to this event' });
      return;
    }

    // Join event room
    socket.join(`event:${eventId}`);

    // Track room subscription
    if (!userRooms.has(socket.id)) {
      userRooms.set(socket.id, []);
    }
    const rooms = userRooms.get(socket.id);
    if (!rooms.includes(`event:${eventId}`)) {
      rooms.push(`event:${eventId}`);
    }

    socket.emit('joined_event_room', {
      eventId,
      message: 'Successfully subscribed to event updates',
    });

    console.log(`[WS] User ${userId} joined event room ${eventId}`);
  } catch (error) {
    console.error('[WS] Error joining event room:', error);
    socket.emit('error', { message: 'Failed to join event room' });
  }
};

/**
 * Handle leaving an event room
 */
const handleLeaveEventRoom = (socket, data) => {
  try {
    const { eventId } = data;
    const userId = socket.userId;

    if (!eventId) {
      socket.emit('error', { message: 'Event ID is required' });
      return;
    }

    socket.leave(`event:${eventId}`);

    // Remove from tracked rooms
    const rooms = userRooms.get(socket.id);
    if (rooms) {
      const index = rooms.indexOf(`event:${eventId}`);
      if (index > -1) {
        rooms.splice(index, 1);
      }
    }

    socket.emit('left_event_room', {
      eventId,
      message: 'Successfully unsubscribed from event updates',
    });

    console.log(`[WS] User ${userId} left event room ${eventId}`);
  } catch (error) {
    console.error('[WS] Error leaving event room:', error);
    socket.emit('error', { message: 'Failed to leave event room' });
  }
};

/**
 * Emit event update to all users in event room
 * @param {string} eventId - Event ID
 * @param {string} eventType - Event type (user_joined, user_left, capacity_updated, status_changed)
 * @param {Object} data - Event data
 */
const emitEventUpdate = (eventId, eventType, data) => {
  if (!ioInstance) {
    console.warn('[WS] Cannot emit event update: Socket.io not initialized');
    return;
  }

  try {
    ioInstance.to(`event:${eventId}`).emit(`event:${eventType}`, {
      eventId,
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[WS] Error emitting event update:', error);
  }
};

/**
 * Get Socket.io instance (for use in other services)
 * @returns {Server|null} Socket.io server instance
 */
const getIO = () => ioInstance;

module.exports = {
  initializeWebSocket,
  sendNotification,
  getConnectedUserCount,
  isUserConnected,
  emitEventUpdate,
  getIO,
};
