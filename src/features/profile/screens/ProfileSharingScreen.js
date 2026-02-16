import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { SocialFeaturesService } from '../../../services/SocialFeaturesService';
import logger from '../../../utils/logger';
import { getUserFriendlyMessage } from '../../../utils/errorMessages';

const ProfileSharingScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [sharedProfiles, setSharedProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSharedProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSharedProfiles = async () => {
    if (!currentUser?._id) return;

    try {
      setLoading(true);
      const data = await SocialFeaturesService.getUserSharedProfiles(currentUser._id);
      setSharedProfiles(data.sharedProfiles || []);
    } catch (error) {
      logger.error('Error fetching shared profiles:', error);
      Alert.alert(
        'Error',
        getUserFriendlyMessage(error.message || 'Failed to load shared profiles. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShareLink = async (method = 'link') => {
    try {
      const result = await SocialFeaturesService.createShareableProfileLink(
        currentUser._id,
        method
      );

      if (method === 'link' || method === 'qr_code') {
        await Share.share({
          message: `Check out my profile on the Dating App! ${result.shareUrl}`,
          title: 'Share My Profile',
        });
      }

      fetchSharedProfiles();
      Alert.alert('Success', 'Profile shared successfully!');
    } catch (error) {
      logger.error('Error creating share link:', error);
      Alert.alert(
        'Error',
        getUserFriendlyMessage(error.message || 'Failed to create share link. Please try again.')
      );
    }
  };

  const handleDeactivateLink = async (shareToken) => {
    try {
      await SocialFeaturesService.deactivateShareLink(shareToken);
      fetchSharedProfiles();
      Alert.alert('Success', 'Share link deactivated');
    } catch (error) {
      logger.error('Error deactivating link:', error);
      Alert.alert(
        'Error',
        getUserFriendlyMessage(error.message || 'Failed to deactivate link. Please try again.')
      );
    }
  };

  const SharedProfileCard = ({ item }) => {
    const createdDate = new Date(item.createdAt);
    const expiresDate = new Date(item.expiresAt);
    const isExpired = new Date() > expiresDate;

    return (
      <View style={[styles.card, isExpired && styles.expiredCard]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{item.shareMethod}</Text>
            <Text style={styles.cardDate}>Created: {createdDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.viewCount}>
            <Text style={styles.viewCountNumber}>{item.viewCount}</Text>
            <Text style={styles.viewCountLabel}>views</Text>
          </View>
        </View>

        <View style={styles.cardStatus}>
          {isExpired ? (
            <Text style={styles.expiredText}>Expired</Text>
          ) : (
            <Text style={styles.activeText}>Active</Text>
          )}
          <Text style={styles.expiresText}>Expires: {expiresDate.toLocaleDateString()}</Text>
        </View>

        {!isExpired && (
          <TouchableOpacity
            style={styles.deactivateButton}
            onPress={() => handleDeactivateLink(item.shareToken)}
          >
            <Text style={styles.deactivateButtonText}>Deactivate</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>📤 Share Your Profile</Text>
        <Text style={styles.subtitle}>Share your profile with friends and potential matches</Text>
      </View>

      <View style={styles.optionsSection}>
        <Text style={styles.sectionTitle}>Share Methods</Text>

        <TouchableOpacity style={styles.shareOption} onPress={() => handleCreateShareLink('link')}>
          <Text style={styles.shareIcon}>🔗</Text>
          <View style={styles.shareInfo}>
            <Text style={styles.shareTitle}>Share via Link</Text>
            <Text style={styles.shareDescription}>Copy a link and share anywhere</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareOption}
          onPress={() => handleCreateShareLink('qr_code')}
        >
          <Text style={styles.shareIcon}>📱</Text>
          <View style={styles.shareInfo}>
            <Text style={styles.shareTitle}>QR Code</Text>
            <Text style={styles.shareDescription}>Create a scannable QR code</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareOption}
          onPress={() => handleCreateShareLink('instagram')}
        >
          <Text style={styles.shareIcon}>📸</Text>
          <View style={styles.shareInfo}>
            <Text style={styles.shareTitle}>Share on Social Media</Text>
            <Text style={styles.shareDescription}>Post on your Instagram story</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} onPress={() => handleCreateShareLink('email')}>
          <Text style={styles.shareIcon}>📧</Text>
          <View style={styles.shareInfo}>
            <Text style={styles.shareTitle}>Send via Email</Text>
            <Text style={styles.shareDescription}>Email your profile to friends</Text>
          </View>
        </TouchableOpacity>
      </View>

      {sharedProfiles.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Shares</Text>
          {sharedProfiles.map((profile) => (
            <SharedProfileCard key={profile._id} item={profile} />
          ))}
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 About Profile Sharing</Text>
        <Text style={styles.infoText}>
          • Share your profile with friends for their opinions{'\n'}• Track how many people view
          your shared profile{'\n'}• Links expire after 30 days{'\n'}• Deactivate links anytime
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  headerSection: {
    backgroundColor: Colors.background.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  optionsSection: {
    backgroundColor: Colors.background.white,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 12,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background.lighter,
    marginBottom: 10,
  },
  shareIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  shareInfo: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 2,
  },
  shareDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  historySection: {
    backgroundColor: Colors.background.white,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.pink,
  },
  expiredCard: {
    opacity: 0.6,
    borderLeftColor: Colors.text.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  viewCount: {
    alignItems: 'center',
  },
  viewCountNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.accent.pink,
  },
  viewCountLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  cardStatus: {
    marginBottom: 10,
  },
  activeText: {
    color: Colors.status.success,
    fontWeight: '600',
    fontSize: 12,
  },
  expiredText: {
    color: Colors.status.error,
    fontWeight: '600',
    fontSize: 12,
  },
  expiresText: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  deactivateButton: {
    backgroundColor: Colors.status.error,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  deactivateButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 12,
  },
  infoSection: {
    backgroundColor: Colors.background.white,
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.status.info,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});

export default ProfileSharingScreen;
