/**
 * Test Data Fixtures
 * Contains sample data for API testing
 */

const mongoose = require('mongoose');

/**
 * Generate a valid MongoDB ObjectId
 * @returns {string}
 */
const generateObjectId = () => new mongoose.Types.ObjectId().toString();

// Static IDs for consistent testing
const STATIC_IDS = {
  USER_1: '64a1b2c3d4e5f6g7h8i9j0k1',
  USER_2: '64a1b2c3d4e5f6g7h8i9j0k2',
  USER_3: '64a1b2c3d4e5f6g7h8i9j0k3',
  ADMIN: '64a1b2c3d4e5f6g7h8i9j000',
  MATCH_1: '64a1b2c3d4e5f6g7h8i9m001',
  MATCH_2: '64a1b2c3d4e5f6g7h8i9m002',
  MESSAGE_1: '64a1b2c3d4e5f6g7h8i9msg1',
  SWIPE_1: '64a1b2c3d4e5f6g7h8i9s001',
  REPORT_1: '64a1b2c3d4e5f6g7h8i9r001',
};

// User fixtures
const users = {
  validUser: {
    email: 'testuser@example.com',
    password: 'SecurePass123!',
    name: 'Test User',
    age: 25,
    gender: 'male',
    bio: 'A test user for API testing',
  },
  
  validUser2: {
    email: 'testuser2@example.com',
    password: 'SecurePass456!',
    name: 'Test User Two',
    age: 28,
    gender: 'female',
    bio: 'Another test user',
  },
  
  adminUser: {
    _id: STATIC_IDS.ADMIN,
    email: 'admin@example.com',
    password: 'AdminPass123!',
    name: 'Admin User',
    role: 'admin',
    age: 30,
    gender: 'other',
  },
  
  premiumUser: {
    email: 'premium@example.com',
    password: 'PremiumPass123!',
    name: 'Premium User',
    age: 27,
    gender: 'female',
    subscription: {
      tier: 'gold',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  
  invalidUserNoEmail: {
    password: 'SecurePass123!',
    name: 'No Email User',
    age: 25,
  },
  
  invalidUserNoPassword: {
    email: 'nopassword@example.com',
    name: 'No Password User',
    age: 25,
  },
  
  invalidUserShortPassword: {
    email: 'shortpass@example.com',
    password: 'short',
    name: 'Short Password User',
    age: 25,
  },
  
  invalidUserBadEmail: {
    email: 'notanemail',
    password: 'SecurePass123!',
    name: 'Bad Email User',
    age: 25,
  },
  
  invalidUserUnderage: {
    email: 'underage@example.com',
    password: 'SecurePass123!',
    name: 'Underage User',
    age: 17,
  },
  
  invalidUserOverage: {
    email: 'overage@example.com',
    password: 'SecurePass123!',
    name: 'Overage User',
    age: 150,
  },
  
  userWithLocation: {
    email: 'location@example.com',
    password: 'SecurePass123!',
    name: 'Located User',
    age: 26,
    location: {
      type: 'Point',
      coordinates: [-73.935242, 40.730610], // NYC
    },
  },
  
  completeUser: {
    email: 'complete@example.com',
    password: 'SecurePass123!',
    name: 'Complete User',
    age: 25,
    gender: 'male',
    bio: 'A complete profile for testing',
    interests: ['hiking', 'music', 'travel'],
    photos: [
      { url: 'https://example.com/photo1.jpg', order: 0 },
      { url: 'https://example.com/photo2.jpg', order: 1 },
    ],
    location: {
      type: 'Point',
      coordinates: [-73.935242, 40.730610],
    },
    preferences: {
      ageRange: { min: 22, max: 35 },
      genderPreference: ['female'],
      maxDistance: 50,
    },
  },
};

// Profile fixtures
const profiles = {
  validProfileUpdate: {
    name: 'Updated Name',
    bio: 'Updated bio for testing',
    age: 26,
  },
  
  invalidProfileUpdate: {
    name: '',
    bio: 'a'.repeat(600), // Exceeds max length
    age: 15,
  },
  
  photoUpload: {
    photos: [
      { url: 'https://example.com/new-photo1.jpg' },
      { url: 'https://example.com/new-photo2.jpg' },
    ],
  },
  
  photoReorder: {
    photoIds: [generateObjectId(), generateObjectId()],
  },
  
  validPrompts: {
    prompts: [
      { promptId: 'prompt_1', answer: 'My ideal first date' },
      { promptId: 'prompt_2', answer: 'What makes me unique' },
    ],
  },
  
  invalidPrompts: {
    prompts: 'not an array',
  },
  
  education: {
    school: 'MIT',
    degree: 'Bachelor',
    fieldOfStudy: 'Computer Science',
    graduationYear: 2020,
  },
  
  occupation: {
    jobTitle: 'Software Engineer',
    company: 'Tech Corp',
    industry: 'Technology',
  },
  
  height: {
    value: 180,
    unit: 'cm',
  },
};

// Swipe fixtures
const swipes = {
  validLike: {
    targetId: generateObjectId(),
    action: 'like',
  },
  
  validPass: {
    targetId: generateObjectId(),
    action: 'pass',
  },
  
  validSuperLike: {
    targetId: generateObjectId(),
    action: 'superlike',
  },
  
  priorityLike: {
    targetId: generateObjectId(),
    action: 'like',
    isPriority: true,
  },
  
  invalidNoTarget: {
    action: 'like',
  },
  
  invalidNoAction: {
    targetId: generateObjectId(),
  },
  
  invalidAction: {
    targetId: generateObjectId(),
    action: 'invalid',
  },
  
  undoSwipe: {
    swipeId: generateObjectId(),
  },
};

// Chat/Message fixtures
const messages = {
  validMessage: {
    matchId: generateObjectId(),
    content: 'Hello, how are you?',
  },
  
  encryptedMessage: {
    matchId: generateObjectId(),
    content: 'encrypted_content_here',
    isEncrypted: true,
  },
  
  emptyMessage: {
    matchId: generateObjectId(),
    content: '',
  },
  
  longMessage: {
    matchId: generateObjectId(),
    content: 'a'.repeat(10000),
  },
  
  gifMessage: {
    matchId: generateObjectId(),
    gifUrl: 'https://giphy.com/test-gif.gif',
    gifId: 'gif123',
  },
  
  voiceMessage: {
    matchId: generateObjectId(),
    audioUrl: 'https://example.com/voice.mp3',
    duration: 30,
  },
};

// Discovery fixtures
const discovery = {
  validLocationQuery: {
    lat: 40.730610,
    lng: -73.935242,
    radius: 10000,
  },
  
  invalidLatitude: {
    lat: 100,
    lng: -73.935242,
    radius: 10000,
  },
  
  invalidLongitude: {
    lat: 40.730610,
    lng: -200,
    radius: 10000,
  },
  
  invalidRadius: {
    lat: 40.730610,
    lng: -73.935242,
    radius: 100000,
  },
  
  locationUpdate: {
    latitude: 40.730610,
    longitude: -73.935242,
  },
  
  advancedFilters: {
    ageRange: { min: 22, max: 35 },
    distance: 30,
    hasPhotos: true,
    isVerified: true,
  },
};

// Payment fixtures
const payments = {
  stripeCheckout: {
    planId: 'gold_monthly',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  },
  
  stripePaymentIntent: {
    amount: 1999,
    currency: 'usd',
  },
  
  paypalSubscription: {
    planId: 'gold_monthly',
  },
  
  appleReceipt: {
    receiptData: 'base64_encoded_receipt',
    productId: 'com.app.gold_monthly',
  },
  
  googlePurchase: {
    purchaseToken: 'google_purchase_token',
    productId: 'gold_monthly',
    orderId: 'GPA.1234-5678-9012',
  },
};

// Notification fixtures
const notifications = {
  validNotification: {
    userId: generateObjectId(),
    title: 'New Match!',
    body: 'You have a new match',
    data: { matchId: generateObjectId() },
  },
  
  bulkNotification: {
    userIds: [generateObjectId(), generateObjectId()],
    title: 'App Update',
    body: 'Check out our new features',
  },
  
  preferences: {
    matches: true,
    messages: true,
    likes: true,
    marketing: false,
  },
};

// Safety fixtures
const safety = {
  validReport: {
    targetUserId: generateObjectId(),
    reason: 'inappropriate',
    description: 'User sent inappropriate messages',
    evidence: ['screenshot1.jpg'],
  },
  
  blockUser: {
    blockedUserId: generateObjectId(),
  },
  
  flagContent: {
    contentType: 'message',
    contentId: generateObjectId(),
    reason: 'spam',
  },
  
  datePlan: {
    matchId: generateObjectId(),
    venue: 'Coffee Shop',
    address: '123 Main St',
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    emergencyContacts: ['+1234567890'],
  },
  
  emergencyContact: {
    name: 'Emergency Contact',
    phone: '+1234567890',
    relationship: 'friend',
  },
  
  sosAlert: {
    location: {
      latitude: 40.730610,
      longitude: -73.935242,
    },
    message: 'Need help immediately',
  },
};

// Privacy fixtures
const privacy = {
  validSettings: {
    showOnlineStatus: true,
    showLastActive: true,
    showDistance: false,
    shareReadReceipts: true,
  },
  
  consentUpdate: {
    consentType: 'marketing',
    granted: true,
  },
  
  rectifyData: {
    fields: {
      name: 'Corrected Name',
      email: 'corrected@example.com',
    },
  },
};

// Gamification fixtures
const gamification = {
  trackSwipe: {
    action: 'swipe',
    direction: 'right',
  },
  
  addXP: {
    userId: generateObjectId(),
    amount: 100,
    reason: 'daily_login',
  },
  
  challengeProgress: {
    challengeId: generateObjectId(),
    progress: 1,
  },
};

// Social features fixtures
const socialFeatures = {
  groupDate: {
    title: 'Beach Day',
    description: 'Fun day at the beach',
    maxParticipants: 6,
    location: {
      name: 'Santa Monica Beach',
      coordinates: [-118.4912, 34.0195],
    },
    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  
  friendReview: {
    targetUserId: generateObjectId(),
    rating: 5,
    text: 'Great friend, highly recommend!',
  },
  
  event: {
    title: 'Singles Mixer',
    description: 'Meet new people',
    location: {
      name: 'Downtown Bar',
      coordinates: [-73.935242, 40.730610],
    },
    dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    capacity: 50,
  },
};

// OAuth fixtures
const oauth = {
  google: {
    googleId: 'google_user_123',
    email: 'googleuser@gmail.com',
    name: 'Google User',
    picture: 'https://lh3.googleusercontent.com/test',
  },
  
  facebook: {
    facebookId: 'facebook_user_123',
    email: 'fbuser@facebook.com',
    name: 'Facebook User',
    picture: 'https://graph.facebook.com/test',
  },
  
  apple: {
    appleId: 'apple_user_123',
    email: 'appleuser@icloud.com',
    name: 'Apple User',
  },
};

// Premium features fixtures
const premium = {
  passport: {
    location: {
      name: 'Paris, France',
      coordinates: [2.3522, 48.8566],
    },
  },
  
  advancedFilters: {
    verifiedOnly: true,
    hasVideo: true,
    recentlyActive: true,
    heightRange: { min: 160, max: 190 },
  },
  
  adsPreferences: {
    showAds: false,
  },
};

// AI features fixtures
const ai = {
  icebreakerRequest: {
    matchId: generateObjectId(),
  },
  
  bioSuggestions: {
    interests: ['hiking', 'music', 'travel'],
    personality: 'outgoing',
  },
  
  photoAnalysis: {
    photoUrl: 'https://example.com/photo.jpg',
  },
  
  conversationStarters: {
    targetUserId: generateObjectId(),
    context: 'first_message',
  },
};

module.exports = {
  STATIC_IDS,
  generateObjectId,
  users,
  profiles,
  swipes,
  messages,
  discovery,
  payments,
  notifications,
  safety,
  privacy,
  gamification,
  socialFeatures,
  oauth,
  premium,
  ai,
};
