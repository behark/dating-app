/**
 * Fix Demo Profiles - Set isActive flag
 * Demo profiles need isActive: true to appear in discovery
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

// Simple User schema
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function fixDemoProfiles() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Find all demo profiles
    const demoProfiles = await User.find({ isDemo: true });
    console.log(`📊 Found ${demoProfiles.length} demo profiles\n`);

    // Check how many are missing isActive or are suspended
    const inactiveProfiles = demoProfiles.filter(p => p.isActive !== true);
    const suspendedProfiles = demoProfiles.filter(p => p.suspended === true);
    console.log(`⚠️  Profiles missing isActive: ${inactiveProfiles.length}`);
    console.log(`⚠️  Profiles that are suspended: ${suspendedProfiles.length}\n`);

    if (inactiveProfiles.length === 0 && suspendedProfiles.length === 0) {
      console.log('✅ All demo profiles already have isActive: true and are not suspended');
      console.log('   They should appear in discovery if they have valid location data.\n');
    } else {
      console.log('🔧 Fixing demo profiles (setting isActive: true and suspended: false)...');
      
      const result = await User.updateMany(
        { isDemo: true },
        { 
          $set: { 
            isActive: true,
            suspended: false // Explicitly ensure they're not suspended
          } 
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} demo profiles`);
      console.log('   - Set isActive: true');
      console.log('   - Set suspended: false\n');
    }

    // Verify location data
    const profilesWithoutLocation = await User.countDocuments({
      isDemo: true,
      $or: [
        { location: { $exists: false } },
        { 'location.coordinates': { $exists: false } },
        { $expr: { $ne: [{ $size: { $ifNull: ['$location.coordinates', []] } }, 2] } }
      ]
    });

    if (profilesWithoutLocation > 0) {
      console.log(`⚠️  Warning: ${profilesWithoutLocation} demo profiles missing location data`);
      console.log('   Profiles without location won\'t appear in location-based discovery\n');
    } else {
      console.log('✅ All demo profiles have valid location data\n');
    }

    // Summary
    const totalActive = await User.countDocuments({ isDemo: true, isActive: true });
    const totalWithLocation = await User.countDocuments({
      isDemo: true,
      'location.coordinates': { $exists: true, $size: 2 }
    });

    console.log('📈 Summary:');
    console.log(`   Total demo profiles: ${demoProfiles.length}`);
    console.log(`   Active profiles: ${totalActive}`);
    console.log(`   Profiles with location: ${totalWithLocation}`);
    console.log(`   Ready for discovery: ${Math.min(totalActive, totalWithLocation)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

fixDemoProfiles();
