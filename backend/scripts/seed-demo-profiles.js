/**
 * Seed Demo Profiles Script
 * 
 * Creates 100 diverse, professional demo profiles for development and demo purposes.
 * 
 * Usage:
 *   node backend/scripts/seed-demo-profiles.js
 * 
 * Features:
 * - 100 realistic profiles with varied demographics
 * - Professional diversity (30+ different careers)
 * - Varied interests, bios, and characteristics
 * - Mix of verified/unverified profiles
 * - Realistic age distribution (21-45)
 * - Diverse locations across US cities
 * - Realistic photos from Unsplash
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

// Professional profiles data
const PROFESSIONS = [
  'Software Engineer', 'Doctor', 'Teacher', 'Nurse', 'Marketing Manager',
  'Graphic Designer', 'Lawyer', 'Architect', 'Chef', 'Photographer',
  'Physical Therapist', 'Financial Analyst', 'Real Estate Agent', 'Journalist',
  'Data Scientist', 'Product Manager', 'UX Designer', 'Veterinarian',
  'Pharmacist', 'Social Worker', 'Entrepreneur', 'Artist', 'Consultant',
  'Engineer', 'Accountant', 'HR Manager', 'Dentist', 'Fitness Trainer',
  'Interior Designer', 'Writer', 'Sales Manager', 'Research Scientist',
  'Event Planner', 'Music Teacher', 'Psychologist', 'Flight Attendant'
];

const INTERESTS = [
  'hiking', 'yoga', 'cooking', 'travel', 'photography', 'reading',
  'fitness', 'music', 'art', 'dancing', 'coffee', 'wine',
  'foodie', 'movies', 'gaming', 'pets', 'beach', 'camping',
  'skiing', 'surfing', 'cycling', 'running', 'meditation', 'volunteering',
  'concerts', 'theater', 'museums', 'technology', 'fashion', 'nature'
];

const CITIES = [
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 }
];

const FIRST_NAMES = {
  male: ['James', 'Michael', 'David', 'Chris', 'Daniel', 'Matt', 'Ryan', 'Alex', 'Jordan', 'Tyler',
         'Brandon', 'Kevin', 'Brian', 'Eric', 'Jason', 'Andrew', 'Nick', 'Ben', 'Sam', 'Max'],
  female: ['Emma', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Mia', 'Emily', 'Sarah', 'Jessica', 'Rachel',
           'Lauren', 'Ashley', 'Amanda', 'Jennifer', 'Nicole', 'Taylor', 'Madison', 'Hannah', 'Alexis', 'Samantha'],
  neutral: ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Reese', 'Dakota']
};

// User model (simplified version)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'non-binary', 'other'] },
  bio: String,
  profession: String,
  interests: [String],
  photoURL: String,
  photos: [{
    url: String,
    isPrimary: Boolean,
    uploadedAt: Date
  }],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
    city: String,
    state: String
  },
  preferences: {
    ageRange: { min: Number, max: Number },
    distance: Number,
    genderPreference: [String]
  },
  isVerified: Boolean,
  isPremium: Boolean,
  isDemo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

UserSchema.index({ 'location.coordinates': '2dsphere' });

const User = mongoose.model('User', UserSchema);

// Generate bio based on profession and interests
function generateBio(name, profession, interests, age) {
  const templates = [
    `${profession} who loves ${interests[0]} and ${interests[1]}. Looking for someone to share adventures with!`,
    `Passionate ${profession.toLowerCase()} with a love for ${interests[0]}. Always up for ${interests[1]} or trying new restaurants!`,
    `${age}-year-old ${profession.toLowerCase()} who enjoys ${interests[0]}, ${interests[1]}, and good conversation. Let's connect!`,
    `${profession} by day, ${interests[0]} enthusiast by night. Love ${interests[1]} and exploring new places.`,
    `Life's too short for boring dates! ${profession} who's into ${interests[0]}, ${interests[1]}, and making memories.`,
    `${profession} seeking genuine connection. Hobbies include ${interests[0]} and ${interests[1]}. Swipe right if you're adventurous!`,
    `Easy-going ${profession.toLowerCase()} who values ${interests[0]} and ${interests[1]}. Looking for my adventure partner!`,
    `${profession} with a passion for ${interests[0]}. Weekend warrior who loves ${interests[1]} and spontaneous trips.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate realistic Unsplash photo URLs
function generatePhotoURLs(gender, index) {
  const maleIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const femaleIds = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
  
  let photoId;
  if (gender === 'male') {
    photoId = maleIds[index % maleIds.length];
  } else {
    photoId = femaleIds[index % femaleIds.length];
  }
  
  // Use random Unsplash photos with specific dimensions
  const seed = 1000 + index;
  return [
    `https://picsum.photos/seed/${seed}/400/500`,
    `https://picsum.photos/seed/${seed + 1}/400/500`,
    `https://picsum.photos/seed/${seed + 2}/400/500`
  ];
}

// Generate a random profile
function generateProfile(index) {
  const gender = index % 3 === 0 ? 'male' : index % 3 === 1 ? 'female' : 'non-binary';
  const age = 21 + Math.floor(Math.random() * 25); // Ages 21-45
  
  let firstName;
  if (gender === 'male') {
    firstName = FIRST_NAMES.male[Math.floor(Math.random() * FIRST_NAMES.male.length)];
  } else if (gender === 'female') {
    firstName = FIRST_NAMES.female[Math.floor(Math.random() * FIRST_NAMES.female.length)];
  } else {
    firstName = FIRST_NAMES.neutral[Math.floor(Math.random() * FIRST_NAMES.neutral.length)];
  }
  
  const profession = PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)];
  
  // Select 4-6 random interests
  const numInterests = 4 + Math.floor(Math.random() * 3);
  const shuffledInterests = [...INTERESTS].sort(() => 0.5 - Math.random());
  const selectedInterests = shuffledInterests.slice(0, numInterests);
  
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const photos = generatePhotoURLs(gender, index);
  
  const bio = generateBio(firstName, profession, selectedInterests, age);
  
  // 70% verified, 30% not verified
  const isVerified = Math.random() > 0.3;
  
  // 20% premium
  const isPremium = Math.random() > 0.8;
  
  return {
    email: `demo${index}@example.com`,
    password: 'Demo123!', // Will be hashed
    name: firstName,
    age,
    gender,
    bio,
    profession,
    interests: selectedInterests,
    photoURL: photos[0],
    photos: photos.map((url, idx) => ({
      url,
      isPrimary: idx === 0,
      uploadedAt: new Date()
    })),
    location: {
      type: 'Point',
      coordinates: [city.lng, city.lat],
      city: city.name,
      state: city.state
    },
    preferences: {
      ageRange: { min: Math.max(18, age - 10), max: Math.min(60, age + 10) },
      distance: 50,
      genderPreference: gender === 'male' ? ['female'] : gender === 'female' ? ['male'] : ['male', 'female', 'non-binary']
    },
    isVerified,
    isPremium,
    isDemo: true,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date in last 7 days
  };
}

// Main seed function
async function seedProfiles() {
  try {
    console.log('🌱 Starting demo profiles seed...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Remove existing demo profiles
    console.log('🗑️  Removing existing demo profiles...');
    const deleteResult = await User.deleteMany({ isDemo: true });
    console.log(`✅ Removed ${deleteResult.deletedCount} existing demo profiles\n`);
    
    // Generate profiles
    console.log('👥 Generating 100 demo profiles...');
    const profiles = [];
    for (let i = 0; i < 100; i++) {
      const profile = generateProfile(i);
      
      // Hash password
      profile.password = await bcrypt.hash(profile.password, 10);
      
      profiles.push(profile);
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`   Generated ${i + 1}/100 profiles...`);
      }
    }
    console.log('✅ Generated 100 profiles\n');
    
    // Insert profiles in batches
    console.log('💾 Inserting profiles into database...');
    const batchSize = 20;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      await User.insertMany(batch);
      console.log(`   Inserted ${Math.min(i + batchSize, profiles.length)}/100 profiles...`);
    }
    console.log('✅ All profiles inserted\n');
    
    // Statistics
    const stats = {
      total: await User.countDocuments({ isDemo: true }),
      male: await User.countDocuments({ isDemo: true, gender: 'male' }),
      female: await User.countDocuments({ isDemo: true, gender: 'female' }),
      nonBinary: await User.countDocuments({ isDemo: true, gender: 'non-binary' }),
      verified: await User.countDocuments({ isDemo: true, isVerified: true }),
      premium: await User.countDocuments({ isDemo: true, isPremium: true })
    };
    
    console.log('📊 Seed Statistics:');
    console.log(`   Total profiles: ${stats.total}`);
    console.log(`   Male: ${stats.male}`);
    console.log(`   Female: ${stats.female}`);
    console.log(`   Non-binary: ${stats.nonBinary}`);
    console.log(`   Verified: ${stats.verified} (${Math.round(stats.verified / stats.total * 100)}%)`);
    console.log(`   Premium: ${stats.premium} (${Math.round(stats.premium / stats.total * 100)}%)`);
    console.log(`   Cities: ${CITIES.length}`);
    console.log(`   Professions: ${PROFESSIONS.length}`);
    console.log(`   Interests: ${INTERESTS.length}\n`);
    
    console.log('🎉 Demo profiles seeded successfully!\n');
    console.log('💡 Tips:');
    console.log('   - All demo profiles have email: demo{0-99}@example.com');
    console.log('   - All demo profiles have password: Demo123!');
    console.log('   - To remove demo profiles: User.deleteMany({ isDemo: true })');
    console.log('   - To re-run seed: node backend/scripts/seed-demo-profiles.js\n');
    
  } catch (error) {
    console.error('❌ Error seeding profiles:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run seed
seedProfiles();
