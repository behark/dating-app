import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Colors } from '../../../constants/colors';
import { SafetyService } from '../../../services/SafetyService';

const IdentityVerification = ({ userId }) => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVerificationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const status = await SafetyService.getVerificationStatus(userId);
      setVerificationStatus(status);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async () => {
    try {
      setLoading(true);
      const result = await SafetyService.initiateVerification();
      if (result.success) {
        Alert.alert(
          'Verification Started',
          'Please follow the instructions to complete identity verification.'
        );
        loadVerificationStatus();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent.pink} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✓ Identity Verification</Text>
      <Text style={styles.subtitle}>Verify your identity to build trust</Text>

      {verificationStatus?.verified ? (
        <View style={styles.verifiedCard}>
          <Text style={styles.verifiedText}>✓ Verified</Text>
          <Text style={styles.verifiedDate}>
            Verified on {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
          </Text>
        </View>
      ) : verificationStatus?.status === 'pending' ? (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingText}>⏳ Verification Pending</Text>
          <Text style={styles.pendingDate}>
            Submitted on {new Date(verificationStatus.submittedAt).toLocaleDateString()}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.description}>
            Get verified to show other users that you&apos;re a real person. Verified profiles get
            more matches!
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartVerification}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Start Verification</Text>
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
  verifiedCard: {
    backgroundColor: Colors.status.successLight || '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: Colors.status.success || '#4CAF50',
  },
  verifiedText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.status.success || '#4CAF50',
    marginBottom: 8,
  },
  verifiedDate: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  pendingCard: {
    backgroundColor: Colors.status.warningLight || '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: Colors.status.warning || '#FF9800',
  },
  pendingText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.status.warning || '#FF9800',
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
});

export default IdentityVerification;
