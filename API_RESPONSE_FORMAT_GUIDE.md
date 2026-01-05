/\*\*

- API Response Format Documentation
- Standard formats for all API responses
  \*/

## 📋 Standard Response Formats

### ✅ Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### ❌ Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "errors": [
    // Optional validation errors
    {
      "field": "email",
      "message": "Email is required",
      "value": null
    }
  ]
}
```

### 📄 Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔧 Usage Examples

### Authentication Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "jwt-token-here",
      "refreshToken": "refresh-token-here"
    }
  }
}
```

### Match List Response

```json
{
  "success": true,
  "message": "Matches retrieved successfully",
  "data": [
    {
      "_id": "match123",
      "otherUser": {
        "_id": "user456",
        "name": "Jane Doe",
        "photos": [...]
      },
      "lastMessage": {
        "content": "Hello!",
        "createdAt": "2026-01-05T10:00:00Z"
      },
      "unreadCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Swipe Response

```json
{
  "success": true,
  "message": "Swipe recorded successfully",
  "data": {
    "swipeId": "swipe123",
    "action": "like",
    "isMatch": true,
    "match": {
      "_id": "match456",
      "users": ["user123", "user789"]
    },
    "remaining": 45
  }
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": null
    }
  ]
}
```

### Rate Limit Error Response

```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 50,
    "remaining": 0,
    "resetTime": "2026-01-06T00:00:00Z"
  }
}
```

## 📱 Frontend Integration

### Update API Service

```javascript
// Before (inconsistent)
const response1 = await api.get('/matches'); // { data: [...] }
const response2 = await api.post('/swipe'); // { success: true, data: {...} }
const response3 = await api.get('/user'); // { _id: '...', name: '...' }

// After (standardized)
const response = await api.get('/matches');
// Always: { success: true, message: '...', data: [...], pagination?: {...} }

if (response.success) {
  console.log(response.data); // Actual data
  console.log(response.pagination); // Pagination info if applicable
} else {
  console.error(response.error); // Error code
  console.error(response.errors); // Validation errors if applicable
}
```

### Error Handling

```javascript
try {
  const response = await apiService.post('/api/auth/login', credentials);
  if (response.success) {
    setUser(response.data.user);
    setTokens(response.data.tokens);
  } else {
    setError(response.message);
  }
} catch (error) {
  // Network or other errors
  setError('Network error occurred');
}
```

## 🚀 Migration Steps

1. **✅ Created responseHelpers.js** - Standard response functions
2. **🔄 Update Controllers** - Use `sendSuccess()`, `sendError()`, etc.
3. **🔄 Update Frontend** - Expect standardized format
4. **✅ Update Types** - Use shared ApiResponse types

## 🎯 Benefits

- **Consistency**: All endpoints return same format
- **Type Safety**: Shared types prevent errors
- **Better UX**: Predictable error handling
- **Easier Debugging**: Standard error codes
- **Automatic Validation**: Built-in validation helpers
- **Pagination**: Consistent pagination format
