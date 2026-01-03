# Tinder-Style Dating App

A modern dating app built with React Native, Expo, and Firebase. Features swipe gestures, real-time chat, profile management, and match notifications.

## Features

- 🔐 **Authentication**: Email/Password and Google OAuth login
- 👆 **Swipe Cards**: Tinder-style swipe gestures with animations
- 💬 **Real-time Chat**: Firebase-powered messaging between matches
- 👤 **Profile Management**: Edit profile, upload photos, set preferences
- ❤️ **Matching System**: Automatic match detection when both users swipe right
- 📱 **Cross-platform**: Works on both iOS and Android

## Prerequisites

Before you begin, ensure you have:

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Firebase account (free tier works)
- Expo Go app on your phone (for testing)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (configure OAuth consent screen)
4. Create a Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (for development)
5. Set up Storage:
   - Go to Storage
   - Get started with default rules

### 3. Configure Firebase Credentials

Update `app.json` with your Firebase credentials:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "your_api_key",
      "firebaseAuthDomain": "your_project.firebaseapp.com",
      "firebaseProjectId": "your_project_id",
      "firebaseStorageBucket": "your_project.appspot.com",
      "firebaseMessagingSenderId": "your_sender_id",
      "firebaseAppId": "your_app_id",
      "googleWebClientId": "your_google_web_client_id"
    }
  }
}
```

**OR** create a `.env` file (you'll need `expo-constants` and `dotenv`):

```bash
cp .env.example .env
# Then edit .env with your Firebase credentials
```

### 4. Run the App

```bash
# Start the Expo development server
npm start

# Or run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
```

Scan the QR code with Expo Go app on your phone to test!

## Security Setup

### Firebase Security Rules

This app includes Firebase security rules to protect user data. Deploy them after setting up Firebase:

```bash
# Deploy Firestore and Storage rules
firebase deploy --only firestore:rules,storage
```

**CRITICAL**: Never deploy without security rules - your data will be publicly accessible!

### Environment Variables

The app uses environment variables for Firebase credentials. Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
# Edit .env with your Firebase credentials
```

## Project Structure

```
dating-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── Card/         # Swipe card component
│   ├── screens/          # Screen components
│   │   ├── HomeScreen.js      # Main swipe screen
│   │   ├── LoginScreen.js     # Authentication
│   │   ├── ProfileScreen.js   # User profile
│   │   ├── MatchesScreen.js   # List of matches
│   │   └── ChatScreen.js      # Chat interface
│   ├── navigation/       # Navigation setup
│   ├── config/          # Firebase configuration
│   ├── context/         # React Context (Auth)
│   └── utils/           # Helper functions
├── App.js               # Main app component
├── app.json            # Expo configuration
└── package.json        # Dependencies
```

## Key Technologies

- **React Native**: Mobile app framework
- **Expo**: Development platform and tooling
- **Firebase**: Backend services (Auth, Firestore, Storage)
- **React Navigation**: Navigation library
- **React Native Reanimated**: Smooth animations
- **React Native Gesture Handler**: Swipe gestures

## Database Schema

### Users Collection
```javascript
{
  name: string,
  age: number,
  bio: string,
  photoURL: string,
  email: string,
  swipedUsers: [userId1, userId2, ...],  // Users already swiped
  matches: [userId1, userId2, ...],      // Mutual matches
  createdAt: timestamp
}
```

### Chats Collection
```
chats/{chatId}/messages/{messageId}
{
  text: string,
  senderId: string,
  receiverId: string,
  createdAt: timestamp
}
```

## Customization

### Change Colors
Edit the color values in component StyleSheets:
- Primary: `#FF6B6B` (red/pink)
- Secondary: `#4ECDC4` (teal)
- Background: `#f5f5f5`

### Add Filters
Modify `HomeScreen.js` to add age/gender/distance filters in the `loadCards()` function.

### Photo Upload
Currently uses Firebase Storage. To use Cloudinary instead, update `ProfileScreen.js`.

## Troubleshooting

### Firebase Connection Issues
- Verify your Firebase credentials in `app.json`
- Check Firebase console for API restrictions
- Ensure Firestore rules allow read/write (for development)

### Swipe Gestures Not Working
- Make sure `react-native-gesture-handler` is properly installed
- Check that `react-native-reanimated` plugin is in `babel.config.js`

### Build Errors
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## License

MIT License - feel free to use this for learning or as a base for your own project.

## ✅ Completed Features

### 🔒 Security & Infrastructure
- **Firebase Security Rules** - Comprehensive database and storage security
- **Input Validation** - Client-side validation for all forms
- **Error Boundaries** - Graceful error handling and reporting
- **Environment Management** - Multi-environment configuration
- **CI/CD Pipeline** - Automated testing and deployment

### 🚀 Performance & Scalability
- **Chat Pagination** - Load messages in batches (20 at a time)
- **Image Optimization** - Compression and caching for faster loading
- **User Caching** - 5-minute cache for profile data
- **Monitoring Service** - Performance tracking and error reporting

### 💎 Premium Features
- **Super Likes** - Limited daily super likes with premium upgrade
- **Unlimited Swipes** - Premium users get unlimited swipes
- **Advanced Filters** - Premium filtering options
- **Profile Boost** - 30-minute visibility boost
- **Who Liked You** - See users who super liked you

### 📱 User Experience
- **Push Notifications** - Real-time match and message notifications
- **Location Services** - Distance-based matching and filtering
- **Advanced Preferences** - Comprehensive user preference settings
- **Profile Verification** - Document verification system
- **Multiple Photos** - Photo gallery with primary photo selection

### 🧪 Testing & Quality
- **Unit Tests** - Jest testing framework with React Native Testing Library
- **Analytics** - Firebase Analytics integration
- **Error Monitoring** - Comprehensive error tracking
- **Performance Monitoring** - App performance metrics

## 🚀 Deployment Options

### Web Deployment (Recommended for quick start)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Or use the included CI/CD pipeline
git push origin main
```

### Mobile Deployment
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build for iOS/Android
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d

# Or build manually
docker build -t dating-app .
docker run -p 3000:3000 dating-app
```

## 📊 Monitoring & Analytics

The app includes comprehensive monitoring:

- **Performance Metrics** - App load times, network requests
- **Error Tracking** - Automatic error reporting
- **User Analytics** - Feature usage and engagement
- **Health Checks** - System health monitoring

## 🛠️ Development

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Code Quality
```bash
npm run lint      # Check code style
npm run lint:fix  # Fix linting issues
npm run format    # Format code
```

### Environment Setup
```bash
cp env.example .env
# Fill in your Firebase credentials
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

---

**Note**: This is a learning project. For production use, ensure proper security rules, data validation, and compliance with privacy regulations (GDPR, etc.).
