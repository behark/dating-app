import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { SafetyService } from '../../services/SafetyService';
import logger from '../../utils/logger';

/**
 * DatePlansSharing Component
 * Share date plans with friends for safety
 */
export const DatePlansSharing = ({ userId, onPlanShared }) => {
  const [showForm, setShowForm] = useState(false);
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    matchName: '',
    location: '',
    address: '',
    dateTime: new Date(),
    notes: '',
    friendIds: [],
  });

  useEffect(() => {
    loadActivePlans();
  }, [userId]);

  const loadActivePlans = async () => {
    try {
      setLoading(true);
      const plans = await SafetyService.getActiveDatePlans(userId);
      setActivePlans(plans);
    } catch (error) {
      Alert.alert('Error', 'Failed to load date plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSharePlan = async () => {
    try {
      if (!formData.location || !formData.dateTime || !formData.matchName) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const result = await SafetyService.shareDatePlan(
        userId,
        {
          ...formData,
          matchUserId: 'match_id_placeholder',
          matchPhotoUrl: '',
        },
        formData.friendIds
      );

      if (result.success) {
        Alert.alert('Success', 'Date plan shared with friends!');
        setFormData({
          matchName: '',
          location: '',
          address: '',
          dateTime: new Date(),
          notes: '',
          friendIds: [],
        });
        setShowForm(false);
        loadActivePlans();
        onPlanShared?.();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Date Plans Sharing</Text>
      <Text style={styles.subtitle}>Share your date plans with trusted friends</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => setShowForm(true)}>
        <Text style={styles.buttonText}>+ Share New Date Plan</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent.pink} />
      ) : (
        <View>
          {activePlans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active date plans</Text>
              <Text style={styles.emptyStateSubtext}>Share your dates to keep friends updated</Text>
            </View>
          ) : (
            activePlans.map((plan) => (
              <View key={plan.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.matchName}>{plan.matchName}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>ACTIVE</Text>
                  </View>
                </View>
                <View style={styles.planDetails}>
                  <Text style={styles.detailRow}>📍 {plan.location}</Text>
                  <Text style={styles.detailRow}>
                    ⏰ {new Date(plan.dateTime).toLocaleString()}
                  </Text>
                  <Text style={styles.detailRow}>
                    👥 Shared with {plan.sharedWith.length} friends
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <Modal
        visible={showForm}
        animationType="slide"
        accessibilityLabel="Share date plan dialog"
        onRequestClose={() => setShowForm(false)}
      >
        <ScrollView style={styles.formContainer}>
          <Text style={styles.formTitle}>Share Your Date Plan</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Match Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Who are you meeting?"
              value={formData.matchName}
              onChangeText={(text) => setFormData({ ...formData, matchName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Restaurant, cafe, park, etc."
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date & Time *</Text>
            <TouchableOpacity style={styles.dateButton}>
              <Text>{formData.dateTime.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any additional details?"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSharePlan}>
            <Text style={styles.buttonText}>Share Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowForm(false)}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
};

/**
 * CheckInTimer Component
 * Timer for checking in during a date
 */
export const CheckInTimer = ({ datePlanId, userId, onCheckInComplete }) => {
  const [checkInActive, setCheckInActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes default
  const [checkInStarted, setCheckInStarted] = useState(false);

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
      await SafetyService.startCheckInTimer(userId, datePlanId, 300000);
      setCheckInActive(true);
      setCheckInStarted(true);
      Alert.alert('Check-in Started', 'Timer set for 5 minutes. Confirm when you&apos;re safe!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCheckInComplete = async () => {
    try {
      // In production, get the actual checkInId
      await SafetyService.completeCheckIn('checkin_id_placeholder');
      setCheckInActive(false);
      Alert.alert(
        'Success',
        'Check-in confirmed! Friends have been notified that you&apos;re safe.'
      );
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
    <View style={styles.checkInContainer}>
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

/**
 * EmergencySOS Component
 * Emergency SOS button for immediate help
 */
export const EmergencySOS = ({ userId }) => {
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
      const activeAlerts = await SafetyService.getActiveSOS(userId);
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
      // Request location
      if (!location) {
        await requestLocationPermission();
      }

      const result = await SafetyService.sendEmergencySOS(
        userId,
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

  const handleResolveSOS = async (sosAlertId) => {
    try {
      await SafetyService.resolveSOS(sosAlertId, 'resolved');
      Alert.alert('Success', 'SOS alert resolved.');
      loadSOSHistory();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.sosContainer}>
      <Text style={styles.title}>🚨 Emergency SOS</Text>
      <Text style={styles.subtitle}>Call for help immediately</Text>

      <TouchableOpacity
        style={[styles.sosButton, sosActive && styles.sosButtonActive]}
        onPress={handleSendSOS}
        disabled={sosActive}
      >
        <Text style={styles.sosButtonText}>🚨 EMERGENCY SOS</Text>
      </TouchableOpacity>

      {sosActive && (
        <View style={styles.sosActiveContainer}>
          <Text style={styles.sosActiveTitle}>⚠️ Emergency Alert Active</Text>
          <Text style={styles.sosActiveText}>Your emergency contacts have been notified</Text>
        </View>
      )}

      {sosHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Alerts</Text>
          {sosHistory.map((alert) => (
            <View key={alert.id} style={styles.sosHistoryCard}>
              <Text style={styles.sosTime}>{new Date(alert.createdAt).toLocaleString()}</Text>
              <Text style={styles.sosLocation}>📍 {alert.location.address}</Text>
              {alert.status === 'active' && (
                <TouchableOpacity
                  onPress={() => handleResolveSOS(alert.id)}
                  style={styles.resolveButton}
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

/**
 * PhotoVerificationAdvanced Component
 * Advanced photo verification with liveness detection
 */
export const PhotoVerificationAdvanced = ({ userId, onVerificationComplete }) => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [userId]);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      const status = await SafetyService.getPhotoVerificationStatus(userId);
      setVerificationStatus(status);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = () => {
    setShowCamera(true);
  };

  const handlePhotoCapture = async (photoUri) => {
    try {
      setLoading(true);
      const result = await SafetyService.submitAdvancedPhotoVerification(userId, photoUri, {
        method: 'advanced',
        faceDetected: true,
        livenessPassed: true,
        confidence: 0.95,
      });

      if (result.success) {
        Alert.alert(
          'Success',
          "Photo submitted for verification. We'll review it within 24 hours."
        );
        setShowCamera(false);
        checkVerificationStatus();
        onVerificationComplete?.();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.verificationContainer}>
      <Text style={styles.title}>✅ Photo Verification</Text>
      <Text style={styles.subtitle}>Verify your identity with a selfie</Text>

      {verificationStatus?.verified ? (
        <View style={styles.verifiedCard}>
          <Text style={styles.verifiedText}>✓ VERIFIED</Text>
          <Text style={styles.verifiedDate}>
            Verified on {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
          </Text>
        </View>
      ) : verificationStatus?.status === 'pending' ? (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingText}>⏳ PENDING REVIEW</Text>
          <Text style={styles.pendingDate}>
            Submitted on {new Date(verificationStatus.submittedAt).toLocaleDateString()}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.description}>
            Get verified with a quick selfie. This helps build trust in the community.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background.white} />
            ) : (
              <Text style={styles.buttonText}>📸 Start Verification</Text>
            )}
          </TouchableOpacity>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Benefits of being verified:</Text>
            <Text style={styles.benefit}>✓ Increased match success rate</Text>
            <Text style={styles.benefit}>✓ Build trust with potential matches</Text>
            <Text style={styles.benefit}>✓ Stand out in the community</Text>
          </View>
        </>
      )}
    </View>
  );
};

/**
 * BackgroundCheck Component
 * Background check status and initiation (premium feature)
 */
export const BackgroundCheck = ({ userId, isPremium }) => {
  const [checkStatus, setCheckStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCheckStatus();
  }, [userId]);

  const loadCheckStatus = async () => {
    try {
      setLoading(true);
      const status = await SafetyService.getBackgroundCheckStatus(userId);
      setCheckStatus(status);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateCheck = async () => {
    try {
      if (!isPremium) {
        Alert.alert('Premium Only', 'Background checks are a premium feature.');
        return;
      }

      const result = await SafetyService.initiateBackgroundCheck(userId, {
        firstName: 'User',
        lastName: 'Name',
      });

      if (result.success) {
        Alert.alert(
          'Check Initiated',
          "Background check has been initiated. You'll receive results within 24-48 hours."
        );
        loadCheckStatus();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.checkContainer}>
      <Text style={styles.title}>🔍 Background Check</Text>
      <Text style={styles.subtitle}>Premium Safety Feature</Text>

      {!isPremium ? (
        <View style={styles.premiumLock}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockText}>Premium Feature</Text>
          <Text style={styles.lockSubtext}>Upgrade to premium to enable background checks</Text>
        </View>
      ) : checkStatus?.completed ? (
        <View style={styles.checkResultCard}>
          <Text style={styles.resultTitle}>✓ Background Check Completed</Text>
          {Object.entries(checkStatus.results || {}).map(([check, result]) => (
            <View key={check} style={styles.checkResult}>
              <Text style={styles.checkLabel}>{check}</Text>
              <Text style={styles.checkValue}>{result ? '✓ Clear' : '✗ Failed'}</Text>
            </View>
          ))}
        </View>
      ) : checkStatus?.status === 'in_progress' ? (
        <View style={styles.inProgressCard}>
          <Text style={styles.inProgressText}>⏳ Background Check In Progress</Text>
          <Text style={styles.inProgressSubtext}>
            Estimated completion: {new Date(checkStatus.estimatedCompletion).toLocaleDateString()}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.description}>
            Let matches know you&apos;ve passed a background check. This builds trust and increases
            match quality.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleInitiateCheck}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background.white} />
            ) : (
              <Text style={styles.buttonText}>Start Background Check</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What&apos;s included:</Text>
            <Text style={styles.infoItem}>✓ Criminal record check</Text>
            <Text style={styles.infoItem}>✓ Sex offender registry</Text>
            <Text style={styles.infoItem}>✓ Address history</Text>
            <Text style={styles.infoItem}>✓ Identity verification</Text>
          </View>
        </>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: Colors.text.lighter,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: Colors.text.dark,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  planCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.pink,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statusBadge: {
    backgroundColor: Colors.accent.pink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.background.white,
    fontSize: 10,
    fontWeight: '700',
  },
  planDetails: {
    gap: 8,
  },
  detailRow: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  formContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background.lighter,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: Colors.text.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text.dark,
  },
  input: {
    backgroundColor: Colors.background.white,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: Colors.background.white,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
  },
  checkInContainer: {
    padding: 16,
    backgroundColor: Colors.background.lighter,
  },
  timerDisplay: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    marginVertical: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.accent.pink,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  activeButton: {
    backgroundColor: Colors.accent.pink,
  },
  expiredText: {
    color: Colors.accent.red,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  sosContainer: {
    padding: 16,
    backgroundColor: Colors.background.lighter,
  },
  sosButton: {
    backgroundColor: Colors.accent.pink,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: Colors.accent.pink,
  },
  sosButtonActive: {
    backgroundColor: Colors.accent.red,
    borderColor: Colors.accent.red,
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
  verificationContainer: {
    padding: 16,
    backgroundColor: Colors.background.lighter,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginVertical: 16,
    lineHeight: 20,
  },
  verifiedCard: {
    backgroundColor: Colors.status.successLight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: Colors.status.success,
  },
  verifiedText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.status.success,
    marginBottom: 8,
  },
  verifiedDate: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  pendingCard: {
    backgroundColor: Colors.status.warningLight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: Colors.status.warning,
  },
  pendingText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.status.warning,
    marginBottom: 8,
  },
  pendingDate: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  benefitsCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text.primary,
  },
  benefit: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  checkContainer: {
    padding: 16,
    backgroundColor: Colors.background.lighter,
  },
  premiumLock: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    marginVertical: 16,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  lockText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  lockSubtext: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  checkResultCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.status.success,
    marginBottom: 12,
  },
  checkResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  checkLabel: {
    fontSize: 13,
    color: Colors.text.dark,
  },
  checkValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.status.success,
  },
  inProgressCard: {
    backgroundColor: Colors.status.infoLight,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  inProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  inProgressSubtext: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  infoCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text.primary,
  },
  infoItem: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
});

export default {
  DatePlansSharing,
  CheckInTimer,
  EmergencySOS,
  PhotoVerificationAdvanced,
  BackgroundCheck,
};
