import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Colors } from '../../../constants/colors';
import { SafetyService } from '../../../services/SafetyService';
import logger from '../../../utils/logger';

const EmergencySOS = ({ userId }) => {
  const [sosActive, setSosActive] = useState(false);
  const [sosHistory, setSosHistory] = useState([]);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    loadSOSHistory();
    requestLocationPermission();
  }, [userId]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync();
        setLocation(loc.coords);
      }
    } catch (error) {
      logger.error('Location permission error', error, { userId });
    }
  };

  const loadSOSHistory = async () => {
    try {
      const activeAlerts = await SafetyService.getActiveSOS();
      setSosHistory(activeAlerts);
      if (activeAlerts.length > 0) {
        setSosActive(true);
      }
    } catch (error) {
      logger.error('Error loading SOS history', error, { userId });
    }
  };

  const handleSendSOS = async () => {
    try {
      if (!location) {
        await requestLocationPermission();
      }

      const result = await SafetyService.sendEmergencySOS(
        {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          address: 'Current Location',
        },
        'Emergency - Need immediate help!'
      );

      if (result.success) {
        setSosActive(true);
        Alert.alert(
          '🚨 SOS Sent',
          'Emergency alert sent to your emergency contacts and trusted friends. Help is on the way!'
        );
        loadSOSHistory();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleResolveSOS = async (sosId) => {
    try {
      await SafetyService.resolveSOS(sosId, 'User confirmed safe');
      Alert.alert('Success', 'Emergency alert has been resolved.');
      loadSOSHistory();
      setSosActive(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚨 Emergency SOS</Text>
      <Text style={styles.subtitle}>Send immediate alert to contacts</Text>

      <TouchableOpacity
        style={[styles.sosButton, sosActive && styles.sosButtonActive]}
        onPress={handleSendSOS}
        disabled={sosActive}
      >
        <Text style={styles.sosButtonText}>
          {sosActive ? '⚠️ SOS Active' : '🆘 Send Emergency SOS'}
        </Text>
      </TouchableOpacity>

      {sosActive && (
        <View style={styles.sosActiveContainer}>
          <Text style={styles.sosActiveTitle}>Emergency Alert Active</Text>
          <Text style={styles.sosActiveText}>
            Your emergency contacts have been notified of your location.
          </Text>
        </View>
      )}

      {sosHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Alerts</Text>
          {sosHistory.map((sos) => (
            <View key={sos._id} style={styles.sosHistoryCard}>
              <Text style={styles.sosTime}>
                {new Date(sos.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.sosLocation}>{sos.location?.address || 'Unknown location'}</Text>
              {sos.status === 'active' && (
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => handleResolveSOS(sos._id)}
                >
                  <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.background.lighter,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  sosButton: {
    backgroundColor: Colors.accent.pink,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent.pink,
  },
  sosButtonActive: {
    backgroundColor: Colors.accent.red || '#FF4444',
    borderColor: Colors.accent.red || '#FF4444',
  },
  sosButtonText: {
    color: Colors.background.white,
    fontWeight: '700',
    fontSize: 16,
  },
  sosActiveContainer: {
    backgroundColor: '#FFE0E6',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.pink,
  },
  sosActiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent.pink,
    marginBottom: 4,
  },
  sosActiveText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  historyContainer: {
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text.primary,
  },
  sosHistoryCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.pink,
  },
  sosTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  sosLocation: {
    fontSize: 13,
    color: Colors.text.dark,
    marginBottom: 8,
  },
  resolveButton: {
    backgroundColor: Colors.background.light,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  resolveButtonText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});

export default EmergencySOS;
