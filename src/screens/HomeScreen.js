import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import SwipeCard from '../components/Card/SwipeCard';

const HomeScreen = () => {
  const { currentUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      // Get current user's profile to filter out already swiped users
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const swipedUsers = userData?.swipedUsers || [];
      const matches = userData?.matches || [];

      // Get all users
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      const availableUsers = [];
      querySnapshot.forEach((doc) => {
        const user = { id: doc.id, ...doc.data() };
        // Filter out current user, already swiped users, and matches
        if (
          user.id !== currentUser.uid &&
          !swipedUsers.includes(user.id) &&
          !matches.includes(user.id) &&
          user.photoURL // Only show users with photos
        ) {
          availableUsers.push(user);
        }
      });

      setCards(availableUsers);
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Error', 'Failed to load profiles');
    }
  };

  const handleSwipeRight = async (card) => {
    try {
      // Add to swiped users
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const swipedUsers = userDoc.data()?.swipedUsers || [];
      
      await setDoc(userRef, {
        swipedUsers: [...swipedUsers, card.id],
      }, { merge: true });

      // Check if it's a match
      const otherUserRef = doc(db, 'users', card.id);
      const otherUserDoc = await getDoc(otherUserRef);
      const otherUserSwiped = otherUserDoc.data()?.swipedUsers || [];

      if (otherUserSwiped.includes(currentUser.uid)) {
        // It's a match!
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

      // Move to next card
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  const handleSwipeLeft = async (card) => {
    try {
      // Add to swiped users
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const swipedUsers = userDoc.data()?.swipedUsers || [];
      
      await setDoc(userRef, {
        swipedUsers: [...swipedUsers, card.id],
      }, { merge: true });

      // Move to next card
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  return (
    <View style={styles.container}>
      {cards.slice(currentIndex, currentIndex + 3).map((card, index) => (
        <SwipeCard
          key={card.id}
          card={card}
          index={currentIndex + index}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      ))}
      {currentIndex >= cards.length && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No more profiles!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 24,
    color: '#999',
  },
});

export default HomeScreen;
