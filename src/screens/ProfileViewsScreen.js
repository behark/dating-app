import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { ActivityService } from '../services/ActivityService';
import { formatRelativeTime } from '../utils/formatters';
import logger from '../utils/logger';

export default function ProfileViewsScreen({ navigation }) {
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfileViews();
  }, []);

  const fetchProfileViews = async () => {
    try {
      setLoading(true);
      const data = await ActivityService.getProfileViews();
      setViewData(data);
      setError(null);
    } catch (err) {
      logger.error('Error fetching profile views:', err);
      // Ensure error is always a string, not an object
      const errorMessage = err?.message || err?.toString() || 'Failed to load profile views';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfileViews();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalViews = viewData?.totalViews || 0;
  const viewers = viewData?.viewers || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Views</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalViews}</Text>
          <Text style={styles.statLabel}>Total Profile Views</Text>
        </View>
      </View>

      {/* Viewers Section */}
      <View style={styles.viewersSection}>
        <View style={styles.viewersHeader}>
          <Text style={styles.viewersTitle}>
            {viewers.length > 0 ? 'Recent Viewers' : 'No views yet'}
          </Text>
          {viewers.length > 0 && (
            <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
              <Text style={styles.refreshText}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {viewers.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={viewers}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <View style={styles.viewerCard}>
                <View style={styles.viewerInfo}>
                  <Text style={styles.viewerName}>{item.userName || 'Unknown User'}</Text>
                  <Text style={styles.viewerTime}>Viewed {formatRelativeTime(item.viewedAt)}</Text>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Profile</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No one has viewed your profile yet</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Start matching and getting noticed!</Text>
          </View>
        )}
      </View>

      {/* Premium Notice */}
      {!viewData?.isPremium && viewers.length === 0 && (
        <View style={styles.premiumNotice}>
          <Text style={styles.premiumText}>
            👑 Upgrade to Premium to see who viewed your profile
          </Text>
          <TouchableOpacity style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  placeholder: {
    width: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStats: {
    padding: 16,
    backgroundColor: Colors.background.white,
    borderBottomColor: Colors.text.lighter,
    borderBottomWidth: 1,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  viewersSection: {
    flex: 1,
    backgroundColor: Colors.background.white,
    marginTop: 8,
  },
  viewersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomColor: Colors.text.lighter,
    borderBottomWidth: 1,
  },
  viewersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  refreshText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  viewerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: Colors.background.light,
    borderBottomWidth: 1,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  viewerTime: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  viewButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  premiumNotice: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 12,
  },
  premiumText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
    textAlign: 'center',
  },
  premiumButton: {
    backgroundColor: Colors.accent.gold,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  premiumButtonText: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
  },
});
