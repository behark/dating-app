import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PreferencesService } from '../services/PreferencesService';
import { useAuth } from '../context/AuthContext';

const PreferencesScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await PreferencesService.getUserPreferences(currentUser.uid);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    const validation = PreferencesService.validatePreferences(preferences);
    if (!validation.isValid) {
      Alert.alert('Invalid Preferences', validation.errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      const success = await PreferencesService.updateUserPreferences(currentUser.uid, preferences);
      if (success) {
        Alert.alert('Success', 'Preferences saved successfully!');
      } else {
        Alert.alert('Error', 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const renderAgePreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Age Preferences</Text>
      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Minimum Age</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity
              onPress={() => updatePreference('minAge', Math.max(18, preferences.minAge - 1))}
              style={styles.adjustButton}
            >
              <Ionicons name="remove" size={20} color="#667eea" />
            </TouchableOpacity>
            <Text style={styles.numberText}>{preferences.minAge}</Text>
            <TouchableOpacity
              onPress={() => updatePreference('minAge', Math.min(preferences.maxAge - 1, preferences.minAge + 1))}
              style={styles.adjustButton}
            >
              <Ionicons name="add" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maximum Age</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity
              onPress={() => updatePreference('maxAge', Math.max(preferences.minAge + 1, preferences.maxAge - 1))}
              style={styles.adjustButton}
            >
              <Ionicons name="remove" size={20} color="#667eea" />
            </TouchableOpacity>
            <Text style={styles.numberText}>{preferences.maxAge}</Text>
            <TouchableOpacity
              onPress={() => updatePreference('maxAge', Math.min(100, preferences.maxAge + 1))}
              style={styles.adjustButton}
            >
              <Ionicons name="add" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderDistancePreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Distance Preferences</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Maximum Distance: {preferences.maxDistance} km</Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            onPress={() => updatePreference('maxDistance', Math.max(1, preferences.maxDistance - 5))}
            style={styles.sliderButton}
          >
            <Ionicons name="remove" size={24} color="#667eea" />
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                { width: `${(preferences.maxDistance / 100) * 100}%` }
              ]}
            />
          </View>
          <TouchableOpacity
            onPress={() => updatePreference('maxDistance', Math.min(100, preferences.maxDistance + 5))}
            style={styles.sliderButton}
          >
            <Ionicons name="add" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderGenderPreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>I'm Interested In</Text>
      <View style={styles.optionGroup}>
        {[
          { key: 'women', label: 'Women', icon: 'female' },
          { key: 'men', label: 'Men', icon: 'male' },
          { key: 'both', label: 'Everyone', icon: 'people' },
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              preferences.interestedIn === option.key && styles.optionButtonSelected,
            ]}
            onPress={() => updatePreference('interestedIn', option.key)}
          >
            <Ionicons
              name={option.icon}
              size={24}
              color={preferences.interestedIn === option.key ? '#fff' : '#667eea'}
            />
            <Text
              style={[
                styles.optionText,
                preferences.interestedIn === option.key && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNotificationPreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="notifications" size={24} color="#667eea" />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Push Notifications</Text>
              <Text style={styles.switchSubtitle}>Receive notifications on your device</Text>
            </View>
          </View>
          <Switch
            value={preferences.notificationsEnabled}
            onValueChange={(value) => updatePreference('notificationsEnabled', value)}
            trackColor={{ false: '#ccc', true: '#667eea' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="heart" size={24} color="#FF6B6B" />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Match Notifications</Text>
              <Text style={styles.switchSubtitle}>Get notified when you match with someone</Text>
            </View>
          </View>
          <Switch
            value={preferences.matchNotifications}
            onValueChange={(value) => updatePreference('matchNotifications', value)}
            trackColor={{ false: '#ccc', true: '#FF6B6B' }}
            thumbColor="#fff"
            disabled={!preferences.notificationsEnabled}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="chatbubble" size={24} color="#4ECDC4" />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Message Notifications</Text>
              <Text style={styles.switchSubtitle}>Get notified of new messages</Text>
            </View>
          </View>
          <Switch
            value={preferences.messageNotifications}
            onValueChange={(value) => updatePreference('messageNotifications', value)}
            trackColor={{ false: '#ccc', true: '#4ECDC4' }}
            thumbColor="#fff"
            disabled={!preferences.notificationsEnabled}
          />
        </View>
      </View>
    </View>
  );

  const renderPrivacyPreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy</Text>
      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="location" size={24} color="#667eea" />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Show Distance</Text>
              <Text style={styles.switchSubtitle}>Let others see how far you are</Text>
            </View>
          </View>
          <Switch
            value={preferences.showDistance}
            onValueChange={(value) => updatePreference('showDistance', value)}
            trackColor={{ false: '#ccc', true: '#667eea' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="calendar" size={24} color="#FF6B6B" />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Show Age</Text>
              <Text style={styles.switchSubtitle}>Display your age on your profile</Text>
            </View>
          </View>
          <Switch
            value={preferences.showAge}
            onValueChange={(value) => updatePreference('showAge', value)}
            trackColor={{ false: '#ccc', true: '#FF6B6B' }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="settings" size={60} color="#fff" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <TouchableOpacity
          onPress={savePreferences}
          style={styles.saveButton}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderAgePreference()}
          {renderDistancePreference()}
          {renderGenderPreference()}
          {renderNotificationPreferences()}
          {renderPrivacyPreferences()}

          <TouchableOpacity
            style={styles.saveButtonLarge}
            onPress={savePreferences}
            disabled={saving}
          >
            <LinearGradient
              colors={saving ? ['#ccc', '#bbb'] : ['#667eea', '#764ba2']}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
    padding: 15,
    paddingTop: 50,
    paddingBottom: 15,
    shadowColor: '#000',
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
    color: '#fff',
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
    color: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 10,
  },
  adjustButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  numberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  sliderButton: {
    padding: 10,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginHorizontal: 10,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 3,
  },
  optionGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  optionButtonSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea',
  },
  optionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  optionTextSelected: {
    color: '#fff',
  },
  switchGroup: {
    gap: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#333',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  saveButtonLarge: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#667eea',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default PreferencesScreen;