import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';
import api from '../services/api';
import logger from '../utils/logger';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Refs to store latest values for use in event handlers
  const conversationsRef = useRef(conversations);
  const messagesRef = useRef(messages);
  const currentMatchIdRef = useRef(currentMatchId);

  // Queue for messages sent during disconnection
  const messageQueueRef = useRef([]);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;

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

  // Heartbeat helpers
  const startHeartbeat = useCallback((socketInstance) => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketInstance && socketInstance.connected) {
        socketInstance.emit('heartbeat');
      }
    }, 30000); // Send heartbeat every 30s
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    const initSocket = async () => {
      if (!user?.uid) return;

      const serverUrl = SOCKET_URL;
      const authToken = await api.getAuthToken();

      const newSocket = io(serverUrl, {
        auth: {
          userId: user.uid,
          token: authToken, // Include token for socket auth
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        // ===== RECONNECTION CONFIG =====
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000, // Start with 1s delay
        reconnectionDelayMax: 10000, // Max 10s between attempts
        randomizationFactor: 0.5, // Add jitter to prevent thundering herd
        // ===== HEARTBEAT/PING CONFIG =====
        pingTimeout: 60000, // Wait 60s for pong before disconnect
        pingInterval: 25000, // Send ping every 25s
      });

      // ===== CONNECTION EVENTS =====
      newSocket.on('connect', () => {
        logger.info('Connected to chat server');
        setIsConnected(true);
        setIsReconnecting(false);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Flush queued messages
        if (messageQueueRef.current.length > 0) {
          logger.info(`Flushing ${messageQueueRef.current.length} queued messages`);
          messageQueueRef.current.forEach((msg) => {
            newSocket.emit('send_message', msg);
          });
          messageQueueRef.current = [];
        }

        // Rejoin current room if we were in one
        if (currentMatchIdRef.current) {
          newSocket.emit('join_room', currentMatchIdRef.current);
        }

        // Start heartbeat
        startHeartbeat(newSocket);
      });

      newSocket.on('disconnect', (reason) => {
        logger.info('Disconnected from chat server:', reason);
        setIsConnected(false);
        stopHeartbeat();

        // If server disconnected us, try to reconnect manually
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });

      // ===== RECONNECTION EVENTS =====
      newSocket.on('reconnect_attempt', (attemptNumber) => {
        logger.info(`Reconnection attempt ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS}`);
        setIsReconnecting(true);
        reconnectAttemptsRef.current = attemptNumber;
      });

      newSocket.on('reconnect', (attemptNumber) => {
        logger.info(`Reconnected after ${attemptNumber} attempts`);
        setIsReconnecting(false);
        setConnectionError(null);
      });

      newSocket.on('reconnect_error', (error) => {
        logger.error('Reconnection error:', error.message);
        setConnectionError('Connection lost. Retrying...');
      });

      newSocket.on('reconnect_failed', () => {
        logger.error('Failed to reconnect after max attempts');
        setIsReconnecting(false);
        setConnectionError('Unable to connect to chat server. Please check your connection.');
      });

      // Message events
      newSocket.on('new_message', (data) => {
        const { message } = data;

        // Add message to current conversation if it's for the active match
        if (currentMatchIdRef.current === message.matchId.toString()) {
          setMessages((prevMessages) => {
            // Check if message already exists (to prevent duplicates)
            const exists = prevMessages.some((m) => m._id === message._id);
            if (!exists) {
              return [...prevMessages, message];
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
      });

      // Read receipt events
      newSocket.on('message_read_receipt', (data) => {
        const { messageId, readBy, readAt } = data;

        // Update message with read receipt
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId ? { ...msg, isRead: true, readAt, readBy } : msg
          )
        );
      });

      // Typing events
      newSocket.on('user_typing', (data) => {
        if (data.userId !== user.uid) {
          setOtherUserTyping(data.isTyping);
        }
      });

      // Error handling
      newSocket.on('error', (error) => {
        logger.error('Socket error:', error);
        setConnectionError(error.message || 'Socket error occurred');
      });

      // Connection error (different from reconnection error)
      newSocket.on('connect_error', (error) => {
        logger.error('Socket connection error:', error.message);
        setConnectionError('Failed to connect to chat server');
      });

      setSocket(newSocket);

      return () => {
        stopHeartbeat();
        newSocket.disconnect();
      };
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      stopHeartbeat();
    };
  }, [user?.uid, startHeartbeat, stopHeartbeat]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await api.get('/chat/conversations');

      if (response.data?.conversations) {
        setConversations(response.data.conversations);

        // Calculate total unread count
        const totalUnread = response.data.conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      logger.error('Error loading conversations:', error);
      // Show user-friendly error message
      Alert.alert(
        'Error',
        getUserFriendlyMessage(error.message || 'Failed to load conversations. Please try again.'),
        [{ text: 'OK' }]
      );
    }
  }, [user?.uid]);

  // Load messages for a specific match
  const loadMessages = useCallback(
    async (matchId, page = 1) => {
      if (!user?.uid || !matchId) return;

      try {
        const response = await api.get(`/chat/messages/${matchId}?page=${page}&limit=50`);

        if (response.data?.messages) {
          if (page === 1) {
            setMessages(response.data.messages);
          } else {
            setMessages((prevMessages) => [...response.data.messages, ...prevMessages]);
          }

          return response.data.messages;
        }
      } catch (error) {
        logger.error('Error loading messages:', error);
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
    [user?.uid]
  );

  // Join a chat room
  const joinRoom = useCallback(
    (matchId) => {
      if (socket && isConnected && matchId) {
        socket.emit('join_room', matchId);
        setCurrentMatchId(matchId);

        // Mark messages as read
        markAsRead(matchId);
      }
    },
    [socket, isConnected]
  );

  // Send a message
  const sendMessage = useCallback(
    (matchId, content, type = 'text') => {
      if (!content.trim()) return;

      const messageData = {
        matchId,
        content: content.trim(),
        type,
      };

      if (socket && isConnected) {
        socket.emit('send_message', messageData);
      } else {
        // Queue message to send when reconnected
        logger.info('Socket disconnected, queuing message');
        messageQueueRef.current.push(messageData);

        // Optimistically add to UI with pending status
        const optimisticMessage = {
          _id: `pending_${Date.now()}`,
          ...messageData,
          senderId: user?.uid,
          createdAt: new Date().toISOString(),
          pending: true,
        };
        setMessages((prev) => [...prev, optimisticMessage]);
      }
    },
    [socket, isConnected, user?.uid]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    async (matchId) => {
      if (!user?.uid || !matchId) return;

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
    [user?.uid, conversations]
  );

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
    if (socket && !isConnected) {
      logger.info('Manual reconnect triggered');
      socket.connect();
    }
  }, [socket, isConnected]);

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
