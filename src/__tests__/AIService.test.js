// Mock Firebase before imports
jest.mock('../config/firebase', () => ({
  app: {},
  db: {},
  storage: {},
  auth: {
    currentUser: null,
  },
}));

// Mock SafetyService Firebase dependency
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  initializeAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));

import { AIService } from '../services/AIService';
import { SafetyService } from '../services/SafetyService';

describe('AIService', () => {
  let aiService;
  const userId = 'user_123';
  const targetUserId = 'user_456';

  beforeEach(() => {
    aiService = new AIService('mock_token');
  });

  describe('getSmartPhotoSelection', () => {
    test('should return photo recommendations', async () => {
      // Mock the fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                recommendations: [
                  {
                    photoIndex: 0,
                    photoUrl: 'https://example.com/photo1.jpg',
                    score: 95,
                    priority: 'high',
                    reasons: ['Clear face visible', 'Good lighting'],
                  },
                ],
                analysis: {
                  totalPhotos: 5,
                  averageScore: 85,
                },
              },
            }),
        })
      );

      const result = await aiService.getSmartPhotoSelection(userId);
      expect(result.recommendations).toBeDefined();
      expect(result.analysis.totalPhotos).toBe(5);
    });

    test('should handle errors gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      await expect(aiService.getSmartPhotoSelection(userId)).rejects.toThrow();
    });
  });

  describe('getBioSuggestions', () => {
    test('should return bio suggestions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                suggestions: [
                  {
                    bio: 'Adventure seeker | Love exploring new places',
                    tone: 'casual',
                    reason: 'Based on your travel interests',
                  },
                ],
                explanations: {
                  toneAdvice: 'Keep it genuine',
                  lengthTip: 'Aim for 50-150 characters',
                },
              },
            }),
        })
      );

      const result = await aiService.getBioSuggestions(userId, ['travel'], 'Current bio');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getCompatibilityScore', () => {
    test('should calculate compatibility score', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                score: 75,
                breakdown: {
                  interestMatch: 80,
                  valueMatch: 70,
                  ageCompatibility: 85,
                },
                explanation: 'Great match!',
              },
            }),
        })
      );

      const result = await aiService.getCompatibilityScore(userId, targetUserId);
      expect(result.score).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
    });
  });

  describe('getConversationStarters', () => {
    test('should return conversation starters', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                starters: [
                  "Hey! I noticed you love travel. What's your dream destination?",
                  'Your bio caught my attention!',
                ],
                reasoning: {
                  interestBased: 'Based on travel',
                  personalizationLevel: 'high',
                },
              },
            }),
        })
      );

      const result = await aiService.getConversationStarters(userId, targetUserId, {
        interests: ['travel'],
        bio: 'Love traveling',
      });
      expect(result.starters).toBeDefined();
      expect(result.starters.length).toBeGreaterThan(0);
    });
  });

  describe('getPersonalizedMatches', () => {
    test('should return personalized matches', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                matches: [
                  {
                    userId: 'match_1',
                    name: 'Sarah',
                    compatibilityScore: 85,
                  },
                ],
                reasoning: {
                  algorithm: 'Interest-based matching',
                },
              },
            }),
        })
      );

      const result = await aiService.getPersonalizedMatches(userId);
      expect(result.matches).toBeDefined();
      expect(Array.isArray(result.matches)).toBe(true);
    });
  });

  describe('getProfileImprovementSuggestions', () => {
    test('should return profile improvement suggestions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                suggestions: [
                  {
                    area: 'Photos',
                    priority: 'high',
                    suggestion: 'Add more photos',
                  },
                ],
                priority: ['Add more photos'],
                impact: {
                  completenessScore: 65,
                  potentialImprovementScore: 85,
                },
              },
            }),
        })
      );

      const result = await aiService.getProfileImprovementSuggestions(userId);
      expect(result.suggestions).toBeDefined();
      expect(result.impact).toBeDefined();
    });
  });

  describe('getConversationInsights', () => {
    test('should return conversation insights', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                insights: [
                  {
                    title: "You're great at opening lines",
                    description: '45% response rate',
                    impact: 'positive',
                  },
                ],
                tips: ['Ask open-ended questions'],
                patterns: {
                  averageMessageLength: '45 characters',
                },
              },
            }),
        })
      );

      const result = await aiService.getConversationInsights(userId);
      expect(result.insights).toBeDefined();
      expect(result.tips).toBeDefined();
      expect(result.patterns).toBeDefined();
    });
  });
});

describe('SafetyService - Advanced Features', () => {
  const userId = 'user_123';
  const friendIds = ['friend_1', 'friend_2'];
  const TEST_LOCATION = 'Coffee Shop';

  describe('shareDatePlan', () => {
    test('should share date plan successfully', async () => {
      const datePlanData = {
        matchUserId: 'match_123',
        matchName: 'John',
        matchPhotoUrl: 'https://example.com/photo.jpg',
        location: TEST_LOCATION,
        address: '123 Main St',
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        notes: 'First date',
      };

      const result = await SafetyService.shareDatePlan(userId, datePlanData, friendIds);
      expect(result.success).toBe(true);
      expect(result.datePlanId).toBeDefined();
    });

    test('should validate date is in future', async () => {
      const datePlanData = {
        matchUserId: 'match_123',
        matchName: 'John',
        location: TEST_LOCATION,
        dateTime: new Date(Date.now() - 60 * 60 * 1000), // Past date
      };

      await expect(SafetyService.shareDatePlan(userId, datePlanData, friendIds)).rejects.toThrow();
    });
  });

  describe('startCheckInTimer', () => {
    test('should start check-in timer', async () => {
      const result = await SafetyService.startCheckInTimer(userId, 'dateplan_123', 300000);
      expect(result.success).toBe(true);
      expect(result.checkInId).toBeDefined();
    });
  });

  describe('completeCheckIn', () => {
    test('should complete check-in', async () => {
      const result = await SafetyService.completeCheckIn('checkin_123');
      expect(result.success).toBe(true);
    });
  });

  describe('sendEmergencySOS', () => {
    test('should send SOS alert', async () => {
      const location = {
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Main St',
      };

      const result = await SafetyService.sendEmergencySOS(userId, location, 'Emergency!');
      expect(result.success).toBe(true);
      expect(result.sosAlertId).toBeDefined();
    });

    test('should require location', async () => {
      await expect(SafetyService.sendEmergencySOS(userId, {}, 'Emergency!')).rejects.toThrow();
    });
  });

  describe('respondToSOS', () => {
    test('should respond to SOS alert', async () => {
      const result = await SafetyService.respondToSOS('sos_123', 'responder_id', {
        message: "I'm coming",
        confirmedSafe: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('resolveSOS', () => {
    test('should resolve SOS alert', async () => {
      const result = await SafetyService.resolveSOS('sos_123', 'resolved');
      expect(result.success).toBe(true);
    });
  });

  describe('initiateBackgroundCheck', () => {
    test('should initiate background check', async () => {
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        email: 'john@example.com',
      };

      const result = await SafetyService.initiateBackgroundCheck(userId, userInfo);
      expect(result.success).toBe(true);
      expect(result.backgroundCheckId).toBeDefined();
    });
  });

  describe('getBackgroundCheckStatus', () => {
    test('should get background check status', async () => {
      const result = await SafetyService.getBackgroundCheckStatus(userId);
      expect(result.completed).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });

  describe('addEmergencyContact', () => {
    test('should add emergency contact', async () => {
      const contact = {
        name: 'Mom',
        phone: '555-1234',
        relationship: 'Mother',
      };

      const result = await SafetyService.addEmergencyContact(userId, contact);
      expect(result.success).toBe(true);
      expect(result.contact).toBeDefined();
      expect(result.contact.name).toBe('Mom');
    });

    test('should validate contact information', () => {
      const invalidContact = {
        name: '',
        phone: '123',
        relationship: '',
      };

      const validation = SafetyService.validateEmergencyContact(invalidContact);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getEmergencyContacts', () => {
    test('should get emergency contacts', async () => {
      const result = await SafetyService.getEmergencyContacts(userId);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('submitAdvancedPhotoVerification', () => {
    test('should submit advanced photo verification', async () => {
      const result = await SafetyService.submitAdvancedPhotoVerification(userId, 'photo_uri', {
        method: 'advanced',
        faceDetected: true,
        livenessPassed: true,
        confidence: 0.95,
      });
      expect(result.success).toBe(true);
      expect(result.verificationId).toBeDefined();
    });
  });

  describe('getPhotoVerificationStatus', () => {
    test('should get photo verification status', async () => {
      const result = await SafetyService.getPhotoVerificationStatus(userId);
      expect(result.verified).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });

  describe('Validation', () => {
    test('should validate date plan', () => {
      const validPlan = {
        location: TEST_LOCATION,
        dateTime: new Date(Date.now() + 60 * 60 * 1000),
      };

      const validation = SafetyService.validateDatePlan(validPlan);
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should validate emergency contact', () => {
      const validContact = {
        name: 'Mom',
        phone: '5551234567',
        relationship: 'Mother',
      };

      const validation = SafetyService.validateEmergencyContact(validContact);
      expect(validation.isValid).toBe(true);
    });
  });
});
