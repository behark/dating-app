import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { calculateDistance } from '../utils/distanceCalculator';
import logger from '../utils/logger';

const { width } = Dimensions.get('window');

const TopPicksScreen = ({ navigation }) => {
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [topPicks, setTopPicks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getLocation();
    fetchTopPicks();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    } catch (error) {
      logger.error('Error getting location:', error);
    }
  };

  const fetchTopPicks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/discovery/top-picks?limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setTopPicks(data.data.topPicks || []);
      }
    } catch (error) {
      logger.error('Error fetching top picks:', error);
      Alert.alert('Error', 'Failed to load top picks');
    } finally {
      setLoading(false);
    }
  };

  const currentPick = topPicks[selectedIndex];

  const handleNext = () => {
    if (selectedIndex < topPicks.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleViewProfile = () => {
    if (currentPick?.userId) {
      navigation.navigate('ViewProfile', { userId: currentPick.userId._id });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </View>
    );
  }

  if (topPicks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No Top Picks Yet</Text>
          <Text style={styles.emptySubText}>Check back later for personalized recommendations</Text>
        </View>
      </View>
    );
  }

  const user = currentPick?.userId;
  const compatibility = currentPick?.compatibilityScore || 0;

  let distance = null;
  if (location && user?.location) {
    distance = calculateDistance(
      location.latitude,
      location.longitude,
      user.location.coordinates[1],
      user.location.coordinates[0]
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Picks</Text>
        <Text style={styles.counter}>
          {selectedIndex + 1}/{topPicks.length}
        </Text>
      </View>

      {/* Main Card */}
      <View style={styles.cardContainer}>
        {user?.photos?.[0] && (
          <Image source={{ uri: user.photos[0]?.url || user.photos[0] }} style={styles.profileImage} />
        )}

        {user?.isProfileVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}

        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)']}
          style={styles.gradient}
        />

        <View style={styles.cardContent}>
          <View>
            <Text style={styles.userName}>
              {user?.name}, {user?.age}
            </Text>
            {distance && (
              <View style={styles.distanceRow}>
                <Ionicons name="location" size={14} color="#fff" />
                <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
              </View>
            )}
            {user?.occupation?.jobTitle && (
              <Text style={styles.occupation}>{user.occupation.jobTitle}</Text>
            )}
            {user?.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {user.bio}
              </Text>
            )}
          </View>

          {/* Compatibility Score */}
          <View style={styles.compatibilityCard}>
            <Text style={styles.compatibilityLabel}>Compatibility</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>{compatibility}%</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${compatibility}%` }]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Score Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Why They&apos;re A Top Pick</Text>

        {currentPick?.scoreBreakdown && (
          <View style={styles.breakdown}>
            {currentPick.scoreBreakdown.interestCompatibility > 0 && (
              <View style={styles.breakdownItem}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.breakdownText}>Similar interests and passions</Text>
              </View>
            )}
            {currentPick.scoreBreakdown.locationCompatibility > 0 && (
              <View style={styles.breakdownItem}>
                <Ionicons name="location" size={16} color="#FFD700" />
                <Text style={styles.breakdownText}>In your preferred location</Text>
              </View>
            )}
            {currentPick.scoreBreakdown.ageCompatibility > 0 && (
              <View style={styles.breakdownItem}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.breakdownText}>Matches your age preference</Text>
              </View>
            )}
            {currentPick.scoreBreakdown.engagementScore > 0 && (
              <View style={styles.breakdownItem}>
                <Ionicons name="flame" size={16} color="#FFD700" />
                <Text style={styles.breakdownText}>Active and engaged user</Text>
              </View>
            )}
            {currentPick.scoreBreakdown.profileQuality > 0 && (
              <View style={styles.breakdownItem}>
                <Ionicons name="image" size={16} color="#FFD700" />
                <Text style={styles.breakdownText}>Complete, high-quality profile</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={selectedIndex === 0}
          style={[styles.navButton, selectedIndex === 0 && styles.navButtonDisabled]}
        >
          <Ionicons name="chevron-back" size={24} color={selectedIndex === 0 ? '#ccc' : '#fff'} />
        </TouchableOpacity>

        <View style={styles.dots}>
          {topPicks.map((_, index) => (
            <View key={index} style={[styles.dot, index === selectedIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={selectedIndex === topPicks.length - 1}
          style={[
            styles.navButton,
            selectedIndex === topPicks.length - 1 && styles.navButtonDisabled,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={selectedIndex === topPicks.length - 1 ? '#ccc' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.passButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewButton} onPress={handleViewProfile}>
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => {
            // Handle like action
            handleNext();
          }}
        >
          <Ionicons name="heart" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  counter: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  cardContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    height: 400,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 6,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  occupation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  bio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
    lineHeight: 18,
  },
  compatibilityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  compatibilityLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  breakdownSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  breakdown: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownText: {
    fontSize: 13,
    color: '#fff',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccc',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  passButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 14,
  },
  likeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TopPicksScreen;
