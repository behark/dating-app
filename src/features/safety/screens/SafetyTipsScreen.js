import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { SafetyService } from '../../../services/SafetyService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SafetyTipsScreen({ navigation }) {
  const [tips, setTips] = useState([]);
  const [expandedTips, setExpandedTips] = useState(new Set());

  React.useEffect(() => {
    const allTips = SafetyService.getSafetyTips();
    setTips(allTips);
  }, []);

  const toggleTip = (tipId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newExpanded = new Set(expandedTips);
    if (newExpanded.has(tipId)) {
      newExpanded.delete(tipId);
    } else {
      newExpanded.add(tipId);
    }
    setExpandedTips(newExpanded);
  };

  const getCategoryColor = (category) => {
    const colors = {
      privacy: Colors.primary,
      verification: Colors.status.success,
      meeting: Colors.status.warning,
      online: Colors.status.info,
      warning: Colors.accent.red,
      emergency: '#C62828',
    };
    return colors[category] || Colors.primary;
  };

  const SafetyTipCard = ({ item }) => {
    const isExpanded = expandedTips.has(item.id);
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={[styles.tipCard, { borderLeftColor: categoryColor }]}
        onPress={() => toggleTip(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.tipHeader}>
          <View style={styles.tipTitleContainer}>
            <Text style={styles.tipIcon}>{item.icon}</Text>
            <Text style={styles.tipTitle}>{item.title}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={categoryColor}
          />
        </View>

        {isExpanded && (
          <View style={styles.tipContent}>
            <View style={styles.tipsListContainer}>
              {item.tips.map((tip, index) => (
                <View key={index} style={styles.singleTip}>
                  <View style={[styles.bulletPoint, { backgroundColor: categoryColor }]} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={Colors.background.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Tips</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.introBox}>
        <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
        <Text style={styles.introTitle}>Stay Safe While Dating Online</Text>
        <Text style={styles.introText}>
          Your safety is our priority. Here are essential tips for a secure dating experience.
        </Text>
      </View>

      <FlatList
        data={tips}
        keyExtractor={(item) => item.id.toString()}
        renderItem={SafetyTipCard}
        scrollEnabled={false}
        style={styles.tipsList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.emergencySection}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="alert-circle" size={28} color="#C62828" />
            <Text style={styles.emergencyTitle}>Emergency Resources</Text>
          </View>

          <View style={styles.resourceCard}>
            <Text style={styles.resourceTitle}>Feeling Unsafe?</Text>
            <Text style={styles.resourceText}>
              Contact local authorities or crisis services immediately.
            </Text>
            <View style={styles.resourceButtons}>
              <TouchableOpacity style={[styles.resourceButton, styles.emergencyButton]}>
                <Ionicons name="call" size={20} color={Colors.background.white} />
                <Text style={styles.resourceButtonText}>Call Police</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.resourceButton, styles.supportButton]}>
                <Ionicons name="chatbubbles" size={20} color={Colors.background.white} />
                <Text style={styles.resourceButtonText}>Crisis Text</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.reportingGuide}>
            <Text style={styles.reportingTitle}>How to Report on Our App</Text>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Find the user&apos;s profile or conversation</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Tap the menu icon (⋮) and select &quot;Report&quot;
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Select the reason and provide details</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Submit - our team will review within 24 hours</Text>
            </View>
          </View>
        </View>

        <View style={styles.bestPracticesSection}>
          <Text style={styles.sectionTitle}>Best Practices</Text>

          <View style={styles.practiceCard}>
            <Text style={styles.practiceIcon}>🔐</Text>
            <View>
              <Text style={styles.practiceTitle}>Privacy First</Text>
              <Text style={styles.practiceText}>
                Never share personal information too quickly. Keep conversations on the app until
                you trust someone.
              </Text>
            </View>
          </View>

          <View style={styles.practiceCard}>
            <Text style={styles.practiceIcon}>🔍</Text>
            <View>
              <Text style={styles.practiceTitle}>Verify Identity</Text>
              <Text style={styles.practiceText}>
                Ask for a video call or photo verification before meeting. Trust your instincts if
                something feels off.
              </Text>
            </View>
          </View>

          <View style={styles.practiceCard}>
            <Text style={styles.practiceIcon}>📍</Text>
            <View>
              <Text style={styles.practiceTitle}>Public Meetings</Text>
              <Text style={styles.practiceText}>
                Always meet in public places. Tell a friend where you&apos;re going and when to
                expect your call.
              </Text>
            </View>
          </View>

          <View style={styles.practiceCard}>
            <Text style={styles.practiceIcon}>💭</Text>
            <View>
              <Text style={styles.practiceTitle}>Trust Your Gut</Text>
              <Text style={styles.practiceText}>
                If something doesn&apos;t feel right, it probably isn&apos;t. It&apos;s okay to step
                back or block someone.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.communityGuidelinesSection}>
          <Text style={styles.sectionTitle}>Community Guidelines</Text>
          <Text style={styles.guidelineText}>We maintain a safe community by prohibiting:</Text>
          <View style={styles.guidelinesList}>
            <View style={styles.guidelineItem}>
              <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
              <Text style={styles.guidelineItemText}>Harassment, abuse, or threats</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
              <Text style={styles.guidelineItemText}>Explicit or inappropriate content</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
              <Text style={styles.guidelineItemText}>Scams or financial exploitation</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
              <Text style={styles.guidelineItemText}>Fraud or false information</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
              <Text style={styles.guidelineItemText}>Solicitation or spam</Text>
            </View>
          </View>
        </View>

        <View style={styles.footerText}>
          <Text style={styles.footerTitle}>Questions?</Text>
          <Text style={styles.footerDescription}>
            Contact our support team if you have concerns about safety or need assistance.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.background.white,
  },
  introBox: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.background.white95,
    borderRadius: 16,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  introText: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  tipsList: {
    paddingHorizontal: 16,
    maxHeight: 400,
  },
  tipCard: {
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.dark,
    flex: 1,
  },
  tipContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.text.lighter,
  },
  tipsListContainer: {
    marginLeft: 0,
  },
  singleTip: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 6,
    flexShrink: 0,
  },
  tipText: {
    fontSize: 12,
    color: Colors.text.medium,
    flex: 1,
    lineHeight: 16,
  },
  separator: {
    height: 0,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emergencySection: {
    marginBottom: 24,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C62828',
    marginLeft: 10,
  },
  resourceCard: {
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#C62828',
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 6,
  },
  resourceText: {
    fontSize: 12,
    color: Colors.text.medium,
    marginBottom: 10,
    lineHeight: 16,
  },
  resourceButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  resourceButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButton: {
    backgroundColor: '#C62828',
  },
  supportButton: {
    backgroundColor: Colors.status.warning,
  },
  resourceButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 12,
  },
  reportingGuide: {
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  reportingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  stepNumberText: {
    color: Colors.background.white,
    fontWeight: '700',
    fontSize: 12,
  },
  stepText: {
    fontSize: 12,
    color: Colors.text.medium,
    flex: 1,
    lineHeight: 16,
  },
  bestPracticesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 12,
    marginTop: 16,
  },
  practiceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  practiceIcon: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 4,
  },
  practiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  practiceText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
    flex: 1,
  },
  communityGuidelinesSection: {
    marginBottom: 24,
  },
  guidelineText: {
    fontSize: 12,
    color: Colors.text.medium,
    marginBottom: 10,
  },
  guidelinesList: {
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    padding: 12,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  guidelineItemText: {
    fontSize: 12,
    color: Colors.text.medium,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  footerText: {
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 6,
  },
  footerDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
});
