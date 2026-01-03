import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PremiumService } from '../services/PremiumService';

const MatchesScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [receivedLikes, setReceivedLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [])
  );

  const loadMatches = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const matchIds = userDoc.data()?.matches || [];

      // Load premium status
      const premiumStatus = await PremiumService.checkPremiumStatus(currentUser.uid);
      setIsPremium(premiumStatus.isPremium);

      // Load received likes for premium users
      if (premiumStatus.features.seeWhoLikedYou) {
        const likes = await PremiumService.getReceivedSuperLikes(currentUser.uid);
        setReceivedLikes(likes);
      }

      if (matchIds.length === 0) {
        setMatches([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const matchesData = [];
      for (const matchId of matchIds) {
        const matchDoc = await getDoc(doc(db, 'users', matchId));
        if (matchDoc.exists()) {
          matchesData.push({ id: matchDoc.id, ...matchDoc.data() });
        }
      }

      setMatches(matchesData);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading matches:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
  };

  const renderMatch = ({ item }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => navigation.navigate('Chat', { userId: item.id, userName: item.name })}
      activeOpacity={0.8}
    >
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('ViewProfile', { userId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.photoURL || 'https://via.placeholder.com/100' }}
            style={styles.matchImage}
          />
          <View style={styles.onlineIndicator} />
        </View>
      </TouchableOpacity>
      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{item.name}</Text>
        <View style={styles.matchDetails}>
          {item.age && <Text style={styles.matchAge}>{item.age} years old</Text>}
          {item.bio && (
            <Text style={styles.matchBio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('Chat', { userId: item.id, userName: item.name })}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.chatButton}
        >
          <Ionicons name="chatbubble" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="heart" size={60} color="#fff" />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{showLikes ? 'People Who Liked You' : 'Your Matches'}</Text>
        <Text style={styles.subtitle}>
          {showLikes ? `${receivedLikes.length} likes` : `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`}
        </Text>

        {isPremium && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !showLikes && styles.toggleButtonActive]}
              onPress={() => setShowLikes(false)}
            >
              <Ionicons name="heart" size={16} color={!showLikes ? '#fff' : '#667eea'} />
              <Text style={[styles.toggleText, !showLikes && styles.toggleTextActive]}>
                Matches
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, showLikes && styles.toggleButtonActive]}
              onPress={() => setShowLikes(true)}
            >
              <Ionicons name="star" size={16} color={showLikes ? '#fff' : '#FFD700'} />
              <Text style={[styles.toggleText, showLikes && styles.toggleTextActive]}>
                Likes
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {showLikes ? (
        receivedLikes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyCard}
            >
              <Ionicons name="star-outline" size={80} color="#fff" />
              <Text style={styles.emptyTitle}>No likes yet</Text>
              <Text style={styles.emptyText}>
                When someone super likes you, they'll appear here!{'\n'}
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
                      source={{ uri: item.user.photoURL || 'https://via.placeholder.com/100' }}
                      style={styles.matchImage}
                    />
                    <View style={[styles.onlineIndicator, { backgroundColor: '#FFD700' }]} />
                  </View>
                </TouchableOpacity>
                <View style={styles.matchInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.matchName}>{item.user.name}</Text>
                    {item.user.age && <Text style={styles.matchAge}>, {item.user.age}</Text>}
                    <View style={[styles.superLikeBadge]}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                    </View>
                  </View>
                  <View style={styles.matchDetails}>
                    <Text style={styles.likeTime}>
                      Super liked you {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Chat', { userId: item.user.id, userName: item.user.name })}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.chatButton}
                  >
                    <Ionicons name="chatbubble" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.user.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )
      ) : matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.emptyCard}
          >
            <Ionicons name="heart-outline" size={80} color="#fff" />
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>
              Keep swiping to find your perfect match!{'\n'}
              When you both like each other, you'll see them here.
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 4,
  },
  toggleTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
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
    borderColor: '#667eea',
  },
  chatButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
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
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: '#fff',
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
    color: '#333',
  },
  matchDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  matchAge: {
    fontSize: 15,
    color: '#667eea',
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
    borderColor: '#FFD700',
  },
  likeTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  matchBio: {
    fontSize: 14,
    color: '#999',
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MatchesScreen;
