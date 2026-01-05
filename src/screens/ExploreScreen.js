import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
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
const CARD_WIDTH = (width - 24) / 2;

const ExploreScreen = ({ navigation }) => {
  const { user, authToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [sortBy, setSortBy] = useState('recentActivity');
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 100,
    gender: 'any',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    } catch (error) {
      logger.error('Error getting location:', error);
    }
  }, []);

  const exploreUsers = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        lat: location.latitude,
        lng: location.longitude,
        radius: '50000',
        minAge: filters.minAge,
        maxAge: filters.maxAge,
        gender: filters.gender,
        sortBy: sortBy,
        limit: '20',
      });

      const response = await fetch(`${API_BASE_URL}/discovery/explore?${queryParams}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      logger.error('Error exploring users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [location, sortBy, filters, user, authToken]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    if (location) {
      exploreUsers();
    }
  }, [location, exploreUsers]);

  const renderUserCard = ({ item }) => {
    let distance = item.distance;
    if (
      !distance &&
      location &&
      item.location?.coordinates &&
      item.location.coordinates.length >= 2
    ) {
      distance = calculateDistance(
        location.latitude,
        location.longitude,
        item.location.coordinates[1],
        item.location.coordinates[0]
      );
    }

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => navigation.navigate('ViewProfile', { userId: item._id })}
      >
        {item.photos?.[0] && (
          <Image source={{ uri: item.photos[0]?.url || item.photos[0] }} style={styles.userImage} />
        )}

        {item.isBoosted && (
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.8)', 'rgba(255, 215, 0, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.boostedBadge}
          >
            <Ionicons name="flash" size={16} color={Colors.background.white} />
            <Text style={styles.boostedText}>Boosted</Text>
          </LinearGradient>
        )}

        {item.isProfileVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
          </View>
        )}

        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.gradient}
        />

        <View style={styles.cardContent}>
          <Text style={styles.userName}>
            {item.name}, {item.age}
          </Text>
          {distance && (
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={14} color={Colors.background.white} />
              <Text style={styles.distance}>{distance.toFixed(1)} km away</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const SortOption = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.sortOption, sortBy === value && styles.sortOptionActive]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[styles.sortOptionText, sortBy === value && styles.sortOptionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
          <Ionicons name="options" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
        <SortOption label="Recent Activity" value="recentActivity" />
        <SortOption label="Profile Quality" value="profileQuality" />
        <SortOption label="Verified" value="verified" />
        <SortOption label="Boosted" value="boosted" />
      </ScrollView>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Age Range</Text>
            <Text style={styles.filterValue}>
              {filters.minAge} - {filters.maxAge}
            </Text>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Gender</Text>
            <Text style={styles.filterValue}>
              {filters.gender === 'any' ? 'All' : filters.gender}
            </Text>
          </View>
        </View>
      )}

      {/* Users Grid */}
      {loading && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={Colors.text.light} />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubText}>Try adjusting your filters</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.lighter,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.dark,
  },
  filterButton: {
    padding: 8,
  },
  sortContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: Colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  sortOption: {
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.light,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  sortOptionTextActive: {
    color: Colors.background.white,
  },
  filterSection: {
    backgroundColor: Colors.background.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  filterLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  filterValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    gap: 8,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  userCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.white,
    marginBottom: 8,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  boostedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  boostedText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.background.white90,
    borderRadius: 20,
    padding: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.background.white,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: Colors.background.white,
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
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.tertiary,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.text.light,
    marginTop: 6,
  },
});

export default ExploreScreen;
