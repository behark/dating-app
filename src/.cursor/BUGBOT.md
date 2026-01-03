# Frontend - Bugbot Review Guidelines

## Frontend Stack
- React Native with Expo
- React Navigation
- Firebase (Auth, Firestore, Storage)
- Context API for state management
- AsyncStorage for local persistence

## Critical Frontend Security

### Authentication
- Never store JWT tokens in plain text
- Use secure storage (AsyncStorage is encrypted on device)
- Clear tokens on logout
- Validate token expiration before API calls
- Handle authentication errors gracefully

### API Calls
- Always include authentication tokens in headers
- Handle network errors (timeout, no connection)
- Validate API responses before using data
- Never expose API keys in client code
- Use environment variables for API endpoints

### User Input Validation
- Validate inputs on the frontend (but backend validation is still required)
- Sanitize user inputs before display
- Prevent XSS attacks in user-generated content
- Validate file uploads (type, size) before sending to backend

### Data Privacy
- Never log sensitive user data (passwords, tokens, PII)
- Clear sensitive data from memory when not needed
- Implement proper data cleanup on logout
- Be careful with location data - only share when necessary

## React Native Best Practices

### Memory Leaks Prevention
- **ALWAYS** clean up in useEffect hooks:
```javascript
useEffect(() => {
  const subscription = someService.subscribe();
  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);
```

- Remove event listeners:
```javascript
useEffect(() => {
  const handler = () => { /* ... */ };
  EventEmitter.addListener('event', handler);
  return () => EventEmitter.removeListener('event', handler);
}, []);
```

- Clear timers:
```javascript
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);
```

### Error Boundaries
- Wrap major components in ErrorBoundary
- Provide fallback UI for errors
- Log errors to monitoring service
- Don't let one component crash the entire app

### AsyncStorage Usage
- Always use async/await with AsyncStorage
- Handle errors when reading/writing
- Don't store sensitive data without encryption
```javascript
try {
  await AsyncStorage.setItem('key', value);
  const data = await AsyncStorage.getItem('key');
} catch (error) {
  console.error('AsyncStorage error:', error);
}
```

### Image Optimization
- Resize images before upload
- Use appropriate image formats
- Implement lazy loading for image lists
- Handle image load errors gracefully

## Common React Native Issues

### Missing Cleanup
- ❌ `useEffect(() => { setInterval(() => {}, 1000); }, [])`
- ✅ `useEffect(() => { const timer = setInterval(() => {}, 1000); return () => clearInterval(timer); }, [])`

### Missing Error Handling
- ❌ `const data = await fetch(url)`
- ✅ `try { const data = await fetch(url); } catch (error) { /* handle */ }`

### Missing Loading States
- ❌ Directly rendering data without checking if it's loaded
- ✅ Show loading indicator while fetching data

### Permission Handling
- ❌ Assuming permissions are granted
- ✅ Always check and request permissions:
```javascript
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  // Handle denied permission
}
```

### Navigation Issues
- Don't navigate before data is loaded
- Handle navigation errors
- Prevent multiple rapid navigations
- Clean up navigation listeners

## Context API Patterns

### Proper Context Usage
- Don't put everything in one context
- Use separate contexts for different concerns (Auth, Chat, etc.)
- Provide loading and error states in context
- Memoize context values to prevent unnecessary re-renders

### Context Provider Structure
```javascript
export const MyContext = createContext();

export const MyProvider = ({ children }) => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize value
  const value = useMemo(() => ({
    state,
    loading,
    error,
    actions: { /* ... */ }
  }), [state, loading, error]);

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};
```

## Firebase Best Practices

### Firebase Initialization
- Check if Firebase is already initialized before initializing
- Handle initialization errors gracefully
- Use proper error handling for Firebase operations

### Firestore Queries
- Use proper error handling for Firestore operations
- Implement pagination for large collections
- Use indexes for complex queries
- Handle offline scenarios

### Firebase Storage
- Validate file types and sizes before upload
- Show upload progress to users
- Handle upload errors gracefully
- Clean up failed uploads

## Performance Optimization

### Component Optimization
- Use React.memo for expensive components
- Memoize callbacks with useCallback
- Memoize computed values with useMemo
- Avoid creating objects/functions in render

### List Optimization
- Use FlatList for long lists (not ScrollView)
- Implement proper keyExtractor
- Use getItemLayout when possible
- Implement pagination for large datasets

### Image Optimization
- Use appropriate image sizes
- Implement image caching
- Lazy load images in lists
- Use WebP format when possible

## User Experience

### Loading States
- Show loading indicators during async operations
- Provide skeleton screens for better UX
- Don't show blank screens while loading

### Error Handling
- Show user-friendly error messages
- Provide retry options for failed operations
- Log errors for debugging
- Don't crash the app on errors

### Form Validation
- Validate inputs in real-time
- Show clear error messages
- Disable submit button while processing
- Handle form submission errors

## Code Quality

### Console Statements
- Remove console.log in production code
- Use proper logging service for errors
- ESLint should catch console.log statements

### Code Organization
- Keep components focused and small
- Extract reusable logic into hooks
- Use services for API calls
- Follow the existing folder structure

### Type Safety
- Use PropTypes or TypeScript for type checking
- Validate data from API responses
- Handle null/undefined values properly

## Dating App Specific

### Profile Display
- Validate user data before displaying
- Handle missing photos gracefully
- Show appropriate placeholders
- Respect user privacy settings

### Matching Logic
- Ensure users can't see themselves
- Handle edge cases (no matches, all swiped)
- Show appropriate messages for different states

### Real-time Updates
- Handle Socket.io connection states
- Implement reconnection logic
- Show connection status to users
- Handle message delivery failures

### Location Services
- Request location permissions properly
- Handle location errors gracefully
- Update location periodically
- Respect user privacy preferences
