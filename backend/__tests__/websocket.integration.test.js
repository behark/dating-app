const WebSocket = require('ws');

// Mock WebSocket server for testing
class MockWebSocketServer {
  constructor() {
    this.clients = new Map();
    this.messageHandlers = new Map();
  }

  addClient(userId) {
    const mockClient = {
      userId,
      readyState: WebSocket.OPEN,
      send: jest.fn(),
      close: jest.fn(),
    };
    this.clients.set(userId, mockClient);
    return mockClient;
  }

  removeClient(userId) {
    this.clients.delete(userId);
  }

  broadcast(message) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

describe('WebSocket Integration Tests', () => {
  let wsServer;

  beforeEach(() => {
    wsServer = new MockWebSocketServer();
  });

  afterEach(() => {
    wsServer.clients.clear();
  });

  describe('Connection Management', () => {
    it('should add client on connection', () => {
      const client = wsServer.addClient('user_123');

      expect(wsServer.clients.has('user_123')).toBe(true);
      expect(client.readyState).toBe(WebSocket.OPEN);
    });

    it('should remove client on disconnection', () => {
      wsServer.addClient('user_123');
      wsServer.removeClient('user_123');

      expect(wsServer.clients.has('user_123')).toBe(false);
    });

    it('should handle multiple concurrent connections', () => {
      wsServer.addClient('user_1');
      wsServer.addClient('user_2');
      wsServer.addClient('user_3');

      expect(wsServer.clients.size).toBe(3);
    });
  });

  describe('Message Broadcasting', () => {
    it('should broadcast message to all clients', () => {
      const client1 = wsServer.addClient('user_1');
      const client2 = wsServer.addClient('user_2');

      wsServer.broadcast({ type: 'announcement', message: 'Hello everyone!' });

      expect(client1.send).toHaveBeenCalled();
      expect(client2.send).toHaveBeenCalled();
    });

    it('should send message to specific user', () => {
      const client1 = wsServer.addClient('user_1');
      const client2 = wsServer.addClient('user_2');

      wsServer.sendToUser('user_1', { type: 'private', message: 'Hello user 1!' });

      expect(client1.send).toHaveBeenCalled();
      expect(client2.send).not.toHaveBeenCalled();
    });
  });

  describe('Chat Events', () => {
    it('should handle new message event', () => {
      const sender = wsServer.addClient('sender_123');
      const receiver = wsServer.addClient('receiver_123');

      const messagePayload = {
        type: 'new_message',
        data: {
          id: 'msg_123',
          senderId: 'sender_123',
          receiverId: 'receiver_123',
          content: 'Hello!',
          timestamp: new Date().toISOString(),
        },
      };

      wsServer.sendToUser('receiver_123', messagePayload);

      expect(receiver.send).toHaveBeenCalledWith(JSON.stringify(messagePayload));
    });

    it('should handle typing indicator', () => {
      wsServer.addClient('user_1');
      const user2 = wsServer.addClient('user_2');

      const typingEvent = {
        type: 'typing',
        data: {
          userId: 'user_1',
          conversationId: 'conv_123',
          isTyping: true,
        },
      };

      wsServer.sendToUser('user_2', typingEvent);

      expect(user2.send).toHaveBeenCalledWith(JSON.stringify(typingEvent));
    });

    it('should handle read receipt', () => {
      const sender = wsServer.addClient('sender_123');
      wsServer.addClient('receiver_123');

      const readReceipt = {
        type: 'message_read',
        data: {
          messageId: 'msg_123',
          readBy: 'receiver_123',
          readAt: new Date().toISOString(),
        },
      };

      wsServer.sendToUser('sender_123', readReceipt);

      expect(sender.send).toHaveBeenCalledWith(JSON.stringify(readReceipt));
    });
  });

  describe('Match Events', () => {
    it('should notify both users on match', () => {
      const user1 = wsServer.addClient('user_1');
      const user2 = wsServer.addClient('user_2');

      const matchEvent = {
        type: 'new_match',
        data: {
          matchId: 'match_123',
          users: ['user_1', 'user_2'],
          timestamp: new Date().toISOString(),
        },
      };

      wsServer.sendToUser('user_1', matchEvent);
      wsServer.sendToUser('user_2', matchEvent);

      expect(user1.send).toHaveBeenCalledWith(JSON.stringify(matchEvent));
      expect(user2.send).toHaveBeenCalledWith(JSON.stringify(matchEvent));
    });
  });

  describe('Presence Events', () => {
    it('should broadcast user online status', () => {
      const user1 = wsServer.addClient('user_1');
      const user2 = wsServer.addClient('user_2');

      const onlineEvent = {
        type: 'user_online',
        data: {
          userId: 'user_3',
          timestamp: new Date().toISOString(),
        },
      };

      wsServer.broadcast(onlineEvent);

      expect(user1.send).toHaveBeenCalledWith(JSON.stringify(onlineEvent));
      expect(user2.send).toHaveBeenCalledWith(JSON.stringify(onlineEvent));
    });

    it('should broadcast user offline status', () => {
      const user1 = wsServer.addClient('user_1');

      const offlineEvent = {
        type: 'user_offline',
        data: {
          userId: 'user_2',
          lastSeen: new Date().toISOString(),
        },
      };

      wsServer.sendToUser('user_1', offlineEvent);

      expect(user1.send).toHaveBeenCalledWith(JSON.stringify(offlineEvent));
    });
  });

  describe('Error Handling', () => {
    it('should handle message to non-existent user', () => {
      const message = { type: 'test', data: {} };

      // Should not throw
      expect(() => {
        wsServer.sendToUser('nonexistent_user', message);
      }).not.toThrow();
    });

    it('should not send to closed connections', () => {
      const client = wsServer.addClient('user_1');
      client.readyState = WebSocket.CLOSED;

      wsServer.broadcast({ type: 'test' });

      expect(client.send).not.toHaveBeenCalled();
    });
  });
});

describe('Real-time Notification Tests', () => {
  let wsServer;

  beforeEach(() => {
    wsServer = new MockWebSocketServer();
  });

  describe('Push Notifications', () => {
    it('should send like notification', () => {
      const receiver = wsServer.addClient('receiver_123');

      const likeNotification = {
        type: 'notification',
        data: {
          type: 'like',
          title: 'Someone liked you!',
          body: 'Check out who liked your profile',
          userId: 'liker_123',
        },
      };

      wsServer.sendToUser('receiver_123', likeNotification);

      expect(receiver.send).toHaveBeenCalled();
    });

    it('should send super like notification', () => {
      const receiver = wsServer.addClient('receiver_123');

      const superLikeNotification = {
        type: 'notification',
        data: {
          type: 'super_like',
          title: 'You got a Super Like! ⭐',
          body: 'Someone thinks you\'re special',
          userId: 'super_liker_123',
        },
      };

      wsServer.sendToUser('receiver_123', superLikeNotification);

      expect(receiver.send).toHaveBeenCalled();
    });
  });
});
