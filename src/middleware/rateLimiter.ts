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
    // Use multiple factors for more secure rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const xForwardedFor = req.get('X-Forwarded-For') || '';
    
    // Create a composite key
    const baseKey = `${ip}:${userAgent.substring(0, 50)}`;
    
    // If behind proxy, include X-Forwarded-For
    if (xForwardedFor) {
      return `${baseKey}:${xForwardedFor.split(',')[0].trim()}`;
    }
    
    return baseKey;
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
  
  // Check for suspicious user agents
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /http/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    logger.warn('Suspicious user agent detected', {
      userAgent,
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    
    // Apply stricter rate limiting for suspicious requests
    if (!strictLimiter.check(req)) {
      const resetTime = strictLimiter.getResetTime(req);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', '20');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetTime);
      
      throw AppError.newError429(ErrorCode.RATE_LIMITED, 'Rate limit exceeded. Please try again later.');
    }
    
    // Add rate limit headers for suspicious requests
    res.setHeader('X-RateLimit-Limit', '20');
    res.setHeader('X-RateLimit-Remaining', strictLimiter.getRemainingRequests(req));
    res.setHeader('X-RateLimit-Reset', strictLimiter.getResetTime(req));
  } else {
    // Normal rate limiting
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
  }
  
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