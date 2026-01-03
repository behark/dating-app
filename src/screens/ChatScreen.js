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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const ChatScreen = ({ route, navigation }) => {
  const { matchId, otherUser } = route.params;
  const { currentUser } = useAuth();
  const {
    messages,
    sendMessage: chatSendMessage,
    loadMessages: chatLoadMessages,
    joinRoom,
    startTyping,
    stopTyping,
    otherUserTyping,
    isConnected
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef();

  // Load messages for this match
  const loadMessages = useCallback(async (loadMore = false) => {
    if (!matchId) return;

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentPage = loadMore ? page + 1 : 1;
      const newMessages = await chatLoadMessages(matchId, currentPage);

      if (loadMore) {
        setPage(currentPage);
        setHasMoreMessages(newMessages && newMessages.length === 50); // Assuming 50 is the limit
      } else {
        setPage(1);
        setHasMoreMessages(newMessages && newMessages.length === 50);
        // Scroll to bottom after initial load
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [matchId, page, chatLoadMessages]);

  // Initialize chat room and load messages
  useEffect(() => {
    if (matchId) {
      joinRoom(matchId);
      loadMessages();
    }
  }, [matchId, joinRoom]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      const timeoutId = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, loading]);

  const handleSendMessage = () => {
    if (messageText.trim() === '' || !matchId) return;

    chatSendMessage(matchId, messageText.trim());
    setMessageText('');

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping();
  };

  const handleTextChange = (text) => {
    setMessageText(text);

    // Handle typing indicator
    if (text.trim() && !typingTimeoutRef.current) {
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const loadMoreMessages = () => {
    if (!loadingMore && hasMoreMessages && messages.length > 0) {
      loadMessages(true);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUser.uid;
    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
        ]}
      >
        {isMe ? (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.myMessage}
          >
            <Text style={styles.myMessageText}>{item.content}</Text>
            <Text style={styles.myTimestamp}>{time}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.theirMessage}>
            <Text style={styles.theirMessageText}>{item.content}</Text>
            <Text style={styles.theirTimestamp}>{time}</Text>
          </View>
        )}
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
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.headerIndicator, { backgroundColor: isConnected ? '#4ECDC4' : '#FF6B6B' }]} />
            <View>
              <Text style={styles.headerTitle}>{otherUser?.name || 'Chat'}</Text>
              {otherUserTyping && (
                <Text style={styles.typingIndicator}>typing...</Text>
              )}
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#fff" style={{ opacity: 0 }} />
        </LinearGradient>

        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color="#667eea" />
                  <Text style={styles.loadMoreText}>Loading more messages...</Text>
                </View>
              ) : null
            }
          />
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={handleTextChange}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || !isConnected}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={messageText.trim() && isConnected ? ['#667eea', '#764ba2'] : ['#ccc', '#bbb']}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  typingIndicator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  messagesList: {
    padding: 15,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  myMessage: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderTopRightRadius: 4,
    maxWidth: '100%',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  theirMessage: {
    backgroundColor: '#fff',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  theirMessageText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  myTimestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    alignSelf: 'flex-end',
  },
  theirTimestamp: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  loadMoreContainer: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadMoreText: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 10,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 25,
    overflow: 'hidden',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
