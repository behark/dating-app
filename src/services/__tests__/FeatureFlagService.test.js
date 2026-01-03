/**
 * Tests for Feature Flag Service
 */

import { FeatureFlagService } from '../FeatureFlagService';

describe('FeatureFlagService', () => {
  let service;

  beforeEach(() => {
    service = new FeatureFlagService();
    service.initializeFlags();
  });

  describe('Flag Registration', () => {
    it('should register a new feature flag', () => {
      service.registerFlag('test_feature', {
        enabled: true,
        description: 'Test feature',
        rolloutPercentage: 100,
        allowedGroups: ['all'],
      });

      const flags = service.getAllFlags();
      const testFlag = flags.find(f => f.name === 'test_feature');
      
      expect(testFlag).toBeDefined();
      expect(testFlag.enabled).toBe(true);
    });

    it('should initialize default flags', () => {
      const flags = service.getAllFlags();
      
      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(f => f.name.startsWith('beta_'))).toBe(true);
    });
  });

  describe('Flag Evaluation', () => {
    it('should return false for disabled flag', () => {
      service.registerFlag('disabled_feature', {
        enabled: false,
        rolloutPercentage: 100,
        allowedGroups: ['all'],
      });

      expect(service.isEnabled('disabled_feature', 'user_1')).toBe(false);
    });

    it('should return true for enabled flag with 100% rollout', () => {
      service.registerFlag('enabled_feature', {
        enabled: true,
        rolloutPercentage: 100,
        allowedGroups: ['all'],
      });

      expect(service.isEnabled('enabled_feature', 'user_1')).toBe(true);
    });

    it('should return false for non-existent flag', () => {
      expect(service.isEnabled('non_existent_flag', 'user_1')).toBe(false);
    });

    it('should respect user group restrictions', () => {
      service.registerFlag('premium_feature', {
        enabled: true,
        rolloutPercentage: 100,
        allowedGroups: ['premium'],
      });

      // User without premium group
      expect(service.isEnabled('premium_feature', 'user_1', ['free'])).toBe(false);
      
      // User with premium group
      expect(service.isEnabled('premium_feature', 'user_1', ['premium'])).toBe(true);
    });

    it('should allow all users when allowedGroups includes "all"', () => {
      service.registerFlag('public_feature', {
        enabled: true,
        rolloutPercentage: 100,
        allowedGroups: ['all'],
      });

      expect(service.isEnabled('public_feature', 'user_1', ['any_group'])).toBe(true);
    });
  });

  describe('Rollout Percentage', () => {
    it('should consistently return same result for same user', () => {
      service.registerFlag('partial_rollout', {
        enabled: true,
        rolloutPercentage: 50,
        allowedGroups: ['all'],
      });

      const result1 = service.isEnabled('partial_rollout', 'consistent_user');
      const result2 = service.isEnabled('partial_rollout', 'consistent_user');
      const result3 = service.isEnabled('partial_rollout', 'consistent_user');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should enable flag for users within rollout percentage', () => {
      service.registerFlag('rollout_test', {
        enabled: true,
        rolloutPercentage: 50,
        allowedGroups: ['all'],
      });

      // Test with many users to verify distribution
      let enabledCount = 0;
      for (let i = 0; i < 100; i++) {
        if (service.isEnabled('rollout_test', `user_${i}`)) {
          enabledCount++;
        }
      }

      // Should be roughly around 50% (with some variance)
      expect(enabledCount).toBeGreaterThan(30);
      expect(enabledCount).toBeLessThan(70);
    });

    it('should return true for 100% rollout', () => {
      service.registerFlag('full_rollout', {
        enabled: true,
        rolloutPercentage: 100,
        allowedGroups: ['all'],
      });

      // All users should get the feature
      for (let i = 0; i < 10; i++) {
        expect(service.isEnabled('full_rollout', `user_${i}`)).toBe(true);
      }
    });

    it('should return false for 0% rollout', () => {
      service.registerFlag('no_rollout', {
        enabled: true,
        rolloutPercentage: 0,
        allowedGroups: ['all'],
      });

      // No users should get the feature
      for (let i = 0; i < 10; i++) {
        expect(service.isEnabled('no_rollout', `user_${i}`)).toBe(false);
      }
    });
  });

  describe('User Overrides', () => {
    it('should override flag for specific user', () => {
      service.registerFlag('overridable_feature', {
        enabled: false,
        rolloutPercentage: 0,
        allowedGroups: ['all'],
      });

      // Initially disabled
      expect(service.isEnabled('overridable_feature', 'special_user')).toBe(false);

      // Override for specific user
      service.setUserOverride('special_user', 'overridable_feature', true);

      // Now enabled for this user
      expect(service.isEnabled('overridable_feature', 'special_user')).toBe(true);

      // Other users still disabled
      expect(service.isEnabled('overridable_feature', 'other_user')).toBe(false);
    });
  });

  describe('Get User Flags', () => {
    it('should return all flags status for user', () => {
      service.registerFlag('flag_1', { enabled: true, rolloutPercentage: 100, allowedGroups: ['all'] });
      service.registerFlag('flag_2', { enabled: false, rolloutPercentage: 0, allowedGroups: ['all'] });

      const userFlags = service.getUserFlags('user_123', ['all']);

      expect(userFlags.flag_1.enabled).toBe(true);
      expect(userFlags.flag_2.enabled).toBe(false);
    });
  });

  describe('Rollout Updates', () => {
    it('should update rollout percentage', () => {
      service.registerFlag('updateable', {
        enabled: true,
        rolloutPercentage: 10,
        allowedGroups: ['all'],
      });

      service.updateRollout('updateable', 50);

      const flags = service.getAllFlags();
      const flag = flags.find(f => f.name === 'updateable');
      expect(flag.rolloutPercentage).toBe(50);
    });

    it('should cap rollout at 100', () => {
      service.registerFlag('cap_test', { enabled: true, rolloutPercentage: 50, allowedGroups: ['all'] });
      
      service.updateRollout('cap_test', 150);

      const flags = service.getAllFlags();
      const flag = flags.find(f => f.name === 'cap_test');
      expect(flag.rolloutPercentage).toBe(100);
    });

    it('should floor rollout at 0', () => {
      service.registerFlag('floor_test', { enabled: true, rolloutPercentage: 50, allowedGroups: ['all'] });
      
      service.updateRollout('floor_test', -10);

      const flags = service.getAllFlags();
      const flag = flags.find(f => f.name === 'floor_test');
      expect(flag.rolloutPercentage).toBe(0);
    });
  });

  describe('Hash Function', () => {
    it('should produce consistent hashes for same input', () => {
      const hash1 = service.hashUserId('test_user');
      const hash2 = service.hashUserId('test_user');
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.hashUserId('user_1');
      const hash2 = service.hashUserId('user_2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
