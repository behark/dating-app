/**
 * API Response Types
 * Extended types for standardized API responses between frontend and backend
 * Uses base types from common.ts
 */

import type { ApiResponse as BaseApiResponse, ValidationError } from './common';

/**
 * Extended API response with additional fields
 */
export interface ApiResponse<T = unknown> extends BaseApiResponse<T> {
  message: string;
  details?: unknown;
  pagination?: PaginationInfo;
  meta?: Record<string, unknown>;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response structure (extends common ErrorResponse)
 */
export interface ErrorResponse extends ApiResponse<null> {
  success: false;
  message: string;
  error?: string;
  errors?: ValidationError[];
  details?: unknown;
}

// Re-export ValidationError from common
export type { ValidationError } from './common';

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: PaginationInfo;
}

/**
 * Response options for sendSuccess
 */
export interface SuccessResponseOptions<T = unknown> {
  message?: string;
  data?: T;
  pagination?: Partial<PaginationInfo>;
  meta?: Record<string, unknown>;
}

/**
 * Error response options for sendError
 */
export interface ErrorResponseOptions {
  message?: string;
  error?: string;
  errors?: ValidationError[];
  details?: unknown;
}
