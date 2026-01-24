require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Swipe = require('../models/Swipe');

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
        coordinates: [-73.935242, 40.730610], // NYC
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', order: 0 },
        { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', order: 1 }
      ],
      preferences: {
        ageRange: { min: 18, max: 50 },
        distance: 100,
      },
      isVerified: true,
      isActive: true,
      onboardingComplete: true
    });
    console.log(`👤 Created main user: ${mainUser.email} (Password: password123)`);

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
        coordinates: [-73.935242, 40.730610],
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', order: 0 }
      ],
      isActive: true
    });
    console.log(`👤 Created match user: ${matchUser.name}`);

    // 3. Create additional demo profiles for discovery
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
      },
      {
        name: 'Diego',
        email: 'diego.demo@example.com',
        age: 31,
        gender: 'male',
        bio: 'Chef by day, salsa dancer by night. Let’s find the best tacos in town.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', order: 1 },
        ],
        interests: ['cooking', 'dance', 'food', 'music'],
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
      },
      {
        name: 'Eli',
        email: 'eli.demo@example.com',
        age: 26,
        gender: 'male',
        bio: 'Startup builder, gym regular, and amateur guitarist. Let’s jam sometime.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', order: 0 },
          { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', order: 1 },
        ],
        interests: ['music', 'fitness', 'startups', 'coffee'],
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
      },
    ];

    for (const demoProfile of demoProfiles) {
      await User.deleteOne({ email: demoProfile.email });
      await User.create({
        ...demoProfile,
        password: 'password123',
        location: {
          type: 'Point',
          coordinates: [-73.935242, 40.730610],
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
        lastActive: new Date(),
      });
    }

    console.log(`👥 Created ${demoProfiles.length} demo profiles`);

    // 4. Create Mutual Like (Match)
    // Swipe for Main User
    await Swipe.create({
      swiperId: mainUser._id,
      swipedId: matchUser._id,
      action: 'like'
    });

    // Swipe for Match User
    await Swipe.create({
      swiperId: matchUser._id,
      swipedId: mainUser._id,
      action: 'like'
    });

    // Create Match Record
    const userIds = [mainUser._id, matchUser._id].sort();
    await Match.create({
      users: userIds,
      user1: userIds[0],
      user2: userIds[1],
      matchInitiator: mainUser._id,
      lastMessage: null,
      isUnmatched: false
    });
    
    console.log('❤️  Created a mutual match between Test User and Sarah');

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedLocal();
