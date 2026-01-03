# Dating App - Bugbot Review Guidelines

## Project Overview
This is a React Native/Expo dating app with a Node.js/Express backend, using Firebase for authentication and MongoDB for data storage.

## Critical Security Requirements

### Authentication & Authorization
- **JWT Tokens**: Always verify JWT tokens on protected routes using the auth middleware
- **Password Security**: Never log passwords, always use bcryptjs for hashing (minimum 10 rounds)
- **Token Expiration**: Ensure JWT tokens have proper expiration times
- **OAuth Security**: Validate OAuth tokens and verify user identity before account creation
- **Session Management**: Implement proper refresh token rotation

### Input Validation
- **Always validate user input** on both frontend and backend
- Use `express-validator` for backend validation
- Sanitize all user inputs to prevent XSS attacks
- Validate email formats, phone numbers, and age ranges
- Check for SQL injection risks (even with MongoDB, validate query parameters)
- Validate file uploads (type, size, dimensions)

### Data Privacy & Protection
- **Never expose sensitive user data** in API responses (passwords, tokens, internal IDs)
- Implement proper data masking for PII (Personally Identifiable Information)
- Ensure location data is properly secured and only shared with matched users
- Photo URLs should be signed/expiring URLs when possible
- User data should only be accessible by the user themselves or matched users

### API Security
- Use Helmet.js for security headers (already configured)
- Implement rate limiting on authentication endpoints
- Use HTTPS only (enforced by Firebase)
- Validate CORS origins properly
- Never expose internal error details to clients in production

## Code Quality Standards

### Error Handling
- Always use try-catch blocks for async operations
- Provide meaningful error messages (but not sensitive details)
- Log errors server-side, but don't expose stack traces to clients
- Use ErrorBoundary components in React Native for graceful error handling

### Async/Await Patterns
- Prefer async/await over promise chains
- Always handle promise rejections
- Use Promise.all() for parallel operations when appropriate
- Avoid nested async operations - use proper error handling

### Code Consistency
- Follow existing ESLint rules (no console.log in production)
- Use Prettier formatting (already configured)
- Follow camelCase for variables/functions, PascalCase for components
- Use meaningful variable names (avoid abbreviations)

## Dating App Specific Concerns

### User Safety
- Implement proper user reporting mechanisms
- Validate user age (must be 18+)
- Ensure photo moderation is working
- Check for inappropriate content in bios/messages

### Matching & Discovery
- Ensure swipe logic prevents users from seeing themselves
- Validate distance calculations for location-based matching
- Check for duplicate matches
- Ensure mutual match logic is correct

### Real-time Features
- Socket.io connections should be properly cleaned up
- Handle connection failures gracefully
- Implement reconnection logic
- Validate socket event payloads

## Common Issues to Watch For

### React Native Specific
- Memory leaks in useEffect hooks (missing cleanup functions)
- Missing error boundaries around components
- Improper AsyncStorage usage (should be async)
- Missing permission checks for location/camera/notifications
- Image optimization issues (large images causing performance problems)

### Backend Specific
- Missing authentication middleware on protected routes
- Unhandled promise rejections
- Missing input validation
- Database queries without error handling
- Missing rate limiting on sensitive endpoints
- Environment variables not properly loaded

### General
- Hardcoded secrets or API keys
- Missing null/undefined checks
- Race conditions in async code
- Missing loading states in UI
- Poor error messages for users

## Testing Requirements
- New features should include tests when possible
- Critical paths (auth, payments, matching) must have tests
- Use Jest for both frontend and backend tests

## Performance Considerations
- Optimize image sizes before upload
- Implement pagination for large data sets
- Use database indexes for frequently queried fields
- Avoid N+1 query problems
- Implement proper caching where appropriate
