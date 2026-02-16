import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { SafetyService } from '../../../services/SafetyService';

const DatePlansSharing = ({ userId, onPlanShared }) => {
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
      const plans = await SafetyService.getActiveDatePlans();
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
          {activePlans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <Text style={styles.planTitle}>{plan.matchName}</Text>
              <Text style={styles.planLocation}>{plan.location}</Text>
              <Text style={styles.planTime}>{new Date(plan.dateTime).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Date Plan</Text>

            <TextInput
              style={styles.input}
              placeholder="Match's Name"
              value={formData.matchName}
              onChangeText={(text) => setFormData({ ...formData, matchName: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Location Name"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional)"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.shareButton]}
                onPress={handleSharePlan}
              >
                <Text style={styles.shareButtonText}>Share Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    marginBottom: 16,
  },
  buttonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 14,
  },
  planCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.pink,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  planLocation: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  planTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.light,
    marginRight: 8,
  },
  shareButton: {
    backgroundColor: Colors.accent.pink,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  shareButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
  },
});

export default DatePlansSharing;
