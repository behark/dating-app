import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RangeSlider from '../components/Slider/RangeSlider';
import SingleSlider from '../components/Slider/SingleSlider';
import { useAuth } from '../context/AuthContext';
import { PreferencesService } from '../services/PreferencesService';
import { LocationService } from '../services/LocationService';

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
      <Text style={styles.sectionTitle}>Age Range</Text>
      <RangeSlider
        min={18}
        max={100}
        step={1}
        minValue={preferences.minAge}
        maxValue={preferences.maxAge}
        onChangeMin={(value) => updatePreference('minAge', value)}
        onChangeMax={(value) => updatePreference('maxAge', value)}
        color="#FF6B6B"
      />
    </View>
  );

  const renderDistancePreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Discovery Range</Text>
      <SingleSlider
        min={1}
        max={500}
        step={5}
        value={preferences.maxDistance}
        onChange={(value) => updatePreference('maxDistance', value)}
        label="Maximum Distance"
        unit=" km"
        color="#4ECDC4"
      />
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

  const renderLookingForPreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Looking For</Text>
      <View style={styles.optionGrid}>
        {[
          { key: 'casual', label: '😎 Casual', icon: 'sparkles' },
          { key: 'serious', label: '💑 Serious', icon: 'heart' },
          { key: 'marriage', label: '💍 Marriage', icon: 'ribbon' },
          { key: 'any', label: '🤔 Not Sure', icon: 'help-circle' },
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionCard,
              preferences.lookingFor === option.key && styles.optionCardSelected,
            ]}
            onPress={() => updatePreference('lookingFor', option.key)}
          >
            <Ionicons
              name={option.icon}
              size={28}
              color={preferences.lookingFor === option.key ? '#fff' : '#667eea'}
            />
            <Text
              style={[
                styles.optionCardText,
                preferences.lookingFor === option.key && styles.optionCardTextSelected,
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

  const renderLocationPrivacyPreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location Privacy</Text>
      <View style={styles.optionGroup}>
        {[
          { 
            key: 'hidden', 
            label: 'Hidden', 
            icon: 'eye-off',
            description: 'Your location is not visible'
          },
          { 
            key: 'visible_to_matches', 
            label: 'Matches Only', 
            icon: 'eye',
            description: 'Only visible to your matches'
          },
          { 
            key: 'visible_to_all', 
            label: 'Everyone', 
            icon: 'globe',
            description: 'Visible to all users'
          },
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              preferences.locationPrivacy === option.key && styles.optionButtonSelected,
            ]}
            onPress={() => updatePreference('locationPrivacy', option.key)}
          >
            <Ionicons
              name={option.icon}
              size={24}
              color={preferences.locationPrivacy === option.key ? '#fff' : '#667eea'}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={[
                  styles.optionText,
                  preferences.locationPrivacy === option.key && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={[styles.optionSubtext, preferences.locationPrivacy === option.key && styles.optionSubtextSelected]}>
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
          {renderLookingForPreference()}
          {renderNotificationPreferences()}
          {renderPrivacyPreferences()}
          {renderLocationPrivacyPreference()}

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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  optionCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea',
  },
  optionCardText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'center',
  },
  optionCardTextSelected: {
    color: '#fff',
  },
  optionSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  optionSubtextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
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