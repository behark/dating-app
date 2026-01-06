import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import AIService from '../services/AIService';
import { PremiumService } from '../services/PremiumService';
import { showStandardError } from '../utils/errorHandler';
import logger from '../utils/logger';
import api from '../services/api';

const AIInsightsScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [profileSuggestions, setProfileSuggestions] = useState(null);
  const [conversationInsights, setConversationInsights] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'conversation'

  useEffect(() => {
    checkPremiumAndLoad();
  }, []);

  const checkPremiumAndLoad = async () => {
    try {
      setLoading(true);
      const premiumStatus = await PremiumService.checkPremiumStatus(currentUser.uid);
      setIsPremium(premiumStatus.isPremium || false);

      if (premiumStatus.isPremium) {
        await loadInsights();
      }
    } catch (error) {
      logger.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const authToken = await api.getAuthToken();
      const aiService = new AIService(authToken);

      if (activeTab === 'profile') {
        const suggestions = await aiService.getProfileImprovementSuggestions(currentUser.uid);
        setProfileSuggestions(suggestions);
      } else {
        const insights = await aiService.getConversationInsights(currentUser.uid);
        setConversationInsights(insights);
      }
    } catch (error) {
      logger.error('Error loading AI insights:', error);
      showStandardError(error, 'load', 'Unable to Load');
    }
  };

  useEffect(() => {
    if (isPremium && activeTab) {
      loadInsights();
    }
  }, [activeTab, isPremium]);

  const handleUpgrade = () => {
    navigation.navigate('Premium');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  if (!isPremium) {
    return (
      <LinearGradient colors={Colors.gradient.light} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>AI Insights</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.premiumRequiredContainer}>
          <Ionicons name="sparkles" size={64} color={Colors.primary} />
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumDescription}>
            Unlock AI-powered insights to improve your profile and conversations. Get personalized
            suggestions based on your activity.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <LinearGradient
              colors={Colors.gradient.primary}
              style={styles.upgradeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>AI Insights</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            Profile Tips
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'conversation' && styles.tabActive]}
          onPress={() => setActiveTab('conversation')}
        >
          <Text style={[styles.tabText, activeTab === 'conversation' && styles.tabTextActive]}>
            Conversation Insights
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' ? (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Profile Improvement Suggestions</Text>
            {profileSuggestions ? (
              <>
                {profileSuggestions.suggestions && profileSuggestions.suggestions.length > 0 ? (
                  profileSuggestions.suggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionCard}>
                      <View style={styles.suggestionHeader}>
                        <Ionicons
                          name={
                            suggestion.priority === 'high'
                              ? 'alert-circle'
                              : suggestion.priority === 'medium'
                                ? 'information-circle'
                                : 'checkmark-circle'
                          }
                          size={20}
                          color={
                            suggestion.priority === 'high'
                              ? Colors.accent.red
                              : suggestion.priority === 'medium'
                                ? Colors.accent.orange
                                : Colors.accent.teal
                          }
                        />
                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                      </View>
                      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                      {suggestion.action && (
                        <Text style={styles.suggestionAction}>{suggestion.action}</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="checkmark-done-circle" size={48} color={Colors.accent.teal} />
                    <Text style={styles.emptyStateText}>Your profile looks great!</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Keep engaging to get more personalized suggestions.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingStateText}>Analyzing your profile...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Conversation Analytics</Text>
            {conversationInsights ? (
              <>
                {conversationInsights.insights && conversationInsights.insights.length > 0 ? (
                  <>
                    {conversationInsights.insights.map((insight, index) => (
                      <View key={index} style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                          <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
                          <Text style={styles.insightTitle}>{insight.title}</Text>
                        </View>
                        <Text style={styles.insightDescription}>{insight.description}</Text>
                        {insight.metric && (
                          <View style={styles.metricContainer}>
                            <Text style={styles.metricLabel}>{insight.metric.label}</Text>
                            <Text style={styles.metricValue}>{insight.metric.value}</Text>
                          </View>
                        )}
                      </View>
                    ))}

                    {conversationInsights.tips && conversationInsights.tips.length > 0 && (
                      <View style={styles.tipsSection}>
                        <Text style={styles.tipsTitle}>💡 Tips to Improve</Text>
                        {conversationInsights.tips.map((tip, index) => (
                          <View key={index} style={styles.tipCard}>
                            <Text style={styles.tipText}>{tip}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={48} color={Colors.text.tertiary} />
                    <Text style={styles.emptyStateText}>No conversation data yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Start chatting with your matches to get insights!
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingStateText}>Analyzing your conversations...</Text>
              </View>
            )}
          </View>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.gray,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 20,
  },
  suggestionCard: {
    backgroundColor: Colors.background.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginLeft: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  suggestionAction: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: Colors.background.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.gray,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  tipsSection: {
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 12,
  },
  tipCard: {
    backgroundColor: Colors.background.lightest,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text.dark,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    padding: 40,
  },
  loadingStateText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  premiumRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
    marginTop: 20,
    marginBottom: 12,
  },
  premiumDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  upgradeButton: {
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
  },
  upgradeButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: Colors.background.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AIInsightsScreen;
