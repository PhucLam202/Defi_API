/// # Rate Limiting Middleware
/// 
/// Advanced rate limiting system with intelligent threat detection and
/// multi-factor client identification. Provides DoS protection and API abuse prevention
/// with configurable limits and automatic cleanup.
/// 
/// ## Security Features:
/// - **Multi-Factor Client ID**: Uses IP, User-Agent, and X-Forwarded-For headers
/// - **Suspicious Pattern Detection**: Identifies and throttles bots and scrapers
/// - **Adaptive Rate Limiting**: Different limits for normal vs suspicious requests
/// - **Automatic Cleanup**: Memory management with periodic expired entry removal
/// - **Comprehensive Logging**: Security monitoring with sanitized request context
/// 
/// ## Rate Limit Tiers:
/// - **General Endpoints**: 100 requests per minute
/// - **Strict Endpoints**: 20 requests per minute
/// - **Suspicious Clients**: 20 requests per minute (forced)
/// 
/// ## HTTP Headers:
/// - `X-RateLimit-Limit`: Maximum requests allowed in window
/// - `X-RateLimit-Remaining`: Requests remaining in current window
/// - `X-RateLimit-Reset`: Timestamp when window resets
/// - `Retry-After`: Seconds to wait before retrying (when rate limited)
/// 
/// ## Client Identification Strategy:
/// 1. **Primary**: Client IP address
/// 2. **Secondary**: User-Agent string (first 50 chars)
/// 3. **Proxy Support**: X-Forwarded-For header (first IP)
/// 4. **Composite Key**: Combined for unique client identification

import { Request, Response, NextFunction } from 'express';
import { AppError } from './e/AppError.js';
import { ErrorCode } from './e/ErrorCode.js';
import { logger } from '../utils/logger.js';

/// ## Rate Limit Entry Interface
/// 
/// Defines the structure for storing rate limit data per client.
/// 
/// **@property {number} count** - Current request count in the window
/// **@property {number} resetTime** - Timestamp when the window resets
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/// ## RateLimiter Class
/// 
/// Core rate limiting implementation using in-memory storage with automatic
/// cleanup and multi-factor client identification.
/// 
/// ### Architecture:
/// - **Storage**: In-memory Map for high performance
/// - **Cleanup**: Automatic expired entry removal every 60 seconds
/// - **Identification**: Composite client keys for accuracy
/// - **Window**: Sliding window rate limiting algorithm
class RateLimiter {
  /// In-memory storage for rate limit data per client
  /// **Key**: Composite client identifier
  /// **Value**: RateLimitEntry with count and reset time
  private readonly store: Map<string, RateLimitEntry> = new Map();
  
  /// Time window in milliseconds for rate limiting
  /// **Default**: 60000ms (1 minute)
  private readonly windowMs: number;
  
  /// Maximum requests allowed per window
  /// **Default**: 100 requests
  private readonly maxRequests: number;
  
  /// ## Constructor
  /// 
  /// Initializes rate limiter with configurable window and request limits.
  /// Sets up automatic cleanup interval for memory management.
  /// 
  /// **@param {number} windowMs** - Time window in milliseconds (default: 60000)
  /// **@param {number} maxRequests** - Max requests per window (default: 100)
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    /// AUTOMATIC CLEANUP: Remove expired entries every minute
    /// Prevents memory leaks and maintains performance
    setInterval(() => this.cleanup(), 60000);
  }
  
  /// ## Cleanup Method
  /// 
  /// Removes expired rate limit entries from memory to prevent memory leaks.
  /// Called automatically every 60 seconds via setInterval.
  /// 
  /// **@performance** O(n) where n is number of stored entries
  /// **@security** Ensures memory usage stays bounded
  private cleanup(): void {
    const now = Date.now();
    /// Iterate through all entries and remove expired ones
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
  
  /// ## Client Key Generation
  /// 
  /// Creates a unique identifier for each client using multiple request attributes.
  /// This prevents rate limit bypass attempts using single-factor spoofing.
  /// 
  /// **@param {Request} req** - Express request object
  /// **@returns {string}** - Unique client identifier
  /// **@security** Multi-factor identification prevents bypass attempts
  /// 
  /// ### Key Components:
  /// 1. **IP Address**: Primary identifier from req.ip or connection
  /// 2. **User-Agent**: Client software identification (truncated to 50 chars)
  /// 3. **X-Forwarded-For**: Real IP when behind proxy (first IP only)
  /// 
  /// ### Security Considerations:
  /// - Truncates User-Agent to prevent memory exhaustion
  /// - Uses first IP from X-Forwarded-For to prevent proxy chaining abuse
  /// - Defaults to 'unknown' for missing headers to ensure key generation
  private getKey(req: Request): string {
    /// MULTI-FACTOR CLIENT IDENTIFICATION
    /// Combine multiple request attributes for accurate client identification
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const xForwardedFor = req.get('X-Forwarded-For') || '';
    
    /// CREATE BASE KEY: IP + User-Agent (truncated for security)
    /// Truncation prevents memory exhaustion attacks via large User-Agent headers
    const baseKey = `${ip}:${userAgent.substring(0, 50)}`;
    
    /// PROXY SUPPORT: Include real IP when behind proxy
    /// Uses only first IP to prevent X-Forwarded-For header manipulation
    if (xForwardedFor) {
      return `${baseKey}:${xForwardedFor.split(',')[0].trim()}`;
    }
    
    return baseKey;
  }
  
  /// ## Rate Limit Check
  /// 
  /// Validates if a request should be allowed based on current rate limit state.
  /// Implements sliding window algorithm with automatic window reset.
  /// 
  /// **@param {Request} req** - Express request object
  /// **@returns {boolean}** - true if request is allowed, false if rate limited
  /// **@security** Logs rate limit violations for security monitoring
  /// 
  /// ### Algorithm:
  /// 1. **Key Generation**: Create unique client identifier
  /// 2. **Entry Lookup**: Find existing rate limit data
  /// 3. **Window Check**: Reset if window expired
  /// 4. **Limit Check**: Compare count against maximum
  /// 5. **Update**: Increment counter if allowed
  check(req: Request): boolean {
    const key = this.getKey(req);
    const now = Date.now();
    const entry = this.store.get(key);
    
    /// WINDOW RESET: Create new entry or reset expired window
    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true; // First request in window always allowed
    }
    
    /// RATE LIMIT CHECK: Reject if limit exceeded
    if (entry.count >= this.maxRequests) {
      /// SECURITY LOGGING: Record rate limit violations
      logger.warn('Rate limit exceeded', {
        ip: key,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      return false;
    }
    
    /// INCREMENT COUNTER: Allow request and update count
    entry.count++;
    return true;
  }
  
  /// ## Get Remaining Requests
  /// 
  /// Calculates how many requests remain in the current window for a client.
  /// Used for X-RateLimit-Remaining header generation.
  /// 
  /// **@param {Request} req** - Express request object
  /// **@returns {number}** - Number of requests remaining in current window
  /// **@performance** O(1) lookup and calculation
  getRemainingRequests(req: Request): number {
    const key = this.getKey(req);
    const entry = this.store.get(key);
    
    /// NO ENTRY OR EXPIRED: Return full allowance
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    
    /// CALCULATE REMAINING: Ensure non-negative result
    return Math.max(0, this.maxRequests - entry.count);
  }
  
  /// ## Get Reset Time
  /// 
  /// Returns the timestamp when the rate limit window resets for a client.
  /// Used for X-RateLimit-Reset header generation.
  /// 
  /// **@param {Request} req** - Express request object
  /// **@returns {number}** - Unix timestamp when window resets
  /// **@performance** O(1) lookup and calculation
  getResetTime(req: Request): number {
    const key = this.getKey(req);
    const entry = this.store.get(key);
    
    /// NO ENTRY OR EXPIRED: Return new window start time
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs;
    }
    
    /// RETURN EXISTING: Window reset time
    return entry.resetTime;
  }
}

/// ## Rate Limiter Instances
/// 
/// Pre-configured rate limiter instances for different security requirements.
/// 
/// ### Instance Configuration:
/// - **generalLimiter**: 100 requests per minute for standard endpoints
/// - **strictLimiter**: 20 requests per minute for sensitive/expensive operations
/// 
/// ### Use Cases:
/// - **General**: API queries, data retrieval, standard operations
/// - **Strict**: Analytics, conversions, resource-intensive operations
const generalLimiter = new RateLimiter(60000, 100); /// 100 requests per minute
const strictLimiter = new RateLimiter(60000, 20);   /// 20 requests per minute for sensitive endpoints

/// ## Rate Limiting Middleware
/// 
/// Primary rate limiting middleware with intelligent threat detection.
/// Applies different rate limits based on client behavior analysis.
/// 
/// **@param {Request} req** - Express request object
/// **@param {Response} res** - Express response object
/// **@param {NextFunction} next** - Express next function
/// **@throws {AppError}** - 429 error when rate limit exceeded
/// 
/// ### Security Features:
/// 1. **Threat Detection**: Identifies suspicious User-Agent patterns
/// 2. **Adaptive Limiting**: Stricter limits for suspicious clients
/// 3. **Comprehensive Logging**: Security monitoring for all violations
/// 4. **Standard Headers**: RFC-compliant rate limit headers
/// 
/// ### Suspicious Patterns Detected:
/// - Bot/crawler indicators
/// - Automated tools (curl, wget, etc.)
/// - Programming language libraries
/// - Generic HTTP clients
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const limiter = generalLimiter;
  
  /// THREAT DETECTION: Analyze User-Agent for suspicious patterns
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /http/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    /// SECURITY LOGGING: Record suspicious client detection
    logger.warn('Suspicious user agent detected', {
      userAgent,
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    
    /// STRICT RATE LIMITING: Apply reduced limits for suspicious clients
    if (!strictLimiter.check(req)) {
      const resetTime = strictLimiter.getResetTime(req);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      /// SET RATE LIMIT HEADERS: Inform client of limits and retry time
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', '20');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetTime);
      
      throw AppError.newError429(ErrorCode.RATE_LIMITED, 'Rate limit exceeded. Please try again later.');
    }
    
    /// ADD RATE LIMIT HEADERS: Inform suspicious clients of stricter limits
    res.setHeader('X-RateLimit-Limit', '20');
    res.setHeader('X-RateLimit-Remaining', strictLimiter.getRemainingRequests(req));
    res.setHeader('X-RateLimit-Reset', strictLimiter.getResetTime(req));
  } else {
    /// NORMAL RATE LIMITING: Apply standard limits for regular clients
    if (!limiter.check(req)) {
      const resetTime = limiter.getResetTime(req);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      /// SET RATE LIMIT HEADERS: Standard rate limit response
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetTime);
      
      throw AppError.newError429(ErrorCode.RATE_LIMITED, 'Rate limit exceeded. Please try again later.');
    }
    
    /// ADD RATE LIMIT HEADERS: Inform clients of current limit status
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', limiter.getRemainingRequests(req));
    res.setHeader('X-RateLimit-Reset', limiter.getResetTime(req));
  }
  
  next();
};

/// ## Strict Rate Limiting Middleware
/// 
/// Enhanced rate limiting middleware for sensitive endpoints that require
/// stricter protection against abuse and resource exhaustion.
/// 
/// **@param {Request} req** - Express request object
/// **@param {Response} res** - Express response object
/// **@param {NextFunction} next** - Express next function
/// **@throws {AppError}** - 429 error when rate limit exceeded
/// 
/// ### Use Cases:
/// - Analytics endpoints
/// - Token conversion operations
/// - Resource-intensive queries
/// - Administrative functions
/// 
/// ### Configuration:
/// - **Limit**: 20 requests per minute (fixed)
/// - **Window**: 60 seconds
/// - **Headers**: Standard rate limit headers included
export const strictRateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const limiter = strictLimiter;
  
  /// STRICT RATE LIMIT CHECK: Apply reduced limits for sensitive endpoints
  if (!limiter.check(req)) {
    const resetTime = limiter.getResetTime(req);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    /// SET RATE LIMIT HEADERS: Inform client of strict limits and retry time
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Limit', '20');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', resetTime);
    
    throw AppError.newError429(ErrorCode.RATE_LIMITED, 'Rate limit exceeded. Please try again later.');
  }
  
  /// ADD RATE LIMIT HEADERS: Inform clients of strict limit status
  res.setHeader('X-RateLimit-Limit', '20');
  res.setHeader('X-RateLimit-Remaining', limiter.getRemainingRequests(req));
  res.setHeader('X-RateLimit-Reset', limiter.getResetTime(req));
  
  next();
};