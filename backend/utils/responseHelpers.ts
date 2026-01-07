/**
 * Standardized API Response Utilities (TypeScript)
 * Provides consistent response format across all endpoints
 */

import { Response } from 'express';
import type {
  ApiResponse,
  SuccessResponseOptions,
  ErrorResponseOptions,
  PaginationInfo,
} from '../../shared/types/api';

/**
 * Standard success response format
 */
export const sendSuccess = <T = unknown>(
  res: Response,
  statusCode: number = 200,
  options: SuccessResponseOptions<T> = {}
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message: options.message || 'Operation completed successfully',
    data: options.data ?? (null as T),
  };

  // Add pagination if provided
  if (options.pagination) {
    const pagination: PaginationInfo = {
      page: options.pagination.page || 1,
      limit: options.pagination.limit || 10,
      total: options.pagination.total || 0,
      pages:
        options.pagination.pages ||
        Math.ceil((options.pagination.total || 0) / (options.pagination.limit || 10)),
      hasNext: options.pagination.hasNext ?? false,
      hasPrev: options.pagination.hasPrev ?? false,
    };
    response.pagination = pagination;
  }

  // Add metadata if provided
  if (options.meta) {
    response.meta = options.meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 */
export const sendError = (
  res: Response,
  statusCode: number = 500,
  options: ErrorResponseOptions = {}
): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message: options.message || 'An error occurred',
    data: null,
  };

  // Add error code/type if provided
  if (options.error) {
    response.error = options.error;
  }

  // Add validation errors if provided
  if (options.errors && Array.isArray(options.errors)) {
    response.errors = options.errors;
  }

  // Add error details if provided
  if (options.details) {
    response.details = options.details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: unknown,
  message: string = 'Validation failed'
): Response => {
  interface FormattedError {
    field: string;
    message: string;
    value?: unknown;
  }

  let formattedErrors: FormattedError[] = [];

  if (Array.isArray(errors)) {
    formattedErrors = errors as FormattedError[];
  } else if (typeof errors === 'object' && errors !== null) {
    const errorObj = errors as { errors?: Record<string, { path: string; message: string; value: unknown }> };
    if (errorObj.errors) {
      // Mongoose validation errors
      formattedErrors = Object.values(errorObj.errors).map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));
    } else {
      // Custom error object
      formattedErrors = Object.entries(errorObj).map(([field, error]) => {
        const errorValue = error as { message?: string; value?: unknown } | string;
        return {
          field,
          message: typeof errorValue === 'string' ? errorValue : errorValue.message || 'Validation error',
          value: typeof errorValue === 'object' && errorValue !== null ? errorValue.value : null,
        };
      });
    }
  }

  return sendError(res, 400, {
    message,
    error: 'VALIDATION_ERROR',
    errors: formattedErrors,
  });
};

/**
 * Not found error response
 */
export const sendNotFound = (
  res: Response,
  resource: string = 'Resource',
  identifier: string = ''
): Response => {
  const message = identifier
    ? `${resource} with ID '${identifier}' not found`
    : `${resource} not found`;

  return sendError(res, 404, {
    message,
    error: 'NOT_FOUND',
  });
};

/**
 * Unauthorized error response
 */
export const sendUnauthorized = (res: Response, message: string = 'Authentication required'): Response => {
  return sendError(res, 401, {
    message,
    error: 'UNAUTHORIZED',
  });
};

/**
 * Forbidden error response
 */
export const sendForbidden = (res: Response, message: string = 'Access forbidden'): Response => {
  return sendError(res, 403, {
    message,
    error: 'FORBIDDEN',
  });
};

/**
 * Rate limit error response
 */
export const sendRateLimit = (
  res: Response,
  options: {
    message?: string;
    limit?: number;
    remaining?: number;
    resetTime?: Date | string;
  } = {}
): Response => {
  return sendError(res, 429, {
    message: options.message || 'Rate limit exceeded',
    error: 'RATE_LIMIT_EXCEEDED',
    details: {
      limit: options.limit,
      remaining: options.remaining || 0,
      resetTime: options.resetTime,
    },
  });
};

/**
 * Paginated response helper
 */
export const createPaginatedResponse = <T>(
  data: T[],
  options: {
    page?: number | string;
    limit?: number | string;
    total?: number | string;
    message?: string;
    meta?: Record<string, unknown>;
  } = {}
): SuccessResponseOptions<T[]> => {
  const page = parseInt(String(options.page || 1)) || 1;
  const limit = parseInt(String(options.limit || 10)) || 10;
  const total = parseInt(String(options.total || data.length)) || data.length;
  const pages = Math.ceil(total / limit);

  return {
    message: options.message || 'Data retrieved successfully',
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
    meta: options.meta,
  };
};

/**
 * Handle async controller errors
 */
export const asyncHandler = <T extends (req: unknown, res: Response, next: unknown) => Promise<unknown>>(
  fn: T
): ((req: unknown, res: Response, next: unknown) => Promise<void>) => {
  return async (req: unknown, res: Response, next: unknown): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error('Controller error:', error);

      // Handle specific error types
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'ValidationError') {
          sendValidationError(res, error);
          return;
        }

        if (error.name === 'CastError') {
          sendError(res, 400, {
            message: 'Invalid ID format',
            error: 'INVALID_ID',
          });
          return;
        }

        if ('code' in error && error.code === 11000) {
          sendError(res, 400, {
            message: 'Duplicate entry found',
            error: 'DUPLICATE_ENTRY',
            details: (error as { keyValue?: unknown }).keyValue,
          });
          return;
        }
      }

      // Default server error
      sendError(res, 500, {
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error instanceof Error
              ? error.message
              : 'Unknown error',
        error: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'production' ? null : (error instanceof Error ? error.stack : String(error)),
      });
    }
  };
};
