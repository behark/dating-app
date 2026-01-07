/**
 * DiscoveryService (TypeScript) - User discovery and exploration functionality
 *
 * Provides methods for:
 * - Exploring users based on location and filters
 * - Getting top picks and recently active users
 * - Fetching verified profiles
 * - Calculating distance between users
 */

import { ERROR_MESSAGES } from '../constants/constants';
import { handleApiResponse } from '../utils/apiResponseHandler';
import logger from '../utils/logger';
import { validateCoordinates, validateNumberRange, validateUserId } from '../utils/validators';
import api from './api';
import type { IUserProfile } from '../../shared/types/user';

/**
 * Explore users options
 */
export interface ExploreUsersOptions {
  radius?: number;
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female' | 'any';
  sortBy?: string;
  limit?: number;
  skip?: number;
  guest?: boolean;
}

/**
 * Verified profiles options
 */
export interface VerifiedProfilesOptions {
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female' | 'any';
  radius?: number;
  limit?: number;
  skip?: number;
}

/**
 * Verification method
 */
export type VerificationMethod = 'photo' | 'document' | 'video';

/**
 * Top picks response
 */
export interface TopPicksResponse {
  topPicks: IUserProfile[];
  [key: string]: unknown;
}

/**
 * Users response
 */
export interface UsersResponse {
  users: IUserProfile[];
  [key: string]: unknown;
}

class DiscoveryService {
  /**
   * Explore users with filters and location-based search
   */
  async exploreUsers(lat: number, lng: number, options: ExploreUsersOptions = {}): Promise<IUserProfile[]> {
    try {
      // Validate inputs
      if (!validateCoordinates(lat, lng)) {
        throw new Error('Invalid coordinates provided');
      }

      const {
        radius = 50000,
        minAge = 18,
        maxAge = 100,
        gender = 'any',
        sortBy = 'recentActivity',
        limit = 20,
        skip = 0,
        guest = false,
      } = options;

      // Validate options
      if (!validateNumberRange(radius, 1000, 100000)) {
        throw new Error('Radius must be between 1km and 100km');
      }
      if (!validateNumberRange(minAge, 18, 100) || !validateNumberRange(maxAge, 18, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_AGE_RANGE);
      }
      if (!validateNumberRange(limit, 1, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_LIMIT_RANGE);
      }

      const queryParams = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
        minAge: minAge.toString(),
        maxAge: maxAge.toString(),
        gender,
        sortBy,
        limit: limit.toString(),
        skip: skip.toString(),
      });

      // Add guest parameter if guest mode is enabled
      if (guest) {
        queryParams.append('guest', 'true');
      } else {
      }

      // For guest requests, bypass authentication retry logic
      const response = await api.get<IUserProfile[]>(`/discovery/explore?${queryParams}`, {
        retry: !guest, // Don't retry on 401 for guest requests
      });
      const handled = handleApiResponse(response, 'Explore users') as { data?: IUserProfile[] };
      return handled.data || [];
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error exploring users:', error);
      throw error;
    }
  }

  /**
   * Get top picks - highly compatible users based on algorithm
   */
  async getTopPicks(limit: number = 10): Promise<TopPicksResponse> {
    try {
      // Validate input
      if (!validateNumberRange(limit, 1, 50)) {
        throw new Error('Limit must be between 1 and 50');
      }

      const queryParams = new URLSearchParams({ limit: limit.toString() });

      const response = await api.get<TopPicksResponse>(`/discovery/top-picks?${queryParams}`);
      const handled = handleApiResponse(response, 'Get top picks') as { data?: TopPicksResponse };
      return handled.data || { topPicks: [] };
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error getting top picks:', error);
      throw error;
    }
  }

  /**
   * Get recently active users
   */
  async getRecentlyActiveUsers(hoursBack: number = 24, limit: number = 20): Promise<UsersResponse> {
    try {
      // Validate inputs
      if (!validateNumberRange(hoursBack, 1, 168)) {
        throw new Error('Hours back must be between 1 and 168 (1 week)');
      }
      if (!validateNumberRange(limit, 1, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_LIMIT_RANGE);
      }

      const queryParams = new URLSearchParams({
        hoursBack: hoursBack.toString(),
        limit: limit.toString(),
      });

      const response = await api.get<UsersResponse>(`/discovery/recently-active?${queryParams}`);
      const handled = handleApiResponse(response, 'Get recently active users') as { data?: UsersResponse };
      return handled.data || { users: [] };
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error getting recently active users:', error);
      throw error;
    }
  }

  /**
   * Get verified profiles
   */
  async getVerifiedProfiles(lat: number, lng: number, options: VerifiedProfilesOptions = {}): Promise<UsersResponse> {
    try {
      // Validate coordinates
      if (!validateCoordinates(lat, lng)) {
        throw new Error('Invalid coordinates provided');
      }

      const {
        minAge = 18,
        maxAge = 100,
        gender = 'any',
        radius = 50000,
        limit = 20,
        skip = 0,
      } = options;

      // Validate options
      if (!validateNumberRange(radius, 1000, 100000)) {
        throw new Error('Radius must be between 1km and 100km');
      }
      if (!validateNumberRange(minAge, 18, 100) || !validateNumberRange(maxAge, 18, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_AGE_RANGE);
      }
      if (!validateNumberRange(limit, 1, 100)) {
        throw new Error(ERROR_MESSAGES.INVALID_LIMIT_RANGE);
      }

      const queryParams = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        minAge: minAge.toString(),
        maxAge: maxAge.toString(),
        gender,
        radius: radius.toString(),
        limit: limit.toString(),
        skip: skip.toString(),
      });

      const response = await api.get<UsersResponse>(`/discovery/verified?${queryParams}`);
      const handled = handleApiResponse(response, 'Get verified profiles') as { data?: UsersResponse };
      return handled.data || { users: [] };
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error getting verified profiles:', error);
      throw error;
    }
  }

  /**
   * Initiate profile verification
   */
  async verifyProfile(verificationMethod: VerificationMethod = 'photo'): Promise<Record<string, unknown>> {
    try {
      if (!['photo', 'document', 'video'].includes(verificationMethod)) {
        throw new Error('Invalid verification method. Must be photo, document, or video');
      }

      const response = await api.post('/discovery/verify-profile', { verificationMethod });
      const handled = handleApiResponse(response, 'Verify profile') as { data?: Record<string, unknown> };
      return handled.data || {};
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error verifying profile:', error);
      throw error;
    }
  }

  /**
   * Admin: Approve profile verification
   */
  async approveProfileVerification(userId: string): Promise<Record<string, unknown>> {
    try {
      if (!validateUserId(userId)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
      }

      const response = await api.post('/discovery/approve-verification', { userId });
      const handled = handleApiResponse(response, 'Approve verification') as { data?: Record<string, unknown> };
      return handled.data || {};
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error approving verification:', error);
      throw error;
    }
  }
}

export default DiscoveryService;
