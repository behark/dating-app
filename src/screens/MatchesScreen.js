import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { PremiumService } from '../services/PremiumService';
import { SwipeController } from '../services/SwipeController';
import { showStandardError } from '../utils/errorHandler';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';

const MatchesScreen = () => {
  const navigation = useNavigation();
  const { currentUser, authToken } = useAuth();
  const { conversations, loadConversations, unreadCount } = useChat();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [receivedLikes, setReceivedLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadConversationsList();
    }, [])
  );

  const loadConversationsList = async () => {
    try {
      setLoading(true);
      await loadConversations();
      // Load premium status
      try {
        const premiumStatus = await PremiumService.checkPremiumStatus(currentUser.uid, authToken);
        setIsPremium(premiumStatus.isPremium);
      } catch (error) {
        // Silently fail for premium status, don't break the app
        logger.error('Error loading premium status:', error);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      logger.error('Error loading conversations:', error);
      setLoading(false);
      setRefreshing(false);

      // Show user-friendly error message
      let errorMessage = 'Failed to load conversations.';
      if (error.statusCode === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.statusCode === 403) {
        errorMessage = "You don't have permission to view conversations.";
      } else if (error.statusCode === 404) {
        errorMessage = 'Conversations not found.';
      const errorMessage = getUserFriendlyMessage(error, 'load');
      Alert.alert('Unable to Load Matches', errorMessage, [
        {
          text: 'Retry',
          onPress: () => loadConversationsList(),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversationsList();
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() =>
        navigation.navigate('Chat', {
          matchId: item.matchId,
          otherUser: item.otherUser,
        })
      }
      activeOpacity={0.8}
    >
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('ViewProfile', { userId: item.otherUser._id })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.otherUser.photos?.[0]?.url ||
                item.otherUser.photos?.[0] ||
                process.env.EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL ||
                'https://via.placeholder.com/100',
            }}
            style={styles.matchImage}
          />
          <View style={styles.onlineIndicator} />
        </View>
      </TouchableOpacity>
      <View style={styles.matchInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.matchName}>{item.otherUser?.name || 'Unknown'}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.matchDetails}>
          {item.latestMessage ? (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.latestMessage.content}
            </Text>
          ) : (
            <Text style={styles.noMessages}>No messages yet</Text>
          )}
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => handleUnmatch(item.otherUser?._id, item.otherUser?.name)}
          activeOpacity={0.8}
          style={styles.unmatchButton}
        >
          <Ionicons name="close-circle" size={24} color={Colors.accent.red} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ViewProfile', {
              userId: item.otherUser._id,
              showCompatibility: true,
            })
          }
          activeOpacity={0.8}
          style={styles.compatibilityButton}
        >
          <Ionicons name="heart" size={20} color={Colors.accent.pink} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('SafetyAdvanced', {
              userId: currentUser.uid,
              isPremium: true,
              preSelectTab: 'date-plans',
            })
          }
          activeOpacity={0.8}
          style={styles.datePlanButton}
        >
          <Ionicons name="calendar" size={20} color={Colors.status.warning} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Chat', {
              matchId: item.matchId,
              otherUser: item.otherUser,
            })
          }
          activeOpacity={0.8}
        >
          <LinearGradient colors={Colors.gradient.primary} style={styles.chatButton}>
            <Ionicons name="chatbubble" size={20} color={Colors.text.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const handleUnmatch = (userId, userName) => {
    Alert.alert(
      'Unmatch Confirmation',
      `Are you sure you want to unmatch with ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await SwipeController.unmatch(currentUser.uid, userId);
              if (result.success) {
                Alert.alert('Success', 'You have unmatched');
                onRefresh();
              } else {
                Alert.alert('Error', result.error || 'Failed to unmatch');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to unmatch');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="heart" size={60} color={Colors.text.white} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {showLikes ? 'People Who Liked You' : 'Your Conversations'}
        </Text>
        <Text style={styles.subtitle}>
          {showLikes
            ? `${receivedLikes.length} likes`
            : `${conversations.length} ${conversations.length === 1 ? 'conversation' : 'conversations'}`}
        </Text>

        {isPremium && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !showLikes && styles.toggleButtonActive]}
              onPress={() => setShowLikes(false)}
            >
              <Ionicons
                name="heart"
                size={16}
                color={!showLikes ? Colors.text.white : Colors.primary}
              />
              <Text style={[styles.toggleText, !showLikes && styles.toggleTextActive]}>
                Matches
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, showLikes && styles.toggleButtonActive]}
              onPress={() => setShowLikes(true)}
            >
              <Ionicons
                name="star"
                size={16}
                color={showLikes ? Colors.text.white : Colors.accent.gold}
              />
              <Text style={[styles.toggleText, showLikes && styles.toggleTextActive]}>Likes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {showLikes ? (
        receivedLikes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={Colors.gradient.primary} style={styles.emptyCard}>
              <Ionicons name="star-outline" size={80} color={Colors.text.white} />
              <Text style={styles.emptyTitle}>No likes yet</Text>
              <Text style={styles.emptyText}>
                When someone super likes you, they&apos;ll appear here!{'\n'}
                Keep your profile updated to attract more likes.
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <FlatList
            data={receivedLikes}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.matchCard}
                onPress={() => navigation.navigate('ViewProfile', { userId: item.user.id })}
                activeOpacity={0.8}
              >
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => navigation.navigate('ViewProfile', { userId: item.user.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{
                        uri:
                          item.user.photoURL ||
                          process.env.EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL ||
                          'https://via.placeholder.com/100',
                      }}
                      style={styles.matchImage}
                    />
                    <View
                      style={[styles.onlineIndicator, { backgroundColor: Colors.accent.gold }]}
                    />
                  </View>
                </TouchableOpacity>
                <View style={styles.matchInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.matchName}>{item.user?.name || 'Unknown'}</Text>
                    {item.user?.age && <Text style={styles.matchAge}>, {item.user.age}</Text>}
                    <View style={[styles.superLikeBadge]}>
                      <Ionicons name="star" size={12} color={Colors.accent.gold} />
                    </View>
                  </View>
                  <View style={styles.matchDetails}>
                    <Text style={styles.likeTime}>
                      Super liked you {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Chat', {
                      userId: item.user?.id,
                      userName: item.user?.name,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={Colors.gradient.primary} style={styles.chatButton}>
                    <Ionicons name="chatbubble" size={20} color={Colors.background.white} />
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.user?.id || item._id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient colors={Colors.gradient.primary} style={styles.emptyCard}>
            <Ionicons name="heart-outline" size={80} color={Colors.text.white} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Start chatting with your matches!{'\n'}
              When you both like each other, you can start a conversation here.
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.matchId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 25,
    paddingTop: 50,
    paddingBottom: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text.dark,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.lightest,
    borderRadius: 20,
    padding: 4,
    marginTop: 15,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  toggleTextActive: {
    color: Colors.text.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: Colors.text.white,
    fontWeight: '600',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: Colors.background.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileButton: {
    marginRight: 15,
  },
  matchImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unmatchButton: {
    padding: 8,
  },
  compatibilityButton: {
    padding: 8,
  },
  datePlanButton: {
    padding: 8,
  },
  chatButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent.teal,
    borderWidth: 2,
    borderColor: Colors.background.white,
  },
  matchInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  matchName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  matchDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  matchAge: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 10,
  },
  superLikeBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent.gold,
  },
  likeTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  matchBio: {
    fontSize: 14,
    color: Colors.text.tertiary,
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  noMessages: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: Colors.accent.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Colors.text.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    shadowColor: Colors.background.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.white,
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.white90,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MatchesScreen;
