import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import logger from '../utils/logger';

// Chat Components
import AnimatedTypingIndicator, { HeaderTypingIndicator } from '../components/Chat/AnimatedTypingIndicator';
import ChatThemes, { CHAT_THEMES, useChatTheme } from '../components/Chat/ChatThemes';
import MessageReactions, { QuickReactionButton, REACTIONS } from '../components/Chat/MessageReactions';
import MessageScheduler, { ScheduledMessagesList } from '../components/Chat/MessageScheduler';

const EnhancedChatScreen = ({ route, navigation }) => {
  const { matchId, otherUser } = route.params;
  const { currentUser } = useAuth();
  const {
    messages,
    sendMessage: chatSendMessage,
    sendImageMessage,
    loadMessages: chatLoadMessages,
    joinRoom,
    startTyping,
    stopTyping,
    sendReadReceipt,
    otherUserTyping,
    isConnected,
  } = useChat();

  // Message State
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  
  // UI State
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showScheduledMessages, setShowScheduledMessages] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [messageReactions, setMessageReactions] = useState({});
  
  // Chat Theme
  const { currentTheme } = useChatTheme();
  
  // Refs
  const flatListRef = useRef();
  const typingTimeoutRef = useRef();
  const readReceiptTimers = useRef(new Map());

  // Load messages
  const loadMessages = useCallback(
    async (loadMore = false) => {
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
          setHasMoreMessages(newMessages && newMessages.length === 50);
        } else {
          setPage(1);
          setHasMoreMessages(newMessages && newMessages.length === 50);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      } catch (error) {
        logger.error('Error loading messages:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [matchId, page, chatLoadMessages]
  );

  // Initialize chat
  useEffect(() => {
    if (matchId) {
      joinRoom(matchId);
      loadMessages();
    }
  }, [matchId, joinRoom, loadMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      const timeoutId = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, loading]);

  // Handle sending message
  const handleSendMessage = () => {
    if (messageText.trim() === '' || !matchId) return;

    chatSendMessage(matchId, messageText.trim());
    setMessageText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping();
  };

  // Handle scheduled message
  const handleScheduleMessage = (scheduledData) => {
    setScheduledMessages(prev => [
      ...prev,
      {
        id: `scheduled_${Date.now()}`,
        ...scheduledData,
        matchId,
        status: 'scheduled',
      }
    ]);
    setShowScheduler(false);
    Alert.alert(
      'Message Scheduled ⏰',
      `Your message will be sent on ${scheduledData.date.toLocaleDateString()} at ${scheduledData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    );
  };

  // Handle message reaction
  const handleReaction = (messageId, reactionId) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [reactionId]: (prev[messageId]?.[reactionId] || 0) + 1,
        myReactions: [...(prev[messageId]?.myReactions || []), reactionId],
      }
    }));
    setShowReactionPicker(false);
    setSelectedMessage(null);
    
    // TODO: Send reaction to backend
    // chatService.addReaction(matchId, messageId, reactionId);
  };

  // Handle message long press
  const handleMessageLongPress = (message) => {
    setSelectedMessage(message);
    setShowReactionPicker(true);
  };

  // Handle text change with typing indicator
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

  // Handle image pick
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        sendImageMessage(matchId, result.assets[0].uri, {
          caption: 'Shared an image',
          width: result.assets[0].width,
          height: result.assets[0].height,
        });
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Load more messages
  const loadMoreMessages = () => {
    if (!loadingMore && hasMoreMessages && messages.length > 0) {
      loadMessages(true);
    }
  };

  // Get theme styles
  const getThemeStyles = () => {
    if (currentTheme) {
      const foundTheme = CHAT_THEMES.find(t => t.id === currentTheme);
      if (foundTheme) return foundTheme;
    }
    return CHAT_THEMES[0] || null;
  };

  const themeStyles = getThemeStyles();

  // Render message item
  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUser.uid;
    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const reactions = messageReactions[item._id] || {};
    const reactionEntries = Object.entries(reactions).filter(([key]) => key !== 'myReactions');

    // Send read receipt for unread messages
    if (!isMe && !item.isRead && matchId) {
      const existingTimer = readReceiptTimers.current.get(item._id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      const timer = setTimeout(() => {
        sendReadReceipt(item._id);
        readReceiptTimers.current.delete(item._id);
      }, 500);
      readReceiptTimers.current.set(item._id, timer);
    }

    return (
      <Pressable
        onLongPress={() => handleMessageLongPress(item)}
        style={[
          styles.messageWrapper,
          isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
        ]}
      >
        {item.type === 'image' || item.type === 'gif' ? (
          <View style={styles.imageMessageWrapper}>
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
            {item.content && (
              <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>
                {item.content}
              </Text>
            )}
            <Text style={isMe ? styles.myTimestamp : styles.theirTimestamp}>{time}</Text>
          </View>
        ) : isMe ? (
          <LinearGradient 
            colors={themeStyles.messageBubble?.gradient || ['#667eea', '#764ba2']} 
            style={styles.myMessage}
          >
            <Text style={styles.myMessageText}>{item.content}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.myTimestamp}>{time}</Text>
              {item.isRead ? (
                <Ionicons name="checkmark-done" size={12} color="rgba(255, 255, 255, 0.8)" style={{ marginLeft: 5 }} />
              ) : (
                <Ionicons name="checkmark" size={12} color="rgba(255, 255, 255, 0.6)" style={{ marginLeft: 5 }} />
              )}
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.theirMessage, { backgroundColor: themeStyles.receiverBubbleColor || '#f0f0f0' }]}>
            <Text style={[styles.theirMessageText, { color: themeStyles.receiverTextColor || '#333' }]}>
              {item.content}
            </Text>
            <Text style={styles.theirTimestamp}>{time}</Text>
          </View>
        )}

        {/* Message Reactions Display */}
        {reactionEntries.length > 0 && (
          <View style={[styles.reactionsContainer, isMe ? styles.reactionsRight : styles.reactionsLeft]}>
            {reactionEntries.map(([reactionId, count]) => {
              const reaction = REACTIONS.find(r => r.id === reactionId);
              if (!reaction || count === 0) return null;
              return (
                <View key={reactionId} style={styles.reactionBubble}>
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Reaction Button */}
        <QuickReactionButton
          onPress={() => handleMessageLongPress(item)}
          style={isMe ? styles.quickReactionRight : styles.quickReactionLeft}
        />
      </Pressable>
    );
  };

  // Render header options menu
  const renderHeaderMenu = () => (
    <View style={styles.headerMenu}>
      <TouchableOpacity 
        style={styles.headerMenuButton}
        onPress={() => setShowThemePicker(true)}
      >
        <Ionicons name="color-palette" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.headerMenuButton}
        onPress={() => setShowScheduledMessages(true)}
      >
        <Ionicons name="time" size={20} color="#fff" />
        {scheduledMessages.length > 0 && (
          <View style={styles.scheduledBadge}>
            <Text style={styles.scheduledBadgeText}>{scheduledMessages.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor || '#f5f7fa' }]}>
      {/* Background Pattern */}
      {themeStyles.pattern && (
        <View style={styles.patternOverlay}>
          <Text style={styles.patternText}>
            {Array(100).fill(themeStyles.pattern).join(' ')}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.headerIndicator, { backgroundColor: isConnected ? '#4ECDC4' : '#FF6B6B' }]} />
            <View>
              <Text style={styles.headerTitle}>{otherUser?.name || 'Chat'}</Text>
              {otherUserTyping && (
                <HeaderTypingIndicator 
                  userName={otherUser?.name} 
                  animationType="dots"
                />
              )}
            </View>
          </View>
          {renderHeaderMenu()}
        </LinearGradient>

        {/* Messages List */}
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

        {/* Typing Indicator */}
        {otherUserTyping && (
          <View style={styles.typingContainer}>
            <AnimatedTypingIndicator 
              isVisible={true}
              userName={otherUser?.name}
              animationType="wave"
            />
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
            <Ionicons name="image" size={24} color="#667eea" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={messageText}
              onChangeText={handleTextChange}
              multiline
              maxLength={1000}
            />
          </View>

          {messageText.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.sendButtonGradient}>
                <Ionicons name="send" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.scheduleButton} onPress={() => setShowScheduler(true)}>
              <Ionicons name="time-outline" size={24} color="#667eea" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Reaction Picker Modal */}
      <Modal
        visible={showReactionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowReactionPicker(false);
          setSelectedMessage(null);
        }}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            setShowReactionPicker(false);
            setSelectedMessage(null);
          }}
        >
          <View style={styles.reactionPickerContainer}>
            <MessageReactions
              messageId={selectedMessage?._id}
              onReact={(reactionId) => handleReaction(selectedMessage?._id, reactionId)}
              existingReactions={messageReactions[selectedMessage?._id] || {}}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Message Scheduler Modal */}
      <Modal
        visible={showScheduler}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScheduler(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Message</Text>
            <TouchableOpacity onPress={() => setShowScheduler(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <MessageScheduler
            onSchedule={handleScheduleMessage}
            onCancel={() => setShowScheduler(false)}
          />
        </View>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chat Theme</Text>
            <TouchableOpacity onPress={() => setShowThemePicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ChatThemes onClose={() => setShowThemePicker(false)} />
        </View>
      </Modal>

      {/* Scheduled Messages Modal */}
      <Modal
        visible={showScheduledMessages}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScheduledMessages(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scheduled Messages</Text>
            <TouchableOpacity onPress={() => setShowScheduledMessages(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScheduledMessagesList
            messages={scheduledMessages}
            onCancel={(id) => {
              setScheduledMessages(prev => prev.filter(m => m.id !== id));
              Alert.alert('Cancelled', 'Scheduled message has been cancelled');
            }}
            onEdit={(message) => {
              setScheduledMessages(prev => prev.filter(m => m.id !== message.id));
              setShowScheduledMessages(false);
              setMessageText(message.message);
              setTimeout(() => setShowScheduler(true), 300);
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    overflow: 'hidden',
  },
  patternText: {
    fontSize: 30,
    lineHeight: 40,
    color: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerMenu: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMenuButton: {
    padding: 8,
    marginLeft: 5,
  },
  scheduledBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B6B',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduledBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#667eea',
    fontSize: 16,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadMoreText: {
    marginLeft: 10,
    color: '#667eea',
    fontSize: 14,
  },
  messageWrapper: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
  },
  myMessage: {
    borderRadius: 20,
    borderBottomRightRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minWidth: 80,
  },
  theirMessage: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minWidth: 80,
  },
  myMessageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  theirMessageText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  theirTimestamp: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  imageMessageWrapper: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 15,
  },
  reactionsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  reactionsRight: {
    right: 10,
  },
  reactionsLeft: {
    left: 10,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  quickReactionRight: {
    position: 'absolute',
    left: -30,
    top: '50%',
    marginTop: -12,
  },
  quickReactionLeft: {
    position: 'absolute',
    right: -30,
    top: '50%',
    marginTop: -12,
  },
  typingContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attachButton: {
    padding: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    maxHeight: 80,
  },
  sendButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleButton: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
});

export default EnhancedChatScreen;
