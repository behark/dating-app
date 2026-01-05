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
import { useAuth } from '../context/AuthContext';
import SocialFeaturesService from '../services/SocialFeaturesService';
import logger from '../utils/logger';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import { getUserId, userIdsMatch } from '../utils/userIdUtils';

const EventsScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = ['networking', 'singles_mixer', 'social_party', 'speed_dating', 'activity'];

  const fetchEvents = useCallback(async () => {
    if (!currentUser?.location) return;

    try {
      setLoading(true);
      const data = await SocialFeaturesService.getNearbyEvents(
        currentUser.location.coordinates[0],
        currentUser.location.coordinates[1],
        10000,
        selectedCategory
      );
      setEvents(data.events || []);
    } catch (error) {
      logger.error('Error fetching events:', error);
      Alert.alert(
        'Error',
        getUserFriendlyMessage(error.message || 'Failed to load events. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser?.location, selectedCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      await SocialFeaturesService.registerForEvent(eventId, getUserId(currentUser));
      fetchEvents();
      Alert.alert('Success', 'Successfully registered for event!');
    } catch (error) {
      logger.error('Error registering for event:', error);
      Alert.alert(
        'Error',
        getUserFriendlyMessage(error.message || 'Failed to register for event. Please try again.')
      );
    }
  };

  const EventCard = ({ item }) => {
    const startDate = new Date(item.startTime);
    const userId = getUserId(currentUser);
    const isRegistered = item.attendees.some((a) => userIdsMatch(a.userId, userId));
    const spotsAvailable = item.maxAttendees ? item.maxAttendees - item.currentAttendeeCount : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EventDetail', { event: item })}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📍 {item.locationName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📅 {startDate.toLocaleDateString()}</Text>
          </View>
          {spotsAvailable !== null && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>👥 {spotsAvailable} spots left</Text>
            </View>
          )}
          {item.ticketPrice > 0 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>💰 ${item.ticketPrice}</Text>
            </View>
          )}
        </View>

        {!isRegistered && (
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => handleRegisterEvent(item._id)}
            disabled={spotsAvailable === 0}
          >
            <Text style={styles.registerButtonText}>
              {spotsAvailable === 0 ? 'Sold Out' : 'Register'}
            </Text>
          </TouchableOpacity>
        )}

        {isRegistered && (
          <View style={styles.registeredBadge}>
            <Text style={styles.registeredText}>✓ Registered</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>🎉 Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.createButtonText}>Create New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryFilter}>
        <TouchableOpacity
          style={[styles.categoryButton, !selectedCategory && styles.categoryButtonActive]}
          onPress={() => {
            setSelectedCategory(null);
            fetchEvents();
          }}
        >
          <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
            onPress={() => {
              setSelectedCategory(cat);
              fetchEvents();
            }}
          >
            <Text
              style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}
            >
              {cat.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No events nearby</Text>
          <Text style={styles.emptySubtext}>Check back soon!</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <EventCard item={item} />}
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
    backgroundColor: '#FFF',
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
    borderBottomColor: '#EEE',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryFilter: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B9D',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
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
    color: '#333',
    flex: 1,
  },
  category: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#666',
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
    color: '#555',
  },
  registerButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  registeredBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  registeredText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
  },
});

export default EventsScreen;
