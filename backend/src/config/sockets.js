const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { wsRateLimiter } = require('../api/middleware/rateLimiter');
const User = require('../core/domain/User');
const Swipe = require('../core/domain/Swipe');
const Message = require('../core/domain/Message');
const { logger } = require('../infrastructure/external/LoggingService');

// HTML entity escaping to prevent stored XSS in chat messages
function sanitizeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const initializeSocket = (server, isOriginAllowed) => {
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

      // In production, require JWT token - no direct userId allowed
      if (process.env.NODE_ENV === 'production') {
        if (!token) {
          logger.warn('Socket.io connection rejected: No token in production', {
            ip: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'],
          });
          return next(
            new Error('Authentication required - JWT token must be provided in production')
          );
        }

        // JWT authentication (required in production)
        const jwtProd = require('jsonwebtoken');
        const jwtSecretProd = process.env.JWT_SECRET || '';
        if (!jwtSecretProd) {
          logger.error('JWT_SECRET not configured for Socket.io authentication');
          return next(new Error('JWT_SECRET not configured'));
        }

        try {
          const decoded = /** @type {any} */ (jwtProd.verify(token, jwtSecretProd));
          /** @type {any} */ (socket).userId = decoded.userId || decoded.id;
        } catch (/** @type {any} */ jwtError) {
          logger.warn('Socket.io JWT verification failed', {
            error: jwtError instanceof Error ? jwtError.message : String(jwtError),
            ip: socket.handshake.address,
          });
          return next(new Error('Invalid or expired token'));
        }
      } else {
        // Development mode: Allow JWT or direct userId (with warning)
        if (token) {
          // JWT authentication (preferred)
          const jwtDev = require('jsonwebtoken');
          const jwtSecretDev = process.env.JWT_SECRET || '';
          if (!jwtSecretDev) {
            return next(new Error('JWT_SECRET not configured'));
          }
          try {
            const decoded = /** @type {any} */ (jwtDev.verify(token, jwtSecretDev));
            /** @type {any} */ (socket).userId = decoded.userId || decoded.id;
          } catch (/** @type {any} */ jwtError) {
            // Fall through to userId check if JWT fails in dev
            logger.debug('JWT verification failed in dev mode, falling back to userId');
          }
        }

        // Development fallback: direct userId (with strict validation)
        if (!(/** @type {any} */ (socket).userId) && userId) {
          if (!mongoose.Types.ObjectId.isValid(userId)) {
            return next(new Error('Invalid user ID format'));
          }
          logger.warn('[DEV ONLY] Using userId from query - NOT ALLOWED IN PRODUCTION', {
            userId,
            ip: socket.handshake.address,
          });
          /** @type {any} */ (socket).userId = userId;
        }

        if (!(/** @type {any} */ (socket).userId)) {
          return next(new Error('Authentication required - provide token or userId (dev only)'));
        }
      }

      // Verify user exists and is active
      const user = await User.findById(/** @type {any} */ (socket).userId).select(
        '_id name isActive'
      );
      if (!user) {
        logger.warn('Socket.io connection rejected: User not found', {
          userId: /** @type {any} */ (socket).userId,
          ip: socket.handshake.address,
        });
        return next(new Error('User not found'));
      }

      if (!user.isActive) {
        logger.warn('Socket.io connection rejected: User inactive', {
          userId: /** @type {any} */ (socket).userId,
          ip: socket.handshake.address,
        });
        return next(new Error('User account is inactive'));
      }

      next();
    } catch (/** @type {any} */ error) {
      logger.error('Socket.io authentication error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ip: socket.handshake.address,
      });
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
    logger.info('WebSocket user connected', {
      userId,
      socketId: socket.id,
      ip: socket.handshake.address,
    });

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
    socket.on('join_room', async (matchId) => {
      try {
        // Rate limit join_room events
        const joinLimit = await wsRateLimiter.checkLimit(
          userId,
          'join_room',
          wsRateLimiter.limits.join_room
        );
        if (!joinLimit.allowed) {
          socket.emit('error', { message: 'Too many room join requests. Please slow down.' });
          return;
        }

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

        // Verify the authenticated user is a participant in the match
        const Match = require('../core/domain/Match');
        const match = await Match.findById(matchId);
        if (!match) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }
        const isParticipant = match.users.some(u => u.toString() === userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'Unauthorized' });
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
        logger.debug('WebSocket user joined room', {
          userId,
          matchId,
          socketId: socket.id,
        });

        socket.emit('joined_room', { matchId });
      } catch (/** @type {any} */ error) {
        logger.error('WebSocket error joining room', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId,
          matchId,
        });
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { matchId, content, type = 'text' } = data;
        const senderId = extSocket.userId;

        // Rate limit WebSocket send_message events
        const wsLimit = await wsRateLimiter.checkLimit(
          senderId,
          'send_message',
          wsRateLimiter.limits.send_message
        );
        if (!wsLimit.allowed) {
          socket.emit('error', { message: 'Too many messages. Please slow down.' });
          return;
        }

        // Validate input - comprehensive validation
        if (!matchId || !content || !senderId) {
          logger.warn('Socket.io send_message: Missing required fields', {
            userId: senderId,
            hasMatchId: !!matchId,
            hasContent: !!content,
          });
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Validate matchId format
        if (!mongoose.Types.ObjectId.isValid(matchId)) {
          logger.warn('Socket.io send_message: Invalid matchId format', {
            userId: senderId,
            matchId,
          });
          socket.emit('error', { message: 'Invalid match ID format' });
          return;
        }

        // Validate senderId format
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
          logger.warn('Socket.io send_message: Invalid senderId format', {
            userId: senderId,
          });
          socket.emit('error', { message: 'Invalid user ID format' });
          return;
        }

        // Validate content type and length
        if (typeof content !== 'string') {
          logger.warn('Socket.io send_message: Invalid content type', {
            userId: senderId,
            contentType: typeof content,
          });
          socket.emit('error', { message: 'Content must be a string' });
          return;
        }

        // Validate content length (max 1000 characters)
        if (content.length === 0) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }

        if (content.length > 1000) {
          logger.warn('Socket.io send_message: Content too long', {
            userId: senderId,
            length: content.length,
          });
          socket.emit('error', { message: 'Message content too long (max 1000 characters)' });
          return;
        }

        // Validate message type
        const allowedTypes = ['text', 'image', 'video', 'audio'];
        if (!allowedTypes.includes(type)) {
          logger.warn('Socket.io send_message: Invalid message type', {
            userId: senderId,
            type,
          });
          socket.emit('error', {
            message: `Invalid message type. Allowed: ${allowedTypes.join(', ')}`,
          });
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

        // Sanitize content to prevent stored XSS
        const sanitizedContent = sanitizeHtml(content);

        // Create and save message
        const message = new Message({
          matchId,
          senderId,
          receiverId,
          content: sanitizedContent,
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
            logger.debug('Message notification sent', {
              senderId,
              senderName,
              receiverId,
              messagePreview,
              matchId,
            });
            // In production, send via Expo push notification service
          }
        } catch (/** @type {any} */ notifError) {
          logger.error('Error sending message notification', {
            error: notifError instanceof Error ? notifError.message : String(notifError),
            stack: notifError instanceof Error ? notifError.stack : undefined,
            receiverId,
            senderId,
            matchId,
          });
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
      } catch (/** @type {any} */ error) {
        logger.error('WebSocket error sending message', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: extSocket.userId,
          matchId: data?.matchId,
        });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle read receipts
    socket.on('message_read', async (data) => {
      try {
        const { messageId: readMessageId, matchId: readMatchId } = data;
        const readUserId = extSocket.userId;

        // Verify the user is a participant of the match before marking messages as read
        const readMatch = await Swipe.findOne({
          _id: readMatchId,
          $or: [{ swiperId: readUserId }, { swipedId: readUserId }],
          action: 'like',
        });

        if (!readMatch) {
          socket.emit('error', { message: 'Match not found or access denied' });
          return;
        }

        // Update message as read in database
        const message = await Message.findOneAndUpdate(
          {
            _id: readMessageId,
            receiverId: readUserId,
          },
          {
            isRead: true,
            readAt: new Date(),
          },
          { new: true } // Return updated document
        );

        if (message) {
          // Emit read receipt to the sender
          io.to(readMatchId).emit('message_read_receipt', {
            messageId: message._id,
            readBy: readUserId,
            readAt: message.readAt,
          });
        }
      } catch (/** @type {any} */ error) {
        logger.error('WebSocket error handling message_read', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: extSocket.userId,
          messageId: data?.messageId,
          matchId: data?.matchId,
        });
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
      logger.info('WebSocket user disconnected', {
        userId,
        reason,
        socketId: socket.id,
      });

      // Remove from connected users
      if (connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id);
        if (connectedUsers.get(userId).size === 0) {
          connectedUsers.delete(userId);
          // User has no more connections - they're fully offline
          logger.debug('WebSocket user fully offline', {
            userId,
          });
        }
      }
    });

    // ===== ERROR HANDLER =====
    socket.on('error', (error) => {
      logger.error('WebSocket socket error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        socketId: socket.id,
      });
    });
  });

  return io;
};

module.exports = { initializeSocket };
