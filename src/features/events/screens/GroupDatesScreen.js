import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { LocationService } from '../../../services/LocationService';
import { SocialFeaturesService } from '../../../services/SocialFeaturesService';
import { getUserFriendlyMessage } from '../../../utils/errorMessages';
import logger from '../../../utils/logger';
import { getUserId, userIdsMatch } from '../../../utils/userIdUtils';

const GroupDatesScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [groupDates, setGroupDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Initialize location from currentUser or fetch it
  const initializeLocation = useCallback(async () => {
    // First, try to use location from currentUser
    if (currentUser?.location?.coordinates?.length >= 2) {
      setUserLocation({
        longitude: currentUser.location.coordinates[0],
        latitude: currentUser.location.coordinates[1],
      });
      return true;
    }

    // If no location in currentUser, try to get current location
    try {
      const location = await LocationService.getCurrentLocation();
      if (location?.latitude && location?.longitude) {
        setUserLocation({
          longitude: location.longitude,
          latitude: location.latitude,
        });
        return true;
      }
    } catch (err) {
      logger.error('Error getting current location for group dates:', err);
    }

    // No location available
    setError('Location is required to find nearby group dates. Please enable location services.');
    return false;
  }, [currentUser?.location?.coordinates]);

  const fetchGroupDates = useCallback(async () => {
    if (!userLocation) {
      const hasLocation = await initializeLocation();
      if (!hasLocation) {
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const locationToUse = userLocation || {
        longitude: currentUser?.location?.coordinates?.[0],
        latitude: currentUser?.location?.coordinates?.[1],
      };

      if (!locationToUse?.longitude || !locationToUse?.latitude) {
        setError('Location not available');
        setLoading(false);
        return;
      }

      const data = await SocialFeaturesService.getNearbyGroupDates(
        locationToUse.longitude,
        locationToUse.latitude
      );
      setGroupDates(data.groupDates || []);
      setError(null);
    } catch (err) {
      logger.error('Error fetching group dates:', err);
      setError(
        getUserFriendlyMessage(err.message || 'Failed to load group dates. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, [userLocation, currentUser?.location?.coordinates, initializeLocation]);

  useEffect(() => {
    initializeLocation().then((hasLocation) => {
      if (hasLocation) {
        fetchGroupDates();
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Re-fetch when userLocation changes
  useEffect(() => {
    if (userLocation) {
      fetchGroupDates();
    }
  }, [userLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupDates();
    setRefreshing(false);
  };

  const handleJoinGroupDate = async (groupDateId) => {
    try {
      await SocialFeaturesService.joinGroupDate(groupDateId, getUserId(currentUser));
      fetchGroupDates();
    } catch (error) {
      logger.error('Error joining group date:', error);
      Alert.alert(
        'Error',
        getUserFriendlyMessage(error.message || 'Failed to join group date. Please try again.')
      );
    }
  };

  const GroupDateCard = ({ item }) => {
    const startDate = new Date(item.startTime);
    const userId = getUserId(currentUser);
    const isJoined = item.currentParticipants.some((p) => userIdsMatch(p.userId, userId));

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('GroupDateDetail', { groupDate: item })}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.eventType}>{item.eventType}</Text>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📍 {item.locationName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              📅 {startDate.toLocaleDateString()} at{' '}
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              👥 {item.currentParticipants.length}/{item.maxParticipants} going
            </Text>
          </View>
        </View>

        {!isJoined && (
          <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinGroupDate(item._id)}>
            <Text style={styles.joinButtonText}>Join Group Date</Text>
          </TouchableOpacity>
        )}

        {isJoined && (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>✓ You&apos;re going</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accent.pink} />
        <Text style={styles.loadingText}>Finding group dates nearby...</Text>
      </View>
    );
  }

  // Show error state if location is not available
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.screenTitle}>👫 Group Dates</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.eventsButton}
              onPress={() => navigation.navigate('Events')}
            >
              <Text style={styles.eventsButtonText}>📅 Events</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateGroupDate')}
            >
              <Text style={styles.createButtonText}>Create New</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📍 Location Required</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              initializeLocation().then((hasLocation) => {
                if (hasLocation) {
                  fetchGroupDates();
                } else {
                  setLoading(false);
                }
              });
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>👫 Group Dates</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.eventsButton}
            onPress={() => navigation.navigate('Events')}
          >
            <Text style={styles.eventsButtonText}>📅 Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateGroupDate')}
          >
            <Text style={styles.createButtonText}>Create New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {groupDates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No group dates nearby</Text>
          <Text style={styles.emptySubtext}>Create one to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={groupDates}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <GroupDateCard item={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  eventsButton: {
    backgroundColor: Colors.accent.teal,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  eventsButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 12,
  },
  createButton: {
    backgroundColor: Colors.accent.pink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 12,
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
    flex: 1,
  },
  eventType: {
    backgroundColor: '#F0E6FF',
    color: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  details: {
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.text.medium,
  },
  joinButton: {
    backgroundColor: Colors.accent.pink,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 14,
  },
  joinedBadge: {
    backgroundColor: Colors.status.successLight,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.status.success,
  },
  joinedText: {
    color: Colors.status.successDark,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  retryButton: {
    backgroundColor: Colors.accent.pink,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default GroupDatesScreen;
