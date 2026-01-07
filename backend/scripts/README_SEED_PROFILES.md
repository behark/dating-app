# 🌱 Demo Profiles Seed Script

Comprehensive seed script that creates **100 professional, diverse demo profiles** for development and demo purposes.

---

## ✨ Features

### **Profile Diversity:**
- ✅ **100 realistic profiles** with varied demographics
- ✅ **36+ different professions** (doctors, teachers, engineers, artists, etc.)
- ✅ **30+ interests** per profile
- ✅ **Gender distribution:** ~33% male, ~33% female, ~33% non-binary
- ✅ **Age range:** 21-45 years old (realistic distribution)
- ✅ **10 major US cities** (NY, LA, SF, Austin, Seattle, etc.)

### **Realistic Characteristics:**
- ✅ **Professional bios** generated from profession + interests
- ✅ **3 photos per profile** (using Picsum for reliable loading)
- ✅ **70% verified** profiles (blue checkmark)
- ✅ **20% premium** users
- ✅ **Realistic creation dates** (last 30 days)
- ✅ **Recent activity** (last 7 days)
- ✅ **Location with coordinates** (for distance-based matching)

---

## 🚀 Quick Start

### **1. Install Dependencies**

```bash
cd backend
npm install
```

### **2. Configure Environment**

Make sure your `backend/.env` file has:

```env
MONGODB_URI=mongodb://localhost:27017/dating-app
# Or your production MongoDB connection string
```

### **3. Run the Seed Script**

```bash
node backend/scripts/seed-demo-profiles.js
```

### **4. Expected Output**

```
🌱 Starting demo profiles seed...

📡 Connecting to MongoDB...
✅ Connected to MongoDB

🗑️  Removing existing demo profiles...
✅ Removed 0 existing demo profiles

👥 Generating 100 demo profiles...
   Generated 10/100 profiles...
   Generated 20/100 profiles...
   ...
   Generated 100/100 profiles...
✅ Generated 100 profiles

💾 Inserting profiles into database...
   Inserted 20/100 profiles...
   Inserted 40/100 profiles...
   ...
   Inserted 100/100 profiles...
✅ All profiles inserted

📊 Seed Statistics:
   Total profiles: 100
   Male: 33
   Female: 33
   Non-binary: 34
   Verified: 70 (70%)
   Premium: 20 (20%)
   Cities: 10
   Professions: 36
   Interests: 30

🎉 Demo profiles seeded successfully!

💡 Tips:
   - All demo profiles have email: demo{0-99}@example.com
   - All demo profiles have password: Demo123!
   - To remove demo profiles: User.deleteMany({ isDemo: true })
   - To re-run seed: node backend/scripts/seed-demo-profiles.js

👋 Database connection closed
```

---

## 📊 Profile Details

### **Sample Profile Structure:**

```javascript
{
  email: "demo0@example.com",
  password: "Demo123!", // Hashed in database
  name: "Sarah",
  age: 28,
  gender: "female",
  bio: "Software Engineer who loves hiking and yoga. Looking for someone to share adventures with!",
  profession: "Software Engineer",
  interests: ["hiking", "yoga", "photography", "travel", "coffee", "reading"],
  photoURL: "https://picsum.photos/seed/1000/400/500",
  photos: [
    { url: "https://picsum.photos/seed/1000/400/500", isPrimary: true },
    { url: "https://picsum.photos/seed/1001/400/500", isPrimary: false },
    { url: "https://picsum.photos/seed/1002/400/500", isPrimary: false }
  ],
  location: {
    type: "Point",
    coordinates: [-122.4194, 37.7749], // [longitude, latitude]
    city: "San Francisco",
    state: "CA"
  },
  preferences: {
    ageRange: { min: 18, max: 38 },
    distance: 50,
    genderPreference: ["male"]
  },
  isVerified: true,
  isPremium: false,
  isDemo: true,
  createdAt: "2025-12-15T10:30:00.000Z",
  lastActive: "2026-01-05T18:45:00.000Z"
}
```

---

## 🎯 Use Cases

### **Development:**
- Test matching algorithms with realistic data
- Test discovery features with location-based queries
- Test filters (age, distance, interests)
- Load testing with substantial dataset

### **Demo/Presentation:**
- Show investors/stakeholders realistic profiles
- Demo app features with professional-looking data
- Test user flows with varied profile types

### **QA/Testing:**
- Test edge cases (verified/unverified, premium/free)
- Test different genders and preferences
- Test location-based features across cities

---

## 🛠️ Customization

### **Change Number of Profiles:**

Edit line 7 in the script:

```javascript
// Change from 100 to desired number
for (let i = 0; i < 100; i++) {
```

### **Add More Cities:**

Add to the `CITIES` array (line 32):

```javascript
const CITIES = [
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  // Add your city here:
  { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  // ...
];
```

### **Add More Professions:**

Add to the `PROFESSIONS` array (line 25):

```javascript
const PROFESSIONS = [
  'Software Engineer', 'Doctor', 'Teacher',
  // Add your profession here:
  'Pilot', 'Marine Biologist', 'Sommelier',
  // ...
];
```

### **Change Verification Rate:**

Edit line 171 (currently 70%):

```javascript
// 70% verified, 30% not verified
const isVerified = Math.random() > 0.3; // Change 0.3 to 0.5 for 50%
```

### **Change Premium Rate:**

Edit line 174 (currently 20%):

```javascript
// 20% premium
const isPremium = Math.random() > 0.8; // Change 0.8 to 0.5 for 50%
```

---

## 🧹 Cleanup

### **Remove All Demo Profiles:**

```bash
# Using MongoDB shell
mongo dating-app
db.users.deleteMany({ isDemo: true })
```

### **Remove Specific Demo Profiles:**

```bash
# Remove only unverified demo profiles
db.users.deleteMany({ isDemo: true, isVerified: false })

# Remove only non-premium demo profiles
db.users.deleteMany({ isDemo: true, isPremium: false })
```

### **Re-run Seed (Automatic Cleanup):**

The script automatically removes existing demo profiles before creating new ones:

```bash
node backend/scripts/seed-demo-profiles.js
```

---

## 📝 Login Credentials

All demo profiles can be logged into for testing:

- **Emails:** `demo0@example.com` through `demo99@example.com`
- **Password:** `Demo123!` (all profiles have same password)

**Example:**
```bash
# Login as demo profile #42
Email: demo42@example.com
Password: Demo123!
```

---

## 🔍 Querying Demo Profiles

### **Find All Demo Profiles:**

```javascript
const demoProfiles = await User.find({ isDemo: true });
```

### **Find Demo Profiles by City:**

```javascript
const sfProfiles = await User.find({ 
  isDemo: true, 
  'location.city': 'San Francisco' 
});
```

### **Find Verified Demo Profiles:**

```javascript
const verifiedProfiles = await User.find({ 
  isDemo: true, 
  isVerified: true 
});
```

### **Find Premium Demo Profiles:**

```javascript
const premiumProfiles = await User.find({ 
  isDemo: true, 
  isPremium: true 
});
```

### **Find Demo Profiles by Profession:**

```javascript
const engineers = await User.find({ 
  isDemo: true, 
  profession: 'Software Engineer' 
});
```

---

## ⚠️ Important Notes

### **Production Use:**

**DO NOT run this script in production!** This is for development/demo only.

To prevent accidents, add to your production `.env`:

```env
NODE_ENV=production
```

And add this check to the script:

```javascript
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Cannot run seed script in production!');
  process.exit(1);
}
```

### **Database Size:**

100 profiles will use approximately:
- **MongoDB:** ~2-3 MB
- **With photos cached:** ~50-100 MB

### **Photo Loading:**

- Uses Picsum for reliable, fast-loading placeholder photos
- Photos are deterministic (same seed = same photo)
- Photos load from CDN (fast worldwide)

---

## 🐛 Troubleshooting

### **"Cannot connect to MongoDB"**

1. Make sure MongoDB is running:
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Start MongoDB if needed
   sudo systemctl start mongod
   ```

2. Check your `MONGODB_URI` in `.env`

### **"User model not found"**

Make sure your User model schema matches the script. Update the UserSchema in the script if needed.

### **"Duplicate email error"**

The script removes existing demo profiles first. If you get this error:

1. Manually remove demo profiles:
   ```javascript
   await User.deleteMany({ isDemo: true });
   ```

2. Re-run the script

### **"Photos not loading"**

Picsum photos are reliable, but if they don't load:

1. Check internet connection
2. Try different photo service (edit `generatePhotoURLs` function)
3. Use local photos instead

---

## 📈 Performance

### **Seed Time:**
- **100 profiles:** ~10-15 seconds
- **1000 profiles:** ~2-3 minutes

### **Optimization Tips:**

1. **Batch inserts** (already implemented - 20 at a time)
2. **Pre-hash passwords** in parallel
3. **Use MongoDB bulk operations**
4. **Index optimization** (already has 2dsphere index)

---

## 🎉 Success!

You now have **100 professional, diverse demo profiles** ready for:
- ✅ Development testing
- ✅ Demo presentations
- ✅ Load testing
- ✅ Feature development
- ✅ QA testing

**Happy dating app development!** 💕

---

## 📚 Related Scripts

- `backend/scripts/cleanup-demo-data.js` - Remove all demo data
- `backend/scripts/generate-matches.js` - Generate demo matches
- `backend/scripts/generate-messages.js` - Generate demo conversations

---

**Questions?** Check the main README or create an issue on GitHub!
