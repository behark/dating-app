import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

// Profile Components
import InteractivePhotoGallery from '../components/Profile/InteractivePhotoGallery';
import ProfileCompletionProgress from '../components/Profile/ProfileCompletionProgress';
import ProfileVideoIntroduction from '../components/Profile/ProfileVideoIntroduction';
import { VerificationBadgeGroup, VerificationStatus } from '../components/Profile/VerificationBadge';

// Gamification Components
import { AchievementShowcase } from '../components/Gamification/AchievementBadgeAnimated';
import BadgeShowcase from '../components/Gamification/BadgeShowcase';
import DailyChallenges from '../components/Gamification/DailyChallenges';
import LevelProgressionCard from '../components/Gamification/LevelProgressionCard';

// Services
import GamificationService from '../services/GamificationService';

const EnhancedProfileScreen = () => {
  const navigation = useNavigation();
  const { currentUser, logout } = useAuth();
  
  // Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    bio: '',
    photos: [],
    videoIntro: null,
    interests: [],
    location: null,
    verified: false,
  });
  
  // Gamification State
  const [gamificationData, setGamificationData] = useState({
    currentXP: 0,
    level: 1,
    achievements: [],
    badges: [],
    challenges: [],
    challengeProgress: {},
  });
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'achievements', 'settings'

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProfile(),
        loadGamificationData(),
      ]);
    } catch (error) {
      logger.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          name: data.name || '',
          age: data.age?.toString() || '',
          bio: data.bio || '',
          photos: data.photos || (data.photoURL ? [data.photoURL] : []),
          videoIntro: data.videoIntro || null,
          interests: data.interests || [],
          location: data.location || null,
          verified: data.verified || false,
          verificationBadges: data.verificationBadges || [],
          ...data,
        });
      }
    } catch (error) {
      logger.error('Error loading profile:', error);
    }
  };

  const loadGamificationData = async () => {
    try {
      const [levelData, challenges, achievements, badges] = await Promise.all([
        GamificationService.getUserLevel(currentUser.uid),
        GamificationService.getDailyChallenges(currentUser.uid),
        GamificationService.getUserAchievements(currentUser.uid),
        GamificationService.getUserBadges(currentUser.uid),
      ]);

      setGamificationData({
        currentXP: levelData?.currentXP || 0,
        level: levelData?.level || 1,
        achievements: achievements?.unlocked || [],
        badges: badges || [],
        challenges: challenges || [],
        challengeProgress: achievements?.progress || {},
      });
    } catch (error) {
      logger.error('Error loading gamification data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);

  const handleVideoChange = async (videoUrl) => {
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { videoIntro: videoUrl, updatedAt: new Date() },
        { merge: true }
      );
      setProfileData(prev => ({ ...prev, videoIntro: videoUrl }));
      
      // Award XP for adding video
      await GamificationService.trackAction(currentUser.uid, 'update_profile', { field: 'video' });
      Alert.alert('Success', 'Video introduction updated!');
    } catch (error) {
      logger.error('Error updating video:', error);
      Alert.alert('Error', 'Failed to update video');
    }
  };

  const handlePhotosChange = async (newPhotos) => {
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { photos: newPhotos, updatedAt: new Date() },
        { merge: true }
      );
      setProfileData(prev => ({ ...prev, photos: newPhotos }));
    } catch (error) {
      logger.error('Error updating photos:', error);
    }
  };

  const handleLevelUp = (newLevel) => {
    Alert.alert(
      '🎉 Level Up!',
      `Congratulations! You've reached ${newLevel.name}!`,
      [{ text: 'Awesome!' }]
    );
  };

  const handleClaimChallengeReward = async (challengeId, reward) => {
    try {
      await GamificationService.claimChallengeReward(currentUser.uid, challengeId);
      await loadGamificationData();
      Alert.alert('Reward Claimed!', `You earned ${reward} XP!`);
    } catch (error) {
      logger.error('Error claiming reward:', error);
      Alert.alert('Error', 'Failed to claim reward');
    }
  };

  const handleSectionPress = (sectionId) => {
    const sectionScreens = {
      photos: 'PhotoGallery',
      bio: 'EditProfile',
      interests: 'EditInterests',
      verification: 'Verification',
      preferences: 'Preferences',
    };
    
    const screen = sectionScreens[sectionId];
    if (screen) {
      navigation.navigate(screen);
    }
  };

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      {/* Profile Completion Progress */}
      <ProfileCompletionProgress
        profileData={profileData}
        onSectionPress={handleSectionPress}
      />

      {/* Video Introduction */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Video Introduction</Text>
        <ProfileVideoIntroduction
          videoUrl={profileData.videoIntro}
          onVideoChange={handleVideoChange}
          onVideoRemove={() => handleVideoChange(null)}
        />
      </View>

      {/* Photo Gallery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 Photos</Text>
        <InteractivePhotoGallery
          photos={profileData.photos}
          editable={true}
          maxPhotos={6}
          onPhotosChange={handlePhotosChange}
        />
      </View>

      {/* Verification Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✓ Verification</Text>
        <VerificationStatus
          verifications={profileData.verificationBadges || []}
          onVerifyPress={() => navigation.navigate('Verification')}
        />
      </View>

      {/* Level Progression */}
      <View style={styles.section}>
        <LevelProgressionCard
          currentXP={gamificationData.currentXP}
          onLevelUp={handleLevelUp}
          showActions={true}
        />
      </View>
    </View>
  );

  const renderAchievementsTab = () => (
    <View style={styles.tabContent}>
      {/* Daily Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Daily Challenges</Text>
        <DailyChallenges
          challenges={gamificationData.challenges}
          progress={gamificationData.challengeProgress}
          onClaimReward={handleClaimChallengeReward}
        />
      </View>

      {/* Achievements Showcase */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        <AchievementShowcase
          unlockedAchievements={gamificationData.achievements}
          maxDisplay={6}
        />
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎖️ Badges</Text>
        <BadgeShowcase badges={gamificationData.badges} userId={currentUser.uid} />
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Preferences')}
        >
          <Ionicons name="settings" size={24} color="#667eea" />
          <Text style={styles.settingsButtonText}>Preferences</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('NotificationPreferences')}
        >
          <Ionicons name="notifications" size={24} color="#FFA500" />
          <Text style={styles.settingsButtonText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('SafetyTips')}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color="#FF9800" />
          <Text style={styles.settingsButtonText}>Safety Tips</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('SafetyAdvanced', { userId: currentUser.uid, isPremium: true })}
        >
          <Ionicons name="shield" size={24} color="#FF6B9D" />
          <Text style={styles.settingsButtonText}>Safety Center</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => navigation.navigate('Premium')}
        >
          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumGradient}>
            <Ionicons name="diamond" size={24} color="#fff" />
            <Text style={styles.premiumButtonText}>Go Premium</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {/* Verification Badges */}
          <View style={styles.verificationBadges}>
            <VerificationBadgeGroup
              verifications={profileData.verificationBadges || []}
              size="small"
              showLabels={false}
            />
          </View>
          
          {/* Profile Summary */}
          <Text style={styles.profileName}>{profileData.name || 'Your Name'}</Text>
          {profileData.age && (
            <Text style={styles.profileAge}>{profileData.age} years old</Text>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.card}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
              onPress={() => setActiveTab('profile')}
            >
              <Ionicons 
                name="person" 
                size={20} 
                color={activeTab === 'profile' ? '#667eea' : '#999'} 
              />
              <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
                Profile
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
              onPress={() => setActiveTab('achievements')}
            >
              <Ionicons 
                name="trophy" 
                size={20} 
                color={activeTab === 'achievements' ? '#667eea' : '#999'} 
              />
              <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
                Achievements
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
              onPress={() => setActiveTab('settings')}
            >
              <Ionicons 
                name="settings" 
                size={20} 
                color={activeTab === 'settings' ? '#667eea' : '#999'} 
              />
              <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'achievements' && renderAchievementsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </View>
      </ScrollView>
    </LinearGradient>
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
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  verificationBadges: {
    marginBottom: 15,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileAge: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
    minHeight: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#667eea',
  },
  tabContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingsButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  premiumButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  premiumButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginLeft: 10,
    fontWeight: '600',
  },
});

export default EnhancedProfileScreen;
