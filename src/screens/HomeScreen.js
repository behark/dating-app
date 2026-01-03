import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import SwipeCard from '../components/Card/SwipeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = () => {
  const { currentUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
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
          user.photoURL
        ) {
          availableUsers.push(user);
        }
      });

      setCards(availableUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Error', 'Failed to load profiles');
      setLoading(false);
    }
  };

  const handleSwipeRight = async (card) => {
    try {
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

        Alert.alert('🎉 It\'s a Match!', `You and ${card.name} liked each other!`);
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  const handleSwipeLeft = async (card) => {
    try {
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

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      {cards.length > 0 && cards.slice(currentIndex, currentIndex + 3).map((card, index) => (
        <SwipeCard
          key={card.id}
          card={card}
          index={currentIndex + index}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
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
              Check back later for new matches.
            </Text>
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
          </LinearGradient>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
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
  },
});

export default HomeScreen;
