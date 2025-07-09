import { Request, Response, NextFunction } from 'express';
import { AppError } from './e/AppError';
import { ErrorCode } from './e/ErrorCode';

export const requestValidator = (req: Request, res: Response, next: NextFunction): void => {
  // Add request size limits
  const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
  const contentLength = parseInt(req.get('content-length') || '0');
  
  if (contentLength > MAX_REQUEST_SIZE) {
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Request too large');
  }
  
  // Validate request method
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (!allowedMethods.includes(req.method)) {
    throw AppError.newError400(ErrorCode.BAD_REQUEST, 'Invalid HTTP method');
  }
  
  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid content type. Expected application/json');
    }
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Remove potentially dangerous characters
        req.query[key] = (req.query[key] as string)
          .replace(/[<>\"']/g, '')
          .substring(0, 100); // Limit length
      }
    });
  }
  
  // Validate User-Agent header
  const userAgent = req.get('user-agent');
  if (userAgent && userAgent.length > 500) {
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid User-Agent header');
  }
  
  next();
};