# Code Examples & Integration Guide

## Table of Contents
1. Location Services
2. Chat & Messaging
3. Socket.io Events
4. UI Components
5. Error Handling

---

## 1. Location Services Examples

### Capture and Store Location
```javascript
// In HomeScreen.js or LoginScreen.js
import { LocationService } from '../services/LocationService';

useEffect(() => {
  const initLocation = async () => {
    try {
      // Request permission
      const permission = await LocationService.requestLocationPermission();
      if (!permission) {
        console.log('Location permission denied');
        return;
      }

      // Get current location
      const location = await LocationService.getCurrentLocation();
      if (location) {
        // Store in database
        await LocationService.updateUserLocation(currentUser.uid, location);
        
        // Start periodic updates
        LocationService.startPeriodicLocationUpdates(currentUser.uid);
      }
    } catch (error) {
      console.error('Location init error:', error);
    }
  };

  initLocation();
}, [currentUser.uid]);
```

### Calculate Distance Between Users
```javascript
// In profile or discovery component
import { LocationService } from '../services/LocationService';

const displayDistance = (user1Location, user2Location) => {
  const distanceKm = LocationService.calculateDistance(user1Location, user2Location);
  return LocationService.getLocationDisplayString(distanceKm);
  // Example output: "5.2 km away"
};
```

### Update Location Privacy
```javascript
// In PreferencesScreen
import { LocationService } from '../services/LocationService';

const updatePrivacy = async (privacyLevel) => {
  try {
    // privacyLevel: 'hidden' | 'visible_to_matches' | 'visible_to_all'
    await LocationService.updateLocationPrivacy(currentUser.uid, privacyLevel);
    console.log('Privacy updated to:', privacyLevel);
  } catch (error) {
    console.error('Privacy update error:', error);
  }
};
```

### Fetch Nearby Users
```javascript
// In HomeScreen or DiscoveryScreen
const fetchNearbyUsers = async () => {
  try {
    const location = await LocationService.getCurrentLocation();
    
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services');
      return;
    }

    // Call backend API
    const response = await fetch(
      `${API_URL}/api/discover/users?` +
      `lat=${location.latitude}&` +
      `lng=${location.longitude}&` +
      `radius=50000`, // 50km
      {
        headers: { 'X-User-ID': currentUser.uid }
      }
    );

    const data = await response.json();
    const nearbyUsers = data.data.users; // Array with distance
    
    setCards(nearbyUsers);
  } catch (error) {
    console.error('Error fetching nearby users:', error);
  }
};
```

---

## 2. Chat & Messaging Examples

### Initialize Chat Context
```javascript
// In App.js or root navigation
import { ChatProvider } from './context/ChatContext';

export default function App() {
  return (
    <ChatProvider>
      <Navigation />
    </ChatProvider>
  );
}
```

### Send Text Message
```javascript
// In ChatScreen.js
import { useChat } from '../context/ChatContext';

const ChatScreen = ({ route }) => {
  const { matchId } = route.params;
  const { sendMessage, isConnected } = useChat();
  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (!messageText.trim() || !isConnected) return;

    sendMessage(matchId, messageText.trim());
    setMessageText('');
  };

  return (
    // UI
  );
};
```

### Load Messages with Pagination
```javascript
// In ChatScreen.js
const { loadMessages } = useChat();

const handleLoadOlderMessages = async () => {
  try {
    const page = currentPage + 1;
    const olderMessages = await loadMessages(matchId, page);
    
    if (olderMessages && olderMessages.length > 0) {
      setMessages(prev => [...olderMessages, ...prev]);
      setCurrentPage(page);
    }
  } catch (error) {
    console.error('Load messages error:', error);
  }
};
```

### Display Read Receipts
```javascript
// In MessageItem component
const MessageItem = ({ message, isMe }) => {
  const renderCheckmark = () => {
    if (isMe) {
      return (
        <Ionicons
          name={message.isRead ? "checkmark-done" : "checkmark"}
          size={12}
          color={message.isRead ? "#4ECDC4" : "#999"}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.messageContainer}>
      <Text>{message.content}</Text>
      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </Text>
        {renderCheckmark()}
      </View>
    </View>
  );
};
```

### Handle Typing Indicator
```javascript
// In ChatScreen.js
import { useChat } from '../context/ChatContext';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ route }) => {
  const { matchId, otherUser } = route.params;
  const { startTyping, stopTyping, otherUserTyping } = useChat();
  const [messageText, setMessageText] = useState('');
  const typingTimeoutRef = useRef();

  const handleTextChange = (text) => {
    setMessageText(text);

    // Start typing if not already
    if (text.trim() && !typingTimeoutRef.current) {
      startTyping();
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = null;
    }, 1000);
  };

  return (
    <View>
      <Text style={styles.userName}>{otherUser.name}</Text>
      {otherUserTyping && (
        <Text style={styles.typingIndicator}>typing...</Text>
      )}
      {/* Messages and input */}
    </View>
  );
};
```

---

## 3. Image Sharing Examples

### Send Image from Library
```javascript
// In ChatScreen.js
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '../context/ChatContext';

const handlePickImage = async () => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Photo library access required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      sendImageMessage(matchId, asset.uri, {
        caption: 'Shared an image',
        width: asset.width,
        height: asset.height,
        mimeType: asset.type === 'image' ? 'image/jpeg' : asset.type
      });
    }
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert('Error', 'Failed to pick image');
  }
};
```

### Take Photo with Camera
```javascript
// In ChatScreen.js
import * as ImagePicker from 'expo-image-picker';

const handleTakePicture = async () => {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera access required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      sendImageMessage(matchId, asset.uri, {
        caption: 'Shared a photo',
        width: asset.width,
        height: asset.height
      });
    }
  } catch (error) {
    console.error('Camera error:', error);
    Alert.alert('Error', 'Failed to take photo');
  }
};
```

### Display Image in Message
```javascript
// In MessageItem component
import { Image } from 'react-native';

const MessageItem = ({ message, isMe }) => {
  if (message.type === 'image' || message.type === 'gif') {
    return (
      <View style={styles.messageContainer}>
        <Image
          source={{ uri: message.imageUrl }}
          style={styles.messageImage}
          resizeMode="cover"
        />
        {message.content && (
          <Text style={styles.caption}>{message.content}</Text>
        )}
        <Text style={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </Text>
      </View>
    );
  }

  // Text message rendering
  return (
    // ...
  );
};

const styles = StyleSheet.create({
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    marginBottom: 4,
  }
});
```

---

## 4. Socket.io Event Examples

### Listen for New Messages
```javascript
// In ChatContext.js
useEffect(() => {
  if (!socket) return;

  socket.on('new_message', (data) => {
    const { message } = data;

    // Add to messages
    setMessages(prev => {
      // Check for duplicates
      const exists = prev.some(m => m._id === message._id);
      return exists ? prev : [...prev, message];
    });

    // Update conversation list
    setConversations(prev => prev.map(conv => {
      if (conv.matchId === message.matchId) {
        return {
          ...conv,
          latestMessage: {
            content: message.content,
            type: message.type,
            createdAt: message.createdAt
          },
          unreadCount: conv.unreadCount + 1
        };
      }
      return conv;
    }));
  });

  return () => {
    socket.off('new_message');
  };
}, [socket]);
```

### Listen for Typing Events
```javascript
// In ChatContext.js
useEffect(() => {
  if (!socket) return;

  socket.on('user_typing', (data) => {
    const { userId, isTyping } = data;
    
    // Only update if not current user
    if (userId !== currentUser.uid) {
      setOtherUserTyping(isTyping);
    }
  });

  return () => {
    socket.off('user_typing');
  };
}, [socket, currentUser.uid]);
```

### Listen for Read Receipts
```javascript
// In ChatContext.js
useEffect(() => {
  if (!socket) return;

  socket.on('message_read_receipt', (data) => {
    const { messageId, readBy, readAt } = data;

    // Update message
    setMessages(prev => 
      prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, isRead: true, readAt, readBy }
          : msg
      )
    );
  });

  return () => {
    socket.off('message_read_receipt');
  };
}, [socket]);
```

### Join Chat Room
```javascript
// In ChatScreen.js
useEffect(() => {
  if (!matchId) return;

  // Join room
  joinRoom(matchId);

  // Clean up when leaving
  return () => {
    // Optional: emit leave_room event
  };
}, [matchId, joinRoom]);
```

---

## 5. Error Handling

### Location Error Handling
```javascript
const getLocationWithFallback = async () => {
  try {
    const location = await LocationService.getCurrentLocation();
    
    if (!location) {
      // User denied permission
      Alert.alert(
        'Location Access Needed',
        'Please enable location services to see nearby matches',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              // Open app settings (platform specific)
            }
          }
        ]
      );
      return null;
    }

    return location;
  } catch (error) {
    console.error('Location error:', error);
    Alert.alert('Error', 'Unable to get location');
    return null;
  }
};
```

### Message Sending Error Handling
```javascript
const handleSendMessage = async () => {
  if (!messageText.trim()) {
    Alert.alert('Empty Message', 'Please type something');
    return;
  }

  if (!isConnected) {
    Alert.alert(
      'Connection Error',
      'Not connected to chat server. Retrying...',
      [{ text: 'OK' }]
    );
    return;
  }

  if (messageText.length > 1000) {
    Alert.alert('Message Too Long', 'Maximum 1000 characters');
    return;
  }

  try {
    sendMessage(matchId, messageText.trim());
    setMessageText('');
  } catch (error) {
    console.error('Send message error:', error);
    Alert.alert('Error', 'Failed to send message');
  }
};
```

### Image Upload Error Handling
```javascript
const handleImageUpload = async (imageUri) => {
  try {
    // Validate
    if (!imageUri) {
      throw new Error('No image selected');
    }

    // Size check (example: max 5MB)
    const fileSize = await getFileSizeInBytes(imageUri);
    if (fileSize > 5 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Maximum 5MB allowed');
      return;
    }

    // Send
    sendImageMessage(matchId, imageUri, {
      caption: 'Image from camera'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    Alert.alert('Error', error.message || 'Failed to upload image');
  }
};
```

---

## 6. Complete Component Example

### Full ChatScreen Component Integration
```javascript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const ChatScreen = ({ route, navigation }) => {
  const { matchId, otherUser } = route.params;
  const { currentUser } = useAuth();
  const {
    messages,
    sendMessage,
    sendImageMessage,
    loadMessages,
    joinRoom,
    startTyping,
    stopTyping,
    sendReadReceipt,
    otherUserTyping,
    isConnected
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef();

  // Initialize
  useEffect(() => {
    initChat();
  }, [matchId]);

  const initChat = async () => {
    try {
      setLoading(true);
      joinRoom(matchId);
      await loadMessages(matchId, 1);
    } catch (error) {
      console.error('Init error:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send read receipts
  const handleMessageDisplay = useCallback((message) => {
    if (!message.isRead && message.receiverId === currentUser.uid) {
      setTimeout(() => {
        sendReadReceipt(message._id);
      }, 500);
    }
  }, [currentUser.uid, sendReadReceipt]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !isConnected) return;

    sendMessage(matchId, messageText.trim());
    setMessageText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping();
  };

  const handleTextChange = (text) => {
    setMessageText(text);

    if (text.trim() && !typingTimeoutRef.current) {
      startTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handlePickImage = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Photo library access needed');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const { uri, width, height } = result.assets[0];
        sendImageMessage(matchId, uri, { caption: 'Shared image', width, height });
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUser.uid;
    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    useEffect(() => {
      handleMessageDisplay(item);
    }, [item._id, item.isRead]);

    if (item.type === 'image' || item.type === 'gif') {
      return (
        <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
          {item.content && <Text style={styles.caption}>{item.content}</Text>}
          <Text style={styles.timestamp}>{time}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
        <LinearGradient
          colors={isMe ? ['#667eea', '#764ba2'] : ['#fff', '#fff']}
          style={styles.messageBubble}
        >
          <Text style={isMe ? styles.myText : styles.theirText}>{item.content}</Text>
          <View style={styles.messageFooter}>
            <Text style={isMe ? styles.myTime : styles.theirTime}>{time}</Text>
            {isMe && (
              <Ionicons
                name={item.isRead ? "checkmark-done" : "checkmark"}
                size={12}
                color={item.isRead ? "#4ECDC4" : "rgba(255,255,255,0.6)"}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{otherUser.name}</Text>
            {otherUserTyping && <Text style={styles.typing}>typing...</Text>}
          </View>
          <View style={{ width: 24 }} />
        </LinearGradient>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.messagesList}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handlePickImage}>
            <Ionicons name="image" size={24} color="#667eea" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity onPress={handleSendMessage} disabled={!isConnected}>
            <Ionicons
              name="send"
              size={20}
              color={isConnected ? "#667eea" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  typing: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  messagesList: {
    padding: 15,
    flexGrow: 1,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myWrapper: {
    alignSelf: 'flex-end',
  },
  theirWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myText: {
    color: '#fff',
    fontSize: 16,
  },
  theirText: {
    color: '#333',
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  caption: {
    fontSize: 14,
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  myTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  theirTime: {
    fontSize: 11,
    color: '#999',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
```

---

## Summary

This guide provides practical code examples for implementing all geolocation and messaging features. Copy-paste these examples and adapt them to your specific needs.

For more details, refer to:
- `GEOLOCATION_MESSAGING_IMPLEMENTATION.md` - Complete documentation
- `QUICK_REFERENCE_GEOLOCATION_MESSAGING.md` - Quick reference
