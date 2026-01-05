/**
 * Structured Logging Service
 * Winston-based logging with multiple transports
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(colors);

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${meta}`;
  })
);

// JSON format for production
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let meta = '';
    if (Object.keys(metadata).length && metadata.stack) {
      meta = `\n${metadata.stack}`;
    } else if (Object.keys(metadata).length) {
      meta = ` ${JSON.stringify(metadata)}`;
    }
    return `${timestamp} ${level}: ${message}${meta}`;
  })
);

class Logger {
  constructor(options = {}) {
    const {
      service = 'dating-app',
      level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      logDir = process.env.LOG_DIR || 'logs',
    } = options;

    this.service = service;
    this.logger = this.createLogger(level, logDir);
    this.requestLogger = this.createRequestLogger();
  }

  createLogger(level, logDir) {
    const transports = [];

    // Console transport
    transports.push(
      new winston.transports.Console({
        level,
        format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
      })
    );

    // File transports for production
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING) {
      // Combined log file (rotating daily)
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '50m',
          maxFiles: '14d',
          format: jsonFormat,
        })
      );

      // Error log file (rotating daily)
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '50m',
          maxFiles: '30d',
          format: jsonFormat,
        })
      );

      // HTTP access log file
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'access-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'http',
          maxSize: '100m',
          maxFiles: '7d',
          format: jsonFormat,
        })
      );
    }

    return winston.createLogger({
      level,
      levels,
      defaultMeta: { service: this.service },
      transports,
      exitOnError: false,
    });
  }

  createRequestLogger() {
    // Morgan-compatible stream
    return {
      write: (message) => {
        this.logger.http(message.trim());
      },
    };
  }

  // Standard log methods
  error(message, meta = {}) {
    this.logger.error(message, this.enrichMeta(meta));
  }

  warn(message, meta = {}) {
    this.logger.warn(message, this.enrichMeta(meta));
  }

  info(message, meta = {}) {
    this.logger.info(message, this.enrichMeta(meta));
  }

  http(message, meta = {}) {
    this.logger.http(message, this.enrichMeta(meta));
  }

  debug(message, meta = {}) {
    this.logger.debug(message, this.enrichMeta(meta));
  }

  // Enriched logging methods
  enrichMeta(meta) {
    return {
      ...meta,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      hostname: require('os').hostname(),
    };
  }

  // Request context logging
  logRequest(req, res, duration) {
    const logData = {
      requestId: req.requestId || req.headers['x-request-id'],
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous',
    };

    if (res.statusCode >= 500) {
      this.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      this.warn('Request error', logData);
    } else {
      this.http('Request completed', logData);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation, collection, duration, success = true, details = {}) {
    const logData = {
      type: 'database',
      operation,
      collection,
      duration: `${duration}ms`,
      success,
      ...details,
    };

    if (!success) {
      this.error('Database operation failed', logData);
    } else if (duration > 1000) {
      this.warn('Slow database operation', logData);
    } else {
      this.debug('Database operation', logData);
    }
  }

  // Cache operation logging
  logCacheOperation(operation, key, hit = false, duration = 0) {
    this.debug('Cache operation', {
      type: 'cache',
      operation,
      key,
      hit,
      duration: `${duration}ms`,
    });
  }

  // Authentication logging
  logAuth(event, userId, success, details = {}) {
    const logData = {
      type: 'auth',
      event,
      userId,
      success,
      ...details,
    };

    if (!success) {
      this.warn('Authentication event', logData);
    } else {
      this.info('Authentication event', logData);
    }
  }

  // Business event logging
  logBusinessEvent(event, userId, details = {}) {
    this.info('Business event', {
      type: 'business',
      event,
      userId,
      ...details,
    });
  }

  // Error with context
  logError(error, context = {}) {
    this.error(error.message, {
      type: 'error',
      errorName: error.name,
      stack: error.stack,
      code: error.code,
      ...context,
    });
  }

  // Performance logging
  logPerformance(metric, value, unit = 'ms', tags = {}) {
    this.debug('Performance metric', {
      type: 'performance',
      metric,
      value,
      unit,
      ...tags,
    });
  }

  // Get stream for morgan middleware
  getStream() {
    return this.requestLogger;
  }

  // Express middleware for request logging
  getMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Generate request ID if not present
      req.requestId = req.requestId || req.headers['x-request-id'] || this.generateRequestId();

      // Log on response finish
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logRequest(req, res, duration);
      });

      next();
    };
  }

  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Child logger with additional context
  child(metadata) {
    const childLogger = new Logger({ service: this.service });
    childLogger.logger = this.logger.child(metadata);
    return childLogger;
  }
}

// =============================================
// Morgan Format for HTTP Logging
// =============================================

const morganFormat = (tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res), 10),
    responseTime: parseFloat(tokens['response-time'](req, res)),
    contentLength: tokens.res(req, res, 'content-length'),
    userAgent: tokens['user-agent'](req, res),
    remoteAddr: tokens['remote-addr'](req, res),
    requestId: req.requestId || req.headers['x-request-id'],
    userId: req.user?.id || 'anonymous',
  });
};

// =============================================
// Audit Logger for sensitive operations
// =============================================

class AuditLogger extends Logger {
  constructor() {
    super({ service: 'dating-app-audit' });
  }

  logDataAccess(userId, action, resource, resourceId, details = {}) {
    this.info('Data access', {
      type: 'audit',
      category: 'data_access',
      userId,
      action,
      resource,
      resourceId,
      ...details,
    });
  }

  logAdminAction(adminId, action, targetType, targetId, details = {}) {
    this.info('Admin action', {
      type: 'audit',
      category: 'admin',
      adminId,
      action,
      targetType,
      targetId,
      ...details,
    });
  }

  logPaymentEvent(userId, event, amount, currency, transactionId, details = {}) {
    this.info('Payment event', {
      type: 'audit',
      category: 'payment',
      userId,
      event,
      amount,
      currency,
      transactionId,
      ...details,
    });
  }

  logSecurityEvent(event, userId, ip, details = {}) {
    this.warn('Security event', {
      type: 'audit',
      category: 'security',
      event,
      userId,
      ip,
      ...details,
    });
  }
}

// Export singleton instances
const logger = new Logger();
const auditLogger = new AuditLogger();

module.exports = {
  Logger,
  AuditLogger,
  logger,
  auditLogger,
  morganFormat,
};
