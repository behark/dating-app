import { SafetyService } from '../SafetyService';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('SafetyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks a user successfully', async () => {
    api.post.mockResolvedValue({ success: true, data: true });

    const result = await SafetyService.blockUser('user_2');

    expect(result).toBe(true);
    expect(api.post).toHaveBeenCalledWith('/safety/block', { blockedUserId: 'user_2' });
  });

  it('returns false when block fails', async () => {
    api.post.mockResolvedValue({ success: false, message: 'Failed' });

    const result = await SafetyService.blockUser('user_2');

    expect(result).toBe(false);
  });

  it('returns blocked users list', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { blockedUsers: ['user_2', 'user_3'] },
      blockedUsers: ['user_2', 'user_3'],
    });

    const result = await SafetyService.getBlockedUsers();

    expect(result).toEqual(['user_2', 'user_3']);
  });

  it('reports a user successfully', async () => {
    api.post.mockResolvedValue({ success: true, data: { reportId: 'report_1' } });

    const result = await SafetyService.reportUser(
      'reported_user',
      'harassment',
      'Sent inappropriate messages',
      []
    );

    expect(result.reportId).toBe('report_1');
  });

  it('returns report categories', async () => {
    const categories = await SafetyService.getReportCategories();

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c) => c.id === 'harassment')).toBe(true);
  });

  it('submits photo verification using advanced endpoint', async () => {
    api.post.mockResolvedValue({ success: true, data: { verificationId: 'verification_1' } });

    const result = await SafetyService.submitPhotoVerification('photo_uri', {
      method: 'advanced',
      passed: true,
      confidence: 0.9,
    });

    expect(result.success).toBe(true);
    expect(result.verificationId).toBe('verification_1');
  });

  it('returns photo verification status', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { verified: false, status: 'not_submitted' },
    });

    const result = await SafetyService.getPhotoVerificationStatus();

    expect(result.verified).toBe(false);
    expect(result.status).toBe('not_submitted');
  });

  it('validates date plan and emergency contact fields', () => {
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
