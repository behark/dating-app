import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SwipeCard from '../components/Card/SwipeCard';
import { useAuth } from '../context/AuthContext';
import LoginScreen from './LoginScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Demo profiles for preview
const DEMO_PROFILES = [
  {
    id: 'demo_1',
    name: 'Alex',
    age: 28,
    bio: 'Love hiking, coffee, and good conversations. Looking for someone to explore the city with!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['hiking', 'coffee', 'travel', 'photography'],
    distance: 5,
    isVerified: true,
  },
  {
    id: 'demo_2',
    name: 'Jordan',
    age: 26,
    bio: 'Foodie, bookworm, and adventure seeker. Always up for trying something new!',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['food', 'books', 'yoga', 'music'],
    distance: 12,
    isVerified: false,
  },
  {
    id: 'demo_3',
    name: 'Taylor',
    age: 30,
    bio: 'Fitness enthusiast, dog lover, and weekend explorer. Let\'s make memories together!',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['fitness', 'dogs', 'travel', 'cooking'],
    distance: 8,
    isVerified: true,
  },
  {
    id: 'demo_4',
    name: 'Sam',
    age: 27,
    bio: 'Creative soul, music lover, and sunset chaser. Looking for my person to share adventures with.',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['music', 'art', 'beach', 'photography'],
    distance: 15,
    isVerified: false,
  },
  {
    id: 'demo_5',
    name: 'Casey',
    age: 29,
    bio: 'Tech enthusiast, coffee addict, and weekend warrior. Let\'s build something amazing together!',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['technology', 'coffee', 'hiking', 'gaming'],
    distance: 20,
    isVerified: true,
  },
];

const PreviewHomeScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [cards] = useState(DEMO_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [interactionType, setInteractionType] = useState(null); // 'swipe', 'view', 'like'

  // Close modal when user successfully logs in
  useEffect(() => {
    if (currentUser && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [currentUser, showLoginModal]);

  // If user is logged in, they shouldn't see preview
  if (currentUser) {
    return null; // Will be handled by AppNavigator
  }

  const handleSwipeLeft = () => {
    setInteractionType('swipe');
    setShowLoginModal(true);
  };

  const handleSwipeRight = () => {
    setInteractionType('swipe');
    setShowLoginModal(true);
  };

  const handleViewProfile = () => {
    setInteractionType('view');
    setShowLoginModal(true);
  };

  const handleLike = () => {
    setInteractionType('like');
    setShowLoginModal(true);
  };

  const handleSuperLike = () => {
    setInteractionType('superlike');
    setShowLoginModal(true);
  };

  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop back to first card
      setCurrentIndex(0);
    }
  };

  const getInteractionMessage = () => {
    switch (interactionType) {
      case 'swipe':
        return 'Sign up to start matching!';
      case 'view':
        return 'Create an account to view full profiles';
      case 'like':
        return 'Join to like and match with people';
      case 'superlike':
        return 'Sign up to send Super Likes!';
      default:
        return 'Sign up to get started';
    }
  };

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      {/* Preview Badge */}
      <View style={styles.previewBadge}>
        <Ionicons name="eye" size={14} color="#667eea" />
        <Text style={styles.previewBadgeText}>Preview Mode</Text>
      </View>

      {/* Value Proposition Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Find Your Perfect Match</Text>
          <Text style={styles.headerSubtitle}>
            Swipe through profiles • Match with people • Start meaningful conversations
          </Text>
        </View>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => setShowLoginModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.signUpButtonGradient}
          >
            <Text style={styles.signUpButtonText}>Sign Up Free</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Demo Cards */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cards.length > 0 && cards.slice(currentIndex, currentIndex + 3).map((card, index) => (
          <View key={card.id} style={styles.cardWrapper}>
            <SwipeCard
              card={card}
              index={currentIndex + index}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onViewProfile={handleViewProfile}
            />
            {/* Demo Overlay */}
            <View style={styles.demoOverlay}>
              <View style={styles.demoBadge}>
                <Ionicons name="information-circle" size={16} color="#fff" />
                <Text style={styles.demoBadgeText}>Demo Profile</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Empty State */}
        {currentIndex >= cards.length && (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
              style={styles.emptyCard}
            >
              <Ionicons name="heart" size={80} color="#667eea" />
              <Text style={styles.emptyTitle}>You've seen all preview profiles!</Text>
              <Text style={styles.emptyText}>
                Sign up to see real matches in your area and start connecting
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => setShowLoginModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.ctaButtonGradient}
                >
                  <Text style={styles.ctaButtonText}>Get Started Free</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={handleSwipeLeft}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={32} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={handleSuperLike}
          activeOpacity={0.7}
        >
          <Ionicons name="star" size={28} color="#4ECDC4" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleSwipeRight}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={32} color="#4ECDC4" />
        </TouchableOpacity>
      </View>

      {/* Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowLoginModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{getInteractionMessage()}</Text>
            <Text style={styles.modalSubtitle}>
              Create a free account to {interactionType === 'view' ? 'view full profiles' : 'start matching'}
            </Text>
          </View>
          <View style={styles.loginContainer}>
            <LoginScreen 
              navigation={navigation}
              onAuthSuccess={() => setShowLoginModal(false)}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewBadge: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  previewBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  signUpButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  demoOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  demoBadgeText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCard: {
    width: '100%',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  ctaButton: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  passButton: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  superLikeButton: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loginContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default PreviewHomeScreen;
