/**
 * Shared Type Definitions
 * Central export file for all shared types between frontend and backend
 */

// User types
export * from './user';

// Message and chat types
export * from './message';

// Match and swipe types
export * from './match';

// Common types (exported first as base types)
export * from './common';

// API response types (extends common types)
export type {
  SuccessResponse,
  ErrorResponse as ApiErrorResponse,
  PaginatedResponse as ApiPaginatedResponse,
  PaginationInfo,
  SuccessResponseOptions,
  ErrorResponseOptions,
} from './api';
