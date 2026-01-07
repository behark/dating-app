import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  InteractionManager,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import SkeletonCard from '../components/Card/SkeletonCard';
import SwipeCard from '../components/Card/SwipeCard';
import EmptyState from '../components/Common/EmptyState';
import MicroAnimations from '../components/Common/MicroAnimations';
import { Colors } from '../constants/colors';
import { UI_MESSAGES } from '../constants/constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserRepository } from '../repositories';
import AdvancedInteractionsService from '../services/AdvancedInteractionsService';
import AnalyticsService from '../services/AnalyticsService';
import { GamificationService } from '../services/GamificationService';
import { LocationService } from '../services/LocationService';
import { PreferencesService } from '../services/PreferencesService';
import { PremiumService } from '../services/PremiumService';
import { SwipeController } from '../services/SwipeController';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSwipeActions } from '../hooks/useSwipeActions';
import { GuestModeBanner, PremiumHeader, ActionButtons } from '../components/Home';
import HapticFeedback from '../utils/haptics';
import logger from '../utils/logger';
import LoginScreen from './LoginScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Minimum time between swipes on the same card (ms) - prevents race conditions
const SWIPE_DEBOUNCE_MS = 500;

// Guest mode configuration
const GUEST_FREE_VIEWS = 10; // Number of profiles guest can view before prompt (increased for better UX)
const GUEST_DEMO_PROFILES = [
  {
    id: 'demo_1',
    _id: 'demo_1',
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
    isDemo: true,
  },
  {
    id: 'demo_2',
    _id: 'demo_2',
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
    isDemo: true,
  },
  {
    id: 'demo_3',
    _id: 'demo_3',
    name: 'Taylor',
    age: 30,
    bio: "Fitness enthusiast, dog lover, and weekend explorer. Let's make memories together!",
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['fitness', 'dogs', 'travel', 'cooking'],
    distance: 8,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_4',
    _id: 'demo_4',
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
    isDemo: true,
  },
  {
    id: 'demo_5',
    _id: 'demo_5',
    name: 'Casey',
    age: 29,
    bio: "Tech enthusiast, coffee addict, and weekend warrior. Let's build something amazing together!",
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['technology', 'coffee', 'hiking', 'gaming'],
    distance: 20,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_6',
    _id: 'demo_6',
    name: 'Emma',
    age: 25,
    bio: 'Yoga instructor by day, wine enthusiast by night. Seeking meaningful connections!',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['yoga', 'reading', 'cooking', 'wine'],
    distance: 7,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_7',
    _id: 'demo_7',
    name: 'James',
    age: 32,
    bio: 'Passionate about fitness and photography. Love exploring new places and meeting new people!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['fitness', 'running', 'travel', 'photography'],
    distance: 10,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_8',
    _id: 'demo_8',
    name: 'Olivia',
    age: 24,
    bio: 'Art lover, museum enthusiast, and theater goer. Looking for someone to share cultural experiences with.',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['art', 'museums', 'theater', 'concerts'],
    distance: 6,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_9',
    _id: 'demo_9',
    name: 'Michael',
    age: 35,
    bio: 'Chef at heart, traveler by nature. Always cooking up new adventures!',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['cooking', 'wine', 'travel', 'photography'],
    distance: 14,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_10',
    _id: 'demo_10',
    name: 'Sophia',
    age: 26,
    bio: 'Wellness coach and nature enthusiast. Seeking balance and genuine connections.',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['fitness', 'yoga', 'meditation', 'nature'],
    distance: 9,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_11',
    _id: 'demo_11',
    name: 'David',
    age: 31,
    bio: 'Software engineer who loves gaming and coffee. Looking for my player two!',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['technology', 'gaming', 'coffee', 'hiking'],
    distance: 11,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_12',
    _id: 'demo_12',
    name: 'Ava',
    age: 23,
    bio: 'Writer and bookworm. Love deep conversations over coffee and good books.',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['reading', 'writing', 'coffee', 'books'],
    distance: 5,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_13',
    _id: 'demo_13',
    name: 'Chris',
    age: 29,
    bio: 'Photographer capturing life\'s beautiful moments. Let\'s create memories together!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['photography', 'travel', 'nature', 'hiking'],
    distance: 13,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_14',
    _id: 'demo_14',
    name: 'Isabella',
    age: 27,
    bio: 'Music producer and concert goer. Dancing through life and looking for a partner!',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['music', 'concerts', 'dancing', 'art'],
    distance: 8,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_15',
    _id: 'demo_15',
    name: 'Daniel',
    age: 33,
    bio: 'Cyclist and fitness enthusiast. Always on the move and ready for adventure!',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['fitness', 'cycling', 'travel', 'photography'],
    distance: 16,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_16',
    _id: 'demo_16',
    name: 'Mia',
    age: 25,
    bio: 'Food blogger and cooking enthusiast. Let\'s explore restaurants and cook together!',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['cooking', 'foodie', 'wine', 'travel'],
    distance: 7,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_17',
    _id: 'demo_17',
    name: 'Matt',
    age: 28,
    bio: 'Tech startup founder. Love gaming, movies, and building cool things!',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['technology', 'gaming', 'coffee', 'movies'],
    distance: 12,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_18',
    _id: 'demo_18',
    name: 'Emily',
    age: 26,
    bio: 'Yoga teacher and meditation guide. Seeking peace, love, and connection.',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['yoga', 'meditation', 'nature', 'reading'],
    distance: 9,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_19',
    _id: 'demo_19',
    name: 'Ryan',
    age: 30,
    bio: 'Travel photographer documenting the world. Looking for someone to explore with!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['photography', 'art', 'travel', 'coffee'],
    distance: 15,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_20',
    _id: 'demo_20',
    name: 'Sarah',
    age: 28,
    bio: 'Fitness trainer and dog mom. Active lifestyle and looking for an active partner!',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['fitness', 'running', 'dogs', 'hiking'],
    distance: 6,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_21',
    _id: 'demo_21',
    name: 'Brandon',
    age: 27,
    bio: 'DJ and music lover. Dancing is my language, let\'s speak it together!',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['music', 'concerts', 'dancing', 'coffee'],
    distance: 11,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_22',
    _id: 'demo_22',
    name: 'Jessica',
    age: 24,
    bio: 'Author and book collector. Love stories, both reading and writing them.',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['reading', 'books', 'writing', 'coffee'],
    distance: 8,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_23',
    _id: 'demo_23',
    name: 'Kevin',
    age: 34,
    bio: 'Adventure seeker and nature photographer. Mountains, beaches, and everything in between!',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['travel', 'photography', 'nature', 'hiking'],
    distance: 17,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_24',
    _id: 'demo_24',
    name: 'Rachel',
    age: 29,
    bio: 'Restaurant owner and foodie. Life is too short for bad food or boring dates!',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['cooking', 'foodie', 'wine', 'travel'],
    distance: 10,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_25',
    _id: 'demo_25',
    name: 'Brian',
    age: 31,
    bio: 'Personal trainer and wellness advocate. Health is wealth, let\'s build it together!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['fitness', 'yoga', 'meditation', 'nature'],
    distance: 13,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_26',
    _id: 'demo_26',
    name: 'Lauren',
    age: 26,
    bio: 'Art curator and museum enthusiast. Beauty is everywhere, let\'s find it together!',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['art', 'museums', 'theater', 'photography'],
    distance: 7,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_27',
    _id: 'demo_27',
    name: 'Eric',
    age: 28,
    bio: 'Game developer and tech geek. Building virtual worlds and seeking real connections!',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['technology', 'gaming', 'coffee', 'movies'],
    distance: 14,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_28',
    _id: 'demo_28',
    name: 'Ashley',
    age: 25,
    bio: 'Musician and concert enthusiast. Music brings people together, let\'s make harmony!',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['music', 'concerts', 'dancing', 'art'],
    distance: 9,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_29',
    _id: 'demo_29',
    name: 'Jason',
    age: 32,
    bio: 'Outdoor enthusiast and camping lover. Nature is my therapy, want to join?',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['hiking', 'camping', 'nature', 'photography'],
    distance: 18,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_30',
    _id: 'demo_30',
    name: 'Amanda',
    age: 27,
    bio: 'Sommelier and wine expert. Life\'s too short to drink bad wine!',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['cooking', 'wine', 'foodie', 'travel'],
    distance: 11,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_31',
    _id: 'demo_31',
    name: 'Andrew',
    age: 29,
    bio: 'Marathon runner and fitness coach. Running through life, one mile at a time!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['fitness', 'running', 'dogs', 'hiking'],
    distance: 12,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_32',
    _id: 'demo_32',
    name: 'Jennifer',
    age: 30,
    bio: 'Meditation teacher and spiritual guide. Seeking inner peace and outer connection.',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['yoga', 'meditation', 'reading', 'nature'],
    distance: 8,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_33',
    _id: 'demo_33',
    name: 'Nick',
    age: 26,
    bio: 'Travel blogger and photographer. Documenting adventures and seeking a travel partner!',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['photography', 'travel', 'art', 'coffee'],
    distance: 15,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_34',
    _id: 'demo_34',
    name: 'Nicole',
    age: 28,
    bio: 'Coffee shop owner and barista. Life happens over coffee, let\'s share a cup!',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['coffee', 'reading', 'books', 'music'],
    distance: 6,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_35',
    _id: 'demo_35',
    name: 'Ben',
    age: 31,
    bio: 'Film director and movie buff. Creating stories and looking for someone to share them with!',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['movies', 'technology', 'coffee', 'art'],
    distance: 19,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_36',
    _id: 'demo_36',
    name: 'Madison',
    age: 24,
    bio: 'Bookstore owner and literature lover. Books, coffee, and meaningful conversations!',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['reading', 'books', 'writing', 'coffee'],
    distance: 10,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_37',
    _id: 'demo_37',
    name: 'Max',
    age: 27,
    bio: 'Adventure photographer and explorer. Capturing moments, seeking a partner for life\'s journey!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['photography', 'travel', 'nature', 'hiking'],
    distance: 13,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_38',
    _id: 'demo_38',
    name: 'Hannah',
    age: 26,
    bio: 'Chef and food stylist. Cooking is love made visible, let\'s create together!',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['cooking', 'foodie', 'wine', 'travel'],
    distance: 7,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_39',
    _id: 'demo_39',
    name: 'Tyler',
    age: 29,
    bio: 'Fitness influencer and health advocate. Strong body, strong mind, strong connection!',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['fitness', 'yoga', 'meditation', 'nature'],
    distance: 16,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_40',
    _id: 'demo_40',
    name: 'Alexis',
    age: 25,
    bio: 'Art therapist and creative soul. Healing through art and seeking meaningful bonds!',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['art', 'museums', 'theater', 'photography'],
    distance: 9,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_41',
    _id: 'demo_41',
    name: 'Morgan',
    age: 28,
    bio: 'Music teacher and pianist. Teaching harmony and seeking it in relationships!',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['music', 'concerts', 'dancing', 'art'],
    distance: 14,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_42',
    _id: 'demo_42',
    name: 'Riley',
    age: 27,
    bio: 'Tech entrepreneur and innovator. Building the future, one connection at a time!',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['technology', 'gaming', 'movies', 'coffee'],
    distance: 11,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_43',
    _id: 'demo_43',
    name: 'Avery',
    age: 26,
    bio: 'Novelist and storyteller. Writing life\'s next chapter, want to be in it?',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['reading', 'books', 'writing', 'coffee'],
    distance: 8,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_44',
    _id: 'demo_44',
    name: 'Quinn',
    age: 29,
    bio: 'Wildlife photographer and conservationist. Protecting nature and seeking a nature-loving partner!',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['photography', 'nature', 'hiking', 'travel'],
    distance: 17,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_45',
    _id: 'demo_45',
    name: 'Reese',
    age: 28,
    bio: 'Restaurant critic and food explorer. Life\'s an adventure, especially at the dinner table!',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['cooking', 'foodie', 'wine', 'travel'],
    distance: 12,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_46',
    _id: 'demo_46',
    name: 'Dakota',
    age: 30,
    bio: 'Yoga studio owner and wellness coach. Finding balance and seeking a balanced relationship!',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['yoga', 'meditation', 'nature', 'fitness'],
    distance: 10,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_47',
    _id: 'demo_47',
    name: 'Samantha',
    age: 27,
    bio: 'Gallery owner and art collector. Beauty, art, and meaningful connections!',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['art', 'museums', 'theater', 'photography'],
    distance: 15,
    isVerified: false,
    isDemo: true,
  },
  {
    id: 'demo_48',
    _id: 'demo_48',
    name: 'Jordan',
    age: 26,
    bio: 'Music festival organizer and DJ. Bringing people together through music and dance!',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['music', 'concerts', 'dancing', 'art'],
    distance: 6,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_49',
    _id: 'demo_49',
    name: 'Alex',
    age: 28,
    bio: 'Mountain guide and outdoor instructor. Conquering peaks and seeking a climbing partner!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['hiking', 'camping', 'nature', 'photography'],
    distance: 19,
    isVerified: true,
    isDemo: true,
  },
  {
    id: 'demo_50',
    _id: 'demo_50',
    name: 'Taylor',
    age: 31,
    bio: 'Wine maker and vineyard owner. Crafting fine wines and seeking fine company!',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['wine', 'cooking', 'travel', 'nature'],
    distance: 13,
    isVerified: true,
    isDemo: true,
  },
];

const HomeScreen = ({ navigation }) => {
  const { currentUser, authToken, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { isOnline } = useNetworkStatus();
  const { width: windowWidth } = useWindowDimensions();
  const styles = getStyles(theme);

  // Swipe actions hook
  const swipeActions = useSwipeActions({
    userId,
    isPremium,
    navigation,
    isGuest,
    promptLogin,
    onOptimisticUpdate: applySwipeUIOptimistic,
    onMatchFound: (name, matchId) => {
      setSuccessMessage(`🎉 Match with ${name}!`);
      setShowSuccessAnimation(true);
    },
  });

  // Guest mode state - only determine after auth loading is complete
  const isGuest = !authLoading && !currentUser;
  const [guestViewCount, setGuestViewCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState(null);

  // Get the user repository (API or Firebase based on config)
  const userRepository = useMemo(() => getUserRepository(authToken), [authToken]);

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // Using real backend data now
  const [refreshing, setRefreshing] = useState(false);
  const [lastSwipedCard, setLastSwipedCard] = useState(null);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumFeatures, setPremiumFeatures] = useState({});
  const [swipesUsedToday, setSwipesUsedToday] = useState(0);
  const [swipesRemaining, setSwipesRemaining] = useState(50);
  const [userLocation, setUserLocation] = useState(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(50); // km
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Success animation state
  const [successMessage, setSuccessMessage] = useState('');
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Get the user ID (supports both uid and _id)
  const userId = currentUser?.uid || currentUser?._id;

  // Guest mode: Show login prompt helper
  const lastPromptRef = useRef(0);
  const promptLogin = useCallback((reason) => {
    if (showLoginModal) return;
    const now = Date.now();
    if (now - lastPromptRef.current < 2000) return;
    lastPromptRef.current = now;
    setLoginPromptReason(reason);
    setShowLoginModal(true);
    AnalyticsService.logEvent('guest_login_prompt', { 
      reason, 
      viewCount: guestViewCount,
      profilesViewed: guestViewCount 
    });
  }, [guestViewCount, showLoginModal]);

  // Guest mode: Get prompt message based on action
  const getLoginPromptMessage = () => {
    switch (loginPromptReason) {
      case 'swipe':
        return { title: '💕 Ready to Match?', subtitle: 'Create a free account to start swiping and find your match!' };
      case 'like':
        return { title: '❤️ Like This Person?', subtitle: 'Sign up to let them know you\'re interested!' };
      case 'superlike':
        return { title: '⭐ Super Like?', subtitle: 'Create an account to send Super Likes and stand out!' };
      case 'view':
        return { title: '👀 Want to See More?', subtitle: 'Sign up to view full profiles and photos!' };
      case 'limit':
        return { 
          title: '🔥 You\'re on Fire!', 
          subtitle: `You've viewed ${guestViewCount} profiles! Sign up free to see unlimited matches and start connecting.` 
        };
      case 'banner':
        return { 
          title: '💕 Ready to Match?', 
          subtitle: 'Join thousands of singles and start your dating journey today!' 
        };
      default:
        return { 
          title: 'Join Our Community!', 
          subtitle: 'Create a free account to unlock all features and start matching!' 
        };
    }
  };

  // Close modal when user logs in
  useEffect(() => {
    if (currentUser && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [currentUser, showLoginModal]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      // Track screen view for analytics
      AnalyticsService.logScreenView('Home');

      // Don't load anything until auth loading is complete
      if (authLoading) {
        setLoading(true);
        return;
      }

      (async () => {
        if (isGuest) {
          // Guest mode: Load demo profiles from database (100 profiles)
          const loc = await initializeLocation();
          if (!isActive) return;
          await loadCards(loc, true); // true = guest mode
          if (!isActive) return;
          return;
        }
        if (userId) {
          const loc = await initializeLocation();
          if (!isActive) return;
          await loadCards(loc);
          if (!isActive) return;
          loadPremiumStatus();
          loadGamificationData();
        }
      })();

      return () => {
        isActive = false;
      };
    }, [userId, isGuest, authLoading])
  );

  const loadGamificationData = async () => {
    if (!userId) return;
    try {
      const streakData = await GamificationService.getSwipeStreak(userId);
      if (streakData) {
        setCurrentStreak(streakData.currentStreak || 0);
        setLongestStreak(streakData.longestStreak || 0);
      }
      setShowRewardNotification(true);
    } catch (error) {
      logger.error('Error loading gamification data:', error);
    }
  };

  const initializeLocation = async () => {
    if (!userId) return;
    try {
      setLocationUpdating(true);

      // First, try to get location from user profile (in case GPS isn't available)
      let location = null;
      try {
        const userData = await userRepository.getCurrentUser(userId);
        if (userData?.location?.coordinates && userData.location.coordinates.length === 2) {
          // User has saved location in profile
          location = {
            latitude: userData.location.coordinates[1], // MongoDB stores as [lng, lat]
            longitude: userData.location.coordinates[0],
            accuracy: null,
          };
          logger.info('Using saved location from user profile', location);
        }
      } catch (profileError) {
        logger.warn('Could not get location from user profile', profileError);
      }

      // If no saved location, try to get current GPS location
      if (!location) {
        const gpsLocation = await LocationService.getCurrentLocation();
        if (gpsLocation) {
          location = gpsLocation;
          // Update user location in database
          await LocationService.updateUserLocation(userId, location);
          // Start periodic location updates (every 5 minutes)
          LocationService.startPeriodicLocationUpdates(userId);
        }
      }

      // If still no location, use a better default (NYC where many demo profiles are)
      if (!location) {
        logger.warn('Location not available, using NYC as default location for discovery');
        const defaultLocation = {
          latitude: 40.7128, // New York City (where many demo profiles are)
          longitude: -74.0060,
          accuracy: null,
        };
        location = defaultLocation;
      }

      setUserLocation(location);
      return location;
    } catch (error) {
      logger.error('Error initializing location:', error);
      // Use NYC as default location on error (better than 0,0)
      const defaultLocation = {
        latitude: 40.7128, // New York City
        longitude: -74.0060,
        accuracy: null,
      };
      setUserLocation(defaultLocation);
      return defaultLocation;
    } finally {
      setLocationUpdating(false);
    }
  };

  const loadPremiumStatus = async () => {
    if (!userId || !authToken) return;
    try {
      const premiumStatus = await PremiumService.checkPremiumStatus(userId, authToken);
      setIsPremium(premiumStatus.isPremium);
      setPremiumFeatures(premiumStatus.features);

      // Get super likes count - using AdvancedInteractionsService
      try {
        const interactionsService = new AdvancedInteractionsService(authToken);
        const quota = await interactionsService.getSuperLikeQuota();
        const superLikesCount = quota?.used || 0;
        setSuperLikesUsed(superLikesCount);
      } catch (error) {
        logger.error('Error loading super likes count:', error);
        setSuperLikesUsed(0);
      }

      // Load swipe count for the day
      const swipesCount = await SwipeController.getSwipesCountToday(userId);
      setSwipesUsedToday(swipesCount);

      // Calculate remaining swipes (50 for free, unlimited for premium)
      if (premiumStatus.isPremium) {
        setSwipesRemaining(-1); // -1 indicates unlimited
      } else {
        setSwipesRemaining(Math.max(0, 50 - swipesCount));
      }
    } catch (error) {
      logger.error('Error loading premium status:', error);
    }
  };

  // Cleanup repository cache on unmount
  useEffect(() => {
    return () => {
      // Stop periodic location updates to prevent memory leak
      LocationService.stopPeriodicLocationUpdates();
    };
  }, []);

  const loadCards = async (loc, isGuestMode = false) => {
    if (!isGuestMode && !userId) {
      setLoading(false);
      return;
    }

    // Check network status before making API calls
    if (!isOnline) {
      setLoading(false);
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);

      let availableUsers = [];
      if (isGuestMode) {
        // For guest users, use DiscoveryService to get demo profiles
        const DiscoveryService = (await import('../services/DiscoveryService')).default;
        const discoveryService = new DiscoveryService();
        const result = await discoveryService.exploreUsers(
          loc?.latitude ?? userLocation?.latitude ?? 40.7128,
          loc?.longitude ?? userLocation?.longitude ?? -74.0060,
          {
            radius: discoveryRadius * 1000,
            limit: 50,
            guest: true,
          }
        );
        availableUsers = result || [];
      } else {
        // For authenticated users, use repository to get discoverable users
        availableUsers = await userRepository.getDiscoverableUsers(userId, {
          limit: 50,
          lat: (loc?.latitude ?? userLocation?.latitude),
          lng: (loc?.longitude ?? userLocation?.longitude),
          radius: discoveryRadius * 1000, // Convert km to meters
        });
      }

      // If no users found, show empty state (no error alert)
      if (availableUsers.length === 0) {
        setCards([]);
        setCurrentIndex(0);
        setLoading(false);
        return;
      }

      // Apply user preferences filtering
      const filteredUsers = await PreferencesService.filterUsersForDiscovery(
        userId,
        availableUsers
      );

      // Shuffle for variety
      const shuffled = filteredUsers.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading cards:', error);
      // Show empty state when backend is not available
      setCards([]);
      setCurrentIndex(0);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear repository cache on refresh to get fresh data
    if (!isGuest) {
      userRepository.clearCache();
    }
    await loadCards(null, isGuest);
    setRefreshing(false);
  };

  const applySwipeUIOptimistic = useCallback((direction, card) => {
    startTransition(() => {
      setLastSwipedCard({ card, direction, swipeId: null });
      setCurrentIndex((prev) => prev + 1);
      const newCount = swipesUsedToday + 1;
      setSwipesUsedToday(newCount);
      if (!isPremium) {
        setSwipesRemaining(Math.max(0, 50 - newCount));
      }
    });
  }, [isPremium, swipesUsedToday]);

  const reconcileSwipeCounters = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await SwipeController.getSwipesCountToday(userId);
      startTransition(() => {
        setSwipesUsedToday(count);
        if (!isPremium) {
          setSwipesRemaining(Math.max(0, 50 - count));
        }
      });
    } catch (e) {
      logger.error('Error reconciling swipe counters', e);
    }
  }, [userId, isPremium]);

  // Swipe handlers using the swipe actions hook
  const handleSwipeRight = useCallback((card) => {
    if (isGuest) {
      const newViewCount = guestViewCount + 1;
      setGuestViewCount(newViewCount);
      promptLogin('like');
      return;
    }
    swipeActions.handleSwipeRight(card);
  }, [isGuest, guestViewCount, promptLogin, swipeActions]);

  const handleSwipeLeft = useCallback((card) => {
    if (isGuest) {
      const newViewCount = guestViewCount + 1;
      setGuestViewCount(newViewCount);
      if (newViewCount >= GUEST_FREE_VIEWS) {
        promptLogin('limit');
      }
      return;
    }
    swipeActions.handleSwipeLeft(card);
  }, [isGuest, guestViewCount, promptLogin, swipeActions, GUEST_FREE_VIEWS]);

  const handleSuperLike = useCallback(
    async (card) => {
      // Guest mode: Prompt login for super like
      if (isGuest) {
        promptLogin('superlike');
        return;
      }

      // Heavy haptic for super like
      HapticFeedback.heavyImpact();

      // Defer heavy async work
      InteractionManager.runAfterInteractions(async () => {
        try {
          const interactionsService = new AdvancedInteractionsService(authToken);
          const targetId = card.id || card._id;
          const result = await interactionsService.sendSuperLike(targetId, null);

          if (!result.success) {
            if (result.error === 'Daily super like limit reached') {
              setTimeout(() => {
                Alert.alert(
                  'Super Like Limit Reached',
                  `You've used all ${premiumFeatures.superLikesPerDay || 1} super likes for today. Upgrade to premium for more!`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
                  ]
                );
              }, 0);
            } else {
              setTimeout(() => {
                Alert.alert('Error', result.error);
              }, 0);
            }
            return;
          }

          // Increment used super likes on success
          startTransition(() => {
            setSuperLikesUsed((prev) => prev + 1);
          });

          // Track super like analytics
          AnalyticsService.logSwipe('superlike', targetId);

          // Apply optimistic like UI without double-calling like
          applySwipeUIOptimistic('right', card);
          startTransition(() => {
            setLastSwipedCard({ card, direction: 'right', swipeId: result.swipeId || null });
          });

          // Feedback
          setTimeout(() => {
            Alert.alert('💎 Super Liked!', `${card.name} will definitely see your interest!`, [
              { text: 'Awesome!', style: 'default' },
            ]);
          }, 100);
        } catch (error) {
          logger.error('Error using super like:', error);
          setTimeout(() => {
            Alert.alert('Error', 'Failed to use super like');
          }, 0);
        } finally {
          await reconcileSwipeCounters();
        }
      });
    },
    [userId, premiumFeatures.superLikesPerDay, authToken, isGuest, promptLogin, navigation, applySwipeUIOptimistic, reconcileSwipeCounters]
  );

  // Guest mode: Handle view profile
  const handleViewProfile = useCallback(
    (card) => {
      if (isGuest) {
        promptLogin('view');
        return;
      }
      // Navigate to profile view for authenticated users
      navigation.navigate('ViewProfile', { profile: card });
    },
    [isGuest, promptLogin, navigation]
  );

  const handleButtonSwipe = useCallback(
    (direction) => {
      if (cards.length > 0 && currentIndex < cards.length) {
        const card = cards[currentIndex];
        if (direction === 'right') {
          handleSwipeRight(card);
        } else {
          handleSwipeLeft(card);
        }
      }
    },
    [cards, currentIndex, handleSwipeRight, handleSwipeLeft]
  );

  const undoLastSwipe = async () => {
    if (lastSwipedCard) {
      try {
        // If we have a swipeId, use the undo method
        if (lastSwipedCard.swipeId) {
          const result = await SwipeController.undoSwipe(userId, lastSwipedCard.swipeId);

          if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to undo swipe');
            return;
          }
        }

        // Restore the card by going back one index
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }

        setLastSwipedCard(null);
        Alert.alert('Success', 'Last swipe has been undone');
      } catch (error) {
        logger.error('Error undoing swipe:', error);
        Alert.alert('Error', 'Failed to undo swipe');
      }
    } else {
      Alert.alert('No Swipe to Undo', 'Undo the current card first');
    }
  };

  // Update swipe counter when undoing
  const undoLastSwipeWithCounter = async () => {
    if (lastSwipedCard) {
      await undoLastSwipe();
      await reconcileSwipeCounters();
    }
  };

  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!userId) return;
      try {
        // Use repository to get current user profile
        const userData = await userRepository.getCurrentUser(userId);
        // Temporarily relaxed: Only require name (not photo) for testing
        // TODO: Re-enable photo requirement after testing: !userData?.photoURL
        setNeedsProfile(!userData?.name);
      } catch (error) {
        logger.error('Error checking profile:', error);
        setNeedsProfile(false); // Don't block on error
      }
    };
    checkProfile();
  }, [userId, userRepository]);

  if (needsProfile) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <EmptyState
            icon="person-add-outline"
            title="Complete Your Profile ✨"
            description="Add your name, photo, and bio to start matching with amazing people!"
            buttonText="Complete Profile"
            onButtonPress={() => {
              HapticFeedback.lightImpact();
              navigation.navigate('Profile');
            }}
            variant="gradient"
            iconSize={80}
          />
        </ScrollView>
      </LinearGradient>
    );
  }

  // Get login prompt content
  const loginPrompt = getLoginPromptMessage();

  return (
    <LinearGradient colors={theme.gradient.primary} style={styles.container}>
      {/* Animations */}
      <MicroAnimations.HeartAnimation
        visible={showHeartAnimation}
        onComplete={() => setShowHeartAnimation(false)}
      />
      <MicroAnimations.SuccessAnimation
        visible={showSuccessAnimation}
        message={successMessage}
        onComplete={() => setShowSuccessAnimation(false)}
      />

      {/* Guest Mode Banner */}
      {isGuest && (
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerContent}>
            <Ionicons name="eye-outline" size={18} color={Colors.primary} />
            <Text style={styles.guestBannerText}>
              {guestViewCount >= GUEST_FREE_VIEWS 
                ? '🔥 Last chance!' 
                : 'Browsing as Guest'}
            </Text>
            {guestViewCount < GUEST_FREE_VIEWS && (
              <Text style={styles.guestBannerCount}>
                {Math.max(0, GUEST_FREE_VIEWS - guestViewCount)} free views left
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.guestSignUpButton,
              guestViewCount >= GUEST_FREE_VIEWS && styles.guestSignUpButtonUrgent
            ]}
            onPress={() => promptLogin('banner')}
          >
            <Text style={styles.guestSignUpButtonText}>
              {guestViewCount >= GUEST_FREE_VIEWS ? '🚀 Sign Up Now' : 'Join Free'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Status Header - Only show for authenticated users */}
      {!isGuest && (
      <View style={styles.premiumHeader}>
        <View style={styles.headerLeftSection}>
          {isPremium ? (
            <LinearGradient colors={Colors.gradient.gold} style={styles.premiumBadge}>
              <Ionicons name="diamond" size={16} color={Colors.background.white} />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={styles.upgradePrompt}
              onPress={() => navigation.navigate('Premium')}
            >
              <Ionicons name="diamond-outline" size={16} color={Colors.accent.gold} />
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          )}

          {!isPremium && (
            <View style={styles.swipeLimitBadge}>
              <Ionicons name="flame" size={14} color={Colors.accent.red} />
              <Text style={styles.swipeLimitText}>{swipesRemaining}/50</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightSection}>
          <TouchableOpacity
            style={styles.discoveryButton}
            onPress={() => navigation.navigate('TopPicks')}
          >
            <Ionicons name="trophy" size={18} color={Colors.accent.gold} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.discoveryButton}
            onPress={() => navigation.navigate('Explore')}
          >
            <Ionicons name="compass" size={18} color={Colors.accent.teal} />
          </TouchableOpacity>
          {userLocation && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color={Colors.accent.red} />
              <Text style={styles.locationText}>{userLocation.latitude.toFixed(2)}°</Text>
            </View>
          )}
          <View style={styles.superLikeCounter}>
            <Ionicons name="star" size={16} color={Colors.accent.teal} />
            <Text style={styles.counterText}>
              {Math.max(0, (premiumFeatures.superLikesPerDay || 1) - superLikesUsed)} left
            </Text>
          </View>
        </View>
      </View>
      )}

      {/* AI Features Quick Access */}
      {isPremium && !isGuest && (
        <View style={styles.aiQuickAccessContainer}>
          <View style={styles.aiHeaderRow}>
            <Ionicons name="sparkles" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.aiQuickAccessTitle}>AI Insights</Text>
          </View>
          <View style={styles.aiButtonsGrid}>
            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('ViewProfile', {
                  userId: cards[currentIndex]?.id || cards[currentIndex]?._id,
                  showCompatibility: true,
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={20} color={Colors.accent.red} />
              <Text style={styles.aiButtonLabel}>Compatibility</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('Premium', {
                  feature: 'conversationStarters',
                  targetUserId: cards[currentIndex]?.id || cards[currentIndex]?._id,
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubbles" size={20} color={Colors.accent.teal} />
              <Text style={styles.aiButtonLabel}>Talk Tips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('EditProfile', {
                  feature: 'bioSuggestions',
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="create" size={20} color={Colors.accent.gold} />
              <Text style={styles.aiButtonLabel}>Bio Ideas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('Premium', {
                  feature: 'smartPhotos',
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="image" size={20} color={Colors.primary} />
              <Text style={styles.aiButtonLabel}>Photo Tips</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading || authLoading
          ? // Show skeleton cards while loading
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} style={{ marginBottom: 15 }} />
            ))
          : cards.length > 0 && (
              <View style={styles.cardsContainer}>
                <View 
                  style={styles.cardsWrapper}
                >
                  {cards
                    .slice(currentIndex, currentIndex + 3)
                    .map((card, index) => (
                      <SwipeCard
                        key={card.id || card._id}
                        card={card}
                        index={currentIndex + index}
                        onSwipeLeft={handleSwipeLeft}
                        onSwipeRight={handleSwipeRight}
                        onViewProfile={() => navigation.navigate('ViewProfile', { userId: card.id || card._id })}
                      />
                    ))}
                </View>
              </View>
            )}

        {currentIndex >= cards.length && cards.length > 0 && (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="checkmark-circle"
              title="You're All Caught Up! ✨"
              description="You've seen all available profiles. Pull down to refresh and discover new matches!"
              buttonText="Refresh"
              onButtonPress={() => {
                HapticFeedback.lightImpact();
                onRefresh();
              }}
              secondaryButtonText="Adjust Filters"
              onSecondaryButtonPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('Preferences');
              }}
              variant="gradient"
              iconSize={80}
            />
          </View>
        )}

        {cards.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="people-outline"
              title={isGuest ? "Preview Mode 👋" : "No Profiles Yet 🌟"}
              description={
                isGuest
                  ? "You're viewing in guest mode. Sign up to see real profiles and start matching!"
                  : "Check back soon for new profiles, or adjust your preferences to see more matches!"
              }
              buttonText={isGuest ? "Sign Up Free" : "Adjust Preferences"}
              onButtonPress={() => {
                HapticFeedback.lightImpact();
                if (isGuest) {
                  promptLogin('view');
                } else {
                  navigation.navigate('Preferences');
                }
              }}
              secondaryButtonText="Refresh"
              onSecondaryButtonPress={() => {
                HapticFeedback.lightImpact();
                onRefresh();
              }}
              variant="gradient"
              iconSize={80}
            />
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {cards.length > 0 && currentIndex < cards.length && (
        <View style={styles.actionButtonsContainer}>
          {lastSwipedCard && (
            <TouchableOpacity
              style={styles.undoButton}
              onPress={undoLastSwipeWithCounter}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-undo" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dislikeButton}
            onPress={() => handleButtonSwipe('left')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Colors.gradient.red} style={styles.actionButtonCircle}>
              <Ionicons name="close" size={32} color={Colors.background.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.superLikeButton,
              superLikesUsed >= (premiumFeatures.superLikesPerDay || 1) && styles.disabledButton,
            ]}
            onPress={() => {
              if (
                superLikesUsed < (premiumFeatures.superLikesPerDay || 1) &&
                cards.length > 0 &&
                currentIndex < cards.length
              ) {
                handleSuperLike(cards[currentIndex]);
              } else if (superLikesUsed >= (premiumFeatures.superLikesPerDay || 1)) {
                Alert.alert(
                  'Super Like Limit',
                  "You've reached your daily limit. Upgrade to premium for unlimited super likes!",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
                  ]
                );
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                superLikesUsed >= (premiumFeatures.superLikesPerDay || 1)
                  ? Colors.gradient.disabled
                  : Colors.gradient.teal
              }
              style={styles.actionButtonCircle}
            >
              <Ionicons name="star" size={28} color={Colors.background.white} />
            </LinearGradient>
            {superLikesUsed >= (premiumFeatures.superLikesPerDay || 1) && (
              <View style={styles.limitBadge}>
                <Ionicons name="lock-closed" size={12} color={Colors.background.white} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleButtonSwipe('right')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Colors.gradient.primary} style={styles.actionButtonCircle}>
              <Ionicons name="heart" size={32} color={Colors.background.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Guest Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLoginModal(false)}
        accessibilityLabel="Sign up or login dialog"
      >
        <View style={styles.loginModalContainer}>
          <View style={styles.loginModalHeader}>
            <TouchableOpacity
              onPress={() => setShowLoginModal(false)}
              style={styles.loginModalCloseButton}
            >
              <Ionicons name="close" size={28} color={Colors.text.dark} />
            </TouchableOpacity>
            <Text style={styles.loginModalTitle}>{loginPrompt.title}</Text>
            <Text style={styles.loginModalSubtitle}>{loginPrompt.subtitle}</Text>
          </View>
          <View style={styles.loginModalContent}>
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

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
      ...Platform.select({
        web: {
          // Ensure no padding on web that could affect centering
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },
      }),
    },
    // Guest mode styles
    guestBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.light,
    },
    guestBannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    guestBannerText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary,
    },
    guestBannerCount: {
      fontSize: 12,
      color: Colors.text.secondary,
      marginLeft: 8,
    },
    guestSignUpButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    guestSignUpButtonUrgent: {
      backgroundColor: Colors.accent.red,
      shadowColor: Colors.accent.red,
    },
    guestSignUpButtonText: {
      color: Colors.background.white,
      fontSize: 13,
      fontWeight: '700',
    },
    loginModalContainer: {
      flex: 1,
      backgroundColor: Colors.background.white,
    },
    loginModalHeader: {
      paddingTop: 50,
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.light,
    },
    loginModalCloseButton: {
      alignSelf: 'flex-end',
      padding: 10,
    },
    loginModalTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: Colors.text.dark,
      marginTop: 10,
      marginBottom: 8,
      textAlign: 'center',
    },
    loginModalSubtitle: {
      fontSize: 15,
      color: Colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    loginModalContent: {
      flex: 1,
    },
    premiumHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 10,
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      shadowColor: Colors.accent.gold,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    premiumText: {
      color: theme.text.inverse,
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 4,
    },
    headerLeftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    swipeLimitBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark ? 'rgba(242, 139, 130, 0.1)' : 'rgba(255, 107, 107, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.interactive.danger,
    },
    swipeLimitText: {
      color: theme.interactive.danger,
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
    },
    upgradePrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: Colors.accent.gold,
    },
    upgradeText: {
      color: Colors.accent.gold,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    locationText: {
      color: Colors.accent.red,
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 4,
    },
    headerRightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    discoveryButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    superLikeCounter: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(78, 205, 196, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    counterText: {
      color: Colors.accent.teal,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 20,
      paddingBottom: 100,
      width: '100%', // Ensure full width on web
      ...Platform.select({
        web: {
          // Remove any horizontal padding that could affect centering
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },
      }),
    },
    cardsContainer: {
      width: '100%',
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: SCREEN_HEIGHT * 0.75,
      ...Platform.select({
        web: {
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          // No marginHorizontal - let flexbox handle centering
        },
      }),
    },
    cardsWrapper: {
      // On web, use 100% width and let flexbox center the cards
      width: Platform.OS === 'web' ? '100%' : SCREEN_WIDTH,
      position: 'relative',
      alignItems: 'center', // This centers the absolutely positioned cards
      justifyContent: 'center', // This centers the absolutely positioned cards
      minHeight: SCREEN_HEIGHT * 0.75,
      ...Platform.select({
        web: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          // Remove fixed pixel widths - let flexbox handle centering
        },
      }),
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
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      minHeight: 400,
    },
    emptyCard: {
      width: SCREEN_WIDTH - 40,
      borderRadius: 30,
      padding: 40,
      alignItems: 'center',
      shadowColor: Colors.text.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 15,
    },
    emptyTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: Colors.background.white,
      marginTop: 20,
      marginBottom: 15,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: Colors.text.white90,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    actionButton: {
      borderRadius: 25,
      overflow: 'hidden',
      marginTop: 10,
    },
    actionButtonGradient: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: Colors.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    actionButtonsContainer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center', // Centers buttons horizontally
      alignItems: 'center', // Centers buttons vertically
      paddingHorizontal: 20,
      gap: 15,
      ...Platform.select({
        web: {
          // Ensure perfect centering on web
          display: 'flex',
          width: '100%',
          marginLeft: 0,
          marginRight: 0,
        },
      }),
    },
    undoButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: Colors.background.white,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.text.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      marginRight: 10,
    },
    dislikeButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      overflow: 'hidden',
      shadowColor: Colors.accent.red,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    superLikeButton: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      overflow: 'hidden',
      shadowColor: Colors.accent.teal,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    likeButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      overflow: 'hidden',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    actionButtonCircle: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    disabledButton: {
      opacity: 0.6,
    },
    limitBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: Colors.accent.red,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.background.white,
    },
    aiQuickAccessContainer: {
      backgroundColor: Colors.background.white,
      borderBottomWidth: 1,
      borderBottomColor: Colors.background.light,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    aiHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    aiQuickAccessTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text.dark,
    },
    aiButtonsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    aiQuickButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: Colors.background.lightest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border.gray,
    },
    aiButtonLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: Colors.text.dark,
      marginTop: 6,
      textAlign: 'center',
    },
    gamificationSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border.light,
    },
  });

export default HomeScreen;
