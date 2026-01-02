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

## Next Steps

- [ ] Add push notifications for new matches/messages
- [ ] Implement distance-based filtering
- [ ] Add photo moderation
- [ ] Create admin panel
- [ ] Add reporting/blocking features
- [ ] Implement premium features

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

---

**Note**: This is a learning project. For production use, ensure proper security rules, data validation, and compliance with privacy regulations (GDPR, etc.).
