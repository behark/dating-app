require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/core/domain/User');
const Match = require('../src/core/domain/Match');
const Swipe = require('../src/core/domain/Swipe');
const Message = require('../src/core/domain/Message');

// Helper to generate a date in the past (days ago)
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Helper to generate a random date within a range (days ago)
const randomDaysAgo = (minDays, maxDays) => {
  const days = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  return daysAgo(days);
};

// App launch date - approximately 1 year ago (January 2025)
const APP_LAUNCH_DATE = new Date('2025-01-15');

const seedLocal = async () => {
  try {
    console.log('🌱 Starting local seed...');

    // Connect to Database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Create Main Test User
    const mainUserEmail = 'test@example.com';
    await User.deleteOne({ email: mainUserEmail });

    const mainUser = await User.create({
      name: 'Test User',
      email: mainUserEmail,
      password: 'password123', // Will be hashed by pre-save hook
      age: 25,
      gender: 'male',
      bio: 'I am a test user created by the seed script.',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.73061], // NYC
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', order: 0 },
        { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', order: 1 },
      ],
      preferences: {
        ageRange: { min: 18, max: 50 },
        distance: 100,
      },
      isVerified: true,
      isActive: true,
      onboardingComplete: true,
      createdAt: daysAgo(180), // Joined 6 months ago
      lastActive: daysAgo(0), // Active today
    });
    console.log(
      `👤 Created main user: ${mainUser.email} (Password: password123, Joined: 6 months ago)`
    );

    // 2. Create a Match User
    const matchEmail = 'sarah@example.com';
    await User.deleteOne({ email: matchEmail });

    const matchUser = await User.create({
      name: 'Sarah',
      email: matchEmail,
      password: 'password123',
      age: 24,
      gender: 'female',
      bio: 'Lover of coffee and coding.',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.73061],
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', order: 0 },
      ],
      isActive: true,
      createdAt: daysAgo(320), // Early adopter - joined 10+ months ago
      lastActive: daysAgo(1), // Active yesterday
    });
    console.log(`👤 Created match user: ${matchUser.name} (Joined: 10+ months ago)`);

    // 3. Create additional demo profiles for discovery
    // Profiles have varying join dates spread across the year since launch
    const demoProfiles = [
      {
        name: 'Maya',
        email: 'maya.demo@example.com',
        age: 27,
        gender: 'female',
        bio: 'Photographer, tea lover, and weekend trail runner. Always chasing golden hour.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500', order: 1 },
        ],
        interests: ['photography', 'running', 'travel', 'art'],
        createdAt: daysAgo(350), // Early adopter
        lastActive: daysAgo(0),
      },
      {
        name: 'Diego',
        email: 'diego.demo@example.com',
        age: 31,
        gender: 'male',
        bio: "Chef by day, salsa dancer by night. Let's find the best tacos in town.",
        photos: [
          { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', order: 1 },
        ],
        interests: ['cooking', 'dance', 'food', 'music'],
        createdAt: daysAgo(280), // Joined 9 months ago
        lastActive: daysAgo(2),
      },
      {
        name: 'Priya',
        email: 'priya.demo@example.com',
        age: 29,
        gender: 'female',
        bio: 'Product designer who loves museums, indie films, and handwritten notes.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500', order: 1 },
        ],
        interests: ['design', 'movies', 'museums', 'coffee'],
        createdAt: daysAgo(220), // Joined 7 months ago
        lastActive: daysAgo(0),
      },
      {
        name: 'Eli',
        email: 'eli.demo@example.com',
        age: 26,
        gender: 'male',
        bio: "Startup builder, gym regular, and amateur guitarist. Let's jam sometime.",
        photos: [
          { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', order: 1 },
        ],
        interests: ['music', 'fitness', 'startups', 'coffee'],
        createdAt: daysAgo(150), // Joined 5 months ago
        lastActive: daysAgo(1),
      },
      {
        name: 'Hana',
        email: 'hana.demo@example.com',
        age: 24,
        gender: 'female',
        bio: 'Bookshop explorer, brunch enthusiast, and watercolor artist.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500', order: 1 },
        ],
        interests: ['art', 'books', 'brunch', 'travel'],
        createdAt: daysAgo(90), // Joined 3 months ago
        lastActive: daysAgo(0),
      },
      {
        name: 'Noah',
        email: 'noah.demo@example.com',
        age: 32,
        gender: 'male',
        bio: 'Runner, podcast addict, and aspiring home barista.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', order: 1 },
        ],
        interests: ['running', 'coffee', 'podcasts', 'travel'],
        createdAt: daysAgo(45), // Joined 6 weeks ago
        lastActive: daysAgo(0),
      },
      {
        name: 'Zoe',
        email: 'zoe.demo@example.com',
        age: 28,
        gender: 'female',
        bio: 'UX researcher who loves improv, pottery, and sunset bike rides.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500', order: 1 },
        ],
        interests: ['ux', 'improv', 'pottery', 'cycling'],
        createdAt: daysAgo(21), // Joined 3 weeks ago
        lastActive: daysAgo(0),
      },
      {
        name: 'Arman',
        email: 'arman.demo@example.com',
        age: 30,
        gender: 'male',
        bio: 'Architect, city walker, and craft beer collector.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', order: 1 },
        ],
        interests: ['architecture', 'city walks', 'beer', 'photography'],
        createdAt: daysAgo(7), // New user - joined last week
        lastActive: daysAgo(0),
      },
    ];

    for (const demoProfile of demoProfiles) {
      await User.deleteOne({ email: demoProfile.email });
      await User.create({
        ...demoProfile,
        password: 'password123',
        location: {
          type: 'Point',
          coordinates: [-73.935242, 40.73061],
        },
        preferences: {
          ageRange: { min: 18, max: 50 },
          distance: 100,
        },
        isVerified: true,
        isActive: true,
        isDemo: true,
        onboardingComplete: true,
        profileCompleteness: 85,
        // Use profile's lastActive or default to recent
        lastActive: demoProfile.lastActive || new Date(),
      });
    }

    console.log(`👥 Created ${demoProfiles.length} demo profiles with historical join dates`);

    // 4. Create Mutual Like (Match) - happened 2 months ago
    const matchDate = daysAgo(60);

    // Swipe for Main User
    await Swipe.create({
      swiperId: mainUser._id,
      swipedId: matchUser._id,
      action: 'like',
      createdAt: matchDate,
    });

    // Swipe for Match User (liked back same day)
    await Swipe.create({
      swiperId: matchUser._id,
      swipedId: mainUser._id,
      action: 'like',
      createdAt: matchDate,
    });

    // Create Match Record
    const userIds = [mainUser._id, matchUser._id].sort();
    const match = await Match.create({
      users: userIds,
      user1: userIds[0],
      user2: userIds[1],
      matchInitiator: mainUser._id,
      lastMessage: null,
      isUnmatched: false,
      createdAt: matchDate,
    });

    // 5. Create sample conversation history
    const conversationMessages = [
      { sender: mainUser._id, content: 'Hey Sarah! Love your profile 😊', daysAgo: 60 },
      { sender: matchUser._id, content: 'Thanks! I noticed you like hiking too!', daysAgo: 60 },
      {
        sender: mainUser._id,
        content: 'Yes! Have you been to any good trails lately?',
        daysAgo: 59,
      },
      {
        sender: matchUser._id,
        content: 'I went to Bear Mountain last weekend. The views were amazing!',
        daysAgo: 59,
      },
      {
        sender: mainUser._id,
        content: 'That sounds awesome! Would love to check it out sometime',
        daysAgo: 58,
      },
      {
        sender: matchUser._id,
        content: 'We should go together! I know all the best spots 🏔️',
        daysAgo: 57,
      },
      {
        sender: mainUser._id,
        content: 'That would be great! How about next Saturday?',
        daysAgo: 45,
      },
      {
        sender: matchUser._id,
        content: 'Perfect! Let me check my schedule and get back to you',
        daysAgo: 45,
      },
      { sender: matchUser._id, content: 'Saturday works for me! 🎉', daysAgo: 44 },
      { sender: mainUser._id, content: "Awesome! Can't wait!", daysAgo: 44 },
      {
        sender: matchUser._id,
        content: 'That hike was so fun! We should do it again soon',
        daysAgo: 30,
      },
      {
        sender: mainUser._id,
        content: 'Definitely! Maybe somewhere with a coffee shop nearby next time ☕',
        daysAgo: 30,
      },
      {
        sender: matchUser._id,
        content: "You read my mind! There's this great place in Beacon...",
        daysAgo: 29,
      },
      { sender: mainUser._id, content: 'Tell me more!', daysAgo: 28 },
      {
        sender: matchUser._id,
        content: "It's called Bank Square Coffeehouse. Best lattes in the Hudson Valley",
        daysAgo: 28,
      },
      { sender: mainUser._id, content: 'Sounds perfect. This weekend?', daysAgo: 14 },
      { sender: matchUser._id, content: "Let's do it! Saturday morning?", daysAgo: 14 },
      { sender: mainUser._id, content: 'See you then! 😊', daysAgo: 14 },
      { sender: matchUser._id, content: 'Had such a great time yesterday!', daysAgo: 7 },
      { sender: mainUser._id, content: 'Me too! That coffee was incredible', daysAgo: 7 },
      { sender: matchUser._id, content: 'Want to grab dinner sometime this week?', daysAgo: 3 },
      { sender: mainUser._id, content: "I'd love that! How about Thursday?", daysAgo: 2 },
      {
        sender: matchUser._id,
        content: 'Thursday is perfect! Any cuisine preferences?',
        daysAgo: 2,
      },
      { sender: mainUser._id, content: 'Surprise me! You seem to have great taste 😄', daysAgo: 1 },
    ];

    // Clear existing messages for this match
    await Message.deleteMany({ matchId: match._id });

    let lastMessageContent = null;
    let lastMessageTime = null;

    for (const msg of conversationMessages) {
      const messageDate = daysAgo(msg.daysAgo);
      await Message.create({
        matchId: match._id,
        senderId: msg.sender,
        content: msg.content,
        type: 'text',
        isRead: true,
        createdAt: messageDate,
        updatedAt: messageDate,
      });
      lastMessageContent = msg.content;
      lastMessageTime = messageDate;
    }

    // Update match with last message info
    await Match.findByIdAndUpdate(match._id, {
      lastMessage: lastMessageContent,
      lastMessageAt: lastMessageTime,
    });

    console.log('❤️  Created a mutual match between Test User and Sarah (matched 2 months ago)');
    console.log(`💬 Created ${conversationMessages.length} messages in conversation history`);

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (/** @type {any} */ error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedLocal();
