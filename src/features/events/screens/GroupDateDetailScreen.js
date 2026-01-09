import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { SocialFeaturesService } from '../../../services/SocialFeaturesService';
import { getUserId, userIdsMatch } from '../../../utils/userIdUtils';
import logger from '../../../utils/logger';

const GroupDateDetailScreen = ({ navigation, route }) => {
  const { groupDate } = route.params || {};
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (groupDate) {
      const userId = getUserId(currentUser);
      const joined = groupDate.currentParticipants?.some((p) => userIdsMatch(p.userId, userId));
      setIsJoined(joined || false);
    }
  }, [groupDate, currentUser]);

  const handleJoinGroupDate = async () => {
    if (!groupDate?._id) {
      Alert.alert('Error', 'Group date information is missing');
      return;
    }

    try {
      setLoading(true);
      await SocialFeaturesService.joinGroupDate(groupDate._id, getUserId(currentUser));
      setIsJoined(true);
      Alert.alert('Success', 'You have successfully joined this group date!');
    } catch (error) {
      logger.error('Error joining group date:', error);
      Alert.alert('Error', error.message || 'Failed to join group date');
    } finally {
      setLoading(false);
    }
  };

  if (!groupDate) {
    return (
      <LinearGradient colors={Colors.gradient.light} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Group Date Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Group date not found</Text>
        </View>
      </LinearGradient>
    );
  }

  const startDate = new Date(groupDate.startTime);
  const spotsAvailable = groupDate.maxParticipants
    ? groupDate.maxParticipants - (groupDate.currentParticipants?.length || 0)
    : null;

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Group Date Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.groupDateTitle}>{groupDate.title}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{groupDate.eventType || 'Casual'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{groupDate.description}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.detailText}>{groupDate.locationName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.detailText}>
                {startDate.toLocaleDateString()} at{' '}
                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people" size={20} color={Colors.primary} />
              <Text style={styles.detailText}>
                {groupDate.currentParticipants?.length || 0}/{groupDate.maxParticipants || '∞'}{' '}
                going
              </Text>
            </View>
          </View>

          {groupDate.currentParticipants && groupDate.currentParticipants.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Participants</Text>
              {groupDate.currentParticipants.map((participant, index) => (
                <View key={index} style={styles.participantRow}>
                  <Text style={styles.participantText}>
                    {participant.userName || participant.name || 'User'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!isJoined && (
            <TouchableOpacity
              style={[
                styles.joinButton,
                loading && styles.disabledButton,
                spotsAvailable === 0 && styles.disabledButton,
              ]}
              onPress={handleJoinGroupDate}
              disabled={loading || spotsAvailable === 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.background.white} />
              ) : (
                <Text style={styles.joinButtonText}>
                  {spotsAvailable === 0 ? 'Full' : 'Join Group Date'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {isJoined && (
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.status.success} />
              <Text style={styles.joinedText}>You're going!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.background.white,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  groupDateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.pink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: Colors.text.dark,
    marginLeft: 12,
    flex: 1,
  },
  participantRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.gray,
  },
  participantText: {
    fontSize: 16,
    color: Colors.text.dark,
  },
  joinButton: {
    backgroundColor: Colors.accent.pink,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.status.successLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  joinedText: {
    color: Colors.status.successDark,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});

export default GroupDateDetailScreen;
