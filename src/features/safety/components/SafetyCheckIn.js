import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors } from '../../../constants/colors';
import { SafetyService } from '../../../services/SafetyService';

const SafetyCheckIn = ({ datePlanId, onCheckInComplete }) => {
  const [checkInActive, setCheckInActive] = useState(false);
  const [checkInStarted, setCheckInStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);

  useEffect(() => {
    let interval;
    if (checkInActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleCheckInExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [checkInActive, timeRemaining]);

  const handleStartCheckIn = async () => {
    try {
      await SafetyService.startCheckInTimer(datePlanId, 5);
      setCheckInActive(true);
      setCheckInStarted(true);
      Alert.alert('Check-in Started', 'Timer set for 5 minutes. Confirm when you are safe!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCheckInComplete = async () => {
    try {
      await SafetyService.completeCheckIn('checkin_id_placeholder');
      setCheckInActive(false);
      Alert.alert('Success', 'Check-in confirmed! Friends have been notified that you are safe.');
      onCheckInComplete?.();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCheckInExpired = () => {
    setCheckInActive(false);
    Alert.alert('Check-in Expired', 'Please confirm your safety status.');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏱️ Safety Check-in</Text>
      <Text style={styles.subtitle}>Confirm your safety with friends</Text>

      {!checkInStarted ? (
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartCheckIn}>
          <Text style={styles.buttonText}>Start Check-in Timer</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.timerLabel}>Confirm your safety</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, checkInActive && styles.activeButton]}
            onPress={handleCheckInComplete}
            disabled={!checkInActive}
          >
            <Text style={styles.buttonText}>✓ I&apos;m Safe - Confirm Check-in</Text>
          </TouchableOpacity>

          {timeRemaining === 0 && (
            <Text style={styles.expiredText}>Check-in timer expired. Please confirm manually.</Text>
          )}
        </>
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
  primaryButton: {
    backgroundColor: Colors.accent.pink,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  activeButton: {
    backgroundColor: Colors.status.success,
  },
  buttonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 14,
  },
  timerDisplay: {
    alignItems: 'center',
    marginVertical: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.accent.pink,
  },
  timerLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  expiredText: {
    textAlign: 'center',
    color: Colors.status.error,
    fontSize: 13,
    marginTop: 8,
  },
});

export default SafetyCheckIn;
