import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { Colors } from '../../../constants/colors';

const TermsOfServiceScreen = ({ navigation }) => {
  const handleOpenWebVersion = () => {
    // Replace with your actual terms of service URL
    const termsUrl =
      process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL || 'https://your-domain.com/terms-of-service';
    Linking.openURL(termsUrl).catch((err) =>
      console.error('Failed to open terms of service URL:', err)
    );
  };

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionText}>
              By accessing or using our dating app, you agree to be bound by these Terms of Service.
              If you disagree with any part of these terms, you may not access the service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By creating an account or using our service, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service and our Privacy Policy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Eligibility</Text>
            <Text style={styles.sectionText}>
              You must be at least 18 years old to use this service. By using the service, you
              represent and warrant that:
            </Text>
            <Text style={styles.bulletPoint}>• You are at least 18 years of age</Text>
            <Text style={styles.bulletPoint}>
              • You have the legal capacity to enter into these terms
            </Text>
            <Text style={styles.bulletPoint}>• You will comply with all applicable laws</Text>
            <Text style={styles.bulletPoint}>
              • You have not been convicted of a felony or sex offense
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.sectionText}>You are responsible for:</Text>
            <Text style={styles.bulletPoint}>
              • Maintaining the confidentiality of your account
            </Text>
            <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
            <Text style={styles.bulletPoint}>• Providing accurate and truthful information</Text>
            <Text style={styles.bulletPoint}>
              • Notifying us immediately of any unauthorized use
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. User Conduct</Text>
            <Text style={styles.sectionText}>You agree not to:</Text>
            <Text style={styles.bulletPoint}>• Use the service for any illegal purpose</Text>
            <Text style={styles.bulletPoint}>• Harass, abuse, or harm other users</Text>
            <Text style={styles.bulletPoint}>
              • Post false, misleading, or fraudulent information
            </Text>
            <Text style={styles.bulletPoint}>• Impersonate any person or entity</Text>
            <Text style={styles.bulletPoint}>• Spam or send unsolicited messages</Text>
            <Text style={styles.bulletPoint}>• Use automated systems to access the service</Text>
            <Text style={styles.bulletPoint}>• Share your account with others</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Content and Intellectual Property</Text>
            <Text style={styles.sectionText}>
              You retain ownership of content you post, but grant us a license to use, display, and
              distribute your content on the service. You represent that you have the right to post
              all content you submit.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Premium Services</Text>
            <Text style={styles.sectionText}>
              Premium features are available through subscription. Subscriptions automatically renew
              unless cancelled. Refunds are subject to our refund policy and applicable law.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Safety and Reporting</Text>
            <Text style={styles.sectionText}>
              We are committed to user safety. You can report inappropriate behavior through the
              app. We reserve the right to suspend or terminate accounts that violate these terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Disclaimers</Text>
            <Text style={styles.sectionText}>
              The service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee
              that you will find matches or that the service will be uninterrupted or error-free.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              To the maximum extent permitted by law, we shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Account Termination</Text>
            <Text style={styles.sectionText}>
              You may delete your account at any time through Privacy Settings. We may suspend or
              terminate your account if you violate these terms. Upon termination, your right to use
              the service will immediately cease.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We reserve the right to modify these terms at any time. We will notify you of
              significant changes. Continued use of the service after changes constitutes
              acceptance.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Governing Law</Text>
            <Text style={styles.sectionText}>
              These terms shall be governed by and construed in accordance with the laws of{' '}
              {process.env.EXPO_PUBLIC_GOVERNING_JURISDICTION || 'the United States'}, without
              regard to its conflict of law provisions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Contact Information</Text>
            <Text style={styles.sectionText}>
              If you have questions about these Terms of Service, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>
              Email: {process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@dating-app.com'}
            </Text>
            {process.env.EXPO_PUBLIC_COMPANY_ADDRESS && (
              <Text style={styles.contactInfo}>
                Address: {process.env.EXPO_PUBLIC_COMPANY_ADDRESS}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.webVersionButton} onPress={handleOpenWebVersion}>
            <Ionicons name="globe-outline" size={20} color={Colors.primary} />
            <Text style={styles.webVersionText}>View Full Terms of Service Online</Text>
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

export default TermsOfServiceScreen;
