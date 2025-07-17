import { Request, Response, NextFunction } from 'express';
import { AppError } from './e/AppError.js';
import { ErrorCode } from './e/ErrorCode.js';
import { logger } from '../utils/logger.js';

export const requestValidator = (req: Request, res: Response, next: NextFunction): void => {
  // Validate request size
  const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
  const contentLength = parseInt(req.get('content-length') || '0');
  
  if (contentLength > MAX_REQUEST_SIZE) {
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Request too large');
  }

  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Content-Type must be application/json');
    }
  }

  // Validate required headers
  const userAgent = req.get('User-Agent');
  if (!userAgent) {
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'User-Agent header is required');
  }

  // Block common attack patterns in URL
  const maliciousPatterns = [
    /\.\./g, // Directory traversal
    /\0/g, // Null bytes
    /<script>/gi, // XSS
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
    /data:/gi, // Data protocol
    /eval\(/gi, // Eval function
    /expression\(/gi, // CSS expression
    /import\(/gi, // Dynamic import
    /require\(/gi, // Node.js require
    /system\(/gi, // System calls
    /exec\(/gi, // Execute commands
    /cmd\(/gi, // Command execution
    /shell\(/gi, // Shell execution
    /drop\s+table/gi, // SQL injection
    /union\s+select/gi, // SQL injection
    /insert\s+into/gi, // SQL injection
    /delete\s+from/gi, // SQL injection
    /update\s+set/gi, // SQL injection
  ];

  const url = req.url;
  const query = JSON.stringify(req.query);
  const body = JSON.stringify(req.body);

  for (const pattern of maliciousPatterns) {
    if (pattern.test(url) || pattern.test(query) || pattern.test(body)) {
      logger.warn('Malicious pattern detected', {
        pattern: pattern.toString(),
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid request format');
    }
  }

  // Validate URL length
  if (url.length > 2048) {
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'URL too long');
  }

  // Validate query parameter count
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 20) {
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Too many query parameters');
  }

  // Validate individual query parameter lengths
  for (const key of queryKeys) {
    if (key.length > 100) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Query parameter key too long');
    }
    
    const value = req.query[key];
    if (typeof value === 'string' && value.length > 1000) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Query parameter value too long');
    }
  }

  // Validate request method
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  if (!allowedMethods.includes(req.method)) {
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Method not allowed');
  }

  // Validate JSON body structure if present
  if (req.body && typeof req.body === 'object') {
    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length > 50) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Request body too complex');
    }
  }

  // Rate limiting for specific endpoints
  const sensitiveEndpoints = ['/auth', '/admin', '/config'];
  const isSensitive = sensitiveEndpoints.some(endpoint => url.startsWith(endpoint));
  
  if (isSensitive) {
    // Additional validation for sensitive endpoints
    const referer = req.get('Referer');
    if (referer && !referer.startsWith(req.protocol + '://' + req.get('Host'))) {
      logger.warn('Suspicious referer for sensitive endpoint', {
        referer,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  }

  next();
};