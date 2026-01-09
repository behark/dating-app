import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import logger from '../../../utils/logger';
import { NotificationService } from '../../../services/NotificationService';

const NotificationPreferencesScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [frequencyModalVisible, setFrequencyModalVisible] = useState(false);
  const [quietHoursModalVisible, setQuietHoursModalVisible] = useState(false);
  const [tempQuietHours, setTempQuietHours] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await NotificationService.getNotificationPreferences(currentUser.uid);
      setPreferences(prefs);
      setTempQuietHours(prefs.quietHours);
    } catch (error) {
      logger.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await NotificationService.updateNotificationPreferences(currentUser.uid, {
        ...preferences,
        quietHours: tempQuietHours,
      });
      setPreferences((prev) => ({ ...prev, quietHours: tempQuietHours }));
      Alert.alert('Success', 'Notification preferences saved successfully!');
    } catch (error) {
      logger.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const frequencyOptions = [
    { id: 'instant', label: 'Instant', description: 'Get notified right away' },
    { id: 'daily', label: 'Daily Digest', description: 'Once per day at 9:00 AM' },
    { id: 'weekly', label: 'Weekly Digest', description: 'Once per week on Monday' },
  ];

  const renderNotificationTypePreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Types</Text>
      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="heart" size={24} color={Colors.accent.red} />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Match Notifications</Text>
              <Text style={styles.switchSubtitle}>When you match with someone</Text>
            </View>
          </View>
          <Switch
            value={preferences.matchNotifications}
            onValueChange={(value) => updatePreference('matchNotifications', value)}
            trackColor={{ false: Colors.text.light, true: Colors.accent.red }}
            thumbColor={Colors.background.white}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="chatbubble" size={24} color={Colors.accent.teal} />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Message Notifications</Text>
              <Text style={styles.switchSubtitle}>New messages from matches</Text>
            </View>
          </View>
          <Switch
            value={preferences.messageNotifications}
            onValueChange={(value) => updatePreference('messageNotifications', value)}
            trackColor={{ false: Colors.text.light, true: Colors.accent.teal }}
            thumbColor={Colors.background.white}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="flash" size={24} color="#FFA500" />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Like Notifications</Text>
              <Text style={styles.switchSubtitle}>Someone liked your profile</Text>
            </View>
          </View>
          <Switch
            value={preferences.likeNotifications}
            onValueChange={(value) => updatePreference('likeNotifications', value)}
            trackColor={{ false: Colors.text.light, true: '#FFA500' }}
            thumbColor={Colors.background.white}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="megaphone" size={24} color={Colors.primary} />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>System Announcements</Text>
              <Text style={styles.switchSubtitle}>App updates and announcements</Text>
            </View>
          </View>
          <Switch
            value={preferences.systemNotifications}
            onValueChange={(value) => updatePreference('systemNotifications', value)}
            trackColor={{ false: Colors.text.light, true: Colors.primary }}
            thumbColor={Colors.background.white}
          />
        </View>
      </View>
    </View>
  );

  const renderFrequencyPreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Frequency</Text>
      <TouchableOpacity
        style={styles.frequencyButton}
        onPress={() => setFrequencyModalVisible(true)}
      >
        <View style={styles.frequencyContent}>
          <View>
            <Text style={styles.frequencyLabel}>
              {frequencyOptions.find((o) => o.id === preferences.notificationFrequency)?.label}
            </Text>
            <Text style={styles.frequencyDescription}>
              {
                frequencyOptions.find((o) => o.id === preferences.notificationFrequency)
                  ?.description
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderQuietHours = () => (
    <View style={styles.section}>
      <View style={styles.quietHoursHeader}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <Switch
          value={tempQuietHours?.enabled || false}
          onValueChange={(value) => setTempQuietHours((prev) => ({ ...prev, enabled: value }))}
          trackColor={{ false: Colors.text.light, true: Colors.primary }}
          thumbColor={Colors.background.white}
        />
      </View>

      {tempQuietHours?.enabled && (
        <View style={styles.quietHoursContent}>
          <Text style={styles.quietHoursDescription}>
            Don&apos;t send notifications between {tempQuietHours.start} and {tempQuietHours.end}
          </Text>
          <TouchableOpacity
            style={styles.editQuietHoursButton}
            onPress={() => setQuietHoursModalVisible(true)}
          >
            <Ionicons name="time" size={20} color={Colors.primary} />
            <Text style={styles.editQuietHoursText}>Edit Times</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFrequencyModal = () => (
    <Modal
      transparent
      visible={frequencyModalVisible}
      accessibilityLabel="Notification frequency dialog"
      onRequestClose={() => setFrequencyModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notification Frequency</Text>
            <TouchableOpacity onPress={() => setFrequencyModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {frequencyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.frequencyOption,
                  preferences.notificationFrequency === option.id && styles.frequencyOptionSelected,
                ]}
                onPress={() => {
                  updatePreference('notificationFrequency', option.id);
                  setFrequencyModalVisible(false);
                }}
              >
                <View style={styles.frequencyOptionContent}>
                  <Text style={styles.frequencyOptionLabel}>{option.label}</Text>
                  <Text style={styles.frequencyOptionDescription}>{option.description}</Text>
                </View>
                {preferences.notificationFrequency === option.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderQuietHoursModal = () => (
    <Modal
      transparent
      visible={quietHoursModalVisible}
      accessibilityLabel="Quiet hours dialog"
      onRequestClose={() => setQuietHoursModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quiet Hours</Text>
            <TouchableOpacity onPress={() => setQuietHoursModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.timeLabel}>From (Start Time)</Text>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeDisplay}>{tempQuietHours?.start || '22:00'}</Text>
            </View>

            <Text style={styles.timeLabel}>To (End Time)</Text>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeDisplay}>{tempQuietHours?.end || '08:00'}</Text>
            </View>

            <Text style={styles.timeNote}>
              Note: You won&apos;t receive any notifications during these hours.
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setQuietHoursModalVisible(false)}
            >
              <Text style={styles.confirmButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="notifications" size={60} color={Colors.background.white} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <LinearGradient colors={Colors.gradient.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.background.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity onPress={savePreferences} style={styles.saveButton} disabled={saving}>
          <Ionicons name="checkmark" size={24} color={Colors.background.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderNotificationTypePreferences()}
          {renderFrequencyPreference()}
          {renderQuietHours()}

          <TouchableOpacity
            style={styles.saveButtonLarge}
            onPress={savePreferences}
            disabled={saving}
          >
            <LinearGradient
              colors={saving ? Colors.gradient.disabled : Colors.gradient.primary}
              style={styles.saveButtonGradient}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={Colors.background.white}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderFrequencyModal()}
      {renderQuietHoursModal()}
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
    padding: 15,
    paddingTop: 50,
    paddingBottom: 15,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.background.white,
    textAlign: 'center',
  },
  saveButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: Colors.background.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.background.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 15,
  },
  switchGroup: {
    gap: 0,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchText: {
    marginLeft: 15,
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.gray,
  },
  frequencyButton: {
    padding: 15,
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  frequencyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  frequencyDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  quietHoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quietHoursContent: {
    backgroundColor: Colors.background.lightest,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  quietHoursDescription: {
    fontSize: 14,
    color: Colors.text.dark,
    fontWeight: '500',
    marginBottom: 12,
  },
  editQuietHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editQuietHoursText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.gray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  modalBody: {
    padding: 20,
  },
  frequencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: Colors.background.lightest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  frequencyOptionSelected: {
    backgroundColor: '#f0f0ff',
    borderColor: Colors.primary,
  },
  frequencyOptionContent: {
    flex: 1,
  },
  frequencyOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  frequencyOptionDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
    marginTop: 20,
    marginBottom: 8,
  },
  timeInputContainer: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: Colors.background.lightest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.gray,
    marginBottom: 15,
  },
  timeDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  timeNote: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 15,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonLarge: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: Colors.background.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default NotificationPreferencesScreen;
