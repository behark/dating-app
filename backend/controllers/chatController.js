const Message = require('../models/Message');
const Swipe = require('../models/Swipe');
const { encryptMessage, decryptMessage, generateConversationKey } = require('../utils/encryption');

// Get all messages for a specific match
const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.id; // From auth middleware
    const { page = 1, limit = 50, decrypt: shouldDecrypt = 'true' } = req.query;

    // Validate matchId
    if (!matchId || !require('mongoose').Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match ID'
      });
    }

    // Verify user has access to this match
    if (userId) {
      const match = await Swipe.findOne({
        _id: matchId,
        $or: [
          { swiperId: userId },
          { swipedId: userId }
        ],
        action: 'like'
      });

      if (!match) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this conversation'
        });
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages with pagination
    let messages = await Message.getMessagesForMatch(
      matchId,
      parseInt(limit),
      skip
    );

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
        const otherUserId = match.swiperId.toString() === userId 
          ? match.swipedId.toString() 
          : match.swiperId.toString();
        const conversationKey = generateConversationKey(userId, otherUserId);
        
        messages = messages.map(msg => {
          if (msg.isEncrypted && msg.content) {
            try {
              return {
                ...msg,
                content: decryptMessage(msg.content, conversationKey),
                _decrypted: true
              };
            } catch (e) {
              return { ...msg, _decryptionFailed: true };
            }
          }
          return msg;
        });
      }
    }

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order (oldest first)
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all matches/conversations for a user
const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find all matches for this user
    const matches = await Swipe.find({
      $or: [
        { swiperId: userId },
        { swipedId: userId }
      ],
      action: 'like'
    })
    .populate('swiperId', 'name photos lastActive')
    .populate('swipedId', 'name photos lastActive')
    .sort({ createdAt: -1 });

    // For each match, get the latest message and unread count
    const conversations = await Promise.all(
      matches.map(async (match) => {
        const latestMessage = await Message.findOne({ matchId: match._id })
          .populate('senderId', 'name photos')
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          matchId: match._id,
          receiverId: userId,
          isRead: false
        });

        // Determine the other user in the conversation
        const otherUser = match.swiperId._id.toString() === userId
          ? match.swipedId
          : match.swiperId;

        return {
          matchId: match._id,
          otherUser: {
            _id: otherUser._id,
            name: otherUser.name,
            photos: otherUser.photos,
            lastActive: otherUser.lastActive
          },
          latestMessage: latestMessage ? {
            content: latestMessage.content,
            type: latestMessage.type,
            createdAt: latestMessage.createdAt,
            senderId: latestMessage.senderId
          } : null,
          unreadCount,
          matchDate: match.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        conversations,
        count: conversations.length
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark messages as read for a match
const markAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate matchId
    if (!matchId || !require('mongoose').Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match ID'
      });
    }

    // Verify user has access to this match
    const match = await Swipe.findOne({
      _id: matchId,
      $or: [
        { swiperId: userId },
        { swipedId: userId }
      ],
      action: 'like'
    });

    if (!match) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    // Mark messages as read
    const result = await Message.markMatchAsRead(matchId, userId);

    res.json({
      success: true,
      data: {
        markedAsRead: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get unread messages count for user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const unreadCount = await Message.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete a message (soft delete by marking as deleted)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied'
      });
    }

    // For now, we'll actually delete the message
    // In production, you might want to implement soft delete
    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark a specific message as read with timestamp
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!messageId || !require('mongoose').Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      receiverId: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied'
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
        readAt: message.readAt
      }
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get read receipts for messages in a conversation
const getReadReceipts = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!matchId || !require('mongoose').Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match ID'
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
        messages
      }
    });

  } catch (error) {
    console.error('Get read receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send an encrypted message
const sendEncryptedMessage = async (req, res) => {
  try {
    const { matchId, content, type = 'text' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!matchId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Match ID and content are required'
      });
    }

    // Verify user has access to this match
    const match = await Swipe.findOne({
      _id: matchId,
      $or: [
        { swiperId: userId },
        { swipedId: userId }
      ],
      action: 'like'
    });

    if (!match) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    // Determine recipient
    const receiverId = match.swiperId.toString() === userId 
      ? match.swipedId 
      : match.swiperId;

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
        keyVersion: 1
      }
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
          createdAt: message.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Send encrypted message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
  sendEncryptedMessage
};