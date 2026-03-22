/* eslint-disable sonarjs/no-duplicate-string */
/**
 * Consent Banner Component
 *
 * GDPR-compliant consent banner shown on first app launch.
 * Records user consent preferences for data collection, analytics, and marketing.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import PrivacyService from '../services/PrivacyService';
import { Colors } from '../constants/colors';
import logger from '../utils/logger';
import { AnalyticsService } from '../services/AnalyticsService';

const ConsentBanner = ({ visible, onConsentComplete }) => {
  const [analyticsTracking, setAnalyticsTracking] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [thirdPartySharing, setThirdPartySharing] = useState(false);
  const [loading, setLoading] = useState(false);

  const privacyPolicyUrl =
    Constants.expoConfig?.extra?.privacyPolicyUrl ||
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ||
    'https://your-domain.com/privacy-policy';

  const termsOfServiceUrl =
    Constants.expoConfig?.extra?.termsOfServiceUrl ||
    process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL ||
    'https://your-domain.com/terms-of-service';

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Record consent with backend
      await PrivacyService.recordConsent({
        purposes: {
          analytics: analyticsTracking,
          marketing: marketingEmails,
          thirdParty: thirdPartySharing,
        },
        policyVersion: '1.0',
      });

      // Track consent event
      AnalyticsService.logEvent('consent_given', {
        analytics: analyticsTracking,
        marketing: marketingEmails,
        thirdParty: thirdPartySharing,
      });

      // Store consent locally
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('hasConsented', 'true');
      await AsyncStorage.setItem('consentDate', new Date().toISOString());

      onConsentComplete();
    } catch (error) {
      logger.error('Error recording consent:', error);
      // Still allow user to proceed even if backend call fails
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('hasConsented', 'true');
      onConsentComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL(privacyPolicyUrl).catch((err) => {
      logger.error('Error opening privacy policy:', err);
    });
  };

  const handleOpenTerms = () => {
    Linking.openURL(termsOfServiceUrl).catch((err) => {
      logger.error('Error opening terms of service:', err);
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      accessibilityViewIsModal={true}
      accessibilityLabel="Privacy and consent dialog"
    >
      <LinearGradient
        colors={[Colors.primary, '#8B5CF6', Colors.gradient.pink[0]]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={64} color={Colors.background.white} />
            <Text style={styles.title}>Privacy & Consent</Text>
            <Text style={styles.subtitle}>We respect your privacy</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Before you continue, please review and choose your privacy preferences. You can change
              these settings anytime in your profile.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What we collect:</Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletText}>• Profile information and photos</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletText}>• Location data (for matching)</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletText}>• Messages and interactions</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletText}>• App usage analytics</Text>
              </View>
            </View>

            <View style={styles.preferences}>
              <TouchableOpacity
                style={styles.preferenceItem}
                onPress={() => setAnalyticsTracking(!analyticsTracking)}
                accessibilityLabel={`Analytics tracking ${analyticsTracking ? 'enabled' : 'disabled'}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: analyticsTracking }}
              >
                <View style={styles.checkboxContainer}>
                  <Ionicons
                    name={analyticsTracking ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={Colors.background.white}
                  />
                </View>
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceTitle}>Analytics & Performance</Text>
                  <Text style={styles.preferenceDescription}>
                    Help us improve the app by sharing usage data
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.preferenceItem}
                onPress={() => setMarketingEmails(!marketingEmails)}
                accessibilityLabel={`Marketing emails ${marketingEmails ? 'enabled' : 'disabled'}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: marketingEmails }}
              >
                <View style={styles.checkboxContainer}>
                  <Ionicons
                    name={marketingEmails ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={Colors.background.white}
                  />
                </View>
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceTitle}>Marketing Communications</Text>
                  <Text style={styles.preferenceDescription}>
                    Receive updates about new features and promotions
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.preferenceItem}
                onPress={() => setThirdPartySharing(!thirdPartySharing)}
                accessibilityLabel={`Third-party sharing ${thirdPartySharing ? 'enabled' : 'disabled'}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: thirdPartySharing }}
              >
                <View style={styles.checkboxContainer}>
                  <Ionicons
                    name={thirdPartySharing ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={Colors.background.white}
                  />
                </View>
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceTitle}>Third-Party Sharing</Text>
                  <Text style={styles.preferenceDescription}>
                    Share anonymized data with trusted partners for better matching
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={handleOpenPrivacyPolicy} style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalLinkSeparator}> • </Text>
              <TouchableOpacity onPress={handleOpenTerms} style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, loading && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={loading}
            accessibilityLabel="Accept and continue"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Accept & Continue'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.background.white,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.background.white,
    marginTop: 8,
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  preferences: {
    marginTop: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F5F6FF',
    borderWidth: 1,
    borderColor: '#E8EAF6',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.gray,
  },
  legalLink: {
    padding: 8,
  },
  legalLinkText: {
    fontSize: 14,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  legalLinkSeparator: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginHorizontal: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 0,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.background.white,
    letterSpacing: 0.3,
  },
});

export default ConsentBanner;
