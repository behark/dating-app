require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function fixDemoLocations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // NYC coordinates (where test user is located)
    const nycLat = 40.7128;
    const nycLng = -74.0060;

    // Update all demo profiles to NYC location using bulk update
    const result = await User.updateMany(
      { isDemo: true },
      {
        $set: {
          'location.coordinates': [nycLng, nycLat],
          'location.type': 'Point',
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} demo profiles to NYC location`);

    // Verify count
    const totalCount = await User.countDocuments({
      isDemo: true,
      isActive: true,
      suspended: { $ne: true },
    });

    console.log(`✅ Total discoverable demo profiles: ${totalCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDemoLocations();
