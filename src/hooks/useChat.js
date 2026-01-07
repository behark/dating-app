import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '../utils/logger';
import { useSocket } from './useSocket';

/**
 * Custom hook for chat-specific socket functionality
 * Handles all chat-related socket events and operations
 */
export const useChat = (matchId) => {
  const { socket, isConnected, emit, on, off, emitWithAck } = useSocket();
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  /**
   * Join a chat room
   */
  const joinChatRoom = useCallback(() => {
    if (!matchId || !isConnected) return;

    logger.info('[useChat] Joining chat room:', matchId);
    emit('join_room', matchId);
  }, [matchId, isConnected, emit]);

  /**
   * Leave a chat room
   */
  const leaveChatRoom = useCallback(() => {
    if (!matchId || !isConnected) return;

    logger.info('[useChat] Leaving chat room:', matchId);
    emit('leave_room', matchId);
  }, [matchId, isConnected, emit]);

  /**
   * Send a message
   * @param {object} messageData - Message data { matchId, senderId, content, type }
   * @returns {Promise} Promise that resolves with sent message
   */
  const sendMessage = useCallback(
    async (messageData) => {
      try {
        logger.info('[useChat] Sending message:', messageData);

        if (!isConnected) {
          throw new Error('Not connected to socket server');
        }

        const response = await emitWithAck('send_message', {
          matchId: matchId || messageData.matchId,
          senderId: messageData.senderId,
          content: messageData.content,
          type: messageData.type || 'text',
          metadata: messageData.metadata,
        });

        logger.info('[useChat] Message sent successfully:', response);
        return response;
      } catch (error) {
        logger.error('[useChat] Failed to send message:', error);
        throw error;
      }
    },
    [matchId, isConnected, emitWithAck]
  );

  /**
   * Send typing indicator
   * @param {string} userId - User ID who is typing
   */
  const sendTypingIndicator = useCallback(
    (userId) => {
      if (!matchId || !isConnected) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing event
      emit('typing', { matchId, userId });
      setIsUserTyping(true);

      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(userId);
      }, 3000);
    },
    [matchId, isConnected, emit]
  );

  /**
   * Stop typing indicator
   * @param {string} userId - User ID who stopped typing
   */
  const stopTyping = useCallback(
    (userId) => {
      if (!matchId || !isConnected) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      emit('stop_typing', { matchId, userId });
      setIsUserTyping(false);
    },
    [matchId, isConnected, emit]
  );

  /**
   * Mark messages as read
   * @param {array} messageIds - Array of message IDs to mark as read
   */
  const markMessagesAsRead = useCallback(
    (messageIds) => {
      if (!matchId || !isConnected) return;

      logger.info('[useChat] Marking messages as read:', messageIds);
      emit('mark_read', { matchId, messageIds });
    },
    [matchId, isConnected, emit]
  );

  /**
   * Send read receipt
   * @param {string} messageId - Message ID to send receipt for
   */
  const sendReadReceipt = useCallback(
    (messageId) => {
      if (!matchId || !isConnected) return;

      emit('read_receipt', { matchId, messageId });
    },
    [matchId, isConnected, emit]
  );

  /**
   * Handle incoming new message
   */
  useEffect(() => {
    if (!socket || !matchId) return;

    const handleNewMessage = (message) => {
      logger.info('[useChat] Received new message:', message);

      // Only add if it's for this chat
      if (message.matchId === matchId || message.match === matchId) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    return on('new_message', handleNewMessage);
  }, [socket, matchId, on]);

  /**
   * Handle typing indicator
   */
  useEffect(() => {
    if (!socket || !matchId) return;

    const handleTyping = ({ userId, matchId: typingMatchId }) => {
      if (typingMatchId === matchId) {
        logger.debug('[useChat] User typing:', userId);
        setTyping((prev) => ({ ...prev, [userId]: true }));

        // Clear typing after 3 seconds
        setTimeout(() => {
          setTyping((prev) => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
        }, 3000);
      }
    };

    const handleStopTyping = ({ userId, matchId: typingMatchId }) => {
      if (typingMatchId === matchId) {
        logger.debug('[useChat] User stopped typing:', userId);
        setTyping((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    };

    const unsubscribeTyping = on('typing', handleTyping);
    const unsubscribeStopTyping = on('stop_typing', handleStopTyping);

    return () => {
      unsubscribeTyping();
      unsubscribeStopTyping();
    };
  }, [socket, matchId, on]);

  /**
   * Handle user online/offline status
   */
  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = (userId) => {
      logger.debug('[useChat] User online:', userId);
      setOnlineUsers((prev) => new Set([...prev, userId]));
    };

    const handleUserOffline = (userId) => {
      logger.debug('[useChat] User offline:', userId);
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    const unsubscribeOnline = on('user_online', handleUserOnline);
    const unsubscribeOffline = on('user_offline', handleUserOffline);

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, [socket, on]);

  /**
   * Handle message read receipts
   */
  useEffect(() => {
    if (!socket || !matchId) return;

    const handleMessageRead = ({ messageId, readBy }) => {
      logger.debug('[useChat] Message read:', { messageId, readBy });

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, readBy: [...(msg.readBy || []), readBy] } : msg
        )
      );
    };

    return on('message_read', handleMessageRead);
  }, [socket, matchId, on]);

  /**
   * Handle message delivery receipts
   */
  useEffect(() => {
    if (!socket || !matchId) return;

    const handleMessageDelivered = ({ messageId }) => {
      logger.debug('[useChat] Message delivered:', messageId);

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: 'delivered', deliveredAt: new Date() } : msg
        )
      );
    };

    return on('message_delivered', handleMessageDelivered);
  }, [socket, matchId, on]);

  /**
   * Auto-join room when connected and matchId is available
   */
  useEffect(() => {
    if (matchId && isConnected) {
      joinChatRoom();
    }

    return () => {
      if (matchId && isConnected) {
        leaveChatRoom();
      }
    };
  }, [matchId, isConnected, joinChatRoom, leaveChatRoom]);

  /**
   * Clear typing timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    messages,
    typing,
    onlineUsers,
    isUserTyping,
    isConnected,

    // Actions
    sendMessage,
    sendTypingIndicator,
    stopTyping,
    markMessagesAsRead,
    sendReadReceipt,
    joinChatRoom,
    leaveChatRoom,

    // Utils
    setMessages, // Allow external message updates (e.g., from API fetch)
  };
};

export { useChat as useMatchChat };
export default useChat;
