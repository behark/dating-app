import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, Text, Dimensions, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import SwipeCard from '../components/Card/SwipeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSwipedCard, setLastSwipedCard] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  const loadCards = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      // Check if user has completed profile
      const userData = userDoc.data();
      if (!userData?.name || !userData?.photoURL) {
        setLoading(false);
        return;
      }

      const swipedUsers = userData?.swipedUsers || [];
      const matches = userData?.matches || [];

      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      const availableUsers = [];
      querySnapshot.forEach((doc) => {
        const user = { id: doc.id, ...doc.data() };
        if (
          user.id !== currentUser.uid &&
          !swipedUsers.includes(user.id) &&
          !matches.includes(user.id) &&
          user.photoURL &&
          user.name
        ) {
          availableUsers.push(user);
        }
      });

      // Shuffle for variety
      const shuffled = availableUsers.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Error', 'Failed to load profiles');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCards();
    setRefreshing(false);
  };

  const handleSwipeRight = async (card) => {
    try {
      setLastSwipedCard({ card, direction: 'right' });
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const swipedUsers = userDoc.data()?.swipedUsers || [];
      
      await setDoc(userRef, {
        swipedUsers: [...swipedUsers, card.id],
      }, { merge: true });

      const otherUserRef = doc(db, 'users', card.id);
      const otherUserDoc = await getDoc(otherUserRef);
      const otherUserSwiped = otherUserDoc.data()?.swipedUsers || [];

      if (otherUserSwiped.includes(currentUser.uid)) {
        const matches = userDoc.data()?.matches || [];
        const otherMatches = otherUserDoc.data()?.matches || [];

        await setDoc(userRef, {
          matches: [...matches, card.id],
        }, { merge: true });

        await setDoc(otherUserRef, {
          matches: [...otherMatches, currentUser.uid],
        }, { merge: true });

        // Navigate to matches on match
        setTimeout(() => {
          Alert.alert(
            '🎉 It\'s a Match!',
            `You and ${card.name} liked each other!`,
            [
              { text: 'Keep Swiping', style: 'cancel' },
              { 
                text: 'View Match', 
                onPress: () => navigation.navigate('Matches')
              }
            ]
          );
        }, 500);
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  const handleSwipeLeft = async (card) => {
    try {
      setLastSwipedCard({ card, direction: 'left' });
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const swipedUsers = userDoc.data()?.swipedUsers || [];
      
      await setDoc(userRef, {
        swipedUsers: [...swipedUsers, card.id],
      }, { merge: true });

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  const handleButtonSwipe = (direction) => {
    if (cards.length > 0 && currentIndex < cards.length) {
      const card = cards[currentIndex];
      if (direction === 'right') {
        handleSwipeRight(card);
      } else {
        handleSwipeLeft(card);
      }
    }
  };

  const undoLastSwipe = async () => {
    if (lastSwipedCard && currentIndex > 0) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const swipedUsers = userDoc.data()?.swipedUsers || [];
        const filtered = swipedUsers.filter(id => id !== lastSwipedCard.card.id);
        
        await setDoc(userRef, {
          swipedUsers: filtered,
        }, { merge: true });

        setCurrentIndex(currentIndex - 1);
        setLastSwipedCard(null);
        Alert.alert('Undone', 'Last swipe has been undone');
      } catch (error) {
        console.error('Error undoing swipe:', error);
      }
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="heart" size={60} color="#fff" />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      </LinearGradient>
    );
  }

  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        setNeedsProfile(!userData?.name || !userData?.photoURL);
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };
    checkProfile();
  }, []);

  if (needsProfile) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.emptyCard}
          >
            <Ionicons name="person-add-outline" size={80} color="#fff" />
            <Text style={styles.emptyTitle}>Complete Your Profile</Text>
            <Text style={styles.emptyText}>
              Add your name, photo, and bio to start matching with others!
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#fff', '#f0f0f0']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="person" size={20} color="#667eea" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Go to Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {cards.length > 0 && cards.slice(currentIndex, currentIndex + 3).map((card, index) => (
          <SwipeCard
            key={card.id}
            card={card}
            index={currentIndex + index}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onViewProfile={() => navigation.navigate('ViewProfile', { userId: card.id })}
          />
        ))}
        
        {currentIndex >= cards.length && cards.length > 0 && (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyCard}
            >
              <Ionicons name="checkmark-circle" size={80} color="#fff" />
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptyText}>
                You've seen all available profiles.{'\n'}
                Pull down to refresh and see new matches.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRefresh}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#fff', '#f0f0f0']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#667eea" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
        
        {cards.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyCard}
            >
              <Ionicons name="people-outline" size={80} color="#fff" />
              <Text style={styles.emptyTitle}>No profiles yet</Text>
              <Text style={styles.emptyText}>
                Be the first to create a profile!{'\n'}
                Tell your friends to join too.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRefresh}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#fff', '#f0f0f0']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#667eea" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {cards.length > 0 && currentIndex < cards.length && (
        <View style={styles.actionButtonsContainer}>
          {lastSwipedCard && (
            <TouchableOpacity
              style={styles.undoButton}
              onPress={undoLastSwipe}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-undo" size={24} color="#667eea" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.dislikeButton}
            onPress={() => handleButtonSwipe('left')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#EE5A6F']}
              style={styles.actionButtonCircle}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.superLikeButton}
            onPress={() => handleButtonSwipe('right')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.actionButtonCircle}
            >
              <Ionicons name="star" size={28} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleButtonSwipe('right')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionButtonCircle}
            >
              <Ionicons name="heart" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 100,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 400,
  },
  emptyCard: {
    width: SCREEN_WIDTH - 40,
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
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 15,
  },
  undoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginRight: 10,
  },
  dislikeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  superLikeButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    overflow: 'hidden',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
