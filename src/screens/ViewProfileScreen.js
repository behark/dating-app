import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { db } from '../config/firebase';
import logger from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ViewProfileScreen = ({ route, navigation }) => {
  const { userId, showCompatibility } = route.params;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompatibilityScore, setShowCompatibilityScore] = useState(showCompatibility || false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setProfile({ id: userDoc.id, ...userDoc.data() });
      } else {
        // Profile doesn't exist
        Alert.alert(
          'Profile Not Found',
          'This profile could not be found. It may have been deleted.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      logger.error('Error loading profile:', error);
      Alert.alert(
        'Error Loading Profile',
        error.message || 'Failed to load profile. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: loadProfile,
          },
          {
            text: 'Go Back',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person" size={60} color={Colors.background.white} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={60} color={Colors.background.white} />
          <Text style={styles.loadingText}>Profile not found</Text>
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => setShowCompatibilityScore(!showCompatibilityScore)}
          style={styles.compatibilityButton}
        >
          <Ionicons name="heart" size={20} color={Colors.accent.red} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                profile.photoURL ||
                profile.photos?.[0]?.url ||
                profile.photos?.[0] ||
                process.env.EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL ||
                'https://via.placeholder.com/400',
            }}
            style={styles.profileImage}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.nameSection}>
            <Text style={styles.name}>{profile.name || 'Unknown'}</Text>
            {profile.age && <Text style={styles.age}>{profile.age} years old</Text>}
          </View>

          {profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{profile.email || 'Not provided'}</Text>
            </View>
            {profile.createdAt && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>
                  Member since {profile.createdAt.toDate?.().toLocaleDateString() || 'Recently'}
                </Text>
              </View>
            )}
          </View>

          {showCompatibilityScore && (
            <View style={styles.compatibilitySection}>
              <View style={styles.compatibilityHeader}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
                <Text style={styles.compatibilityTitle}>Compatibility Score</Text>
              </View>
              <TouchableOpacity
                style={styles.viewCompatibilityButton}
                onPress={() =>
                  navigation.navigate('Premium', {
                    feature: 'compatibility',
                    targetUserId: userId,
                  })
                }
              >
                <Ionicons name="trending-up" size={16} color={Colors.background.white} />
                <Text style={styles.viewCompatibilityText}>View AI Analysis</Text>
              </TouchableOpacity>
            </View>
          )}
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
  scrollContent: {
    paddingBottom: 30,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
    zIndex: 10,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: Colors.background.white,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  card: {
    backgroundColor: Colors.background.white,
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 25,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.gray,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text.dark,
    marginBottom: 5,
  },
  age: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  infoSection: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginLeft: 12,
    flex: 1,
  },
  compatibilityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  compatibilitySection: {
    backgroundColor: Colors.background.white,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.red,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compatibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compatibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginLeft: 8,
  },
  viewCompatibilityButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewCompatibilityText: {
    color: Colors.background.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ViewProfileScreen;
