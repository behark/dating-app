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
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { SocialFeaturesService } from '../services/SocialFeaturesService';
import logger from '../utils/logger';

const EventDetailScreen = ({ navigation, route }) => {
  const { event } = route.params || {};
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (event) {
      // Check if user is registered
      const userId = currentUser?.uid || currentUser?._id;
      const registered = event.currentAttendees?.some(
        (attendee) => attendee.userId === userId || attendee._id === userId
      );
      setIsRegistered(registered || false);
    }
  }, [event, currentUser]);

  const handleRegisterEvent = async () => {
    if (!event?._id) {
      Alert.alert('Error', 'Event information is missing');
      return;
    }

    try {
      setLoading(true);
      await SocialFeaturesService.registerForEvent(event._id);
      setIsRegistered(true);
      Alert.alert('Success', 'You have successfully registered for this event!');
    } catch (error) {
      logger.error('Error registering for event:', error);
      Alert.alert('Error', error.message || 'Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <LinearGradient colors={Colors.gradient.light} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Event Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </LinearGradient>
    );
  }

  const startDate = new Date(event.startTime);
  const spotsAvailable = event.maxAttendees
    ? event.maxAttendees - (event.currentAttendeeCount || 0)
    : null;

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Event Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category || 'General'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.detailText}>{event.locationName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.detailText}>
                {startDate.toLocaleDateString()} at{' '}
                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {spotsAvailable !== null && (
              <View style={styles.detailRow}>
                <Ionicons name="people" size={20} color={Colors.primary} />
                <Text style={styles.detailText}>
                  {spotsAvailable} spots available ({event.currentAttendeeCount || 0}/
                  {event.maxAttendees} registered)
                </Text>
              </View>
            )}
            {event.ticketPrice > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="cash" size={20} color={Colors.primary} />
                <Text style={styles.detailText}>${event.ticketPrice} per ticket</Text>
              </View>
            )}
          </View>

          {!isRegistered && (
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegisterEvent}
              disabled={loading || spotsAvailable === 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.background.white} />
              ) : (
                <Text style={styles.registerButtonText}>
                  {spotsAvailable === 0 ? 'Sold Out' : 'Register for Event'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {isRegistered && (
            <View style={styles.registeredBadge}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.status.success} />
              <Text style={styles.registeredText}>You're registered for this event!</Text>
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
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
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
  registerButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.status.successLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  registeredText: {
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

export default EventDetailScreen;
