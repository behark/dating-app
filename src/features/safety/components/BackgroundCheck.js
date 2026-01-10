import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { SafetyService } from '../../../services/SafetyService';

const BackgroundCheck = ({ userId, isPremium }) => {
  const [checkStatus, setCheckStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backgroundCheckId, setBackgroundCheckId] = useState(null);

  useEffect(() => {
    if (backgroundCheckId) {
      loadCheckStatus();
    }
  }, [backgroundCheckId]);

  const loadCheckStatus = async () => {
    if (!backgroundCheckId) {
      return;
    }
    try {
      setLoading(true);
      const status = await SafetyService.getBackgroundCheckStatus(backgroundCheckId);
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

      const result = await SafetyService.initiateBackgroundCheck({
        firstName: 'User',
        lastName: 'Name',
      });

      if (result.success) {
        const newCheckId = result.backgroundCheckId;
        setBackgroundCheckId(newCheckId);
        Alert.alert(
          'Check Initiated',
          "Background check has been initiated. You'll receive results within 24-48 hours."
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
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
            Let matches know you've passed a background check. This builds trust and increases
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
            <Text style={styles.infoTitle}>What's included:</Text>
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
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginVertical: 16,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Colors.accent.pink,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 14,
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
    color: Colors.text.primary,
    marginBottom: 4,
  },
  lockSubtext: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  checkResultCard: {
    backgroundColor: Colors.status.successLight || '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.status.success || '#4CAF50',
    marginBottom: 12,
  },
  checkResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  checkLabel: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  checkValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  inProgressCard: {
    backgroundColor: Colors.status.warningLight || '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
  },
  inProgressText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.status.warning || '#FF9800',
    marginBottom: 8,
  },
  inProgressSubtext: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  infoCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
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

export default BackgroundCheck;
