import { Request, Response, NextFunction } from 'express';
import { AppError } from './e/AppError';
import { ErrorCode } from './e/ErrorCode';
import { logger } from '../utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private readonly store: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
  
  private getKey(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
  
  check(req: Request): boolean {
    const key = this.getKey(req);
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    if (entry.count >= this.maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: key,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  getRemainingRequests(req: Request): number {
    const key = this.getKey(req);
    const entry = this.store.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    
    return Math.max(0, this.maxRequests - entry.count);
  }
  
  getResetTime(req: Request): number {
    const key = this.getKey(req);
    const entry = this.store.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs;
    }
    
    return entry.resetTime;
  }
}

// Create rate limiter instances
const generalLimiter = new RateLimiter(60000, 100); // 100 requests per minute
const strictLimiter = new RateLimiter(60000, 20);   // 20 requests per minute for sensitive endpoints

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const limiter = generalLimiter;
  
  if (!limiter.check(req)) {
    const resetTime = limiter.getResetTime(req);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', resetTime);
    
    throw AppError.newError429(ErrorCode.RATE_LIMITED, 'Rate limit exceeded. Please try again later.');
  }
  
  // Add rate limit headers to response
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', limiter.getRemainingRequests(req));
  res.setHeader('X-RateLimit-Reset', limiter.getResetTime(req));
  
  next();
};

export const strictRateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const limiter = strictLimiter;
  
  if (!limiter.check(req)) {
    const resetTime = limiter.getResetTime(req);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Limit', '20');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', resetTime);
    
    throw AppError.newError429(ErrorCode.RATE_LIMITED, 'Rate limit exceeded. Please try again later.');
  }
  
  // Add rate limit headers to response
  res.setHeader('X-RateLimit-Limit', '20');
  res.setHeader('X-RateLimit-Remaining', limiter.getRemainingRequests(req));
  res.setHeader('X-RateLimit-Reset', limiter.getResetTime(req));
  
  next();
};