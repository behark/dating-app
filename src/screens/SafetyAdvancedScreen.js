import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import {
  BackgroundCheck,
  CheckInTimer,
  DatePlansSharing,
  EmergencySOS,
  PhotoVerificationAdvanced,
} from '../components/Safety/SafetyAdvancedComponents';
import { SafetyService } from '../services/SafetyService';

/**
 * SafetyAdvancedScreen
 * Comprehensive safety features including check-in, date plans, SOS, etc.
 */
const SafetyAdvancedScreen = ({ route, navigation }) => {
  const { userId, isPremium } = route.params || {};
  const [activeFeature, setActiveFeature] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmergencyContacts();
  }, [userId]);

  const loadEmergencyContacts = async () => {
    try {
      setLoading(true);
      const contacts = await SafetyService.getEmergencyContacts(userId);
      setEmergencyContacts(contacts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'Date Safety',
      data: [
        {
          id: 'date-plans',
          name: '📍 Share Date Plans',
          description: 'Share your date plans with trusted friends',
          icon: '📍',
          component: DatePlansSharing,
        },
        {
          id: 'checkin',
          name: '⏱️ Check-in Timer',
          description: 'Confirm your safety with an automatic timer',
          icon: '⏱️',
          component: CheckInTimer,
        },
      ],
    },
    {
      title: 'Emergency',
      data: [
        {
          id: 'sos',
          name: '🚨 Emergency SOS',
          description: 'Alert emergency contacts immediately',
          icon: '🚨',
          component: EmergencySOS,
        },
        {
          id: 'emergency-contacts',
          name: '📞 Emergency Contacts',
          description: 'Manage your emergency contact list',
          icon: '📞',
        },
      ],
    },
    {
      title: 'Verification',
      data: [
        {
          id: 'photo-verification',
          name: '✅ Photo Verification',
          description: 'Get verified with advanced liveness detection',
          icon: '✅',
          component: PhotoVerificationAdvanced,
        },
        {
          id: 'background-check',
          name: '🔍 Background Check',
          description: `Premium - Build trust in the community`,
          icon: '🔍',
          component: BackgroundCheck,
          premium: true,
        },
      ],
    },
  ];

  const handleAddEmergencyContact = () => {
    navigation.navigate('AddEmergencyContact', { userId });
  };

  const renderFeatureItem = ({ item }) => {
    const isPremiumFeature = item.premium && !isPremium;

    return (
      <TouchableOpacity
        style={[styles.featureCard, isPremiumFeature && styles.disabledCard]}
        onPress={() => !isPremiumFeature && setActiveFeature(item)}
        disabled={isPremiumFeature}
      >
        <View style={styles.featureContent}>
          <Text style={styles.featureIcon}>{item.icon}</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureName}>{item.name}</Text>
            <Text style={styles.featureDescription}>{item.description}</Text>
          </View>
        </View>

        {isPremiumFeature && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}

        {!isPremiumFeature && <Text style={styles.arrowIcon}>›</Text>}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Render active feature
  if (activeFeature) {
    const FeatureComponent = activeFeature.component;

    return (
      <View style={styles.featureContainer}>
        <View style={styles.featureHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveFeature(null)}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.featureTitle}>{activeFeature.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        {activeFeature.id === 'emergency-contacts' ? (
          <ScrollView style={styles.featureContent}>
            <View style={styles.contactsContainer}>
              <Text style={styles.title}>Emergency Contacts</Text>

              {emergencyContacts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No emergency contacts added yet</Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleAddEmergencyContact}
                  >
                    <Text style={styles.buttonText}>+ Add First Contact</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {emergencyContacts.map((contact) => (
                    <View key={contact.id} style={styles.contactCard}>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactRelation}>{contact.relationship}</Text>
                        <Text style={styles.contactPhone}>{contact.phone}</Text>
                      </View>
                      <TouchableOpacity style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleAddEmergencyContact}
                  >
                    <Text style={styles.buttonText}>+ Add Another Contact</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={styles.featureContent}>
            <FeatureComponent
              userId={userId}
              isPremium={isPremium}
              onPlanShared={() => setActiveFeature(null)}
              onCheckInComplete={() => setActiveFeature(null)}
              onVerificationComplete={() => setActiveFeature(null)}
            />
          </ScrollView>
        )}
      </View>
    );
  }

  // Render features list
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ Safety Center</Text>
        <Text style={styles.headerSubtitle}>Manage your safety features</Text>
      </View>

      <SectionList
        sections={features}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderFeatureItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

      <View style={styles.safetyTipsSection}>
        <View style={styles.tipsHeader}>
          <Text style={styles.tipsTitle}>💡 Safety Tips</Text>
        </View>

        <TouchableOpacity style={styles.tipCard} onPress={() => navigation.navigate('SafetyTips')}>
          <Text style={styles.tipText}>
            Learn best practices for staying safe while dating online
          </Text>
          <Text style={styles.tipArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emergencyBanner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>In Case of Emergency</Text>
          <Text style={styles.bannerText}>
            Your emergency contacts will always be able to reach your location data
          </Text>
        </View>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.lighter,
  },
  header: {
    backgroundColor: Colors.background.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  featureCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledCard: {
    opacity: 0.6,
  },
  featureContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  premiumBadge: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  arrowIcon: {
    fontSize: 24,
    color: Colors.border.light,
    marginLeft: 12,
  },
  featureContainer: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent.pink,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  featureContainerContent: {
    flex: 1,
  },
  contactsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.pink,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  contactRelation: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFE0E6',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: Colors.accent.pink,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.accent.pink,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 14,
  },
  safetyTipsSection: {
    padding: 16,
  },
  tipsHeader: {
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  tipCard: {
    backgroundColor: Colors.status.warningLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.warning,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.dark,
    lineHeight: 18,
  },
  tipArrow: {
    fontSize: 20,
    color: Colors.status.warning,
    marginLeft: 12,
  },
  emergencyBanner: {
    backgroundColor: '#FFE0E6',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.pink,
  },
  bannerContent: {},
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent.pink,
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
});

export default SafetyAdvancedScreen;
