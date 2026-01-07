/**
 * Fix Demo Profiles - Ensure all are not suspended
 * Forces all demo profiles to have suspended: false and isActive: true
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

// Simple User schema
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function fixSuspendedProfiles() {
  try {
    console.log('🔧 Fixing Demo Profiles Suspended Status...\n');
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Count before
    const beforeCount = await User.countDocuments({ isDemo: true });
    const suspendedBefore = await User.countDocuments({ isDemo: true, suspended: true });
    const inactiveBefore = await User.countDocuments({ isDemo: true, isActive: { $ne: true } });
    
    console.log(`📊 Current Status:`);
    console.log(`   Total demo profiles: ${beforeCount}`);
    console.log(`   Suspended: ${suspendedBefore}`);
    console.log(`   Inactive: ${inactiveBefore}\n`);

    // Force update all demo profiles to be active and not suspended
    console.log('🔧 Updating all demo profiles...');
    const result = await User.updateMany(
      { isDemo: true },
      { 
        $set: { 
          isActive: true,
          suspended: false
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} demo profiles`);
    console.log('   - Set isActive: true');
    console.log('   - Set suspended: false\n');

    // Verify after
    const suspendedAfter = await User.countDocuments({ isDemo: true, suspended: true });
    const inactiveAfter = await User.countDocuments({ isDemo: true, isActive: { $ne: true } });
    const activeAndNotSuspended = await User.countDocuments({ 
      isDemo: true, 
      isActive: true, 
      suspended: false 
    });

    console.log(`📊 Final Status:`);
    console.log(`   Total demo profiles: ${beforeCount}`);
    console.log(`   Active and not suspended: ${activeAndNotSuspended}`);
    console.log(`   Still suspended: ${suspendedAfter}`);
    console.log(`   Still inactive: ${inactiveAfter}\n`);

    if (suspendedAfter === 0 && inactiveAfter === 0) {
      console.log('🎉 All demo profiles are now active and not suspended!');
      console.log('   They should appear in discovery.\n');
    } else {
      console.log('⚠️  Some profiles may still need attention.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

fixSuspendedProfiles();
