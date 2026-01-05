import React, { useState, useEffect } from 'react';
import { Colors } from '../constants/colors';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PremiumService } from '../services/PremiumService';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const PremiumScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      const status = await PremiumService.checkPremiumStatus(currentUser.uid);
      setPremiumStatus(status);
    } catch (error) {
      logger.error('Error loading premium status:', error);
      Alert.alert('Error', 'Failed to load premium status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (processing) return;

    setProcessing(true);
    try {
      const result = await PremiumService.startTrialSubscription(currentUser.uid);
      if (result.success) {
        Alert.alert(
          'Trial Started! 🎉',
          `Your 7-day premium trial has begun. Enjoy all premium features!`,
          [{ text: 'Awesome!', onPress: loadPremiumStatus }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      logger.error('Error starting trial:', error);
      Alert.alert('Error', 'Failed to start trial');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpgrade = async (planType) => {
    if (processing) return;

    setProcessing(true);
    try {
      const result = await PremiumService.upgradeToPremium(currentUser.uid, planType);
      if (result.success) {
        Alert.alert(
          'Upgrade Successful! 🚀',
          `You've been upgraded to premium! Enjoy all features.`,
          [{ text: 'Amazing!', onPress: loadPremiumStatus }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      logger.error('Error upgrading:', error);
      Alert.alert('Error', 'Failed to upgrade');
    } finally {
      setProcessing(false);
    }
  };

  const renderFeatureItem = (icon, title, description, isPremium = false) => (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, isPremium && styles.premiumFeatureIcon]}>
        <Ionicons name={icon} size={24} color={isPremium ? Colors.accent.gold : Colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, isPremium && styles.premiumFeatureTitle]}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
      {isPremium && (
        <View style={styles.premiumBadge}>
          <Ionicons name="diamond" size={12} color={Colors.accent.gold} />
        </View>
      )}
    </View>
  );

  const renderPricingCard = (planType, title, price, period, features, recommended = false) => (
    <View style={[styles.pricingCard, recommended && styles.recommendedCard]}>
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>MOST POPULAR</Text>
        </View>
      )}

      <View style={styles.pricingHeader}>
        <Text style={styles.planTitle}>{title}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>
      </View>

      <View style={styles.planFeatures}>
        {features.map((feature, index) => (
          <View key={index} style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={Colors.accent.teal} />
            <Text style={styles.planFeatureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.selectButton, recommended && styles.recommendedButton]}
        onPress={() => {
          if (planType === 'trial') {
            handleStartTrial();
          } else {
            handleUpgrade(planType);
          }
        }}
        disabled={processing || (planType !== 'trial' && premiumStatus?.isPremium)}
      >
        <LinearGradient
          colors={
            processing
              ? Colors.gradient.disabled
              : recommended
                ? Colors.gradient.gold
                : Colors.gradient.primary
          }
          style={styles.selectButtonGradient}
        >
          <Text style={[styles.selectButtonText, recommended && styles.recommendedButtonText]}>
            {processing
              ? 'Processing...'
              : premiumStatus?.isPremium && planType !== 'trial'
                ? 'Current Plan'
                : planType === 'trial'
                  ? 'Start Free Trial'
                  : `Choose ${title}`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="diamond" size={60} color={Colors.background.white} />
          <Text style={styles.loadingText}>Loading premium...</Text>
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
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Current Status */}
          {premiumStatus?.isPremium ? (
            <View style={styles.statusCard}>
              <LinearGradient colors={Colors.gradient.gold} style={styles.statusBadge}>
                <Ionicons name="diamond" size={24} color={Colors.background.white} />
                <Text style={styles.statusText}>PREMIUM ACTIVE</Text>
              </LinearGradient>
              <Text style={styles.statusSubtext}>
                Expires: {premiumStatus.subscriptionEnd?.toLocaleDateString()}
              </Text>
            </View>
          ) : (
            <View style={styles.statusCard}>
              <Text style={styles.freeStatusText}>Free Plan</Text>
              <Text style={styles.freeStatusSubtext}>Upgrade for premium features</Text>
            </View>
          )}

          {/* Features List */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Premium Features</Text>

            {renderFeatureItem(
              'star',
              '5 Super Likes per Day',
              'Stand out with special likes that guarantee visibility',
              true
            )}

            {renderFeatureItem(
              'infinite',
              'Unlimited Swipes',
              'Never run out of swipes again',
              true
            )}

            {renderFeatureItem(
              'filter',
              'Advanced Filters',
              'Filter by interests, lifestyle, and more',
              true
            )}

            {renderFeatureItem(
              'eye',
              'See Who Liked You',
              'Browse profiles of people who liked you first',
              true
            )}

            {renderFeatureItem(
              'rocket',
              'Profile Boost',
              'Get 10x more visibility for 30 minutes',
              true
            )}

            {renderFeatureItem(
              'heart',
              'Priority Matching',
              'Appear at the top of potential matches',
              true
            )}

            {renderFeatureItem(
              'notifications',
              'Push Notifications',
              'Get notified instantly of matches and messages',
              false
            )}

            {renderFeatureItem('location', 'Location-Based Matching', 'Find matches nearby', false)}

            {renderFeatureItem(
              'shield-checkmark',
              'Profile Verification',
              'Build trust with verified profiles',
              false
            )}
          </View>

          {/* Pricing Cards */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>

            <View style={styles.pricingGrid}>
              {renderPricingCard('trial', 'Free Trial', '7 Days', 'Free', [
                'All Premium Features',
                'No Payment Required',
                'Cancel Anytime',
                'Full Access',
              ])}

              {renderPricingCard(
                'monthly',
                'Monthly',
                '$9.99',
                '/month',
                [
                  'All Premium Features',
                  'Cancel Anytime',
                  'Priority Support',
                  'New Features First',
                ],
                true
              )}

              {renderPricingCard('yearly', 'Yearly', '$49.99', '/year', [
                'All Premium Features',
                '2 Months Free',
                'Best Value',
                'VIP Support',
                'Exclusive Features',
              ])}
            </View>
          </View>

          <Text style={styles.disclaimer}>
            * Prices are in USD. Subscription auto-renews. Cancel anytime in app settings. 7-day
            free trial available to new users only.
          </Text>
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
  statusCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    color: Colors.background.white,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  statusSubtext: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  freeStatusText: {
    color: Colors.text.dark,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
  },
  freeStatusSubtext: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  featuresSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.lightest,
    marginRight: 15,
  },
  premiumFeatureIcon: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: Colors.accent.gold,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  premiumFeatureTitle: {
    color: Colors.accent.gold,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent.gold,
  },
  pricingSection: {
    marginBottom: 30,
  },
  pricingGrid: {
    gap: 15,
  },
  pricingCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 15,
    padding: 20,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: Colors.accent.gold,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: Colors.accent.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: Colors.background.white,
    fontSize: 10,
    fontWeight: '800',
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
  },
  period: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recommendedButton: {
    shadowColor: Colors.accent.gold,
  },
  selectButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
  recommendedButtonText: {
    color: Colors.background.white,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

export default PremiumScreen;
