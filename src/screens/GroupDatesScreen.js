import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { getUserId, userIdsMatch } from '../utils/userIdUtils';

const GroupDatesScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [groupDates, setGroupDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroupDates = useCallback(async () => {
    if (!currentUser?.location) return;

    try {
      setLoading(true);
      const data = await SocialFeaturesService.getNearbyGroupDates(
        currentUser.location.coordinates[0],
        currentUser.location.coordinates[1]
      );
      setGroupDates(data.groupDates || []);
    } catch (error) {
      logger.error('Error fetching group dates:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.location]);

  useEffect(() => {
    fetchGroupDates();
  }, [fetchGroupDates]);

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
      alert(error.response?.data?.message || 'Failed to join group date');
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
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>👫 Group Dates</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateGroupDate')}
        >
          <Text style={styles.createButtonText}>Create New</Text>
        </TouchableOpacity>
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
  joinButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  joinedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  joinedText: {
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

export default GroupDatesScreen;
