# WebSocket/Socket.io Integration Setup - Integration Guide

This guide explains how to integrate the newly created Socket.io components into your dating app frontend.

## 🎯 Overview

The following components have been created to enable real-time communication:

1. **SocketContext** - Core Socket.io connection management
2. **useSocket** - Hook for socket operations
3. **useChat** - Hook for chat-specific functionality
4. **Shared Types** - TypeScript definitions matching backend

## 📁 Files Created

### Frontend Components
- `src/contexts/SocketContext.js` - Socket.io context provider
- `src/hooks/useSocket.js` - Socket operations hook
- `src/hooks/useChat.js` - Chat-specific hook

### Shared Types
- `shared/types/user.ts` - User type definitions
- `shared/types/message.ts` - Message and chat types
- `shared/types/match.ts` - Match and swipe types
- `shared/types/common.ts` - Common utility types
- `shared/types/index.ts` - Central export file

## 🔧 Integration Steps

### Step 1: Wrap Your App with SocketProvider

Update your `App.js` or main app component:

```javascript
import React from 'react';
import { SocketProvider } from './contexts/SocketContext';
import { NavigationContainer } from '@react-navigation/native';

function App() {
  return (
    <SocketProvider>
      <NavigationContainer>
        {/* Your app navigation and screens */}
      </NavigationContainer>
    </SocketProvider>
  );
}

export default App;
```

### Step 2: Use Socket.io in Your Components

#### For Chat Screen

```javascript
import React, { useEffect } from 'react';
import { View, FlatList, TextInput, Button } from 'react-native';
import { useChat } from '../hooks/useChat';

function ChatScreen({ route }) {
  const { matchId, otherUserId } = route.params;
  const { 
    messages, 
    sendMessage, 
    sendTypingIndicator,
    stopTyping,
    isConnected,
    typing 
  } = useChat(matchId);

  const handleSendMessage = async (text) => {
    try {
      await sendMessage({
        senderId: currentUserId, // Get from auth context
        content: text,
        type: 'text'
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTextChange = (text) => {
    if (text.length > 0) {
      sendTypingIndicator(currentUserId);
    } else {
      stopTyping(currentUserId);
    }
  };

  return (
    <View>
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item._id}
      />
      {typing[otherUserId] && <Text>User is typing...</Text>}
      <TextInput 
        onChangeText={handleTextChange}
        placeholder="Type a message..."
      />
      <Button title="Send" onPress={() => handleSendMessage(text)} />
    </View>
  );
}
```

#### For Match List Screen

```javascript
import React, { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

function MatchListScreen() {
  const { isConnected, on, off } = useSocket();
  const [onlineUsers, setOnlineUsers] = React.useState(new Set());

  useEffect(() => {
    if (!isConnected) return;

    // Listen for user online status
    const handleUserOnline = (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    const unsubOnline = on('user_online', handleUserOnline);
    const unsubOffline = on('user_offline', handleUserOffline);

    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, [isConnected, on, off]);

  // Render your match list with online indicators
}
```

### Step 3: Connect on Login

Update your authentication flow to connect the socket after successful login:

```javascript
import { useSocketContext } from './contexts/SocketContext';

function LoginScreen() {
  const { connect } = useSocketContext();

  const handleLogin = async (email, password) => {
    try {
      const response = await loginAPI(email, password);
      
      // Store tokens
      await AsyncStorage.setItem('token', response.tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', response.tokens.refreshToken);
      await AsyncStorage.setItem('userId', response.user._id);

      // Connect socket
      await connect();

      // Navigate to main app
      navigation.navigate('MainApp');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // Your login UI
  );
}
```

### Step 4: Disconnect on Logout

```javascript
import { useSocketContext } from './contexts/SocketContext';

function LogoutButton() {
  const { disconnect } = useSocketContext();

  const handleLogout = async () => {
    // Clear tokens
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userId');

    // Disconnect socket
    disconnect();

    // Navigate to login
    navigation.navigate('Login');
  };

  return <Button title="Logout" onPress={handleLogout} />;
}
```

### Step 5: Use Shared Types (Optional but Recommended)

For better type safety, import and use shared types in your TypeScript/JavaScript files:

```typescript
import { IMessage, IUser, IMatch, SendMessagePayload } from '../../shared/types';

// Type-safe message handling
const message: IMessage = {
  matchId: '123',
  senderId: 'user1',
  receiverId: 'user2',
  content: 'Hello!',
  type: 'text',
  createdAt: new Date()
};
```

## 🔌 Backend Socket Events

Your backend already implements these events (see `backend/server.js:650-820`):

### Client → Server Events
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `typing` - User is typing
- `stop_typing` - User stopped typing
- `mark_read` - Mark messages as read
- `read_receipt` - Send read receipt

### Server → Client Events
- `new_message` - Receive a new message
- `typing` - Someone is typing
- `stop_typing` - Someone stopped typing
- `user_online` - User came online
- `user_offline` - User went offline
- `message_delivered` - Message was delivered
- `message_read` - Message was read

## 📊 Connection States

The `SocketContext` tracks connection state:
- `disconnected` - Not connected
- `connecting` - Attempting to connect
- `connected` - Successfully connected
- `error` - Connection error
- `reconnecting` - Attempting to reconnect

Access via:
```javascript
const { connectionState, isConnected, error } = useSocketContext();
```

## 🔄 Auto-Reconnection

The socket automatically reconnects on connection loss with:
- 5 retry attempts
- Exponential backoff (1-5 seconds)
- Automatic re-authentication

## 💓 Heartbeat

A heartbeat ping is sent every 20 seconds to keep the connection alive.

## 🧹 Cleanup

All event listeners are automatically cleaned up when components unmount.

## 🚨 Error Handling

Errors are logged and stored in the context:
```javascript
const { error } = useSocketContext();

if (error) {
  console.error('Socket error:', error);
  // Show error UI
}
```

## 📝 Next Steps

1. ✅ Wrap your app with `SocketProvider`
2. ✅ Connect socket after login
3. ✅ Disconnect socket on logout
4. ✅ Use `useChat` in chat screens
5. ✅ Use `useSocket` for other real-time features
6. ✅ Import shared types for type safety

## 🔍 Testing

To test the Socket.io integration:

1. Log in on two devices/simulators
2. Open a chat between them
3. Send messages - they should appear in real-time
4. Type in one device - typing indicator should show on the other
5. Check online/offline status indicators
6. Test connection resilience by going offline and back online

## 📚 Additional Resources

- Socket.io Client Docs: https://socket.io/docs/v4/client-api/
- Backend Socket Implementation: `backend/server.js:650-820`
- Backend Type Definitions: `backend/types/index.d.ts`
