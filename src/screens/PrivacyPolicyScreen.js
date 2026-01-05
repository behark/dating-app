import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { Colors } from '../constants/colors';

const PrivacyPolicyScreen = ({ navigation }) => {
  const handleOpenWebVersion = () => {
    // Replace with your actual privacy policy URL
    const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || 
      'https://your-domain.com/privacy-policy';
    Linking.openURL(privacyPolicyUrl).catch((err) => 
      console.error('Failed to open privacy policy URL:', err)
    );
  };

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect information that you provide directly to us, including:
            </Text>
            <Text style={styles.bulletPoint}>• Account information (name, email, age, gender)</Text>
            <Text style={styles.bulletPoint}>• Profile information (photos, bio, interests)</Text>
            <Text style={styles.bulletPoint}>• Location data (for matching purposes)</Text>
            <Text style={styles.bulletPoint}>• Messages and interactions with other users</Text>
            <Text style={styles.bulletPoint}>• Device information and push notification tokens</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              We use the information we collect to:
            </Text>
            <Text style={styles.bulletPoint}>• Provide, maintain, and improve our services</Text>
            <Text style={styles.bulletPoint}>• Match you with potential partners</Text>
            <Text style={styles.bulletPoint}>• Send you notifications and updates</Text>
            <Text style={styles.bulletPoint}>• Ensure safety and prevent fraud</Text>
            <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Information Sharing</Text>
            <Text style={styles.sectionText}>
              We do not sell your personal information. We may share your information:
            </Text>
            <Text style={styles.bulletPoint}>• With other users (as part of the matching service)</Text>
            <Text style={styles.bulletPoint}>• With service providers who assist us</Text>
            <Text style={styles.bulletPoint}>• When required by law or to protect rights</Text>
            <Text style={styles.bulletPoint}>• In connection with a business transfer</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Your Rights (GDPR)</Text>
            <Text style={styles.sectionText}>
              If you are located in the European Union, you have the right to:
            </Text>
            <Text style={styles.bulletPoint}>• Access your personal data</Text>
            <Text style={styles.bulletPoint}>• Rectify inaccurate data</Text>
            <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
            <Text style={styles.bulletPoint}>• Object to processing of your data</Text>
            <Text style={styles.bulletPoint}>• Data portability</Text>
            <Text style={styles.sectionText}>
              You can exercise these rights through the Privacy Settings in the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. California Privacy Rights (CCPA)</Text>
            <Text style={styles.sectionText}>
              California residents have the right to:
            </Text>
            <Text style={styles.bulletPoint}>• Know what personal information is collected</Text>
            <Text style={styles.bulletPoint}>• Know if personal information is sold or disclosed</Text>
            <Text style={styles.bulletPoint}>• Opt-out of the sale of personal information</Text>
            <Text style={styles.bulletPoint}>• Access and delete personal information</Text>
            <Text style={styles.sectionText}>
              You can opt-out of data selling in Privacy Settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Data Security</Text>
            <Text style={styles.sectionText}>
              We implement appropriate technical and organizational measures to protect your personal
              information. However, no method of transmission over the internet is 100% secure.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Data Retention</Text>
            <Text style={styles.sectionText}>
              We retain your personal information for as long as your account is active or as needed
              to provide services. You can delete your account at any time through Privacy Settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
            <Text style={styles.sectionText}>
              Our service is not intended for users under 18 years of age. We do not knowingly collect
              personal information from children under 18.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
            <Text style={styles.sectionText}>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have questions about this Privacy Policy, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>
              Email: {process.env.EXPO_PUBLIC_PRIVACY_EMAIL || 'privacy@dating-app.com'}
            </Text>
            {process.env.EXPO_PUBLIC_COMPANY_ADDRESS && (
              <Text style={styles.contactInfo}>
                Address: {process.env.EXPO_PUBLIC_COMPANY_ADDRESS}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.webVersionButton} onPress={handleOpenWebVersion}>
            <Ionicons name="globe-outline" size={20} color={Colors.primary} />
            <Text style={styles.webVersionText}>View Full Privacy Policy Online</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginLeft: 16,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  webVersionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.lightest,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.gray,
    marginTop: 20,
  },
  webVersionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
});

export default PrivacyPolicyScreen;
