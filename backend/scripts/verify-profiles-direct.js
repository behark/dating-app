/**
 * Verify Demo Profiles Directly from Database
 * Checks if demo profiles exist and are properly configured
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

// Simple User schema
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function verifyProfiles() {
  try {
    console.log('🔍 Verifying Demo Profiles in Database...\n');
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Count total demo profiles
    const totalDemo = await User.countDocuments({ isDemo: true });
    console.log(`📊 Total demo profiles: ${totalDemo}\n`);

    if (totalDemo === 0) {
      console.log('❌ No demo profiles found in database!');
      console.log('   Run: node backend/scripts/seed-demo-profiles.js\n');
      process.exit(1);
    }

    // Check active status
    const activeDemo = await User.countDocuments({ isDemo: true, isActive: true });
    const inactiveDemo = await User.countDocuments({ isDemo: true, isActive: { $ne: true } });
    
    console.log(`✅ Active demo profiles: ${activeDemo}`);
    if (inactiveDemo > 0) {
      console.log(`⚠️  Inactive demo profiles: ${inactiveDemo}`);
      console.log('   Run: node backend/scripts/fix-demo-profiles-active.js\n');
    }

    // Check location data
    const withLocation = await User.countDocuments({
      isDemo: true,
      'location.coordinates': { $exists: true, $size: 2 }
    });
    const withoutLocation = totalDemo - withLocation;
    
    console.log(`✅ Profiles with location: ${withLocation}`);
    if (withoutLocation > 0) {
      console.log(`⚠️  Profiles without location: ${withoutLocation}\n`);
    }

    // Check photos
    const withPhotos = await User.countDocuments({
      isDemo: true,
      $or: [
        { photoURL: { $exists: true, $ne: null } },
        { photos: { $exists: true, $ne: [] } }
      ]
    });
    
    console.log(`✅ Profiles with photos: ${withPhotos}\n`);

    // Sample profiles
    console.log('📋 Sample Demo Profiles:');
    const samples = await User.find({ isDemo: true })
      .select('name age gender email isActive suspended location photos photoURL')
      .limit(5)
      .lean();

    samples.forEach((profile, idx) => {
      console.log(`\n   ${idx + 1}. ${profile.name} (${profile.age}, ${profile.gender})`);
      console.log(`      Email: ${profile.email}`);
      console.log(`      Active: ${profile.isActive ? '✅' : '❌'}`);
      console.log(`      Suspended: ${profile.suspended ? '❌' : '✅'}`);
      console.log(`      Location: ${profile.location?.city || 'N/A'} (${profile.location?.coordinates ? '✅' : '❌'})`);
      console.log(`      Photos: ${profile.photos?.length || 0} (primary: ${profile.photoURL ? '✅' : '❌'})`);
    });

    // Check if profiles would appear in discovery
    console.log('\n🔍 Discovery Readiness Check:');
    
    const discoveryReady = await User.countDocuments({
      isDemo: true,
      isActive: true,
      suspended: { $ne: true },
      'location.coordinates': { $exists: true, $size: 2 },
      $or: [
        { photoURL: { $exists: true, $ne: null } },
        { photos: { $exists: true, $ne: [] } }
      ]
    });

    console.log(`✅ Discovery-ready profiles: ${discoveryReady}/${totalDemo}`);
    
    if (discoveryReady === totalDemo) {
      console.log('   🎉 All demo profiles are ready for discovery!\n');
    } else {
      const missing = totalDemo - discoveryReady;
      console.log(`   ⚠️  ${missing} profiles need fixes\n`);
    }

    // Test a discovery query (simulate what the API does)
    console.log('🧪 Testing Discovery Query (NYC area)...');
    const testLat = 40.7128;
    const testLng = -74.0060;
    const testRadius = 50000; // 50km

    const discoverableProfiles = await User.find({
      isDemo: true,
      isActive: true,
      suspended: { $ne: true },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [testLng, testLat],
          },
          $maxDistance: testRadius,
        },
      },
    })
      .select('name age gender location')
      .limit(10)
      .lean();

    console.log(`   Found ${discoverableProfiles.length} demo profiles near NYC (50km radius)`);
    
    if (discoverableProfiles.length > 0) {
      console.log('   ✅ Demo profiles ARE discoverable!');
      console.log('   Sample locations:');
      discoverableProfiles.slice(0, 3).forEach((p, i) => {
        console.log(`      ${i + 1}. ${p.name} - ${p.location?.city || 'Unknown'}`);
      });
    } else {
      console.log('   ⚠️  No demo profiles found near NYC');
      console.log('   This is normal if demo profiles are in other cities');
    }

    console.log('\n✅ Verification complete!');
    console.log('\n💡 If profiles don\'t show on site:');
    console.log('   1. Check user location is set (discovery needs lat/lng)');
    console.log('   2. Check discovery radius is large enough (try 50km+)');
    console.log('   3. Check user preferences match demo profile genders/ages');
    console.log('   4. Check if user already swiped on all demo profiles');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('$size')) {
      console.error('   MongoDB query error - this is a known issue with location check');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

verifyProfiles();
