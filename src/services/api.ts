/**
 * API Service (TypeScript)
 * Centralized API client with authentication, token refresh, and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { getTokenSecurely, storeTokenSecurely, removeTokenSecurely } from '../utils/secureStorage';
import { getUserFriendlyMessage, STANDARD_ERROR_MESSAGES } from '../utils/errorMessages';
import rateLimiter from '../utils/rateLimiter';
import requestDeduplicator from '../utils/requestDeduplication';
import { retryWithBackoff } from '../utils/retryUtils';
import logger from '../utils/logger';
import type { ApiResponse, SuccessResponse, ErrorResponse } from '../../shared/types/api';

// Token storage keys
const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * API request options
 */
export interface ApiRequestOptions {
  bypassDeduplication?: boolean;
  bypassRateLimit?: boolean;
  maxRequests?: number;
  rateLimitWindow?: number;
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
  headers?: Record<string, string>;
  context?: string;
}

/**
 * Normalized API response
 */
export interface NormalizedApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

/**
 * Extended error with additional properties
 */
export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  retryAfter?: number;
  validationErrors?: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

/**
 * Refresh queue item
 */
interface RefreshQueueItem {
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
}

/**
 * API Service Class
 */
class ApiService {
  // Auth token (cached in memory for performance)
  private _authToken: string | null = null;
  // Refresh token (cached in memory)
  private _refreshToken: string | null = null;
  // Flag to prevent multiple simultaneous refresh attempts
  private _isRefreshing: boolean = false;
  // Queue of requests waiting for token refresh
  private _refreshQueue: RefreshQueueItem[] = [];

  /**
   * Set the auth token for API requests
   */
  setAuthToken(token: string | null): void {
    this._authToken = token;
    // Persist for future sessions
    if (token) {
      storeTokenSecurely(AUTH_TOKEN_KEY, token).catch((error) => {
        logger.error('Error persisting auth token', error as any);
      });
    }
  }

  /**
   * Set the refresh token
   */
  setRefreshToken(token: string | null): void {
    this._refreshToken = token;
    if (token) {
      storeTokenSecurely(REFRESH_TOKEN_KEY, token).catch((error) => {
        logger.error('Error persisting refresh token', error as any);
      });
    }
  }

  /**
   * Get the auth token (from memory or storage)
   */
  async getAuthToken(): Promise<string | null> {
    if (this._authToken) {
      return this._authToken;
    }
    try {
      const token = await getTokenSecurely(AUTH_TOKEN_KEY);
      if (token) {
        this._authToken = token;
      }
      return token;
    } catch (error) {
      logger.error('Error getting auth token', error as any);
      return null;
    }
  }

  /**
   * Get the refresh token (from memory or storage)
   */
  async getRefreshToken(): Promise<string | null> {
    if (this._refreshToken) {
      return this._refreshToken;
    }
    try {
      const token = await getTokenSecurely(REFRESH_TOKEN_KEY);
      if (token) {
        this._refreshToken = token;
      }
      return token;
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error getting refresh token', error);
      return null;
    }
  }

  /**
   * Clear all auth tokens (on logout)
   */
  clearAuthToken(): void {
    this._authToken = null;
    this._refreshToken = null;
    removeTokenSecurely(AUTH_TOKEN_KEY).catch((error) =>
      logger.error('Error clearing auth token', error)
    );
    removeTokenSecurely(REFRESH_TOKEN_KEY).catch((error) =>
      logger.error('Error clearing refresh token', error)
    );
  }

  /**
   * Attempt to refresh the auth token using the refresh token
   */
  async refreshAuthToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this._isRefreshing) {
      logger.debug('Token refresh already in progress, queuing request...');
      // Wait for the ongoing refresh to complete
      return new Promise<string | null>((resolve, reject) => {
        this._refreshQueue.push({ resolve, reject });
      });
    }

    this._isRefreshing = true;
    logger.debug('Starting token refresh process...');

    try {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        logger.debug('No refresh token available for token refresh');
        return null;
      }

      // Validate API_URL is not localhost in production
      if (!API_URL || API_URL.includes('localhost')) {
        logger.error('Invalid API_URL for token refresh:', API_URL);
        throw new Error(`Invalid API_URL: ${API_URL}. Backend URL not configured correctly.`);
      }

      // API_URL should already end with /api, use it directly
      const refreshUrl = `${API_URL}/auth/refresh-token`;

      logger.debug('Attempting to refresh auth token...', {
        apiUrl: API_URL,
        refreshUrl,
        hasRefreshToken: !!refreshToken,
      });

      let response: Response;
      try {
        response = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (fetchError) {
        const error = fetchError as Error;
        logger.error('Network error refreshing token', error as any, {
          apiUrl: API_URL,
          refreshUrl,
        });
        // Re-throw to be handled by outer catch
        throw new Error(`Failed to connect to backend: ${error.message}. Check API_URL: ${API_URL}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.debug('Token refresh failed:', (errorData as { message?: string }).message || response.status);
        return null;
      }

      const data = (await response.json()) as {
        data?: {
          tokens?: { accessToken?: string; refreshToken?: string };
          authToken?: string;
          refreshToken?: string;
        };
        authToken?: string;
        refreshToken?: string;
      };

      // Handle standardized response format: { success: true, data: { tokens: {...} } }
      const newAuthToken =
        data.data?.tokens?.accessToken || data.data?.authToken || data.authToken;
      const newRefreshToken =
        data.data?.tokens?.refreshToken || data.data?.refreshToken || data.refreshToken;

      if (newAuthToken) {
        // Update tokens in memory and storage
        this._authToken = newAuthToken;
        await storeTokenSecurely(AUTH_TOKEN_KEY, newAuthToken);

        if (newRefreshToken) {
          this._refreshToken = newRefreshToken;
          await storeTokenSecurely(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        logger.debug('Auth token refreshed successfully');

        // Resolve all queued requests with the new token
        this._refreshQueue.forEach(({ resolve }) => resolve(newAuthToken));
        this._refreshQueue = [];

        return newAuthToken;
      }

      return null;
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error refreshing auth token', error);
      // Reject all queued requests
      const err = error instanceof Error ? error : new Error(String(error));
      this._refreshQueue.forEach(({ reject }) => reject(err));
      this._refreshQueue = [];
      return null;
    } finally {
      this._isRefreshing = false;
    }
  }

  /**
   * Normalize API response to consistent format
   * Handles both { success, data } and flat object responses
   */
  normalizeResponse<T = unknown>(response: unknown): NormalizedApiResponse<T> {
    // Already in standard format
    if (response && typeof response === 'object' && 'success' in response) {
      const apiResponse = response as ApiResponse<T>;
      return {
        success: apiResponse.success,
        data: (apiResponse.data !== undefined ? apiResponse.data : response) as T,
        message: apiResponse.message,
        pagination: apiResponse.pagination,
        error: apiResponse.error,
        errors: apiResponse.errors,
      };
    }

    // Flat object - wrap in standard format
    return {
      success: true,
      data: response as T,
      message: (response as { message?: string })?.message,
    };
  }

  /**
   * Make an API request with authentication and automatic token refresh
   */
  async request<T = unknown>(
    method: string,
    endpoint: string,
    data: unknown = null,
    options: ApiRequestOptions = {},
    _isRetry: boolean = false,
    _isDeduplicated: boolean = false
  ): Promise<NormalizedApiResponse<T>> {
    // Request deduplication (unless explicitly bypassed or already deduplicated)
    if (!options.bypassDeduplication && !_isDeduplicated && !_isRetry) {
      return requestDeduplicator.deduplicate(
        method,
        endpoint,
        () => this.request<T>(method, endpoint, data, options, false, true),
        data as object | undefined
      ) as Promise<NormalizedApiResponse<T>>;
    }

    // Client-side rate limiting (unless explicitly bypassed)
    if (!options.bypassRateLimit && !_isRetry) {
      const rateLimitKey = `${method}:${endpoint}`;
      const maxRequests = options.maxRequests || 10; // Default: 10 requests
      const windowMs = options.rateLimitWindow || 1000; // Default: 1 second window

      if (!rateLimiter.canMakeRequest(rateLimitKey, maxRequests, windowMs)) {
        const timeRemaining = rateLimiter.getTimeUntilNextRequest(rateLimitKey, windowMs);
        const error = new Error(STANDARD_ERROR_MESSAGES.RATE_LIMIT) as ApiError;
        error.code = 'RATE_LIMIT';
        error.retryAfter = Math.ceil(timeRemaining / 1000);
        throw error;
      }
    }

    // Wrap request in retry logic (unless explicitly disabled)
    if (options.retry !== false && !_isRetry) {
      const retryOptions = {
        maxRetries: options.maxRetries || 3,
        initialDelay: options.retryDelay || 1000,
        shouldRetry: options.shouldRetry,
      };

      return retryWithBackoff(
        () =>
          this.request<T>(
            method,
            endpoint,
            data,
            { ...options, retry: false },
            false,
            _isDeduplicated
          ),
        {
          ...retryOptions,
          maxDelay: 10000,
          backoffMultiplier: 2,
          shouldRetry: retryOptions.shouldRetry || (() => true),
        }
      ) as Promise<NormalizedApiResponse<T>>;
    }

    const url = `${API_URL}${endpoint}`;

    // Get auth token
    const authToken = await this.getAuthToken();

    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

    const requestOptions: RequestInit = {
      method,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = isFormData ? (data as FormData) : JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Handle 401 Unauthorized - token may be expired, attempt refresh
      if (response.status === 401) {
        // Don't retry if this is already a retry or if hitting auth endpoints
        const isAuthEndpoint = endpoint.includes('/auth/');

        if (!_isRetry && !isAuthEndpoint) {
          logger.debug('Received 401, attempting token refresh...');

          // Try to refresh the token
          const newToken = await this.refreshAuthToken();

          if (newToken) {
            // Retry the original request with the new token
            logger.debug('Token refreshed, retrying original request...');
            return this.request<T>(method, endpoint, data, options, true);
          }
        }

        // Token refresh failed or not applicable - clear tokens and throw
        this.clearAuthToken();
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        logger.apiError(endpoint, method, 401, 'Unauthorized - token expired or invalid');
        throw new Error(
          getUserFriendlyMessage(errorData.message || 'Session expired. Please login again.')
        );
      }

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
          errors?: Array<{ field: string; message: string; value?: unknown }>;
        };
        // Handle standardized error format: { success: false, message: '...', error: 'CODE' }
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        logger.apiError(endpoint, method, response.status, errorMessage);

        // Create error object with additional info from standardized format
        const error = new Error(getUserFriendlyMessage(errorMessage)) as ApiError;
        error.code = errorData.error;
        error.statusCode = response.status;
        error.validationErrors = errorData.errors;

        throw error;
      }

      // Parse response
      const rawResponse = await response.json();

      // Normalize response format to ensure consistency
      return this.normalizeResponse<T>(rawResponse);
    } catch (error) {
      // Don't double-wrap errors we already threw (they already have user-friendly messages)
      if (error instanceof Error && (error as ApiError).code) {
        throw error;
      }

      // Handle network errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage?.includes('Network') ||
        errorMessage?.includes('fetch') ||
        (error instanceof Error && (error.name === 'TypeError' || error.name === 'NetworkError'))
      ) {
        logger.apiError(endpoint, method, 'NETWORK', error);
        const networkError = new Error(STANDARD_ERROR_MESSAGES.NETWORK_ERROR) as ApiError;
        networkError.code = 'NETWORK_ERROR';
        throw networkError;
      }

      // Log and wrap other errors
      logger.apiError(endpoint, method, 'ERROR', error as Error | string);
      const friendlyError = new Error(
        getUserFriendlyMessage(error as string | Error, options.context || '')
      ) as ApiError;
      friendlyError.code = (error as ApiError)?.code || 'UNKNOWN_ERROR';
      throw friendlyError;
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<NormalizedApiResponse<T>> {
    return this.request<T>('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<NormalizedApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<NormalizedApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<NormalizedApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<NormalizedApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, null, options);
  }
}

// Create singleton instance
const api = new ApiService();

export default api;
