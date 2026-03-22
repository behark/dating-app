/* eslint-disable sonarjs/cognitive-complexity, react-hooks/rules-of-hooks */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EmptyState from '../../../components/common/EmptyState';
import { Colors } from '../../../constants/colors';
import DESIGN_TOKENS from '../../../constants/designTokens';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';
import AnalyticsService from '../../../services/AnalyticsService';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { showStandardError } from '../../../utils/errorHandler';
import { getUserFriendlyMessage } from '../../../utils/errorMessages';
import HapticFeedback from '../../../utils/haptics';
import logger from '../../../utils/logger';

const ChatScreen = ({ route, navigation }) => {
  const { matchId, otherUser } = route.params || {};
  const { currentUser } = useAuth();
  const { isOnline } = useNetworkStatus();
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

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const readReceiptTimers = useRef(new Map());
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef();

  // Early return if no matchId (after all hooks)
  if (!matchId) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Conversation not found</Text>
      </View>
    );
  }

  // Load messages for this match
  const loadMessages = useCallback(
    async (loadMore = false) => {
      if (!matchId) {
        Alert.alert('Error', 'Invalid conversation. Please go back and try again.');
        navigation.goBack();
        return;
      }

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
        logger.error('Error loading messages:', error);

        if (!loadMore) {
          // Initial load failure - show alert with retry option
          const message = getUserFriendlyMessage(error, 'load');
          Alert.alert('Unable to Load Messages', message, [
            {
              text: 'Retry',
              onPress: () => loadMessages(false),
            },
            {
              text: 'Go Back',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          // Load more failure - show less intrusive message
          showStandardError(error, 'load', 'Unable to Load');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [matchId, page, chatLoadMessages, navigation]
  );

  // Initialize chat room and load messages
  useEffect(() => {
    // Track screen view for analytics
    AnalyticsService.logScreenView('Chat');

    if (matchId) {
      joinRoom(matchId);
      loadMessages();
    }
  }, [matchId, joinRoom, loadMessages]);

  // Cleanup read receipt timers on unmount to prevent memory leaks
  useEffect(() => {
    const timers = readReceiptTimers.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

    // Check network status before sending
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Haptic feedback for sending message
    HapticFeedback.mediumImpact();

    // Track message sent analytics
    AnalyticsService.logMessageSent(matchId, 'text');

    chatSendMessage(matchId, messageText.trim());
    setMessageText('');

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping();
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Check network status before sending
        if (!isOnline) {
          Alert.alert(
            'No Internet Connection',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
          return;
        }

        const imageUri = result.assets[0].uri;

        // Track image message analytics
        AnalyticsService.logMessageSent(matchId, 'image');

        sendImageMessage(matchId, imageUri, {
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

  const handleTakePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        sendImageMessage(matchId, imageUri, {
          caption: 'Shared a photo',
          width: result.assets[0].width,
          height: result.assets[0].height,
        });
      }
    } catch (error) {
      logger.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleShowMediaOptions = () => {
    Alert.alert(
      'Share Media',
      'Choose how to share',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePicture,
          style: 'default',
        },
        {
          text: 'Choose from Library',
          onPress: handlePickImage,
          style: 'default',
        },
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
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

  const loadMoreMessages = useCallback(() => {
    if (!loadingMore && hasMoreMessages && messages.length > 0) {
      loadMessages(true);
    }
  }, [loadingMore, hasMoreMessages, messages.length, loadMessages]);

  // Estimated message height for getItemLayout optimization
  const MESSAGE_HEIGHT = 80;
  const getItemLayout = useCallback(
    (data, index) => ({
      length: MESSAGE_HEIGHT,
      offset: MESSAGE_HEIGHT * index,
      index,
    }),
    []
  );

  const renderMessage = useCallback(
    ({ item }) => {
      const isMe = item.senderId === currentUser.uid;
      const time = new Date(item.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const isDecryptionFailed = item._decryptionFailed === true;
      const displayContent = isDecryptionFailed
        ? '🔒 Message could not be decrypted'
        : item.content;
      const textStyle = isDecryptionFailed ? { fontStyle: 'italic', opacity: 0.8 } : {};

      // Send read receipt when message is rendered for non-sender
      // Use ref-based approach instead of useEffect in render function
      if (!isMe && !item.isRead && matchId) {
        // Clear existing timer for this message
        const existingTimer = readReceiptTimers.current.get(item._id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(() => {
          sendReadReceipt(item._id);
          readReceiptTimers.current.delete(item._id);
        }, 500);
        readReceiptTimers.current.set(item._id, timer);
      }

      return (
        <View
          style={[
            styles.messageWrapper,
            isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
          ]}
        >
          {item.type === 'image' || item.type === 'gif' ? (
            <View style={styles.imageMessageWrapper}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              {displayContent && (
                <Text style={[isMe ? styles.myMessageText : styles.theirMessageText, textStyle]}>
                  {displayContent}
                </Text>
              )}
              <Text style={isMe ? styles.myTimestamp : styles.theirTimestamp}>{time}</Text>
              {isMe && (
                <View style={styles.readReceiptContainer}>
                  {item.isRead ? (
                    <Ionicons name="checkmark-done" size={12} color="rgba(255, 255, 255, 0.8)" />
                  ) : (
                    <Ionicons name="checkmark" size={12} color="rgba(255, 255, 255, 0.6)" />
                  )}
                </View>
              )}
            </View>
          ) : isMe ? (
            <LinearGradient
              colors={DESIGN_TOKENS.colors.gradients.chat}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.myMessage}
            >
              <Text style={[styles.myMessageText, textStyle]}>{displayContent}</Text>
              <View style={styles.messageFooter}>
                <Text style={styles.myTimestamp}>{time}</Text>
                {item.isRead ? (
                  <Ionicons
                    name="checkmark-done"
                    size={12}
                    color="rgba(255, 255, 255, 0.8)"
                    style={styles.readStatusIcon}
                  />
                ) : (
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color="rgba(255, 255, 255, 0.6)"
                    style={styles.readStatusIcon}
                  />
                )}
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.theirMessage}>
              <Text style={[styles.theirMessageText, textStyle]}>{displayContent}</Text>
              <Text style={styles.theirTimestamp}>{time}</Text>
            </View>
          )}
        </View>
      );
    },
    [currentUser.uid, matchId, sendReadReceipt, readReceiptTimers]
  );

  return (
    <LinearGradient colors={DESIGN_TOKENS.colors.gradients.chat} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <LinearGradient
          colors={DESIGN_TOKENS.colors.gradients.chat}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.background.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View
              style={[
                styles.headerIndicator,
                { backgroundColor: isConnected ? Colors.accent.teal : Colors.accent.red },
              ]}
            />
            <View>
              <Text style={styles.headerTitle}>{otherUser?.name || 'Chat'}</Text>
              {otherUserTyping && <Text style={styles.typingIndicator}>typing...</Text>}
            </View>
          </View>
          <Ionicons
            name="heart"
            size={24}
            color={Colors.background.white}
            style={styles.headerIconPlaceholder}
          />
        </LinearGradient>

        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            {/* Chat skeleton loader */}
            <View style={styles.skeletonMessages}>
              {[0.6, 0.4, 0.7, 0.5, 0.3].map((widthFraction, i) => (
                <View
                  key={i}
                  style={[
                    styles.skeletonBubble,
                    i % 2 === 0 ? styles.skeletonLeft : styles.skeletonRight,
                    { width: `${widthFraction * 80}%` },
                  ]}
                />
              ))}
            </View>
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="Start the Conversation! 💬"
            description={`Say hi to ${otherUser?.name || 'your match'}! Break the ice with a friendly message or ask about their interests.`}
            buttonText="Send a Message"
            onButtonPress={() => {
              // Focus the input
              HapticFeedback.lightImpact();
            }}
            secondaryButtonText="View Profile"
            onSecondaryButtonPress={() => {
              HapticFeedback.lightImpact();
              navigation.navigate('ViewProfile', { userId: otherUser?._id });
            }}
            variant="simple"
            iconSize={64}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            getItemLayout={getItemLayout}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={20}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadMoreText}>Loading more messages...</Text>
                </View>
              ) : null
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleShowMediaOptions}
            activeOpacity={0.7}
          >
            <Ionicons name="image" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={handleTextChange}
              placeholder="Type a message..."
              placeholderTextColor={Colors.text.tertiary}
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
              colors={
                messageText.trim() && isConnected
                  ? DESIGN_TOKENS.colors.gradients.chat
                  : Colors.gradient.disabled
              }
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color={Colors.background.white} />
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
    backgroundColor: '#FAFBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 54,
    paddingBottom: 16,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  backButton: {
    marginRight: 14,
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent.teal,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background.white,
    letterSpacing: -0.2,
  },
  typingIndicator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headerIconPlaceholder: {
    opacity: 0,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 10,
    maxWidth: '78%',
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
    borderTopRightRadius: 6,
    maxWidth: '100%',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  theirMessage: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    maxWidth: '100%',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.06)',
  },
  myMessageText: {
    color: Colors.background.white,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  theirMessageText: {
    color: DESIGN_TOKENS.colors.text.primary,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 1,
  },
  readStatusIcon: {
    marginLeft: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    marginBottom: 8,
  },
  imageMessageWrapper: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    maxWidth: '100%',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  readReceiptContainer: {
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  myTimestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    fontWeight: '400',
  },
  theirTimestamp: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.text.tertiary,
    alignSelf: 'flex-end',
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FAFBFF',
  },
  skeletonMessages: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  skeletonBubble: {
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108,99,255,0.06)',
  },
  skeletonLeft: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
  },
  skeletonRight: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  loadMoreContainer: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    marginBottom: 8,
  },
  loadMoreText: {
    marginTop: 5,
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    alignItems: 'flex-end',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  mediaButton: {
    paddingRight: 8,
    paddingVertical: 10,
    paddingLeft: 2,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F5F6FF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E8EAF6',
    marginRight: 10,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: DESIGN_TOKENS.colors.text.primary,
    maxHeight: 100,
    letterSpacing: 0.1,
  },
  sendButton: {
    borderRadius: 22,
    overflow: 'hidden',
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
