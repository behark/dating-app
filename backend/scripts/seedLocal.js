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

    // 3. Create Mutual Like (Match)
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
