import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
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

  // Initialize Socket.io connection
  useEffect(() => {
    if (user?.uid) {
      const serverUrl = SOCKET_URL;

      const newSocket = io(serverUrl, {
        auth: {
          userId: user.uid
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      // Message events
      newSocket.on('new_message', (data) => {
        const { message } = data;

        // Add message to current conversation if it's for the active match
        if (currentMatchIdRef.current === message.matchId.toString()) {
          setMessages(prevMessages => {
            // Check if message already exists (to prevent duplicates)
            const exists = prevMessages.some(m => m._id === message._id);
            if (!exists) {
              return [...prevMessages, message];
            }
            return prevMessages;
          });
        }

        // Update conversations list
        setConversations(prevConversations => {
          return prevConversations.map(conv => {
            if (conv.matchId === message.matchId) {
              return {
                ...conv,
                latestMessage: {
                  content: message.content,
                  type: message.type,
                  createdAt: message.createdAt,
                  senderId: message.senderId,
                  imageUrl: message.imageUrl
                },
                unreadCount: conv.matchId === currentMatchIdRef.current ? 0 : conv.unreadCount + 1
              };
            }
            return conv;
          });
        });

        // Update total unread count
        setUnreadCount(prev => prev + 1);
      });

      // Read receipt events
      newSocket.on('message_read_receipt', (data) => {
        const { messageId, readBy, readAt } = data;

        // Update message with read receipt
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === messageId
              ? { ...msg, isRead: true, readAt, readBy }
              : msg
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
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?.uid]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const serverUrl = SOCKET_URL;
      const response = await fetch(`${serverUrl}/api/chat/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.uid
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.data.conversations);

        // Calculate total unread count
        const totalUnread = data.data.conversations.reduce(
          (sum, conv) => sum + conv.unreadCount,
          0
        );
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user?.uid]);

  // Load messages for a specific match
  const loadMessages = useCallback(async (matchId, page = 1) => {
    if (!user?.uid || !matchId) return;

    try {
      const serverUrl = SOCKET_URL;
      const response = await fetch(
        `${serverUrl}/api/chat/messages/${matchId}?page=${page}&limit=50`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.uid
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (page === 1) {
          setMessages(data.data.messages);
        } else {
          setMessages(prevMessages => [...data.data.messages, ...prevMessages]);
        }

        return data.data.messages;
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user?.uid]);

  // Join a chat room
  const joinRoom = useCallback((matchId) => {
    if (socket && isConnected && matchId) {
      socket.emit('join_room', matchId);
      setCurrentMatchId(matchId);

      // Mark messages as read
      markAsRead(matchId);
    }
  }, [socket, isConnected]);

  // Send a message
  const sendMessage = useCallback((matchId, content, type = 'text') => {
    if (socket && isConnected && content.trim()) {
      socket.emit('send_message', {
        matchId,
        content: content.trim(),
        type
      });
    }
  }, [socket, isConnected]);

  // Mark messages as read
  const markAsRead = useCallback(async (matchId) => {
    if (!user?.uid || !matchId) return;

    try {
      const serverUrl = SOCKET_URL;
      await fetch(`${serverUrl}/api/chat/messages/${matchId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.uid
        }
      });

      // Update local state
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.matchId === matchId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      setUnreadCount(prev => Math.max(0, prev - (conversations.find(c => c.matchId === matchId)?.unreadCount || 0)));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user?.uid, conversations]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (socket && isConnected && currentMatchId) {
      socket.emit('typing_start', currentMatchId);
    }
  }, [socket, isConnected, currentMatchId]);

  // Send read receipt for a specific message
  const sendReadReceipt = useCallback((messageId) => {
    if (socket && isConnected && currentMatchId) {
      socket.emit('message_read', {
        messageId,
        matchId: currentMatchId
      });
    }
  }, [socket, isConnected, currentMatchId]);

  // Send image message
  const sendImageMessage = useCallback((matchId, imageUri, imageData = {}) => {
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
          mimeType: imageData.mimeType || 'image/jpeg'
        }
      });
    }
  }, [socket, isConnected]);

  // Send GIF message
  const sendGifMessage = useCallback((matchId, gifUrl, gifData = {}) => {
    if (socket && isConnected && gifUrl) {
      socket.emit('send_message', {
        matchId,
        content: gifData.caption || '',
        type: 'gif',
        imageUrl: gifUrl,
        imageMetadata: {
          width: gifData.width,
          height: gifData.height,
          mimeType: 'image/gif'
        }
      });
    }
  }, [socket, isConnected]);

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

  const value = {
    // State
    isConnected,
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
    clearCurrentConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};