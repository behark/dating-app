import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/api';
import logger from '../../utils/logger';

/**
 * Socket.io Context for real-time communication
 * Manages WebSocket connection, authentication, and event subscriptions
 */

const SocketContext = createContext(null);

/**
 * Socket connection states
 */
export const SOCKET_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting',
};

/**
 * Socket.io Provider Component
 * Wraps the app and provides socket connection to all child components
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState(SOCKET_STATES.DISCONNECTED);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const eventListenersRef = useRef(new Map());
  const heartbeatIntervalRef = useRef(null);

  /**
   * Heartbeat mechanism to keep connection alive
   */
  const startHeartbeat = useCallback((socketInstance) => {
    // Send heartbeat every 20 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketInstance?.connected) {
        socketInstance.emit('heartbeat');
      }
    }, 20000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Initialize socket connection with authentication
   */
  const connect = useCallback(
    async (userId) => {
      try {
        // Don't reconnect if already connected
        if (socketRef.current?.connected) {
          logger.debug('[Socket] Already connected');
          return socketRef.current;
        }

        // Clean up existing connection if any
        if (socketRef.current) {
          // Remove specific listeners we tracked to avoid leaks across reconnects
          if (eventListenersRef.current.size > 0) {
            eventListenersRef.current.forEach((handlers, event) => {
              handlers.forEach((handler) => {
                socketRef.current.off(event, handler);
              });
            });
            eventListenersRef.current.clear();
          }
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        }

        setConnectionState(SOCKET_STATES.CONNECTING);
        setError(null);

        // Get authentication token
        const token = await AsyncStorage.getItem('authToken');

        if (!token && !userId) {
          logger.warn('[Socket] No authentication token or userId available');
          setConnectionState(SOCKET_STATES.DISCONNECTED);
          return null;
        }

        logger.debug('[Socket] Connecting to:', SOCKET_URL);

        // Create socket connection
        const newSocket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          timeout: 20000,
          auth: {
            token,
            userId,
          },
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          logger.info('[Socket] Connected successfully', { socketId: newSocket.id });
          setIsConnected(true);
          setConnectionState(SOCKET_STATES.CONNECTED);
          setError(null);

          // Start heartbeat
          startHeartbeat(newSocket);
        });

        newSocket.on('disconnect', (reason) => {
          logger.info('[Socket] Disconnected:', reason);
          setIsConnected(false);
          setConnectionState(SOCKET_STATES.DISCONNECTED);

          // Stop heartbeat
          stopHeartbeat();

          // Attempt reconnection for certain reasons
          if (reason === 'io server disconnect') {
            // Server disconnected, manually reconnect
            newSocket.connect();
          }
        });

        newSocket.on('connect_error', (err) => {
          logger.error('[Socket] Connection error:', err.message);
          setError(err.message);
          setConnectionState(SOCKET_STATES.ERROR);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          logger.info('[Socket] Reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
          setConnectionState(SOCKET_STATES.CONNECTED);
          setError(null);
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
          logger.debug('[Socket] Reconnection attempt:', attemptNumber);
          setConnectionState(SOCKET_STATES.RECONNECTING);
        });

        newSocket.on('reconnect_error', (err) => {
          logger.error('[Socket] Reconnection error:', err.message);
          setError(err.message);
        });

        newSocket.on('reconnect_failed', () => {
          logger.error('[Socket] Reconnection failed - max attempts reached');
          setError('Failed to reconnect to server');
          setConnectionState(SOCKET_STATES.ERROR);
        });

        // Server error handler
        newSocket.on('error', (err) => {
          logger.error('[Socket] Server error:', err);
          setError(err.message || 'Socket error occurred');
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return newSocket;
      } catch (err) {
        logger.error('[Socket] Connection initialization error:', err);
        setError(err.message || 'Failed to initialize socket connection');
        setConnectionState(SOCKET_STATES.ERROR);
        return null;
      }
    },
    [startHeartbeat, stopHeartbeat]
  );

  /**
   * Disconnect socket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      logger.info('[Socket] Disconnecting...');
      stopHeartbeat();
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setConnectionState(SOCKET_STATES.DISCONNECTED);
      eventListenersRef.current.clear();
    }
  }, [stopHeartbeat]);

  /**
   * Emit an event to the server
   */
  const emit = useCallback((event, data, callback) => {
    if (!socketRef.current?.connected) {
      logger.warn('[Socket] Cannot emit - socket not connected');
      if (callback) callback({ success: false, error: 'Not connected' });
      return;
    }

    logger.debug('[Socket] Emitting event:', event, data);

    if (callback) {
      socketRef.current.emit(event, data, callback);
    } else {
      socketRef.current.emit(event, data);
    }
  }, []);

  /**
   * Subscribe to a socket event
   */
  const on = useCallback((event, handler) => {
    if (!socketRef.current) {
      logger.warn('[Socket] Cannot subscribe - socket not initialized');
      return () => {};
    }

    logger.debug('[Socket] Subscribing to event:', event);

    // Store handler reference for cleanup
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event).add(handler);

    socketRef.current.on(event, handler);

    // Return cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
      if (eventListenersRef.current.has(event)) {
        eventListenersRef.current.get(event).delete(handler);
      }
    };
  }, []);

  /**
   * Unsubscribe from a socket event
   */
  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
    if (eventListenersRef.current.has(event)) {
      eventListenersRef.current.get(event).delete(handler);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopHeartbeat();
      const reconnectTimeout = reconnectTimeoutRef.current;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      const socketInstance = socketRef.current;
      const trackedListeners = eventListenersRef.current;
      if (socketInstance) {
        if (trackedListeners.size > 0) {
          trackedListeners.forEach((handlers, event) => {
            handlers.forEach((handler) => {
              socketInstance.off(event, handler);
            });
          });
          trackedListeners.clear();
        }
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
      }
    };
  }, [stopHeartbeat]);

  const value = {
    socket: socketRef.current,
    isConnected,
    connectionState,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

/**
 * Hook to use socket context
 * @returns {Object} Socket context value
 */
export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
