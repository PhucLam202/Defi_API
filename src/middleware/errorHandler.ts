import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AppError } from './e/AppError.js';
import { ErrorCode } from './e/ErrorCode.js';
import { CustomExpress } from './e/CustomExpress.js';

declare module 'express' {
  interface Request {
    correlationId?: string;
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const customExpress = new CustomExpress(req, res, next);

  if (error instanceof AppError) {
    logger.error('App error', {
      error: error.msg,
      errCode: error.errCode,
      statusCode: error.statusCode,
      root: error.root?.message,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.socket.remoteAddress,
      correlationId: req.correlationId
    });

    customExpress.responseAppError(error);
    return;
  }

  // Sanitize error details for logging
  const sanitizedError = {
    error: sanitizeErrorMessage(error.message),
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.socket.remoteAddress,
    correlationId: req.correlationId,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  logger.error('Unhandled error', sanitizedError);

  // In production, provide generic error message to prevent information leakage
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : sanitizeErrorMessage(error.message);

  customExpress.response500(ErrorCode.UNKNOWN_ERROR, {
    message: errorMessage,
    timestamp: new Date().toISOString()
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const customExpress = new CustomExpress(req, res, () => {});

  customExpress.response404(ErrorCode.NOT_FOUND, {
    message: 'Endpoint not found',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

function sanitizeErrorMessage(message: string): string {
  // Remove sensitive patterns that might leak information
  const sensitivePatterns = [
    /\/[A-Za-z]:\/.*$/g,  // Windows paths
    /\/[^\/\s]+\/[^\/\s]+/g,  // Unix paths
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,  // IP addresses
    /localhost:\d+/g,  // localhost with port
    /password/gi,  // Password references
    /secret/gi,  // Secret references
    /token/gi,  // Token references
    /key/gi,  // Key references
    /database/gi,  // Database references
    /sql/gi,  // SQL references
    /mongodb/gi,  // MongoDB references
    /redis/gi,  // Redis references
    /ECONNREFUSED/gi,  // Connection errors
    /ENOTFOUND/gi,  // DNS errors
    /ETIMEDOUT/gi,  // Timeout errors
  ];

  let sanitized = message;
  
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // Limit message length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + '...';
  }

  return sanitized;
}