import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AIService } from '../../services/AIService';

/**
 * SmartPhotoSelector Component
 * Shows AI recommendations for photo selection and ordering
 */
export const SmartPhotoSelector = ({ userId, onPhotoSelected }) => {
  const [recommendations, useState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const aiService = new AIService(null); // Initialize with token from context/auth

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await aiService.getSmartPhotoSelection(userId);
      useState(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📸 Smart Photo Selection</Text>
      <Text style={styles.subtitle}>AI-optimized photo recommendations</Text>

      {recommendations?.recommendations.map((rec, index) => (
        <View key={index} style={styles.photoCard}>
          <View style={styles.photoHeader}>
            <Text style={styles.photoTitle}>Photo {rec.photoIndex + 1}</Text>
            <View style={[styles.badge, { backgroundColor: rec.priority === 'high' ? '#FF6B9D' : rec.priority === 'medium' ? '#FFD93D' : '#9D84B7' }]}>
              <Text style={styles.badgeText}>{rec.priority.toUpperCase()}</Text>
            </View>
          </View>

          {rec.photoUrl && (
            <Image
              source={{ uri: rec.photoUrl }}
              style={styles.photoImage}
            />
          )}

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Quality Score:</Text>
            <Text style={styles.scoreValue}>{Math.round(rec.score)}/100</Text>
          </View>

          <View style={styles.reasonsList}>
            <Text style={styles.reasonsTitle}>Why this works:</Text>
            {rec.reasons.map((reason, i) => (
              <Text key={i} style={styles.reasonItem}>✓ {reason}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => onPhotoSelected?.(rec.photoIndex)}
          >
            <Text style={styles.buttonText}>Use as Primary Photo</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.analysisCard}>
        <Text style={styles.analysisTitle}>📊 Profile Analysis</Text>
        <Text style={styles.analysisText}>Average Quality: {recommendations?.analysis.averageScore.toFixed(0)}/100</Text>
        <Text style={styles.analysisText}>Total Photos: {recommendations?.analysis.totalPhotos}</Text>
      </View>
    </ScrollView>
  );
};

/**
 * BioSuggestions Component
 * Provides AI-generated bio suggestions
 */
export const BioSuggestions = ({ userId, interests, currentBio, onBioSelected }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const aiService = new AIService(null);

  useEffect(() => {
    loadSuggestions();
  }, [userId, interests]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await aiService.getBioSuggestions(userId, interests, currentBio);
      setSuggestions(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#FF6B9D" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✍️ Bio Suggestions</Text>

      {suggestions?.suggestions.map((suggestion, index) => (
        <View key={index} style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.toneBadge}>{suggestion.tone}</Text>
          </View>

          <Text style={styles.bioSuggestionText}>{suggestion.bio}</Text>

          <Text style={styles.reasonText}>{suggestion.reason}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => onBioSelected?.(suggestion.bio)}
          >
            <Text style={styles.buttonText}>Use This Bio</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Bio Tips</Text>
        {suggestions?.explanations && Object.entries(suggestions.explanations).map(([key, value], i) => (
          <Text key={i} style={styles.tipText}>• {value}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

/**
 * CompatibilityScore Component
 * Displays compatibility score with another user
 */
export const CompatibilityScore = ({ userId, targetUserId }) => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const aiService = new AIService(null);

  useEffect(() => {
    loadScore();
  }, [userId, targetUserId]);

  const loadScore = async () => {
    try {
      setLoading(true);
      const data = await aiService.getCompatibilityScore(userId, targetUserId);
      setScore(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#FF6B9D" />;
  }

  if (!score) {
    return <Text style={styles.errorText}>Could not calculate compatibility</Text>;
  }

  const getScoreColor = (value) => {
    if (value >= 75) return '#6BCB77';
    if (value >= 50) return '#FFD93D';
    return '#FF6B6B';
  };

  return (
    <View style={styles.scoreCard}>
      <Text style={styles.title}>💕 Compatibility Score</Text>

      <View style={styles.mainScoreContainer}>
        <View style={[styles.scoreCircle, { borderColor: getScoreColor(score.score) }]}>
          <Text style={styles.mainScore}>{score.score}%</Text>
        </View>
        <Text style={styles.scoreExplanation}>{score.explanation}</Text>
      </View>

      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Score Breakdown</Text>

        {Object.entries(score.breakdown).map(([key, value]) => (
          <View key={key} style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>{formatLabel(key)}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${value}%`, backgroundColor: getScoreColor(value) }
                ]}
              />
            </View>
            <Text style={styles.breakdownValue}>{value}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * ConversationStarters Component
 * AI-generated conversation starter suggestions
 */
export const ConversationStarters = ({ userId, targetUserId, targetProfile, onStarterSelected }) => {
  const [starters, setStarters] = useState(null);
  const [loading, setLoading] = useState(false);
  const aiService = new AIService(null);

  useEffect(() => {
    loadStarters();
  }, [userId, targetUserId]);

  const loadStarters = async () => {
    try {
      setLoading(true);
      const data = await aiService.getConversationStarters(userId, targetUserId, targetProfile);
      setStarters(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#FF6B9D" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💬 Conversation Starters</Text>
      <Text style={styles.subtitle}>Personalized opening lines</Text>

      {starters?.starters.map((starter, index) => (
        <TouchableOpacity
          key={index}
          style={styles.starterCard}
          onPress={() => onStarterSelected?.(starter)}
        >
          <Text style={styles.starterText}>{starter}</Text>
          <Text style={styles.useText}>→ Use this</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Utility functions
const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  photoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  photoImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B9D',
  },
  reasonsList: {
    marginBottom: 16,
  },
  reasonsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  reasonItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#FF6B9D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  analysisCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  suggestionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  suggestionHeader: {
    marginBottom: 12,
  },
  toneBadge: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  bioSuggestionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
    marginBottom: 12,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  tipsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  scoreCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  mainScoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FF6B9D',
  },
  scoreExplanation: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  breakdownContainer: {
    marginTop: 20,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EEE',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  starterCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
  },
  starterText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
    marginBottom: 8,
  },
  useText: {
    fontSize: 12,
    color: '#FF6B9D',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
  },
});

export default {
  SmartPhotoSelector,
  BioSuggestions,
  CompatibilityScore,
  ConversationStarters,
};
