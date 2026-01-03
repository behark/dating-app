import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ChatScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef();

  useEffect(() => {
    const chatId = [currentUser.uid, userId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return unsubscribe;
  }, [userId]);

  const sendMessage = async () => {
    if (messageText.trim() === '') return;

    try {
      const chatId = [currentUser.uid, userId].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');

      await addDoc(messagesRef, {
        text: messageText,
        senderId: currentUser.uid,
        receiverId: userId,
        createdAt: serverTimestamp(),
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUser.uid;
    const time = item.createdAt?.toDate?.().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) || 'Just now';
    
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
            <Text style={styles.myMessageText}>{item.text}</Text>
            <Text style={styles.myTimestamp}>{time}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.theirMessage}>
            <Text style={styles.theirMessageText}>{item.text}</Text>
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
            <View style={styles.headerIndicator} />
            <Text style={styles.headerTitle}>{userName}</Text>
          </View>
          <Ionicons name="heart" size={24} color="#fff" style={{ opacity: 0 }} />
        </LinearGradient>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!messageText.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={messageText.trim() ? ['#667eea', '#764ba2'] : ['#ccc', '#bbb']}
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
