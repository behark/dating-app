/* eslint-disable sonarjs/no-duplicate-string */
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import RangeSlider from '../../../components/Slider/RangeSlider';
import SingleSlider from '../../../components/Slider/SingleSlider';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { showStandardError, showSuccess } from '../../../utils/errorHandler';
import logger from '../../../utils/logger';
import { PreferencesService } from '../../../services/PreferencesService';
import { LocationService } from '../../../services/LocationService';

const PreferencesScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dynamic styles that depend on theme
  const themeStyles = {
    themeToggleContainer: {
      ...styles.themeToggleContainer,
      backgroundColor: theme.background.card,
    },
    themeLabel: {
      ...styles.themeLabel,
      color: theme.text.primary,
    },
    themeDescription: {
      ...styles.themeDescription,
      color: theme.text.secondary,
    },
  };

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await PreferencesService.getUserPreferences(currentUser.uid);
      setPreferences(prefs);
    } catch (error) {
      logger.error('Error loading preferences:', error);
      showStandardError(error, 'load', 'Unable to Load');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    const validation = PreferencesService.validatePreferences(preferences);
    if (!validation.isValid) {
      showStandardError(validation.errors.join('\n'), 'validation', 'Invalid Preferences');
      return;
    }

    setSaving(true);
    try {
      const success = await PreferencesService.updateUserPreferences(currentUser.uid, preferences);
      if (success) {
        showSuccess('Preferences saved successfully!');
      } else {
        showStandardError('Unable to save preferences', 'save', 'Save Failed');
      }
    } catch (error) {
      logger.error('Error saving preferences:', error);
      showStandardError(error, 'save', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
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
        color={Colors.accent.red}
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
        color={Colors.accent.teal}
      />
    </View>
  );

  const renderGenderPreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>I&apos;m Interested In</Text>
      <View style={styles.optionGroup}>
        {[
          { key: 'women', label: 'Women', icon: 'female' },
          { key: 'men', label: 'Men', icon: 'male' },
          { key: 'both', label: 'Everyone', icon: 'people' },
        ].map((option) => (
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
              color={
                preferences.interestedIn === option.key ? Colors.background.white : Colors.primary
              }
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
        ].map((option) => (
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
              color={
                preferences.lookingFor === option.key ? Colors.background.white : Colors.primary
              }
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
            <Ionicons name="notifications" size={24} color={Colors.primary} />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Push Notifications</Text>
              <Text style={styles.switchSubtitle}>Receive notifications on your device</Text>
            </View>
          </View>
          <Switch
            value={preferences.notificationsEnabled}
            onValueChange={(value) => updatePreference('notificationsEnabled', value)}
            trackColor={{ false: Colors.text.light, true: Colors.primary }}
            thumbColor={Colors.background.white}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="heart" size={24} color={Colors.accent.red} />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Match Notifications</Text>
              <Text style={styles.switchSubtitle}>Get notified when you match with someone</Text>
            </View>
          </View>
          <Switch
            value={preferences.matchNotifications}
            onValueChange={(value) => updatePreference('matchNotifications', value)}
            trackColor={{ false: Colors.text.light, true: Colors.accent.red }}
            thumbColor={Colors.background.white}
            disabled={!preferences.notificationsEnabled}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="chatbubble" size={24} color={Colors.accent.teal} />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Message Notifications</Text>
              <Text style={styles.switchSubtitle}>Get notified of new messages</Text>
            </View>
          </View>
          <Switch
            value={preferences.messageNotifications}
            onValueChange={(value) => updatePreference('messageNotifications', value)}
            trackColor={{ false: Colors.text.light, true: Colors.accent.teal }}
            thumbColor={Colors.background.white}
            disabled={!preferences.notificationsEnabled}
          />
        </View>
      </View>
    </View>
  );

  const renderPrivacyPreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy</Text>
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate('PrivacySettings')}
      >
        <View style={styles.actionCardContent}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
          <View style={styles.actionCardText}>
            <Text style={styles.actionCardTitle}>Privacy & Data Settings</Text>
            <Text style={styles.actionCardSubtitle}>
              Export data, delete account, manage GDPR/CCPA rights
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
      </TouchableOpacity>
      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="location" size={24} color={Colors.primary} />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Show Distance</Text>
              <Text style={styles.switchSubtitle}>Let others see how far you are</Text>
            </View>
          </View>
          <Switch
            value={preferences.showDistance}
            onValueChange={(value) => updatePreference('showDistance', value)}
            trackColor={{ false: Colors.text.light, true: Colors.primary }}
            thumbColor={Colors.background.white}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="calendar" size={24} color={Colors.accent.red} />
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Show Age</Text>
              <Text style={styles.switchSubtitle}>Display your age on your profile</Text>
            </View>
          </View>
          <Switch
            value={preferences.showAge}
            onValueChange={(value) => updatePreference('showAge', value)}
            trackColor={{ false: Colors.text.light, true: Colors.accent.red }}
            thumbColor={Colors.background.white}
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
            description: 'Your location is not visible',
          },
          {
            key: 'visible_to_matches',
            label: 'Matches Only',
            icon: 'eye',
            description: 'Only visible to your matches',
          },
          {
            key: 'visible_to_all',
            label: 'Everyone',
            icon: 'globe',
            description: 'Visible to all users',
          },
        ].map((option) => (
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
              color={
                preferences.locationPrivacy === option.key
                  ? Colors.background.white
                  : Colors.primary
              }
            />
            <View style={styles.optionDescriptionContainer}>
              <Text
                style={[
                  styles.optionText,
                  preferences.locationPrivacy === option.key && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  styles.optionSubtext,
                  preferences.locationPrivacy === option.key && styles.optionSubtextSelected,
                ]}
              >
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderThemePreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={themeStyles.themeToggleContainer}>
        <Text style={themeStyles.themeLabel}>Dark Mode</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: '#81C995' }}
          thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>
      <Text style={themeStyles.themeDescription}>
        Switch between light and dark themes. Changes apply immediately.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="settings" size={60} color={Colors.background.white} />
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
        <Text style={styles.headerTitle}>Preferences</Text>
        <TouchableOpacity onPress={savePreferences} style={styles.saveButton} disabled={saving}>
          <Ionicons name="checkmark" size={24} color={Colors.background.white} />
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
          {renderThemePreference()}

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
                style={styles.saveButtonIcon}
              />
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
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
  optionDescriptionContainer: {
    flex: 1,
    marginLeft: 10,
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
    borderColor: Colors.border.gray,
    backgroundColor: Colors.background.lightest,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  optionTextSelected: {
    color: Colors.background.white,
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
    borderColor: Colors.border.gray,
    backgroundColor: Colors.background.lightest,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionCardText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  optionCardTextSelected: {
    color: Colors.background.white,
  },
  optionSubtext: {
    fontSize: 11,
    color: Colors.text.tertiary,
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
    color: Colors.text.dark,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.lightest,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionCardText: {
    marginLeft: 15,
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
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
  saveButtonIcon: {
    marginRight: 8,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeDescription: {
    fontSize: 14,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
});

export default PreferencesScreen;
