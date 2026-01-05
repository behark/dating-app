const Message = require('../models/Message');
const Swipe = require('../models/Swipe');
const { ERROR_MESSAGES } = require('../constants/messages');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');
const { encryptMessage, decryptMessage, generateConversationKey } = require('../utils/encryption');

// Get all messages for a specific match
const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.id; // From auth middleware
    const { page = 1, limit = 50, decrypt: shouldDecrypt = 'true' } = req.query;

    // Validate matchId
    if (!matchId || !require('mongoose').Types.ObjectId.isValid(matchId)) {
      return sendError(res, 400, {
        message: 'Invalid match ID',
        error: 'VALIDATION_ERROR',
      });
    }

    // Verify user has access to this match (TD-004: added .lean() for read-only query)
    if (userId) {
      const match = await Swipe.findOne({
        _id: matchId,
        $or: [{ swiperId: userId }, { swipedId: userId }],
        action: 'like',
      }).lean();

      if (!match) {
        return sendForbidden(res, ERROR_MESSAGES.ACCESS_DENIED_CONVERSATION);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages with pagination
    let messages = await Message.getMessagesForMatch(matchId, parseInt(limit), skip);

    // Get total count for pagination info
    const totalMessages = await Message.countDocuments({ matchId });

    // Mark messages as read for the current user
    if (userId) {
      await Message.markMatchAsRead(matchId, userId);
    }

    // Decrypt messages if requested and if they are encrypted
    if (shouldDecrypt === 'true' && userId) {
      const match = await Swipe.findById(matchId);
      if (match) {
        const otherUserId =
          match.swiperId.toString() === userId
            ? match.swipedId.toString()
            : match.swiperId.toString();
        const conversationKey = generateConversationKey(userId, otherUserId);

        // @ts-ignore - Type mismatch after mapping with decrypted content
        messages = messages.map((msg) => {
          if (msg.isEncrypted && msg.content) {
            try {
              return {
                ...msg,
                content: decryptMessage(msg.content, conversationKey),
                _decrypted: true,
              };
            } catch (e) {
              return { ...msg, _decryptionFailed: true };
            }
          }
          return msg;
        });
      }
    }

    return sendSuccess(res, 200, {
      message: 'Messages retrieved successfully',
      data: {
        messages: messages.reverse(), // Return in chronological order (oldest first)
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return sendError(res, 500, {
      message: 'Internal server error',
      error: 'INTERNAL_ERROR',
    });
  }
};

// Get all matches/conversations for a user
// TD-004: Optimized with aggregation pipeline to eliminate N+1 query pattern
const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userObjectId = require('mongoose').Types.ObjectId.createFromHexString(userId);

    if (!userId) {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Optimized: Single aggregation pipeline instead of N+1 queries
    const conversations = await Swipe.aggregate([
      // Stage 1: Find all matches for this user
      {
        $match: {
          $or: [{ swiperId: userObjectId }, { swipedId: userObjectId }],
          action: 'like',
        },
      },
      // Stage 2: Sort by creation date
      { $sort: { createdAt: -1 } },
      // Stage 3: Lookup the other user's details
      {
        $lookup: {
          from: 'users',
          let: {
            otherUserId: {
              $cond: {
                if: { $eq: ['$swiperId', userObjectId] },
                then: '$swipedId',
                else: '$swiperId',
              },
            },
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$otherUserId'] } } },
            { $project: { name: 1, photos: { $slice: ['$photos', 3] }, lastActive: 1 } },
          ],
          as: 'otherUserData',
        },
      },
      { $unwind: '$otherUserData' },
      // Stage 4: Lookup latest message for each match
      {
        $lookup: {
          from: 'messages',
          let: { matchId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$matchId', '$$matchId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { content: 1, type: 1, createdAt: 1, senderId: 1 } },
          ],
          as: 'latestMessageData',
        },
      },
      // Stage 5: Lookup unread count
      {
        $lookup: {
          from: 'messages',
          let: { matchId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$matchId', '$$matchId'] },
                    { $eq: ['$receiverId', userObjectId] },
                    { $eq: ['$isRead', false] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'unreadData',
        },
      },
      // Stage 6: Project final shape
      {
        $project: {
          matchId: '$_id',
          otherUser: {
            _id: '$otherUserData._id',
            name: '$otherUserData.name',
            photos: '$otherUserData.photos',
            lastActive: '$otherUserData.lastActive',
          },
          latestMessage: {
            $cond: {
              if: { $gt: [{ $size: '$latestMessageData' }, 0] },
              then: { $arrayElemAt: ['$latestMessageData', 0] },
              else: null,
            },
          },
          unreadCount: {
            $cond: {
              if: { $gt: [{ $size: '$unreadData' }, 0] },
              then: { $arrayElemAt: ['$unreadData.count', 0] },
              else: 0,
            },
          },
          matchDate: '$createdAt',
        },
      },
    ]);

    return sendSuccess(res, 200, {
      message: 'Conversations retrieved successfully',
      data: {
        conversations,
        count: conversations.length,
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return sendError(res, 500, {
      message: 'Internal server error',
      error: 'INTERNAL_ERROR',
    });
  }
};

// Mark messages as read for a match
const markAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // Validate matchId
    if (!matchId || !require('mongoose').Types.ObjectId.isValid(matchId)) {
      return sendError(res, 400, {
        message: 'Invalid match ID',
        error: 'VALIDATION_ERROR',
      });
    }

    // Verify user has access to this match (use .lean() for read-only query)
    const match = await Swipe.findOne({
      _id: matchId,
      $or: [{ swiperId: userId }, { swipedId: userId }],
      action: 'like',
    }).lean();

    if (!match) {
      return sendForbidden(res, ERROR_MESSAGES.ACCESS_DENIED_CONVERSATION);
    }

    // Mark messages as read
    const result = await Message.markMatchAsRead(matchId, userId);

    return sendSuccess(res, 200, {
      message: 'Messages marked as read',
      data: {
        markedAsRead: result.modifiedCount || 0,
      },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return sendError(res, 500, {
      message: 'Internal server error',
      error: 'INTERNAL_ERROR',
    });
  }
};

// Get unread messages count for user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const unreadCount = await Message.getUnreadCount(userId);

    return sendSuccess(res, 200, {
      message: 'Unread count retrieved successfully',
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return sendError(res, 500, {
      message: 'Internal server error',
      error: 'INTERNAL_ERROR',
    });
  }
};

// Delete a message (soft delete by marking as deleted)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Find and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied',
      });
    }

    // For now, we'll actually delete the message
    // In production, you might want to implement soft delete
    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Mark a specific message as read with timestamp
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendUnauthorized(res, 'Authentication required');
    }

    if (!messageId || !require('mongoose').Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID',
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      receiverId: userId,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied',
      });
    }

    // Mark as read with timestamp
    const readTimestamp = new Date();
    await message.markAsRead(readTimestamp);

    res.json({
      success: true,
      data: {
        messageId: message._id,
        isRead: message.isRead,
        readAt: message.readAt,
      },
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get read receipts for messages in a conversation
const getReadReceipts = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendUnauthorized(res, 'Authentication required');
    }

    if (!matchId || !require('mongoose').Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match ID',
      });
    }

    // Get all messages in the conversation with read status
    const messages = await Message.find({ matchId })
      .select('_id senderId receiverId isRead readAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        messages,
      },
    });
  } catch (error) {
    console.error('Get read receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Send an encrypted message
const sendEncryptedMessage = async (req, res) => {
  try {
    const { matchId, content, type = 'text' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendUnauthorized(res, 'Authentication required');
    }

    if (!matchId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Match ID and content are required',
      });
    }

    // Verify user has access to this match
    const match = await Swipe.findOne({
      _id: matchId,
      $or: [{ swiperId: userId }, { swipedId: userId }],
      action: 'like',
    });

    if (!match) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation',
      });
    }

    // Determine recipient
    const receiverId = match.swiperId.toString() === userId ? match.swipedId : match.swiperId;

    // Generate conversation key and encrypt message
    const conversationKey = generateConversationKey(userId, receiverId.toString());
    const encryptedContent = encryptMessage(content, conversationKey);

    // Create encrypted message
    const message = new Message({
      matchId,
      senderId: userId,
      receiverId,
      content: encryptedContent,
      type,
      isEncrypted: true,
      encryptionMetadata: {
        algorithm: 'aes-256-gcm',
        keyVersion: 1,
      },
    });

    await message.save();

    res.status(201).json({
      success: true,
      data: {
        message: {
          _id: message._id,
          matchId: message.matchId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: content, // Return decrypted for sender
          type: message.type,
          isEncrypted: true,
          createdAt: message.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Send encrypted message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getMessages,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  markMessageAsRead,
  getReadReceipts,
  sendEncryptedMessage,
};
