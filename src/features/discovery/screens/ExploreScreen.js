import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../../services/api';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { calculateDistance } from '../../../utils/distanceCalculator';
import { showStandardError } from '../../../utils/errorHandler';
import logger from '../../../utils/logger';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 24) / 2;

// Import demo profiles from HomeScreen
const DEMO_PROFILES = [
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

const ExploreScreen = ({ navigation }) => {
  const { user, authToken, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [sortBy, setSortBy] = useState('recentActivity');
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 100,
    gender: 'any',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });
        setLocation(loc.coords);
      } else {
        // Permission denied
        Alert.alert(
          'Location Permission Required',
          'We need your location to show you nearby matches. Please enable location permissions in your device settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                // On some platforms, you might want to open settings
                // For now, just show the alert
                logger.info('User needs to enable location permissions manually');
              },
            },
          ]
        );
        // Still allow user to use the app, but show a message
        setLoading(false);
      }
    } catch (error) {
      logger.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        error.message || 'Failed to get your location. Some features may not work correctly.',
        [
          {
            text: 'Retry',
            onPress: getLocation,
          },
          {
            text: 'Continue Without Location',
            style: 'cancel',
            onPress: () => {
              // Allow user to continue, but they won't see location-based results
              setLoading(false);
            },
          },
        ]
      );
    }
  }, []);

  const exploreUsers = useCallback(
    async (loadMore = false) => {
      if (!location) return;

      if (loadMore) {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
        setUsers([]);
        setHasMore(true);
      }

      try {
        const currentPage = loadMore ? page + 1 : 1;
        const queryParams = new URLSearchParams({
          lat: location.latitude,
          lng: location.longitude,
          radius: '50000',
          minAge: filters.minAge,
          maxAge: filters.maxAge,
          gender: filters.gender,
          sortBy: sortBy,
          page: currentPage.toString(),
          limit: '20',
          // Enable guest access to demo profiles
          ...(isGuest ? { guest: 'true' } : {}),
        });

        const response = await api.get(`/discovery/explore?${queryParams}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          const newUsers = data.data?.users || data.data || [];
          const pagination = data.pagination || {};

          // Merge demo profiles with API results (demo profiles always appear first)
          const allUsers = [...DEMO_PROFILES, ...newUsers];

          if (loadMore) {
            setUsers((prev) => [...prev, ...allUsers]);
          } else {
            setUsers(allUsers);
          }

          setHasMore(pagination.hasMore !== false && newUsers.length === 20);
          setPage(currentPage);
        }
      } catch (error) {
        logger.error('Error exploring users:', error);
        showStandardError(error, 'load', 'Unable to Load');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [location, sortBy, filters, user, authToken, page, hasMore, loadingMore, isGuest]
  );

  // Don't load if user is not authenticated
  const isGuest = !user;

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    if (location && user && !authLoading) {
      exploreUsers();
    } else if (!user && !authLoading) {
      // Guest user - show demo profiles only
      setUsers(DEMO_PROFILES);
      setLoading(false);
    }
  }, [location, exploreUsers, user, authLoading]);

  const renderUserCard = ({ item }) => {
    let distance = item.distance;
    if (
      !distance &&
      location &&
      item.location?.coordinates &&
      item.location.coordinates.length >= 2
    ) {
      distance = calculateDistance(
        location.latitude,
        location.longitude,
        item.location.coordinates[1],
        item.location.coordinates[0]
      );
    }

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => navigation.navigate('ViewProfile', { userId: item._id })}
      >
        {item.photos?.[0] && (
          <Image source={{ uri: item.photos[0]?.url || item.photos[0] }} style={styles.userImage} />
        )}

        {item.isBoosted && (
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.8)', 'rgba(255, 215, 0, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.boostedBadge}
          >
            <Ionicons name="flash" size={16} color={Colors.background.white} />
            <Text style={styles.boostedText}>Boosted</Text>
          </LinearGradient>
        )}

        {item.isProfileVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
          </View>
        )}

        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.gradient}
        />

        <View style={styles.cardContent}>
          <Text style={styles.userName}>
            {item.name}, {item.age}
          </Text>
          {distance && (
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={14} color={Colors.background.white} />
              <Text style={styles.distance}>{distance.toFixed(1)} km away</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const SortOption = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.sortOption, sortBy === value && styles.sortOptionActive]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[styles.sortOptionText, sortBy === value && styles.sortOptionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
          <Ionicons name="options" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
        <SortOption label="Recent Activity" value="recentActivity" />
        <SortOption label="Profile Quality" value="profileQuality" />
        <SortOption label="Verified" value="verified" />
        <SortOption label="Boosted" value="boosted" />
      </ScrollView>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Age Range</Text>
            <Text style={styles.filterValue}>
              {filters.minAge} - {filters.maxAge}
            </Text>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Gender</Text>
            <Text style={styles.filterValue}>
              {filters.gender === 'any' ? 'All' : filters.gender}
            </Text>
          </View>
        </View>
      )}

      {/* Users Grid */}
      {(loading || authLoading) && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              exploreUsers(true);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={Colors.text.light} />
          <Text style={styles.emptyText}>
            {isGuest ? 'Sign in to explore' : 'No users found'}
          </Text>
          <Text style={styles.emptySubText}>
            {isGuest
              ? 'Create an account to discover and connect with amazing people!'
              : 'Try adjusting your filters'
            }
          </Text>
          {isGuest && (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.lighter,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.dark,
  },
  filterButton: {
    padding: 8,
  },
  sortContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: Colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  sortOption: {
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.light,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  sortOptionTextActive: {
    color: Colors.background.white,
  },
  filterSection: {
    backgroundColor: Colors.background.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  filterLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  filterValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    gap: 8,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  userCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.white,
    marginBottom: 8,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  boostedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  boostedText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.background.white90,
    borderRadius: 20,
    padding: 4,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.background.white,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: Colors.background.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.tertiary,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.text.light,
    marginTop: 6,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  signInButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExploreScreen;
