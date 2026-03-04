/**
 * Seed demo profiles for local development/testing
 * Run: node backend/scripts/seedDemoProfiles.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

const demoProfiles = [
  {
    email: 'emma.demo@example.com',
    name: 'Emma Johnson',
    age: 26,
    gender: 'female',
    bio: 'Coffee enthusiast, yoga lover, and aspiring chef. Looking for someone who appreciates good food and great conversations.',
    interests: ['Coffee', 'Yoga', 'Cooking', 'Travel', 'Photography'],
    photos: [
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/women/44.jpg', order: 0, moderationStatus: 'approved' },
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/women/45.jpg', order: 1, moderationStatus: 'approved' },
    ],
    occupation: { jobTitle: 'UX Designer', company: 'Tech Co', industry: 'Technology' },
    education: { school: 'NYU', degree: 'Bachelor', fieldOfStudy: 'Design' },
    height: { value: 168, unit: 'cm' },
    location: { type: 'Point', coordinates: [-74.006, 40.7128] },
  },
  {
    email: 'james.demo@example.com',
    name: 'James Wilson',
    age: 28,
    gender: 'male',
    bio: 'Software engineer by day, musician by night. Love hiking, playing guitar, and discovering new restaurants.',
    interests: ['Music', 'Hiking', 'Guitar', 'Technology', 'Food'],
    photos: [
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/men/32.jpg', order: 0, moderationStatus: 'approved' },
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/men/33.jpg', order: 1, moderationStatus: 'approved' },
    ],
    occupation: { jobTitle: 'Software Engineer', company: 'StartupXYZ', industry: 'Technology' },
    education: { school: 'MIT', degree: 'Master', fieldOfStudy: 'Computer Science' },
    height: { value: 183, unit: 'cm' },
    location: { type: 'Point', coordinates: [-73.990, 40.720] },
  },
  {
    email: 'sofia.demo@example.com',
    name: 'Sofia Martinez',
    age: 24,
    gender: 'female',
    bio: 'Art history grad who loves museums, dancing salsa, and weekend road trips. Fluent in sarcasm and Spanish.',
    interests: ['Art', 'Dancing', 'Museums', 'Road Trips', 'Languages'],
    photos: [
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/women/68.jpg', order: 0, moderationStatus: 'approved' },
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/women/69.jpg', order: 1, moderationStatus: 'approved' },
    ],
    occupation: { jobTitle: 'Gallery Curator', company: 'Modern Art Gallery', industry: 'Arts' },
    education: { school: 'Columbia University', degree: 'Bachelor', fieldOfStudy: 'Art History' },
    height: { value: 165, unit: 'cm' },
    location: { type: 'Point', coordinates: [-73.975, 40.764] },
  },
  {
    email: 'alex.demo@example.com',
    name: 'Alex Chen',
    age: 30,
    gender: 'male',
    bio: 'Startup founder, amateur photographer, and terrible cook. Looking for someone to laugh with and explore the city.',
    interests: ['Startups', 'Photography', 'Running', 'Podcasts', 'Travel'],
    photos: [
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/men/75.jpg', order: 0, moderationStatus: 'approved' },
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/men/76.jpg', order: 1, moderationStatus: 'approved' },
    ],
    occupation: { jobTitle: 'CEO', company: 'NextGen Labs', industry: 'Technology' },
    education: { school: 'Stanford', degree: 'MBA', fieldOfStudy: 'Business' },
    height: { value: 178, unit: 'cm' },
    location: { type: 'Point', coordinates: [-74.012, 40.705] },
  },
  {
    email: 'olivia.demo@example.com',
    name: 'Olivia Taylor',
    age: 27,
    gender: 'female',
    bio: 'Nurse by profession, adventurer at heart. Weekend warrior who loves rock climbing, camping, and craft beer.',
    interests: ['Rock Climbing', 'Camping', 'Craft Beer', 'Fitness', 'Nature'],
    photos: [
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/women/90.jpg', order: 0, moderationStatus: 'approved' },
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/women/91.jpg', order: 1, moderationStatus: 'approved' },
    ],
    occupation: { jobTitle: 'Registered Nurse', company: 'City Hospital', industry: 'Healthcare' },
    education: { school: 'Johns Hopkins', degree: 'Bachelor', fieldOfStudy: 'Nursing' },
    height: { value: 170, unit: 'cm' },
    location: { type: 'Point', coordinates: [-73.985, 40.748] },
  },
  {
    email: 'marcus.demo@example.com',
    name: 'Marcus Brown',
    age: 29,
    gender: 'male',
    bio: 'Architect who believes great design makes the world better. Passionate about basketball, jazz, and Sunday brunch.',
    interests: ['Architecture', 'Basketball', 'Jazz', 'Design', 'Brunch'],
    photos: [
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/men/52.jpg', order: 0, moderationStatus: 'approved' },
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/men/53.jpg', order: 1, moderationStatus: 'approved' },
    ],
    occupation: { jobTitle: 'Architect', company: 'Urban Design Studio', industry: 'Architecture' },
    education: { school: 'Yale', degree: 'Master', fieldOfStudy: 'Architecture' },
    height: { value: 188, unit: 'cm' },
    location: { type: 'Point', coordinates: [-73.995, 40.730] },
  },
  {
    email: 'lily.demo@example.com',
    name: 'Lily Park',
    age: 25,
    gender: 'female',
    bio: 'Bookworm, cat mom, and aspiring traveler. Currently obsessed with Korean dramas and making the perfect latte.',
    interests: ['Reading', 'Cats', 'K-Dramas', 'Coffee', 'Travel'],
    photos: [
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/women/33.jpg', order: 0, moderationStatus: 'approved' },
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/women/34.jpg', order: 1, moderationStatus: 'approved' },
    ],
    occupation: { jobTitle: 'Content Writer', company: 'Media Inc', industry: 'Media' },
    education: { school: 'UCLA', degree: 'Bachelor', fieldOfStudy: 'English Literature' },
    height: { value: 160, unit: 'cm' },
    location: { type: 'Point', coordinates: [-73.968, 40.755] },
  },
  {
    email: 'ryan.demo@example.com',
    name: 'Ryan O\'Brien',
    age: 31,
    gender: 'male',
    bio: 'Personal trainer who loves a good challenge. Into CrossFit, surfing, and trying to grow my own vegetables.',
    interests: ['Fitness', 'Surfing', 'CrossFit', 'Gardening', 'Cooking'],
    photos: [
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/men/85.jpg', order: 0, moderationStatus: 'approved' },
      { _id: new mongoose.Types.ObjectId(), url: 'https://randomuser.me/api/portraits/men/86.jpg', order: 1, moderationStatus: 'approved' },
    ],
    occupation: { jobTitle: 'Personal Trainer', company: 'FitLife Gym', industry: 'Fitness' },
    education: { school: 'SDSU', degree: 'Bachelor', fieldOfStudy: 'Kinesiology' },
    height: { value: 185, unit: 'cm' },
    location: { type: 'Point', coordinates: [-74.001, 40.718] },
  },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const User = require('../src/core/domain/User');
  const password = await bcrypt.hash('Demo1234!', 12);

  let created = 0;
  let skipped = 0;

  for (const profile of demoProfiles) {
    const existing = await User.findOne({ email: profile.email });
    if (existing) {
      console.log(`  Skipped (exists): ${profile.name}`);
      skipped++;
      continue;
    }

    await User.create({
      ...profile,
      password,
      isEmailVerified: true,
      isPhoneVerified: false,
      isProfileComplete: true,
      accountStatus: 'active',
      lastActive: new Date(),
      profilePrompts: [
        { promptId: 'ideal_weekend', answer: 'Exploring a new neighborhood and finding hidden gems.' },
        { promptId: 'fun_fact', answer: 'I can solve a Rubik\'s cube in under 2 minutes!' },
      ],
    });
    console.log(`  Created: ${profile.name} (${profile.email})`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
  console.log('\nDemo login credentials:');
  console.log('  Password for all: Demo1234!');
  console.log('  Emails:');
  demoProfiles.forEach(p => console.log(`    - ${p.email} (${p.name}, ${p.age}, ${p.gender})`));

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
