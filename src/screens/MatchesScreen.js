import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const MatchesScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const matchIds = userDoc.data()?.matches || [];

      if (matchIds.length === 0) {
        setMatches([]);
        setLoading(false);
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
    } catch (error) {
      console.error('Error loading matches:', error);
      setLoading(false);
    }
  };

  const renderMatch = ({ item }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => navigation.navigate('Chat', { userId: item.id, userName: item.name })}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.photoURL || 'https://via.placeholder.com/100' }}
          style={styles.matchImage}
        />
        <View style={styles.onlineIndicator} />
      </View>
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
      <Ionicons name="chevron-forward" size={24} color="#999" />
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
        <Text style={styles.title}>Your Matches</Text>
        <Text style={styles.subtitle}>{matches.length} {matches.length === 1 ? 'match' : 'matches'}</Text>
      </View>
      {matches.length === 0 ? (
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
  matchImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#667eea',
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
  matchName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
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
