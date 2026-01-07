/**
 * Quick script to check if demo profiles have photos
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

// Simple User schema for checking
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkProfiles() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Find demo profiles
    const demoProfiles = await User.find({ isDemo: true }).limit(10);
    
    console.log(`📊 Checking ${demoProfiles.length} demo profiles...\n`);
    
    let withPhotos = 0;
    let withoutPhotos = 0;
    let totalPhotos = 0;

    demoProfiles.forEach((profile, index) => {
      const hasPhotoURL = !!profile.photoURL;
      const hasPhotosArray = profile.photos && profile.photos.length > 0;
      const photoCount = profile.photos ? profile.photos.length : 0;
      
      if (hasPhotoURL || hasPhotosArray) {
        withPhotos++;
        totalPhotos += photoCount;
        console.log(`✅ Profile ${index + 1} (${profile.name}, ${profile.email}):`);
        console.log(`   - photoURL: ${hasPhotoURL ? '✅' : '❌'} ${profile.photoURL || 'N/A'}`);
        console.log(`   - photos array: ${hasPhotosArray ? '✅' : '❌'} (${photoCount} photos)`);
        if (hasPhotosArray) {
          profile.photos.slice(0, 2).forEach((photo, i) => {
            console.log(`     Photo ${i + 1}: ${photo.url}`);
          });
        }
        console.log('');
      } else {
        withoutPhotos++;
        console.log(`❌ Profile ${index + 1} (${profile.name}): No photos`);
      }
    });

    console.log('\n📈 Summary:');
    console.log(`   Total checked: ${demoProfiles.length}`);
    console.log(`   With photos: ${withPhotos}`);
    console.log(`   Without photos: ${withoutPhotos}`);
    console.log(`   Average photos per profile: ${(totalPhotos / withPhotos).toFixed(1)}`);

    // Check all demo profiles count
    const totalDemoProfiles = await User.countDocuments({ isDemo: true });
    const totalWithPhotos = await User.countDocuments({ 
      isDemo: true, 
      $or: [{ photoURL: { $exists: true } }, { photos: { $exists: true, $ne: [] } }]
    });
    
    console.log(`\n📊 Database Totals:`);
    console.log(`   Total demo profiles: ${totalDemoProfiles}`);
    console.log(`   Profiles with photos: ${totalWithPhotos} (${((totalWithPhotos/totalDemoProfiles)*100).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

checkProfiles();
