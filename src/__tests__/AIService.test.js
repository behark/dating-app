jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../services/api';
import { AIService } from '../services/AIService';
import { SafetyService } from '../services/SafetyService';

describe('AIService', () => {
  const userId = '507f1f77bcf86cd799439011';
  const targetUserId = '507f1f77bcf86cd799439012';
  let aiService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService('mock_token');
  });

  test('getSmartPhotoSelection returns recommendations', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { recommendations: [{ photoIndex: 0 }], analysis: { totalPhotos: 5 } },
    });

    const result = await aiService.getSmartPhotoSelection(userId);

    expect(api.get).toHaveBeenCalledWith(`/ai/smart-photos/${userId}`);
    expect(result.analysis.totalPhotos).toBe(5);
  });

  test('getSmartPhotoSelection rejects invalid user IDs', async () => {
    await expect(aiService.getSmartPhotoSelection('x')).rejects.toThrow();
  });

  test('getBioSuggestions returns generated suggestions', async () => {
    api.post.mockResolvedValue({
      success: true,
      data: { suggestions: [{ bio: 'Test bio' }], explanations: { toneAdvice: 'Keep it real' } },
    });

    const result = await aiService.getBioSuggestions(userId, ['travel'], 'Current bio');

    expect(api.post).toHaveBeenCalledWith('/ai/bio-suggestions', {
      userId,
      interests: ['travel'],
      currentBio: 'Current bio',
    });
    expect(result.suggestions).toHaveLength(1);
  });

  test('getCompatibilityScore returns match scoring', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { score: 82, breakdown: { interestMatch: 80 }, explanation: 'Great match' },
    });

    const result = await aiService.getCompatibilityScore(userId, targetUserId);

    expect(api.get).toHaveBeenCalledWith(`/ai/compatibility/${userId}/${targetUserId}`);
    expect(result.score).toBe(82);
  });

  test('getConversationStarters returns starters', async () => {
    api.post.mockResolvedValue({
      success: true,
      data: { starters: ['Hello there!'], reasoning: { personalizationLevel: 'high' } },
    });

    const result = await aiService.getConversationStarters(userId, targetUserId, {
      interests: ['travel'],
      bio: 'Love adventures',
    });

    expect(api.post).toHaveBeenCalledWith('/ai/conversation-starters', {
      userId,
      targetUserId,
      targetProfile: expect.objectContaining({
        interests: ['travel'],
        bio: 'Love adventures',
      }),
    });
    expect(result.starters).toEqual(['Hello there!']);
  });

  test('getPersonalizedMatches returns matches list', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { matches: [{ userId: 'm1' }], reasoning: { algorithm: 'interest' } },
    });

    const result = await aiService.getPersonalizedMatches(userId, {
      limit: 20,
      location: true,
      interests: true,
      values: false,
    });

    expect(api.get).toHaveBeenCalledWith(
      `/ai/personalized-matches/${userId}?limit=20&useLocation=true&useInterests=true&useValues=false`
    );
    expect(Array.isArray(result.matches)).toBe(true);
  });

  test('getProfileImprovementSuggestions returns suggestions', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { suggestions: [{ area: 'Photos' }], impact: { completenessScore: 80 } },
    });

    const result = await aiService.getProfileImprovementSuggestions(userId);

    expect(api.get).toHaveBeenCalledWith(`/ai/profile-suggestions/${userId}`);
    expect(result.impact.completenessScore).toBe(80);
  });

  test('getConversationInsights returns insights and tips', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { insights: [{ title: 'Great opener' }], tips: ['Ask questions'], patterns: {} },
    });

    const result = await aiService.getConversationInsights(userId);

    expect(api.get).toHaveBeenCalledWith(`/ai/conversation-insights/${userId}`);
    expect(result.insights).toHaveLength(1);
  });
});

describe('SafetyService Advanced Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shareDatePlan shares and returns datePlanId', async () => {
    api.post.mockResolvedValue({ success: true, data: { datePlanId: 'dp_1' } });

    const result = await SafetyService.shareDatePlan(
      {
        matchUserId: '507f1f77bcf86cd799439099',
        matchName: 'John',
        location: 'Coffee Shop',
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      ['friend_1', 'friend_2']
    );

    expect(result).toEqual({ success: true, datePlanId: 'dp_1' });
  });

  test('startCheckInTimer returns checkInId', async () => {
    api.post.mockResolvedValue({ success: true, data: { checkInId: 'ci_1' } });

    const result = await SafetyService.startCheckInTimer('dateplan_123', 300);

    expect(api.post).toHaveBeenCalledWith('/safety/checkin/start', {
      datePlanId: 'dateplan_123',
      duration: 300,
    });
    expect(result).toEqual({ success: true, checkInId: 'ci_1' });
  });

  test('completeCheckIn returns success', async () => {
    api.post.mockResolvedValue({ success: true, data: {} });

    const result = await SafetyService.completeCheckIn('checkin_123');

    expect(result).toEqual({ success: true });
  });

  test('sendEmergencySOS returns sosAlertId', async () => {
    api.post.mockResolvedValue({ success: true, data: { sosAlertId: 'sos_1' } });

    const result = await SafetyService.sendEmergencySOS(
      { latitude: 37.7749, longitude: -122.4194, address: '123 Main St' },
      'Emergency!'
    );

    expect(result).toEqual({ success: true, sosAlertId: 'sos_1' });
  });

  test('respondToSOS returns success', async () => {
    api.post.mockResolvedValue({ success: true, data: {} });

    const result = await SafetyService.respondToSOS('sos_123', {
      message: "I'm coming",
      confirmedSafe: true,
    });

    expect(result).toEqual({ success: true });
  });

  test('resolveSOS returns success', async () => {
    api.put.mockResolvedValue({ success: true, data: {} });

    const result = await SafetyService.resolveSOS('sos_123', 'resolved');

    expect(result).toEqual({ success: true });
  });

  test('initiateBackgroundCheck returns backgroundCheckId', async () => {
    api.post.mockResolvedValue({ success: true, data: { backgroundCheckId: 'bg_1' } });

    const result = await SafetyService.initiateBackgroundCheck({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      email: 'john@example.com',
    });

    expect(result).toEqual({ success: true, backgroundCheckId: 'bg_1' });
  });

  test('getBackgroundCheckStatus maps completion fields', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { status: 'completed', results: { clear: true }, checks: { criminal: 'clear' } },
    });

    const result = await SafetyService.getBackgroundCheckStatus('bg_1');

    expect(result.completed).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.results.clear).toBe(true);
  });

  test('addEmergencyContact returns created contact', async () => {
    api.post.mockResolvedValue({ success: true, data: { id: 'c1', name: 'Mom' } });

    const result = await SafetyService.addEmergencyContact({
      name: 'Mom',
      phone: '5551234567',
      relationship: 'Mother',
    });

    expect(result.success).toBe(true);
    expect(result.contact.name).toBe('Mom');
  });

  test('submitAdvancedPhotoVerification returns verification id', async () => {
    api.post.mockResolvedValue({ success: true, data: { verificationId: 'v1' } });

    const result = await SafetyService.submitAdvancedPhotoVerification('photo_uri', {
      method: 'advanced',
      faceDetected: true,
      livenessPassed: true,
      confidence: 0.95,
    });

    expect(result).toEqual({ success: true, verificationId: 'v1' });
  });

  test('validation helpers return expected results', () => {
    const validPlan = {
      location: 'Coffee Shop',
      dateTime: new Date(Date.now() + 60 * 60 * 1000),
    };
    const invalidPlan = {
      location: '',
      dateTime: new Date(Date.now() - 60 * 60 * 1000),
    };

    expect(SafetyService.validateDatePlan(validPlan).isValid).toBe(true);
    expect(SafetyService.validateDatePlan(invalidPlan).isValid).toBe(false);

    expect(
      SafetyService.validateEmergencyContact({
        name: 'Mom',
        phone: '5551234567',
        relationship: 'Mother',
      }).isValid
    ).toBe(true);

    expect(
      SafetyService.validateEmergencyContact({
        name: '',
        phone: '123',
        relationship: '',
      }).isValid
    ).toBe(false);
  });
});
