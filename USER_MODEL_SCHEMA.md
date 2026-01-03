# User Model Schema - Complete Reference

## Overview
The User model has been enhanced with Tier 2 features including advanced profile fields, activity tracking, and social media integration.

---

## Complete User Schema

### Authentication Fields
```javascript
{
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phone: {
    type: String,
    sparse: true,
    unique: true
  },
  phoneVerified: Boolean,
  emailVerified: Boolean,
  // ... rest of auth fields
}
```

---

## Basic Profile Fields

```javascript
{
  // Basic Information
  name: String,
  age: Number,
  gender: String, // 'male', 'female', 'other'
  bio: String, // Max 500 characters
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  
  // Photos
  photos: [
    {
      url: String,
      order: Number,
      moderationStatus: String, // pending, approved, rejected
      uploadedAt: Date
    }
  ],
  
  // Basic Interests
  interests: [String]
}
```

---

## Enhanced Profile Fields (Tier 2)

### Video Profile Clips
```javascript
{
  videos: [
    {
      videoUrl: String,
      duration: Number, // In seconds (6-15)
      order: Number,
      moderationStatus: String, // pending, approved, rejected
      uploadedAt: Date
    }
  ]
}
```

**Validation**:
- Duration: 6-15 seconds
- Maximum 3 videos (recommended)
- Video moderation required before display

---

### Profile Prompts (Icebreakers)
```javascript
{
  profilePrompts: [
    {
      prompt: String, // Selected from 12 available prompts
      answer: String  // User's answer (max 300 characters)
    }
  ]
}
```

**Validation**:
- Maximum 3 prompts
- Answer max 300 characters
- Both prompt and answer required

**Available Prompts** (12 total):
1. "My ideal weekend is..."
2. "I'm most passionate about..."
3. "You'd be surprised to know..."
4. "My hidden talent is..."
5. "I'm looking for someone who..."
6. "My favorite place to..."
7. "People usually describe me as..."
8. "My perfect date would be..."
9. "I geek out about..."
10. "Something on my bucket list is..."
11. "I'm convinced that..."
12. "My favorite memory is..."

---

### Education
```javascript
{
  education: {
    school: String,        // University/School name
    degree: String,        // e.g., "Bachelor's", "Master's", "PhD"
    fieldOfStudy: String,  // e.g., "Computer Science"
    graduationYear: Number // e.g., 2023
  }
}
```

**Validation**:
- All fields optional
- Graduation year: 1950-2050 range
- School and field: 1-100 characters

---

### Occupation
```javascript
{
  occupation: {
    jobTitle: String,    // e.g., "Software Engineer"
    company: String,     // e.g., "Tech Company Inc"
    industry: String     // e.g., "Technology", "Finance", etc
  }
}
```

**Validation**:
- All fields optional
- Each field: 1-100 characters

---

### Physical Attributes

#### Height
```javascript
{
  height: {
    value: Number,  // Actual height value
    unit: String    // 'cm' or 'ft'
  }
}
```

**Validation**:
- Value: 100-250
- Unit: 'cm' or 'ft' (stored as-is, conversion handled frontend)
- Both value and unit required together

---

#### Ethnicity
```javascript
{
  ethnicity: [String] // Array of selected ethnicities
}
```

**Available Options**:
- Asian
- Black
- Hispanic/Latin
- Middle Eastern
- Native American
- Pacific Islander
- White
- Mixed
- Other

**Validation**:
- Maximum 3 selections
- Only valid options accepted

---

## Social Media Integration

### Social Media Connections
```javascript
{
  socialMedia: {
    spotify: {
      id: String,           // Spotify user ID
      username: String,     // Spotify username
      profileUrl: String,   // Link to Spotify profile
      isVerified: Boolean   // Whether connection is verified
    },
    instagram: {
      id: String,           // Instagram user ID
      username: String,     // Instagram username
      profileUrl: String,   // Link to Instagram profile
      isVerified: Boolean   // Whether connection is verified
    }
  }
}
```

**Validation**:
- Username: 1-50 characters
- URL: Valid URL format
- isVerified: Boolean (starts as false)

**Public Visibility**:
- Only verified connections displayed on profile
- Non-verified connections hidden from other users
- User can see their own non-verified connections

---

## Activity & Engagement Fields (Tier 2)

### Online Status
```javascript
{
  isOnline: Boolean,          // Currently online flag
  lastActive: Date,           // Last activity timestamp
  lastOnlineAt: Date          // Last online session timestamp
}
```

**Logic**:
- `isOnline = true` when user actively using app
- `isOnline = false` when user closes app or logs out
- `lastActive` updated on every heartbeat
- `lastOnlineAt` updated when transitioning from offline to online

---

### Activity Status Calculation
Activity status is calculated from `lastActive` timestamp:

| Condition | Status | Display |
|-----------|--------|---------|
| `isOnline === true` | online | "Online" |
| `lastActive < 5 minutes ago` | active_now | "Active now" |
| `lastActive < 1 hour ago` | active_Xm_ago | "Active 5m ago", etc |
| `lastActive < 24 hours ago` | active_Xh_ago | "Active 2h ago", etc |
| `lastActive < 7 days ago` | active_Xd_ago | "Active 2d ago", etc |
| `lastActive > 7 days ago` | offline | "Offline" |

---

### Profile View Tracking
```javascript
{
  profileViewCount: Number,   // Total number of profile views
  profileViewedBy: [
    {
      userId: String,         // ID of user who viewed
      userName: String,       // Name of viewer (for display)
      viewedAt: Date          // Timestamp of view
    }
  ]
}
```

**Validation**:
- ViewCount starts at 0
- One view per user per 24-hour period (deduplication)
- Newest views listed first in array
- Keep last 100 views in array (optional, for performance)

**Who Can See**:
- All users: Own profileViewCount
- Premium users: Full profileViewedBy array with viewer details
- Non-premium users: ViewCount only, array empty or hidden

---

### Premium Status
```javascript
{
  isPremium: Boolean,           // Premium tier status
  premiumExpiresAt: Date        // When premium expires
}
```

**Validation**:
- isPremium: true only if premiumExpiresAt > now
- Start as false for new users
- Set during payment processing

**Premium Features Unlocked**:
- See detailed profile viewers
- Additional profile features (future)
- Ad-free experience (future)

---

## Account Status Fields

```javascript
{
  createdAt: Date,              // Account creation date
  updatedAt: Date,              // Last profile update
  isActive: Boolean,            // Account active/deactivated
  isVerified: Boolean,          // Email/phone verified
  isDeleted: Boolean,           // Soft delete flag
  deletedAt: Date               // When account deleted
}
```

---

## Example Full User Document

```javascript
{
  _id: ObjectId,
  
  // Auth
  email: "user@example.com",
  password: "$2b$10$...",
  phoneVerified: true,
  emailVerified: true,
  
  // Basic Profile
  name: "John Doe",
  age: 28,
  gender: "male",
  bio: "Adventure seeker and coffee enthusiast...",
  location: {
    type: "Point",
    coordinates: [-73.9352, 40.7306]
  },
  interests: ["hiking", "photography", "travel"],
  
  // Photos
  photos: [
    {
      url: "s3://bucket/photo1.jpg",
      order: 1,
      moderationStatus: "approved",
      uploadedAt: "2024-01-10T10:00:00Z"
    }
  ],
  
  // Videos
  videos: [
    {
      videoUrl: "s3://bucket/video1.mp4",
      duration: 10,
      order: 1,
      moderationStatus: "approved",
      uploadedAt: "2024-01-15T12:00:00Z"
    }
  ],
  
  // Prompts
  profilePrompts: [
    {
      prompt: "My ideal weekend is...",
      answer: "Hiking in the mountains with friends and then relaxing with a good book"
    },
    {
      prompt: "I'm most passionate about...",
      answer: "Technology and helping others solve real-world problems"
    }
  ],
  
  // Education
  education: {
    school: "Stanford University",
    degree: "Bachelor's",
    fieldOfStudy: "Computer Science",
    graduationYear: 2018
  },
  
  // Occupation
  occupation: {
    jobTitle: "Senior Software Engineer",
    company: "Tech Corp",
    industry: "Technology"
  },
  
  // Physical
  height: {
    value: 180,
    unit: "cm"
  },
  ethnicity: ["Asian", "Mixed"],
  
  // Social Media
  socialMedia: {
    spotify: {
      id: "spotify_user_123",
      username: "johndoe",
      profileUrl: "https://open.spotify.com/user/...",
      isVerified: true
    },
    instagram: {
      id: "instagram_user_456",
      username: "johndoe_official",
      profileUrl: "https://instagram.com/johndoe_official",
      isVerified: false
    }
  },
  
  // Activity
  isOnline: true,
  lastActive: "2024-01-20T11:30:00Z",
  lastOnlineAt: "2024-01-20T11:00:00Z",
  
  // Profile Views
  profileViewCount: 42,
  profileViewedBy: [
    {
      userId: "user456",
      userName: "Jane Smith",
      viewedAt: "2024-01-20T11:25:00Z"
    },
    {
      userId: "user789",
      userName: "Mike Johnson",
      viewedAt: "2024-01-20T11:10:00Z"
    }
  ],
  
  // Premium
  isPremium: true,
  premiumExpiresAt: "2024-02-20T00:00:00Z",
  
  // Account
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2024-01-20T11:30:00Z",
  isActive: true,
  isVerified: true,
  isDeleted: false
}
```

---

## Database Indexes (Recommended)

For optimal query performance, create these indexes:

```javascript
// Performance indexes
db.users.createIndex({ "email": 1 });
db.users.createIndex({ "phone": 1 });
db.users.createIndex({ "location": "2dsphere" });
db.users.createIndex({ "isOnline": 1 });
db.users.createIndex({ "lastActive": 1 });
db.users.createIndex({ "profileViewCount": 1 });
db.users.createIndex({ "isPremium": 1 });
db.users.createIndex({ "createdAt": 1 });

// Compound indexes
db.users.createIndex({ "isActive": 1, "isDeleted": 1 });
db.users.createIndex({ "isPremium": 1, "premiumExpiresAt": 1 });
db.users.createIndex({ "profileViewedBy.userId": 1 });
```

---

## Migration Notes

If updating an existing app, add new fields with defaults:

```javascript
// Migration script
db.users.updateMany(
  {},
  {
    $set: {
      videos: [],
      profilePrompts: [],
      education: {},
      occupation: {},
      height: {},
      ethnicity: [],
      socialMedia: { spotify: {}, instagram: {} },
      isOnline: false,
      profileViewCount: 0,
      profileViewedBy: [],
      isPremium: false
    }
  }
);
```

---

## Field Validation Summary

| Field | Type | Required | Length | Special |
|-------|------|----------|--------|---------|
| name | String | Yes | 1-100 | - |
| age | Number | Yes | 18-100 | - |
| gender | String | Yes | - | enum |
| bio | String | No | 0-500 | - |
| profilePrompts | Array | No | Max 3 | Max 300 chars per answer |
| education.school | String | No | 1-100 | - |
| education.degree | String | No | 1-50 | - |
| height.value | Number | No | 100-250 | - |
| height.unit | String | No | - | 'cm' or 'ft' |
| ethnicity | Array | No | Max 3 | enum values |
| socialMedia.spotify.username | String | No | 1-50 | - |
| socialMedia.instagram.username | String | No | 1-50 | - |
| isPremium | Boolean | No | - | Derived from premiumExpiresAt |

---

## Backward Compatibility

All new fields are optional with sensible defaults:
- New users can have empty education/occupation
- Existing users can add these fields anytime
- Old profiles without videos still work
- Activity fields auto-initialize on first login

---

## Security Considerations

### Data Privacy
- Social media profiles private until verified
- Profile viewers list private (premium only)
- Location only visible to matched users
- Activity status public (unless privacy setting added)

### Data Protection
- Passwords hashed with bcrypt (10 salt rounds)
- Social media tokens not stored (credentials only)
- PII (phone, email) indexed but encrypted in transit
- Video/photo moderation prevents inappropriate content

### Validation
- All string inputs sanitized
- Array lengths enforced (max 3 for ethnicities, etc)
- Numeric fields bounded (age 18-100, height 100-250)
- Enum fields validated against allowed values

---

## Future Enhancements

### Potential New Fields
- `preferences` - Age/height/distance preferences
- `badges` - Achievements and badges
- `blockedUsers` - Users to hide from
- `savedProfiles` - Bookmarked profiles
- `conversationHistory` - Message archives
- `activityLog` - Detailed activity timeline

### Potential New Features
- Privacy settings per field
- Custom prompts (user-created questions)
- Multiple education/occupation history
- Photo albums with captions
- Interest categories with proficiency levels

---

## Documentation References

- API Endpoints: See TIER2_IMPLEMENTATION.md
- Integration Guide: See TIER2_INTEGRATION_CHECKLIST.md
- Quick Reference: See TIER2_QUICK_REFERENCE.md

---

**Last Updated**: 2024
**Schema Version**: 2.0
**Tier**: 2
