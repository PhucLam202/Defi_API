import { Request, Response, NextFunction } from 'express';
import { AppError } from './e/AppError';
import { ErrorCode } from './e/ErrorCode';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface ApiKeyInfo {
  name: string;
  permissions: string[];
  rateLimit: number;
  createdAt: Date;
  lastUsed?: Date;
}

// In production, this should be stored in a database
const API_KEYS: Map<string, ApiKeyInfo> = new Map();

export class ApiKeyManager {
  static generateApiKey(): string {
    const prefix = 'ak_';
    const randomBytes = crypto.randomBytes(32);
    const apiKey = prefix + randomBytes.toString('hex');
    return apiKey;
  }

  static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  static createApiKey(name: string, permissions: string[] = ['read'], rateLimit: number = 1000): string {
    const apiKey = this.generateApiKey();
    const hashedKey = this.hashApiKey(apiKey);
    
    API_KEYS.set(hashedKey, {
      name,
      permissions,
      rateLimit,
      createdAt: new Date(),
    });

    logger.audit('API key created', 'system', 'api_key', { 
      keyName: name, 
      permissions, 
      rateLimit 
    });

    return apiKey;
  }

  static validateApiKey(apiKey: string): ApiKeyInfo | null {
    const hashedKey = this.hashApiKey(apiKey);
    const keyInfo = API_KEYS.get(hashedKey);
    
    if (keyInfo) {
      // Update last used timestamp
      keyInfo.lastUsed = new Date();
      API_KEYS.set(hashedKey, keyInfo);
    }
    
    return keyInfo || null;
  }

  static revokeApiKey(apiKey: string): boolean {
    const hashedKey = this.hashApiKey(apiKey);
    const deleted = API_KEYS.delete(hashedKey);
    
    if (deleted) {
      logger.audit('API key revoked', 'system', 'api_key', { 
        keyHash: hashedKey.substring(0, 8) + '...' 
      });
    }
    
    return deleted;
  }

  static listApiKeys(): Array<Omit<ApiKeyInfo, 'permissions'> & { keyHash: string }> {
    return Array.from(API_KEYS.entries()).map(([hash, info]) => ({
      keyHash: hash.substring(0, 8) + '...',
      name: info.name,
      rateLimit: info.rateLimit,
      createdAt: info.createdAt,
      lastUsed: info.lastUsed
    }));
  }
}

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Skip API key validation in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const apiKey = extractApiKey(req);
  
  if (!apiKey) {
    logger.security('Missing API key', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
    
    throw AppError.newError401(ErrorCode.UNAUTHORIZED, 'API key required');
  }

  const keyInfo = ApiKeyManager.validateApiKey(apiKey);
  
  if (!keyInfo) {
    logger.security('Invalid API key used', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      keyPrefix: apiKey.substring(0, 6) + '...'
    });
    
    throw AppError.newError401(ErrorCode.UNAUTHORIZED, 'Invalid API key');
  }

  // Check permissions
  const requiredPermission = getRequiredPermission(req);
  if (!keyInfo.permissions.includes(requiredPermission) && !keyInfo.permissions.includes('admin')) {
    logger.security('Insufficient permissions', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      keyName: keyInfo.name,
      requiredPermission,
      availablePermissions: keyInfo.permissions
    });
    
    throw AppError.newError403(ErrorCode.FORBIDDEN, 'Insufficient permissions');
  }

  // Add key info to request for later use
  (req as any).apiKeyInfo = keyInfo;

  logger.audit('API access', keyInfo.name, req.url, {
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next();
};

function extractApiKey(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter (less secure, but sometimes necessary)
  const apiKeyQuery = req.query.api_key;
  if (typeof apiKeyQuery === 'string') {
    return apiKeyQuery;
  }

  return null;
}

function getRequiredPermission(req: Request): string {
  const method = req.method.toLowerCase();
  const path = req.path;

  // Admin endpoints
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    return 'admin';
  }

  // Write operations
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    return 'write';
  }

  // Default to read permission
  return 'read';
}

// Optional: Rate limiting per API key
export const apiKeyRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const keyInfo = (req as any).apiKeyInfo as ApiKeyInfo;
  
  if (!keyInfo) {
    return next();
  }

  // Implementation would depend on your rate limiting strategy
  // This is a placeholder for API key specific rate limiting
  next();
};

// Initialize default API keys for development
if (process.env.NODE_ENV === 'development') {
  const devKey = ApiKeyManager.createApiKey('development', ['read', 'write'], 10000);
  console.log(`Development API Key: ${devKey}`);
}