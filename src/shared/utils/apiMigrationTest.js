/**
 * API Migration Test Script
 * Tests the standardized API response format
 */

import api from '../services/api';

// Example usage of the new standardized format

// ✅ LOGIN EXAMPLE
async function testLogin() {
  try {
    const response = await api.post('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    // New standardized format:
    // {
    //   "success": true,
    //   "message": "Login successful",
    //   "data": {
    //     "user": { ... },
    //     "tokens": { "accessToken": "...", "refreshToken": "..." }
    //   }
    // }

    console.log('✅ Login success:', response.message);
    console.log('👤 User:', response.data.user.name);
    console.log('🔑 Token:', `${response.data.tokens.accessToken.substring(0, 20)}...`);
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    console.log('🔍 Error code:', error.code);
  }
}

// ✅ MATCHES EXAMPLE
async function testGetMatches() {
  try {
    const response = await api.get('/matches?page=1&limit=10');

    // New standardized format:
    // {
    //   "success": true,
    //   "message": "Matches retrieved successfully",
    //   "data": [...],
    //   "pagination": {
    //     "page": 1, "limit": 10, "total": 25, "pages": 3,
    //     "hasNext": true, "hasPrev": false
    //   }
    // }

    console.log('✅ Matches success:', response.message);
    console.log('📊 Found:', response.data.length, 'matches');
    console.log('📄 Pagination:', response.pagination);
  } catch (error) {
    console.log('❌ Matches failed:', error.message);
  }
}

// ✅ SWIPE EXAMPLE
async function testSwipe() {
  try {
    const response = await api.post('/swipe', {
      targetId: 'user123',
      action: 'like',
    });

    // New standardized format:
    // {
    //   "success": true,
    //   "message": "Swipe recorded successfully",
    //   "data": {
    //     "swipeId": "...",
    //     "action": "like",
    //     "isMatch": true,
    //     "match": { ... },
    //     "remaining": 45
    //   }
    // }

    console.log('✅ Swipe success:', response.message);
    console.log('💖 Is match:', response.data.isMatch);
    console.log('📊 Swipes remaining:', response.data.remaining);
  } catch (error) {
    console.log('❌ Swipe failed:', error.message);

    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.log('⏰ Rate limited - try again later');
    }
  }
}

// ✅ VALIDATION ERROR EXAMPLE
async function testValidationError() {
  try {
    const response = await api.post('/auth/register', {
      email: 'invalid-email', // Invalid email
      password: '123', // Too short password
      // name: missing required field
    });
  } catch (error) {
    console.log('❌ Validation failed:', error.message);
    console.log('🔍 Error code:', error.code); // "VALIDATION_ERROR"

    if (error.validationErrors) {
      console.log('📝 Validation details:');
      error.validationErrors.forEach((validationError) => {
        console.log(`  • ${validationError.field}: ${validationError.message}`);
      });
    }
  }
}

export { testGetMatches, testLogin, testSwipe, testValidationError };
