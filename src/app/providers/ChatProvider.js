import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// io import removed - using SocketContext
import { SOCKET_URL } from '../../config/api';
import api from '../../services/api';
import logger from '../../utils/logger';
import { getUserFriendlyMessage } from '../../utils/errorMessages';
import { sanitizeString } from '../../utils/sanitize';
import OfflineService from '../../services/OfflineService';
import { useSocketContext } from './SocketProvider';
import { useAuth } from './AuthProvider';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  // Use SocketContext for connection management
  const { socket, isConnected, connect, error: connectionError } = useSocketContext();

  const [conversations, setConversations] = useState([]);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false); // UI state, logic handled by SocketContext

  // Refs to store latest values for use in event handlers
  const conversationsRef = useRef(conversations);
  const messagesRef = useRef(messages);
  const currentMatchIdRef = useRef(currentMatchId);
  const markAsReadRef = useRef(async () => {});
  const loadMessagesFromStorageRef = useRef(async () => null);

  // Queue for messages sent during disconnection
  const messageQueueRef = useRef([]);

  // Persist messages to AsyncStorage
  const persistMessagesToStorage = useCallback(async (matchId, messages) => {
    try {
      const key = `@messages_${matchId}`;
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          matchId,
          messages,
          lastUpdated: Date.now(),
        })
      );
    } catch (error) {
      logger.error('Error persisting messages to storage', error);
    }
  }, []);

  // Update refs when state changes
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentMatchIdRef.current = currentMatchId;
  }, [currentMatchId]);

  // Connect to socket when user logs in
  useEffect(() => {
    const userId = currentUser?.uid || currentUser?._id;
    if (userId) {
      connect(userId);
    }
  }, [currentUser?.uid, currentUser?._id, connect]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Flush queued messages when connected
    if (isConnected && messageQueueRef.current.length > 0) {
      logger.info(`Flushing ${messageQueueRef.current.length} queued messages`);
      messageQueueRef.current.forEach((msg) => {
        socket.emit('send_message', msg);
      });
      messageQueueRef.current = [];
    }

    // Rejoin current room if we were in one
    if (isConnected && currentMatchIdRef.current) {
      socket.emit('join_room', currentMatchIdRef.current);
    }

    const handleNewMessage = async (data) => {
      const { message } = data;

      // Add message to current conversation if it's for the active match
      if (currentMatchIdRef.current === message.matchId.toString()) {
        setMessages((prevMessages) => {
          // Check if message already exists (to prevent duplicates)
          const exists = prevMessages.some((m) => m._id === message._id);
          if (!exists) {
            const newMessages = [...prevMessages, message];
            // Persist updated messages to storage
            persistMessagesToStorage(message.matchId, newMessages).catch((err) => {
              logger.error('Error persisting new message', err);
            });
            return newMessages;
          }
          return prevMessages;
        });
      }

      // Update conversations list
      setConversations((prevConversations) => {
        return prevConversations.map((conv) => {
          if (conv.matchId === message.matchId) {
            return {
              ...conv,
              latestMessage: {
                content: message.content,
                type: message.type,
                createdAt: message.createdAt,
                senderId: message.senderId,
                imageUrl: message.imageUrl,
              },
              unreadCount: conv.matchId === currentMatchIdRef.current ? 0 : conv.unreadCount + 1,
            };
          }
          return conv;
        });
      });

      // Update total unread count
      setUnreadCount((prev) => prev + 1);
    };

    const handleReadReceipt = (data) => {
      const { messageId, readBy, readAt } = data;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, isRead: true, readAt, readBy } : msg
        )
      );
    };

    const handleUserTyping = (data) => {
      const userId = currentUser?.uid || currentUser?._id;
      if (data.userId !== userId) {
        setOtherUserTyping(data.isTyping);
      }
    };

    // Attach listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_read_receipt', handleReadReceipt);
    socket.on('user_typing', handleUserTyping);

    // Cleanup listeners
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_read_receipt', handleReadReceipt);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, isConnected, currentUser?.uid, currentUser?._id, persistMessagesToStorage]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const userId = currentUser?.uid || currentUser?._id;
    if (!userId) return;

    try {
      // Try to load from cache first if offline
      const isOnline = OfflineService.getNetworkStatus();
      if (!isOnline) {
        const cachedConversations = await OfflineService.getCachedConversations();
        if (cachedConversations) {
          logger.info('Loading conversations from cache (offline)');
          setConversations(cachedConversations);
          const totalUnread = cachedConversations.reduce(
            (sum, conv) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadCount(totalUnread);
          return;
        }
      }

      const response = await api.get('/chat/conversations');

      if (response.data?.conversations) {
        setConversations(response.data.conversations);

        // Cache conversations for offline use
        await OfflineService.cacheConversations(response.data.conversations);

        // Calculate total unread count
        const totalUnread = response.data.conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      logger.error('Error loading conversations:', error);

      // Try to load from cache on error
      const cachedConversations = await OfflineService.getCachedConversations();
      if (cachedConversations) {
        logger.info('Loading conversations from cache (error fallback)');
        setConversations(cachedConversations);
        const totalUnread = cachedConversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
        return;
      }

      // Show user-friendly error message
      Alert.alert(
        'Error',
        getUserFriendlyMessage(error.message || 'Failed to load conversations. Please try again.'),
        [{ text: 'OK' }]
      );
    }
  }, [currentUser?.uid, currentUser?._id]);

  // Load messages for a specific match
  const loadMessages = useCallback(
    async (matchId, page = 1) => {
      const userId = currentUser?.uid || currentUser?._id;
      if (!userId || !matchId) return;

      try {
        // Try to load from cache first if offline or on first page
        const isOnline = OfflineService.getNetworkStatus();
        if (!isOnline || page === 1) {
          const cachedMessages = await OfflineService.getCachedMessages(matchId);
          if (cachedMessages && cachedMessages.length > 0) {
            logger.info(
              `Loading ${cachedMessages.length} messages from cache for match ${matchId}`
            );
            if (page === 1) {
              setMessages(cachedMessages);
              // Also persist to AsyncStorage for persistence
              await persistMessagesToStorage(matchId, cachedMessages);
            }
            // Still try to fetch from API if online to get latest
            if (isOnline) {
              // Continue to API call below
            } else {
              return cachedMessages;
            }
          }
        }

        const response = await api.get(`/chat/messages/${matchId}?page=${page}&limit=50`);

        if (response.data?.messages) {
          if (page === 1) {
            setMessages(response.data.messages);
            // Persist messages to AsyncStorage
            await persistMessagesToStorage(matchId, response.data.messages);
            // Also cache via OfflineService
            await OfflineService.cacheMessages(matchId, response.data.messages);
          } else {
            setMessages((prevMessages) => [...response.data.messages, ...prevMessages]);
            // Update persisted messages
            const allMessages = [...response.data.messages, ...messagesRef.current];
            await persistMessagesToStorage(matchId, allMessages);
          }

          return response.data.messages;
        }
      } catch (error) {
        logger.error('Error loading messages:', error);

        // Try to load from cache on error
        if (page === 1) {
          const cachedMessages = await OfflineService.getCachedMessages(matchId);
          const persistedMessages = await loadMessagesFromStorageRef.current(matchId);

          // Use persisted messages if available (more complete than cache)
          const fallbackMessages = persistedMessages || cachedMessages;
          if (fallbackMessages && fallbackMessages.length > 0) {
            logger.info(
              `Loading ${fallbackMessages.length} messages from storage (error fallback)`
            );
            setMessages(fallbackMessages);
            return fallbackMessages;
          }
        }

        // Only show error for first page load, not for pagination
        if (page === 1) {
          Alert.alert(
            'Error',
            getUserFriendlyMessage(error.message || 'Failed to load messages. Please try again.'),
            [{ text: 'OK' }]
          );
        }
      }
    },
    [currentUser?.uid, currentUser?._id, persistMessagesToStorage]
  );

  // Load messages from AsyncStorage
  const loadMessagesFromStorage = useCallback(async (matchId) => {
    try {
      const key = `@messages_${matchId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const { messages } = JSON.parse(stored);
        return messages || [];
      }
      return null;
    } catch (error) {
      logger.error('Error loading messages from storage', error);
      return null;
    }
  }, []);

  useEffect(() => {
    loadMessagesFromStorageRef.current = loadMessagesFromStorage;
  }, [loadMessagesFromStorage]);

  // Join a chat room
  const joinRoom = useCallback(
    async (matchId) => {
      setCurrentMatchId(matchId);

      // Load messages from storage first for instant display
      const persistedMessages = await loadMessagesFromStorage(matchId);
      if (persistedMessages && persistedMessages.length > 0) {
        logger.info(`Loading ${persistedMessages.length} persisted messages for match ${matchId}`);
        setMessages(persistedMessages);
      }

      if (socket && isConnected && matchId) {
        socket.emit('join_room', matchId);
        // Mark messages as read
        markAsReadRef.current(matchId);
      }

      // Also load from API to get latest
      await loadMessages(matchId, 1);
    },
    [socket, isConnected, loadMessages, loadMessagesFromStorage]
  );

  // Send a message
  const sendMessage = useCallback(
    async (matchId, content, type = 'text') => {
      if (!content.trim()) return;

      // Sanitize message content to prevent XSS
      const sanitizedContent = sanitizeString(content.trim(), { maxLength: 1000 });

      const messageData = {
        matchId,
        content: sanitizedContent,
        type,
      };

      // Create optimistic message
      const optimisticMessage = {
        _id: `pending_${Date.now()}`,
        matchId,
        senderId: currentUser?.uid || currentUser?._id,
        receiverId: null, // Will be set by server
        content: sanitizedContent,
        type,
        createdAt: new Date().toISOString(),
        pending: true,
        isRead: false,
      };

      // Add to UI immediately
      setMessages((prev) => {
        const newMessages = [...prev, optimisticMessage];
        // Persist immediately for offline support
        persistMessagesToStorage(matchId, newMessages).catch((err) => {
          logger.error('Error persisting optimistic message', err);
        });
        return newMessages;
      });

      if (socket && isConnected) {
        socket.emit('send_message', messageData);
      } else {
        // Queue message to send when reconnected
        logger.info('Socket disconnected, queuing message');
        messageQueueRef.current.push(messageData);

        // Also queue via OfflineService for sync API
        const isOnline = OfflineService.getNetworkStatus();
        if (!isOnline) {
          await OfflineService.queueAction({
            type: 'SEND_MESSAGE',
            data: messageData,
          });
        }
      }
    },
    [socket, isConnected, currentUser?.uid, currentUser?._id, persistMessagesToStorage]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    async (matchId) => {
      const userId = currentUser?.uid || currentUser?._id;
      if (!userId || !matchId) return;

      try {
        await api.put(`/chat/messages/${matchId}/read`);

        // Update local state
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.matchId === matchId ? { ...conv, unreadCount: 0 } : conv
          )
        );

        setUnreadCount((prev) =>
          Math.max(0, prev - (conversations.find((c) => c.matchId === matchId)?.unreadCount || 0))
        );
      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    },
    [currentUser?.uid, currentUser?._id, conversations]
  );

  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (socket && isConnected && currentMatchId) {
      socket.emit('typing_start', currentMatchId);
    }
  }, [socket, isConnected, currentMatchId]);

  // Send read receipt for a specific message
  const sendReadReceipt = useCallback(
    (messageId) => {
      if (socket && isConnected && currentMatchId) {
        socket.emit('message_read', {
          messageId,
          matchId: currentMatchId,
        });
      }
    },
    [socket, isConnected, currentMatchId]
  );

  // Send image message
  const sendImageMessage = useCallback(
    (matchId, imageUri, imageData = {}) => {
      if (socket && isConnected && imageUri) {
        socket.emit('send_message', {
          matchId,
          content: imageData.caption || '',
          type: 'image',
          imageUrl: imageUri,
          imageMetadata: {
            width: imageData.width,
            height: imageData.height,
            size: imageData.size,
            mimeType: imageData.mimeType || 'image/jpeg',
          },
        });
      }
    },
    [socket, isConnected]
  );

  // Send GIF message
  const sendGifMessage = useCallback(
    (matchId, gifUrl, gifData = {}) => {
      if (socket && isConnected && gifUrl) {
        socket.emit('send_message', {
          matchId,
          content: gifData.caption || '',
          type: 'gif',
          imageUrl: gifUrl,
          imageMetadata: {
            width: gifData.width,
            height: gifData.height,
            mimeType: 'image/gif',
          },
        });
      }
    },
    [socket, isConnected]
  );

  const stopTyping = useCallback(() => {
    if (socket && isConnected && currentMatchId) {
      socket.emit('typing_stop', currentMatchId);
    }
  }, [socket, isConnected, currentMatchId]);

  // Clear current conversation
  const clearCurrentConversation = useCallback(() => {
    setCurrentMatchId(null);
    setMessages([]);
    setOtherUserTyping(false);
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    const userId = currentUser?.uid || currentUser?._id;
    if (userId && !isConnected) {
      logger.info('Manual reconnect triggered');
      connect(userId);
    }
  }, [currentUser?.uid, currentUser?._id, isConnected, connect]);

  const value = {
    // State
    isConnected,
    isReconnecting,
    connectionError,
    conversations,
    currentMatchId,
    messages,
    unreadCount,
    isTyping,
    otherUserTyping,

    // Actions
    loadConversations,
    loadMessages,
    joinRoom,
    sendMessage,
    sendImageMessage,
    sendGifMessage,
    markAsRead,
    sendReadReceipt,
    startTyping,
    stopTyping,
    clearCurrentConversation,
    reconnect,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
