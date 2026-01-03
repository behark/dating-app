# Backend - Bugbot Review Guidelines

## Backend Stack
- Node.js with Express.js
- MongoDB with Mongoose
- Socket.io for real-time features
- JWT for authentication
- bcryptjs for password hashing

## Critical Backend Security

### Authentication Middleware
- **ALWAYS** use `auth.js` middleware on protected routes
- Verify JWT token signature and expiration
- Check user exists and is active before allowing access
- Example: `router.get('/profile', authenticate, getProfile)`

### Input Validation
- **MUST** use `express-validator` for all user inputs
- Validate request body, params, and query strings
- Sanitize inputs to prevent injection attacks
- Check for required fields and data types
- Example:
```javascript
const { body, validationResult } = require('express-validator');
router.post('/endpoint', [
  body('email').isEmail().normalizeEmail(),
  body('age').isInt({ min: 18, max: 100 })
], handler);
```

### Password Security
- Never store plain text passwords
- Always use `bcryptjs.hash()` with at least 10 salt rounds
- Never log passwords or password hashes
- Use `bcryptjs.compare()` for password verification

### Database Security
- Use parameterized queries (Mongoose handles this, but be careful with raw queries)
- Validate ObjectIds before database queries
- Implement proper error handling for database operations
- Never expose MongoDB connection strings or internal IDs

### API Endpoint Security
- Protected routes MUST use authentication middleware
- Validate user ownership before allowing modifications
- Check user permissions for admin operations
- Implement rate limiting on authentication endpoints
- Use Helmet.js (already configured in server.js)

## Error Handling Patterns

### Standard Error Response
```javascript
try {
  // operation
} catch (error) {
  console.error('Error context:', error);
  return res.status(500).json({
    success: false,
    message: 'User-friendly error message',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

### Validation Errors
```javascript
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array()
  });
}
```

## Common Backend Issues

### Missing Error Handling
- ❌ `await User.findById(id)` without try-catch
- ✅ Always wrap database operations in try-catch

### Missing Authentication
- ❌ `router.get('/profile', getProfile)`
- ✅ `router.get('/profile', authenticate, getProfile)`

### Missing Input Validation
- ❌ Directly using `req.body.email` without validation
- ✅ Use express-validator middleware

### Security Vulnerabilities
- ❌ Logging sensitive data: `console.log('Password:', password)`
- ❌ Exposing internal errors: `res.json({ error: error.stack })`
- ❌ Missing CORS configuration
- ❌ Hardcoded secrets in code

### Async/Await Issues
- ❌ Missing await: `User.findById(id)`
- ❌ Unhandled promise rejection
- ❌ Missing error handling in async functions

## Controller Patterns

### Standard Controller Structure
```javascript
exports.functionName = async (req, res) => {
  try {
    // 1. Validate input (if not done in route)
    // 2. Authenticate/authorize (if not done in middleware)
    // 3. Business logic
    // 4. Database operations
    // 5. Return success response
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in functionName:', error);
    res.status(500).json({
      success: false,
      message: 'Error message'
    });
  }
};
```

## Socket.io Security
- Validate socket event payloads
- Authenticate socket connections using JWT
- Check user permissions before emitting sensitive data
- Handle connection errors gracefully
- Clean up event listeners on disconnect

## Environment Variables
- Never commit `.env` files
- Use `dotenv` to load environment variables
- Provide default values where appropriate
- Validate required environment variables on startup

## Database Models
- Define proper schemas with validation
- Use indexes for frequently queried fields
- Implement proper relationships (references)
- Add timestamps (createdAt, updatedAt) where needed

## API Response Format
- Use consistent response format:
```javascript
{
  success: true/false,
  message: "Human-readable message",
  data: { ... } // on success
  error: { ... } // on error (dev only)
}
```

## Rate Limiting
- Implement rate limiting on:
  - Authentication endpoints (login, register)
  - Password reset endpoints
  - Phone verification endpoints
  - API endpoints that perform expensive operations

## Logging
- Use `morgan` for HTTP request logging (already configured)
- Log errors with context (user ID, endpoint, timestamp)
- Never log sensitive information (passwords, tokens, PII)
- Use appropriate log levels (error, warn, info)
