import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate or extract correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
  
  // Add to request object for use in other middleware/handlers
  req.correlationId = correlationId;
  
  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};