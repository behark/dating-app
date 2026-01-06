import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import PrivacyService from '../services/PrivacyService';
import { showStandardError } from '../utils/errorHandler';
import logger from '../utils/logger';

const PrivacySettingsScreen = ({ navigation }) => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [privacySettings, setPrivacySettings] = useState(null);
  const [consentStatus, setConsentStatus] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      const [settings, consent] = await Promise.all([
        PrivacyService.getPrivacySettings(),
        PrivacyService.getConsentStatus(),
      ]);
      setPrivacySettings(settings.data || settings);
      setConsentStatus(consent.data || consent);
    } catch (error) {
      logger.error('Error loading privacy data:', error);
      showStandardError(error, 'load');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Your Data',
      'This will download all your data in JSON format. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              setExporting(true);
              const data = await PrivacyService.exportUserData();
              const exportData = data.data || data;

              // Convert to JSON string
              const jsonString = JSON.stringify(exportData, null, 2);

              // Save to file
              const fileName = `dating-app-export-${Date.now()}.json`;
              const fileUri = `${FileSystem.documentDirectory}${fileName}`;

              await FileSystem.writeAsStringAsync(fileUri, jsonString, {
                encoding: FileSystem.EncodingType.UTF8,
              });

              // Check if sharing is available
              const isAvailable = await Sharing.isAvailableAsync();
              if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'application/json',
                  dialogTitle: 'Export Your Data',
                });
              } else {
                Alert.alert('Success', `Data exported to: ${fileUri}`);
              }
            } catch (error) {
              logger.error('Error exporting data:', error);
              showStandardError(error, 'load', 'Export Failed');
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDoNotSell = async () => {
    Alert.alert(
      'Do Not Sell My Personal Information',
      'This will opt you out of any data selling practices (CCPA compliance).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Opt Out',
          onPress: async () => {
            try {
              await PrivacyService.doNotSell();
              Alert.alert('Success', 'You have been opted out of data selling.');
              loadPrivacyData();
            } catch (error) {
              logger.error('Error opting out:', error);
              showStandardError(error, 'update', 'Opt-Out Failed');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!showPasswordInput) {
      setShowPasswordInput(true);
      return;
    }

    if (!password) {
      showStandardError('Please enter your password to confirm account deletion', 'validation');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted:\n\n• Profile and photos\n• Matches and messages\n• Preferences and settings\n• All other account data\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setShowPasswordInput(false) },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await PrivacyService.deleteAccount(password);
              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await logout();
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              logger.error('Error deleting account:', error);
              showStandardError(error, 'delete', 'Deletion Failed');
              setPassword('');
              setShowPasswordInput(false);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdatePrivacySetting = async (key, value) => {
    try {
      const updated = { ...privacySettings, [key]: value };
      await PrivacyService.updatePrivacySettings(updated);
      setPrivacySettings(updated);
    } catch (error) {
      logger.error('Error updating privacy setting:', error);
      showStandardError(error, 'update', 'Update Failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy & Data</Text>
          <View style={styles.placeholder} />
        </View>

        {/* GDPR Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data Rights (GDPR)</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleExportData}
            disabled={exporting}
          >
            <View style={styles.actionContent}>
              <Ionicons name="download-outline" size={24} color={Colors.primary} />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Export Your Data</Text>
                <Text style={styles.actionDescription}>Download all your data in JSON format</Text>
              </View>
            </View>
            {exporting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.dangerCard]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <View style={styles.actionContent}>
              <Ionicons name="trash-outline" size={24} color={Colors.accent.red} />
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, styles.dangerText]}>Delete Account</Text>
                <Text style={styles.actionDescription}>
                  Permanently delete your account and all data
                </Text>
              </View>
            </View>
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.accent.red} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            )}
          </TouchableOpacity>

          {showPasswordInput && (
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password to confirm"
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoFocus
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPasswordInput(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* CCPA Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>California Privacy Rights (CCPA)</Text>

          <TouchableOpacity style={styles.actionCard} onPress={handleDoNotSell}>
            <View style={styles.actionContent}>
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Do Not Sell My Information</Text>
                <Text style={styles.actionDescription}>Opt out of data selling practices</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Privacy Settings */}
        {privacySettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Profile Visibility</Text>
                <Text style={styles.settingDescription}>Control who can see your profile</Text>
              </View>
              <Switch
                value={privacySettings.profileVisible !== false}
                onValueChange={(value) => handleUpdatePrivacySetting('profileVisible', value)}
                trackColor={{ false: Colors.border.gray, true: Colors.primary }}
                thumbColor={Colors.background.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Show Online Status</Text>
                <Text style={styles.settingDescription}>Let others see when you're online</Text>
              </View>
              <Switch
                value={privacySettings.showOnlineStatus !== false}
                onValueChange={(value) => handleUpdatePrivacySetting('showOnlineStatus', value)}
                trackColor={{ false: Colors.border.gray, true: Colors.primary }}
                thumbColor={Colors.background.white}
              />
            </View>
          </View>
        )}

        {/* Consent Management */}
        {consentStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consent Management</Text>
            <Text style={styles.infoText}>
              You have control over how your data is used. Manage your consent preferences below.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy is important to us. For more information, please review our Privacy Policy.
          </Text>
          <TouchableOpacity
            style={styles.policyLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={styles.policyLinkText}>View Full Privacy Policy</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.background.white,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  placeholder: {
    width: 34,
  },
  section: {
    backgroundColor: Colors.background.white,
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.lightest,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  dangerCard: {
    borderColor: Colors.accent.red,
    backgroundColor: Colors.background.lightest,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  dangerText: {
    color: Colors.accent.red,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  passwordContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  passwordInput: {
    backgroundColor: Colors.background.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.gray,
    marginBottom: 10,
    fontSize: 16,
    color: Colors.text.dark,
  },
  cancelButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.gray,
  },
  settingContent: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  policyLink: {
    marginTop: 8,
    paddingVertical: 8,
  },
  policyLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PrivacySettingsScreen;
