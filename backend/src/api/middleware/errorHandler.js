/**
 * Global Error Handler Middleware
 * 
 * Centralized error handling for all routes
 * Provides consistent error responses and logging
 */

const { logger } = require('../../infrastructure/external/LoggingService');
const { AppError } = require('../../shared/utils/AppError');

/**
 * Global error handler middleware
 * 
 * Handles all errors thrown in the application and provides
 * consistent JSON error responses
 * 
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error with full context
  const errorLog = {
    message: err.message,
    name: err.name,
    stack: err.stack,
    requestId: req.requestId || req.id, // Support both req.requestId and req.id
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip,
  };

  // Log based on error severity
  if (err instanceof AppError && err.isOperational) {
    // Expected operational errors (validation, not found, etc.)
    logger.warn('Operational error', errorLog);
  } else {
    // Unexpected programming errors
    logger.error('Unexpected error', errorLog);
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      requestId: req.requestId || req.id,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
      requestId: req.requestId || req.id,
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid ${err.path}: ${err.value}`,
      },
      requestId: req.requestId || req.id,
    });
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: field ? `${field} already exists` : 'Duplicate entry',
        details: { field, value: err.keyValue?.[field] },
      },
      requestId: req.requestId || req.id,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
      requestId: req.requestId || req.id,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
      requestId: req.requestId || req.id,
    });
  }

  // Handle unexpected errors
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
    requestId: req.id,
  });
};

/**
 * 404 Not Found handler
 * 
 * Catches all requests to undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    requestId: req.id,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
