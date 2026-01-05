import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { ActivityService } from '../services/ActivityService';
import logger from '../utils/logger';

const ActivityIndicatorComponent = ({ userId, showLabel = true }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const activityStatus = await ActivityService.getOnlineStatus(userId);
      setStatus(activityStatus);
      setError(null);
    } catch (err) {
      logger.error('Error fetching activity status', err, { userId });
      // Ensure error is always a string, not an object
      const errorMessage = err?.message || err?.toString() || 'Failed to load activity status';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
  };

  if (loading) {
    return <ActivityIndicator size="small" color="#007AFF" />;
  }

  if (error) {
    return null;
  }

  const getStatusColor = () => {
    if (!status) return Colors.text.tertiary;
    if (status.status === 'online') return '#34C759';
    if (status.status === 'active_now') return '#34C759';
    if (status.status.includes('active')) return '#FFA500';
    return Colors.text.tertiary;
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';
    const s = status.status;
    if (s === 'online') return 'Online';
    if (s === 'active_now') return 'Active now';
    if (s.startsWith('active_')) {
      const match = s.match(/active_(\d+)([mh])_ago/);
      if (match) {
        const time = match[1];
        const unit = match[2] === 'm' ? 'min' : 'hr';
        return `Active ${time}${unit} ago`;
      }
    }
    return 'Offline';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleRefresh} disabled={refreshing}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      {showLabel && <Text style={styles.statusText}>{getStatusText()}</Text>}
      {refreshing && <ActivityIndicator size="small" color="#007AFF" style={styles.spinner} />}
    </TouchableOpacity>
  );
};

export default ActivityIndicatorComponent;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  spinner: {
    marginLeft: 4,
  },
});
