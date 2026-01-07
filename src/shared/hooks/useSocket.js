import { useCallback, useEffect, useRef } from 'react';
import { useSocketContext } from '../../context/SocketContext';
import logger from '../../utils/logger';

/**
 * Custom hook for socket operations
 * Provides convenient methods for socket event handling with automatic cleanup
 *
 * NOTE: For chat functionality, prefer using ChatContext (useChat from context/ChatContext)
 * which provides higher-level chat operations. This hook is for direct socket access
 * when needed outside of the chat context (e.g., notifications, presence).
 */
export const useSocket = () => {
  const { socket, isConnected, connectionState, error, connect, disconnect, emit, on, off } =
    useSocketContext();
  const cleanupFunctionsRef = useRef([]);

  /**
   * Subscribe to a socket event - returns unsubscribe function
   * Use this inside a useEffect in your component for automatic cleanup
   * @param {string} event - Event name
   * @param {function} handler - Event handler function
   * @returns {function} Unsubscribe function
   */
  const subscribe = useCallback(
    (event, handler) => {
      if (!socket) {
        logger.debug('[useSocket] Cannot subscribe, socket not available:', event);
        return () => {}; // Return no-op cleanup
      }

      logger.debug('[useSocket] Subscribing to:', event);
      const unsubscribe = on(event, handler);

      return () => {
        logger.debug('[useSocket] Unsubscribing from:', event);
        unsubscribe();
      };
    },
    [socket, on]
  );

  /**
   * Emit an event with promise-based response
   * @param {string} event - Event name
   * @param {object} data - Data to send
   * @returns {Promise} Promise that resolves with server response
   */
  const emitWithAck = useCallback(
    (event, data) => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket not connected'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('Socket emission timeout'));
        }, 10000); // 10 second timeout

        emit(event, data, (response) => {
          clearTimeout(timeout);
          if (response?.success !== false) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Socket emission failed'));
          }
        });
      });
    },
    [socket, isConnected, emit]
  );

  /**
   * Join a room
   * @param {string} roomId - Room ID to join
   * @returns {Promise} Promise that resolves when joined
   */
  const joinRoom = useCallback(
    (roomId) => {
      logger.info('[useSocket] Joining room:', roomId);
      return emitWithAck('join_room', roomId);
    },
    [emitWithAck]
  );

  /**
   * Leave a room
   * @param {string} roomId - Room ID to leave
   */
  const leaveRoom = useCallback(
    (roomId) => {
      if (!socket || !isConnected) return;
      logger.info('[useSocket] Leaving room:', roomId);
      emit('leave_room', roomId);
    },
    [socket, isConnected, emit]
  );

  /**
   * Cleanup all subscriptions on unmount
   */
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, []);

  return {
    socket,
    isConnected,
    connectionState,
    error,
    connect,
    disconnect,
    emit,
    emitWithAck,
    on,
    off,
    subscribe,
    joinRoom,
    leaveRoom,
  };
};

/**
 * Hook for subscribing to a single socket event
 * Automatically handles cleanup when component unmounts
 * @param {string} event - Event name to listen to
 * @param {function} handler - Handler function
 * @param {array} dependencies - Optional dependencies array
 */
export const useSocketEvent = (event, handler, dependencies = []) => {
  const { socket, on } = useSocketContext();

  useEffect(() => {
    if (!socket || !event || !handler) return;

    logger.debug('[useSocketEvent] Subscribing to:', event);
    const unsubscribe = on(event, handler);

    return () => {
      logger.debug('[useSocketEvent] Unsubscribing from:', event);
      unsubscribe();
    };
  }, [socket, event, on, ...dependencies]);
};

/**
 * Hook for managing room subscriptions
 * Automatically joins room on mount and leaves on unmount
 * @param {string} roomId - Room ID to join
 * @param {object} options - Options { autoJoin: boolean }
 */
export const useRoom = (roomId, options = { autoJoin: true }) => {
  const { isConnected, emit } = useSocketContext();
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !isConnected || !options.autoJoin) return;

    // Join room
    if (!hasJoinedRef.current) {
      logger.info('[useRoom] Joining room:', roomId);
      emit('join_room', roomId);
      hasJoinedRef.current = true;
    }

    // Leave room on unmount
    return () => {
      if (hasJoinedRef.current) {
        logger.info('[useRoom] Leaving room:', roomId);
        emit('leave_room', roomId);
        hasJoinedRef.current = false;
      }
    };
  }, [roomId, isConnected, options.autoJoin, emit]);

  return {
    hasJoined: hasJoinedRef.current,
  };
};

export default useSocket;
