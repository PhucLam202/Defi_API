import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from './e/AppError';
import { ErrorCode } from './e/ErrorCode';
import { CustomExpress } from './e/CustomExpress';

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

  // Log detailed error information for debugging (only in development)
  const logData = {
    error: error.message,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.socket.remoteAddress,
    correlationId: req.correlationId,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  logger.error('Unhandled error', logData);

  // In production, provide generic error message to prevent information leakage
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : 'Internal server error';

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