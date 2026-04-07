/* eslint-disable sonarjs/cognitive-complexity */
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
import EmptyState from '../../../components/common/EmptyState';
import ModernCard from '../../../components/ModernCard';
import { Colors } from '../../../constants/colors';
import DESIGN_TOKENS from '../../../constants/designTokens';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';
import { DEMO_MATCHES, DEMO_LIKES_RECEIVED } from '../data/demoMatches';
import { useMatches } from '../hooks/useMatches';

const PLACEHOLDER_THUMB = require('../../../../assets/icon.png');

const MatchesScreen = () => {
  const navigation = useNavigation();
  const { currentUser, authToken } = useAuth();
  const { conversations, loadConversations } = useChat();

  // UI-only state — data is managed by TanStack Query via useMatches
  const [showLikes, setShowLikes] = useState(false);
  const [convsLoading, setConvsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    isPremium,
    receivedLikes,
    isLoading: matchesLoading,
    likesError,
    unmatch,
    refresh: refreshMatches,
  } = useMatches({ userId: currentUser?.uid, authToken, conversations });

  const loading = convsLoading || matchesLoading;

  // Load conversations from ChatContext when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchConvs = async () => {
        setConvsLoading(true);
        try {
          await loadConversations();
        } finally {
          if (active) setConvsLoading(false);
        }
      };
      fetchConvs();
      return () => { active = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadConversations();
      refreshMatches();
    } finally {
      setRefreshing(false);
    }
  }, [loadConversations, refreshMatches]);

  const renderConversation = ({ item }) => (
    <View style={styles.cardWrapper}>
      <ModernCard style={styles.matchCard}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('ViewProfile', { userId: item.otherUser._id })}
          activeOpacity={0.8}
        >
          <View style={styles.imageContainer}>
            <Image
              source={
                item.otherUser.photos?.[0]?.url
                  ? { uri: item.otherUser.photos[0].url }
                  : item.otherUser.photos?.[0]
                    ? { uri: item.otherUser.photos[0] }
                    : process.env.EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL
                      ? { uri: process.env.EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL }
                      : PLACEHOLDER_THUMB
              }
              style={styles.matchImage}
            />
            <View style={styles.onlineIndicator} />
          </View>
        </TouchableOpacity>

        <View style={styles.matchInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.matchName} numberOfLines={1}>
              {item.otherUser?.name || 'Unknown'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.matchAgeText}>
            {item.otherUser?.age ? `${item.otherUser.age}` : ''}
          </Text>
          <View style={styles.matchDetails}>
            {item.latestMessage ? (
              <Text style={styles.lastMessage} numberOfLines={2}>
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
            style={styles.iconPill}
          >
            <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ViewProfile', {
                userId: item.otherUser._id,
                showCompatibility: true,
              })
            }
            activeOpacity={0.8}
            style={styles.iconPill}
          >
            <Ionicons name="heart" size={18} color={Colors.accent.pink} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Chat', {
                matchId: item.matchId,
                otherUser: item.otherUser,
              })
            }
            activeOpacity={0.8}
            style={styles.chatPill}
          >
            <LinearGradient
              colors={DESIGN_TOKENS.colors.gradients.matches}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chatPillGradient}
            >
              <Ionicons name="chatbubble" size={18} color={Colors.text.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ModernCard>
    </View>
  );

  const handleUnmatch = (targetUserId, userName) => {
    Alert.alert(
      'Unmatch Confirmation',
      `Are you sure you want to unmatch with ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: () =>
            unmatch(
              { currentUserId: currentUser.uid, targetUserId },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'You have unmatched');
                  onRefresh();
                },
                onError: () => Alert.alert('Error', 'Failed to unmatch'),
              }
            ),
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
    <LinearGradient colors={DESIGN_TOKENS.colors.gradients.matches} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {showLikes ? 'People Who Liked You' : 'Your Conversations'}
        </Text>
        <Text style={styles.subtitle}>
          {showLikes
            ? `${receivedLikes.length} ${receivedLikes.length === 1 ? 'like' : 'likes'}`
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
      {likesError && (
        <View style={styles.backendWarning}>
          <Ionicons name="cloud-offline" size={16} color={Colors.background.white} />
          <Text style={styles.backendWarningText}>Network issue — using demo data</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.backendRetry}>
            <Text style={styles.backendRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {showLikes ? (
        receivedLikes.length === 0 ? (
          <FlatList
            data={DEMO_LIKES_RECEIVED}
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
                          PLACEHOLDER_THUMB,
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
                      {item.type === 'superlike' ? 'Super liked' : 'Liked'} on{' '}
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.demoLabel, { marginBottom: 10 }]}>
                📌 Demo Likes - Premium users can see who liked them
              </Text>
            }
          />
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
                          PLACEHOLDER_THUMB,
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
                      {item.type === 'superlike' ? 'Super liked' : 'Liked'} on{' '}
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {item.matchId ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('Chat', {
                        matchId: item.matchId,
                        otherUser: {
                          _id: item.user?.id,
                          name: item.user?.name,
                          photoURL: item.user?.photoURL,
                        },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={Colors.gradient.primary} style={styles.chatButton}>
                      <Ionicons name="chatbubble" size={20} color={Colors.background.white} />
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.chatButtonDisabled}>
                    <Ionicons name="chatbubble-outline" size={20} color={Colors.text.tertiary} />
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.user?.id || item._id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )
      ) : conversations.length === 0 ? (
        <FlatList
          data={DEMO_MATCHES}
          renderItem={renderConversation}
          keyExtractor={(item) => item.matchId}
          numColumns={2}
          columnWrapperStyle={styles.column}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.demoLabel, { marginBottom: 15 }]}>
              📌 Demo Matches - Start swiping to see your real matches here!
            </Text>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.matchId}
          numColumns={2}
          columnWrapperStyle={styles.column}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
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
    padding: 24,
    paddingTop: 54,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.background.white,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  backendWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.accent.red,
    gap: 8,
  },
  backendWarningText: {
    flex: 1,
    color: Colors.background.white,
    fontSize: 13,
    fontWeight: '600',
  },
  backendRetry: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background.white,
  },
  backendRetryText: {
    color: Colors.accent.red,
    fontWeight: '700',
    fontSize: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 3,
    marginTop: 14,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 13,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background.white,
    marginLeft: 4,
  },
  toggleTextActive: {
    color: Colors.text.dark,
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
    paddingHorizontal: 16,
    paddingTop: 10,
    flexGrow: 1,
  },
  column: {
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
    padding: 6,
  },
  matchCard: {
    padding: 12,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  profileButton: {
    marginBottom: 4,
  },
  matchImage: {
    width: '100%',
    height: 160,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    borderWidth: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconPill: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F5F6FF',
    borderWidth: 1,
    borderColor: '#E8EAF6',
  },
  chatPill: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  chatPillGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.gold,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  matchInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
    flex: 1,
    letterSpacing: -0.2,
  },
  matchAgeText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
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
  lastMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  noMessages: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Colors.text.white,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default MatchesScreen;
