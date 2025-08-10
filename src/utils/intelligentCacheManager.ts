/**
 * Intelligent Cache Manager
 * 
 * Advanced caching system with TTL optimization, background warming,
 * and intelligent invalidation strategies for the Market Intelligence system.
 */

import crypto from 'crypto';
import { logger } from './logger.js';
import { 
  CacheStrategy,
  CacheMetadata,
  CacheStats
} from '../types/index.js';

/**
 * Mock Redis interface for development
 * In production, this would be replaced with actual Redis client
 */
interface RedisLike {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  info(section?: string): Promise<string>;
  pipeline(): RedisLike;
  exec(): Promise<Array<[Error | null, any]> | null>;
  ttl(key: string): number;
}

/**
 * Mock Redis implementation for development
 */
class MockRedis implements RedisLike {
  private storage = new Map<string, { value: string; expiry: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.storage.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.storage.set(key, {
      value,
      expiry: Date.now() + (seconds * 1000)
    });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    keys.forEach(key => {
      if (this.storage.delete(key)) deleted++;
    });
    return deleted;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.storage.keys()).filter(key => regex.test(key));
  }

  async info(section?: string): Promise<string> {
    return `used_memory:${this.storage.size * 100}\nconnected_clients:1`;
  }

  pipeline(): RedisLike {
    return this; // Simplified for mock
  }

  async exec(): Promise<Array<[Error | null, any]> | null> {
    return []; // Simplified for mock
  }

  ttl(key: string): number {
    const item = this.storage.get(key);
    if (!item) return -2;
    
    const remaining = Math.floor((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1;
  }
}

/**
 * Memory Cache using Map for fast local caching
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  private stats = { hits: 0, misses: 0, keys: 0 };

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return undefined;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.keys--;
      this.stats.misses++;
      return undefined;
    }
    
    this.stats.hits++;
    return item.value;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const isNewKey = !this.cache.has(key);
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
    
    if (isNewKey) {
      this.stats.keys++;
    }
  }

  del(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.keys--;
    }
    return deleted;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  getStats() {
    return { ...this.stats };
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, keys: 0 };
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        this.stats.keys--;
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Memory cache cleanup completed', { cleaned, remaining: this.stats.keys });
    }
  }
}

/**
 * Intelligent Cache Manager
 * 
 * Advanced caching system with TTL optimization, background warming,
 * and intelligent invalidation strategies.
 */
export class IntelligentCacheManager {
  
  private redisClient: RedisLike;
  private memoryCache: MemoryCache;
  private cacheStrategies: Map<string, CacheStrategy> = new Map();
  private backgroundJobs: NodeJS.Timeout[] = [];

  constructor(redisClient?: RedisLike) {
    this.redisClient = redisClient || new MockRedis();
    this.memoryCache = new MemoryCache();
    
    this.initializeCacheStrategies();
    this.startBackgroundJobs();
    
    logger.info('Intelligent Cache Manager initialized', {
      redisConnected: !!redisClient,
      strategiesCount: this.cacheStrategies.size
    });
  }

  /**
   * Initialize cache strategies for different endpoint types
   */
  private initializeCacheStrategies(): void {
    this.cacheStrategies = new Map([
      // Real-time market data - short TTL, high priority
      ['market_overview', { 
        ttl: 300000, // 5 minutes
        priority: 'high',
        warmingEnabled: true,
        fallbackTtl: 900000 // 15 minutes fallback
      }],
      
      ['market_movers', { 
        ttl: 300000, // 5 minutes
        priority: 'high',
        warmingEnabled: true,
        fallbackTtl: 600000 // 10 minutes fallback
      }],
      
      // Analysis data - medium TTL, medium priority
      ['market_dominance', { 
        ttl: 600000, // 10 minutes
        priority: 'medium',
        warmingEnabled: true,
        fallbackTtl: 1800000 // 30 minutes fallback
      }],
      
      ['market_trending', { 
        ttl: 900000, // 15 minutes
        priority: 'medium',
        warmingEnabled: true,
        fallbackTtl: 1800000 // 30 minutes fallback
      }],
      
      // Historical and stable data - long TTL, low priority
      ['protocol_history', { 
        ttl: 86400000, // 24 hours
        priority: 'low',
        warmingEnabled: false,
        fallbackTtl: 172800000 // 48 hours fallback
      }],
      
      ['chain_fundamentals', { 
        ttl: 43200000, // 12 hours
        priority: 'low',
        warmingEnabled: false,
        fallbackTtl: 86400000 // 24 hours fallback
      }]
    ]);
  }

  /**
   * Get cached data with fallback strategy
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Try memory cache first (fastest)
      const memoryResult = this.memoryCache.get<T>(key);
      if (memoryResult !== undefined) {
        logger.debug('Cache hit (memory)', { 
          key: this.maskSensitiveKey(key), 
          responseTime: Date.now() - startTime 
        });
        return memoryResult;
      }

      // Try Redis cache (distributed)
      const redisResult = await this.redisClient.get(key);
      if (redisResult) {
        try {
          const parsed = JSON.parse(redisResult);
          
          // Update memory cache for next time
          const strategy = this.getCacheStrategy(key);
          this.memoryCache.set(key, parsed, Math.floor(strategy.ttl / 1000));
          
          logger.debug('Cache hit (Redis)', { 
            key: this.maskSensitiveKey(key), 
            responseTime: Date.now() - startTime 
          });
          return parsed;
        } catch (parseError) {
          logger.warn('Failed to parse Redis cache value', { 
            key: this.maskSensitiveKey(key), 
            error: parseError 
          });
        }
      }

      logger.debug('Cache miss', { 
        key: this.maskSensitiveKey(key), 
        responseTime: Date.now() - startTime 
      });
      return null;

    } catch (error) {
      logger.error('Cache get error', { 
        key: this.maskSensitiveKey(key), 
        error,
        responseTime: Date.now() - startTime 
      });
      return null;
    }
  }

  /**
   * Set cached data with intelligent TTL
   */
  async set<T>(key: string, data: T, customTtl?: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const strategy = this.getCacheStrategy(key);
      const ttl = customTtl || strategy.ttl;
      const ttlSeconds = Math.floor(ttl / 1000);

      // Store in both memory and Redis
      this.memoryCache.set(key, data, ttlSeconds);
      
      await this.redisClient.setex(
        key, 
        ttlSeconds, 
        JSON.stringify(data)
      );

      // Store metadata for cache analytics
      await this.storeCacheMetadata(key, {
        strategy: strategy,
        storedAt: new Date().toISOString(),
        ttl: ttl,
        dataSize: JSON.stringify(data).length
      });

      logger.debug('Cache set successful', { 
        key: this.maskSensitiveKey(key), 
        ttl: ttlSeconds,
        dataSize: JSON.stringify(data).length,
        responseTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('Cache set error', { 
        key: this.maskSensitiveKey(key), 
        error,
        responseTime: Date.now() - startTime 
      });
      // Don't throw - caching failures shouldn't break the API
    }
  }

  /**
   * Generate intelligent cache key
   */
  generateCacheKey(endpoint: string, params: any): string {
    // Create deterministic key from endpoint and parameters
    const paramsString = this.serializeParams(params);
    const hash = crypto
      .createHash('md5')
      .update(`${endpoint}:${paramsString}`)
      .digest('hex');
    
    return `defi:market:${endpoint}:${hash}`;
  }

  /**
   * Warm critical caches in background
   */
  async warmIntelligenceCache(): Promise<void> {
    const startTime = Date.now();
    
    logger.info('Starting cache warming process');
    
    const warmingJobs = [
      this.warmMarketOverviewCache(),
      this.warmMarketDominanceCache(),
      this.warmTrendingCache(),
      this.warmMoversCache()
    ];
    
    try {
      const results = await Promise.allSettled(warmingJobs);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      logger.info('Cache warming completed', { 
        successful,
        failed,
        total: warmingJobs.length,
        duration: Date.now() - startTime
      });

      if (failed > 0) {
        logger.warn('Some cache warming jobs failed', { failed, total: warmingJobs.length });
        // Log specific failures
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            logger.error(`Cache warming job ${index} failed`, { reason: result.reason });
          }
        });
      }
    } catch (error) {
      logger.error('Cache warming process failed', { 
        error,
        duration: Date.now() - startTime 
      });
    }
  }

  /**
   * Invalidate cache patterns
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Memory cache pattern invalidation
      const memoryKeys = this.memoryCache.keys();
      const matchingMemoryKeys = memoryKeys.filter(key => key.includes(pattern));
      
      matchingMemoryKeys.forEach(key => {
        this.memoryCache.del(key);
      });

      // Redis pattern invalidation
      const redisKeys = await this.redisClient.keys(`*${pattern}*`);
      if (redisKeys.length > 0) {
        await this.redisClient.del(...redisKeys);
      }

      logger.info('Cache invalidation completed', { 
        pattern, 
        memoryKeys: matchingMemoryKeys.length,
        redisKeys: redisKeys.length,
        duration: Date.now() - startTime
      });

    } catch (error) {
      logger.error('Cache invalidation error', { 
        pattern, 
        error,
        duration: Date.now() - startTime 
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const memoryStats = this.memoryCache.getStats();
      const redisInfo = await this.redisClient.info('memory');
      
      return {
        memory: {
          keys: memoryStats.keys,
          hits: memoryStats.hits,
          misses: memoryStats.misses,
          hitRate: memoryStats.hits + memoryStats.misses > 0 
            ? memoryStats.hits / (memoryStats.hits + memoryStats.misses) 
            : 0
        },
        redis: {
          memoryUsage: this.parseRedisMemoryInfo(redisInfo),
          connectedClients: await this.getRedisConnectedClients()
        },
        strategies: Array.from(this.cacheStrategies.entries()).map(([key, strategy]) => ({
          key,
          ...strategy
        }))
      };
    } catch (error) {
      logger.error('Error getting cache stats', { error });
      return this.getDefaultCacheStats();
    }
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): Promise<{ status: string; checks: any }> {
    try {
      // Test memory cache
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now() };
      
      this.memoryCache.set(testKey, testValue, 10);
      const retrieved = this.memoryCache.get(testKey) as { timestamp: number } | undefined;
const memoryHealthy = retrieved && retrieved.timestamp === testValue.timestamp;
      
      // Test Redis cache
      const redisTestKey = 'redis_health_check_test';
      await this.redisClient.setex(redisTestKey, 10, JSON.stringify(testValue));
      const redisRetrieved = await this.redisClient.get(redisTestKey);
      const redisHealthy = redisRetrieved === JSON.stringify(testValue);
      
      // Cleanup test keys
      this.memoryCache.del(testKey);
      await this.redisClient.del(redisTestKey);
      
      const overallHealthy = memoryHealthy && redisHealthy;
      
      return {
        status: overallHealthy ? 'healthy' : 'degraded',
        checks: {
          memoryCache: memoryHealthy ? 'healthy' : 'unhealthy',
          redisCache: redisHealthy ? 'healthy' : 'unhealthy',
          strategies: this.cacheStrategies.size,
          lastCheck: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        checks: {
          memoryCache: 'unknown',
          redisCache: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Cleanup resources and stop background jobs
   */
  destroy(): void {
    // Stop all background jobs
    this.backgroundJobs.forEach(job => clearInterval(job));
    this.backgroundJobs = [];
    
    // Clear memory cache
    this.memoryCache.clear();
    
    logger.info('Intelligent Cache Manager destroyed');
  }

  // Private helper methods
  private getCacheStrategy(key: string): CacheStrategy {
    // Extract endpoint type from key
    const parts = key.split(':');
    const endpointType = parts.length >= 3 ? parts[2] : 'default';
    
    return this.cacheStrategies.get(endpointType) || {
      ttl: 300000, // 5 minutes default
      priority: 'medium',
      warmingEnabled: false,
      fallbackTtl: 900000
    };
  }

  private serializeParams(params: any): string {
    // Sort keys for consistent serialization
    if (!params || typeof params !== 'object') return '';
    
    const sortedKeys = Object.keys(params).sort();
    return sortedKeys
      .map(key => {
        const value = params[key];
        if (Array.isArray(value)) {
          return `${key}=${value.sort().join(',')}`;
        }
        return `${key}=${value}`;
      })
      .join('&');
  }

  private async storeCacheMetadata(key: string, metadata: CacheMetadata): Promise<void> {
    try {
      const metaKey = `meta:${key}`;
      await this.redisClient.setex(
        metaKey,
        86400, // 24 hours
        JSON.stringify(metadata)
      );
    } catch (error) {
      logger.debug('Cache metadata storage failed', { 
        key: this.maskSensitiveKey(key), 
        error 
      });
    }
  }

  private startBackgroundJobs(): void {
    // Warm cache every 5 minutes for high-priority endpoints
    const warmingJob = setInterval(async () => {
      await this.warmIntelligenceCache();
    }, 300000);
    this.backgroundJobs.push(warmingJob);

    // Clean expired metadata every hour
    const cleanupJob = setInterval(async () => {
      await this.cleanExpiredMetadata();
    }, 3600000);
    this.backgroundJobs.push(cleanupJob);

    // Clean expired memory cache entries every 10 minutes
    const memoryCleanupJob = setInterval(() => {
      this.memoryCache.cleanup();
    }, 600000);
    this.backgroundJobs.push(memoryCleanupJob);

    logger.info('Background cache jobs started', { 
      jobCount: this.backgroundJobs.length 
    });
  }

  private async warmMarketOverviewCache(): Promise<void> {
    // Implementation would pre-warm market overview with common parameters
    logger.debug('Warming market overview cache');
    // Placeholder: In real implementation, this would call the service with common params
  }

  private async warmMarketDominanceCache(): Promise<void> {
    // Implementation would pre-warm market dominance cache
    logger.debug('Warming market dominance cache');
  }

  private async warmTrendingCache(): Promise<void> {
    // Implementation would pre-warm trending protocols cache
    logger.debug('Warming trending cache');
  }

  private async warmMoversCache(): Promise<void> {
    // Implementation would pre-warm market movers cache
    logger.debug('Warming movers cache');
  }

  private async cleanExpiredMetadata(): Promise<void> {
    try {
      const metaKeys = await this.redisClient.keys('meta:*');
      if (metaKeys.length === 0) return;

      const pipeline = this.redisClient.pipeline();
      metaKeys.forEach(key => pipeline.ttl(key));
      
      const ttls = await pipeline.exec();
      const expiredKeys = metaKeys.filter((key, index) => {
        const ttl = ttls?.[index]?.[1] as number;
        return ttl <= 0;
      });

      if (expiredKeys.length > 0) {
        await this.redisClient.del(...expiredKeys);
        logger.debug('Cleaned expired cache metadata', { count: expiredKeys.length });
      }
    } catch (error) {
      logger.error('Error cleaning expired metadata', { error });
    }
  }

  private parseRedisMemoryInfo(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private async getRedisConnectedClients(): Promise<number> {
    try {
      const info = await this.redisClient.info('clients');
      const match = info.match(/connected_clients:(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  private getDefaultCacheStats(): CacheStats {
    return {
      memory: { keys: 0, hits: 0, misses: 0, hitRate: 0 },
      redis: { memoryUsage: 0, connectedClients: 0 },
      strategies: []
    };
  }

  private maskSensitiveKey(key: string): string {
    // Mask potential sensitive information in keys for logging
    return key.length > 50 ? key.substring(0, 20) + '...' + key.substring(key.length - 10) : key;
  }
}

// Export singleton factory
export function createCacheManager(redisClient?: RedisLike): IntelligentCacheManager {
  return new IntelligentCacheManager(redisClient);
}

// Export default instance placeholder
export let intelligentCacheManager: IntelligentCacheManager;