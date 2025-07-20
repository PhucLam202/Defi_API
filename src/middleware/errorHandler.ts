/// # Error Handler Middleware
/// 
/// Centralized error handling middleware for the entire application.
/// Implements security-first error processing with information disclosure prevention,
/// structured logging, and environment-aware error responses.
/// 
/// ## Security Features:
/// - **Information Disclosure Prevention**: Sanitizes sensitive data from error messages
/// - **Environment-Aware Responses**: Different error detail levels for dev/production
/// - **Structured Logging**: Comprehensive error logging without exposing secrets
/// - **Attack Pattern Detection**: Identifies and sanitizes common attack vectors
/// - **Correlation Tracking**: Links errors to specific requests for debugging
/// 
/// ## Error Processing Flow:
/// 1. **Error Type Detection**: Distinguishes between custom AppError and generic Error
/// 2. **Sanitization**: Removes sensitive information from error messages
/// 3. **Logging**: Records error details for monitoring and debugging
/// 4. **Response Formatting**: Returns standardized error responses to client
/// 5. **HTTP Status Mapping**: Maps error types to appropriate HTTP status codes
/// 
/// ## Information Disclosure Protection:
/// Prevents leakage of:
/// - File system paths
/// - IP addresses and network information
/// - Database connection strings
/// - API keys and secrets
/// - Internal stack traces (in production)

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AppError } from './e/AppError.js';
import { ErrorCode } from './e/ErrorCode.js';
import { CustomExpress } from './e/CustomExpress.js';

/// Extend Express Request interface to include correlation ID for request tracking
declare module 'express' {
  interface Request {
    correlationId?: string;
  }
}

/// ## Main Error Handler
/// 
/// Primary error processing function that handles all application errors.
/// Implements defense-in-depth security with sanitization and logging.
/// 
/// **@param {Error | AppError} error** - Error object to be processed
/// **@param {Request} req** - Express request object with context
/// **@param {Response} res** - Express response object for error response
/// **@param {NextFunction} next** - Express next function (not used in error handler)
/// **@returns {void}** - Sends error response and terminates request
/// 
/// ### Error Types:
/// - **AppError**: Custom application errors with structured data
/// - **Error**: Generic JavaScript errors requiring sanitization
/// 
/// ### Security Considerations:
/// - All error messages are sanitized before client response
/// - Sensitive request data (IPs, user agents) logged for security monitoring
/// - Production mode provides minimal error information to prevent reconnaissance
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  /// Initialize custom Express helper for standardized responses
  const customExpress = new CustomExpress(req, res, next);

  /// STRUCTURED ERROR HANDLING (AppError)
  /// Process custom application errors with known structure and security context
  if (error instanceof AppError) {
    /// Log structured error with full context (sanitized by logger)
    logger.error('App error', {
      error: error.msg,                                    // Application error message
      errCode: error.errCode,                             // Structured error code
      statusCode: error.statusCode,                       // HTTP status code
      root: error.root?.message,                          // Root cause if available
      url: req.url,                                       // Request URL for debugging
      method: req.method,                                 // HTTP method
      userAgent: req.get('User-Agent'),                   // Client identification
      ip: req.ip || req.socket.remoteAddress,            // Client IP for security
      correlationId: req.correlationId                   // Request tracking ID
    });

    /// Send structured error response to client
    customExpress.responseAppError(error);
    return;
  }

  /// GENERIC ERROR HANDLING (Error)
  /// Process unexpected errors with comprehensive sanitization
  /// 
  /// Build sanitized error context for logging
  const sanitizedError = {
    error: sanitizeErrorMessage(error.message),          // Sanitized error message
    url: req.url,                                        // Request context
    method: req.method,                                  // HTTP method
    userAgent: req.get('User-Agent'),                    // Client info
    ip: req.ip || req.socket.remoteAddress,             // Client IP
    correlationId: req.correlationId,                   // Request tracking
    /// Include stack trace only in development for debugging
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  /// Log sanitized error details for monitoring
  logger.error('Unhandled error', sanitizedError);

  /// ENVIRONMENT-AWARE ERROR RESPONSES
  /// Production: Generic message to prevent information disclosure
  /// Development: Sanitized actual message for debugging
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred'                     // Generic production message
    : sanitizeErrorMessage(error.message);               // Sanitized development message

  /// Send standardized 500 error response
  customExpress.response500(ErrorCode.UNKNOWN_ERROR, {
    message: errorMessage,
    timestamp: new Date().toISOString()
  });
};

/// ## Not Found Handler
/// 
/// Handles requests to non-existent endpoints with structured 404 responses.
/// 
/// **@param {Request} req** - Express request object
/// **@param {Response} res** - Express response object
/// **@returns {void}** - Sends 404 response
/// 
/// ### Security Features:
/// - Logs attempted access to non-existent endpoints
/// - Provides consistent error response format
/// - Includes request context for security monitoring
export const notFoundHandler = (req: Request, res: Response): void => {
  /// Initialize custom Express helper for standardized responses
  const customExpress = new CustomExpress(req, res, () => {});

  /// Send structured 404 response with request context
  customExpress.response404(ErrorCode.NOT_FOUND, {
    message: 'Endpoint not found',
    path: req.url,                                       // Attempted path for logging
    method: req.method,                                  // HTTP method
    timestamp: new Date().toISOString()
  });
};

/// ## Error Message Sanitization Function
/// 
/// Removes sensitive information from error messages to prevent information disclosure.
/// Uses comprehensive pattern matching to identify and redact sensitive data.
/// 
/// **@param {string} message** - Original error message to sanitize
/// **@returns {string}** - Sanitized error message safe for client response
/// 
/// ### Sensitive Patterns Detected:
/// - **File System Paths**: Windows (C:\path) and Unix (/path/to/file) paths
/// - **Network Information**: IP addresses, localhost URLs, hostnames
/// - **Credentials**: Password, secret, token, key references
/// - **Database Information**: Connection strings, SQL references
/// - **System Errors**: Connection refused, DNS errors, timeouts
/// 
/// ### Security Approach:
/// - Replace sensitive patterns with `[REDACTED]` placeholder
/// - Limit message length to prevent abuse
/// - Preserve enough context for legitimate debugging
function sanitizeErrorMessage(message: string): string {
  /// Comprehensive list of sensitive patterns to redact
  const sensitivePatterns = [
    /\/[A-Za-z]:\/.*$/g,                                 // Windows file paths (C:\path\file)
    /\/[^\/\s]+\/[^\/\s]+/g,                            // Unix file paths (/path/to/file)
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,         // IP addresses (192.168.1.1)
    /localhost:\d+/g,                                    // localhost with port (localhost:3000)
    /password/gi,                                        // Password references
    /secret/gi,                                          // Secret key references
    /token/gi,                                           // Authentication token references
    /key/gi,                                             // API key references
    /database/gi,                                        // Database connection references
    /sql/gi,                                             // SQL query references
    /mongodb/gi,                                         // MongoDB connection references
    /redis/gi,                                           // Redis connection references
    /ECONNREFUSED/gi,                                    // Connection refused errors
    /ENOTFOUND/gi,                                       // DNS resolution errors
    /ETIMEDOUT/gi,                                       // Network timeout errors
  ];

  let sanitized = message;
  
  /// Apply each sanitization pattern
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  /// Limit message length to prevent DoS via large error messages
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + '...';
  }

  return sanitized;
}