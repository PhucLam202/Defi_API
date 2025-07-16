import { AppError } from '../middleware/e/AppError';
import { ErrorCode } from '../middleware/e/ErrorCode';

export class InputValidator {
  
  static sanitizeString(input: string, maxLength: number = 100, allowedChars: RegExp = /^[a-zA-Z0-9\s\-_\.]+$/): string {
    if (!input || typeof input !== 'string') {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: must be a non-empty string');
    }
    
    const trimmed = input.trim();
    
    if (trimmed.length === 0) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: cannot be empty');
    }
    
    if (trimmed.length > maxLength) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid input: exceeds maximum length of ${maxLength}`);
    }
    
    if (!allowedChars.test(trimmed)) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: contains forbidden characters');
    }
    
    return trimmed;
  }
  
  static sanitizeAlphanumeric(input: string, maxLength: number = 50): string {
    if (!input || typeof input !== 'string') {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: must be a non-empty string');
    }
    
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, '');
    
    if (cleaned.length === 0) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: no valid characters found');
    }
    
    if (cleaned.length > maxLength) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid input: exceeds maximum length of ${maxLength}`);
    }
    
    return cleaned;
  }
  
  static sanitizeChainName(input: string): string {
    if (!input || typeof input !== 'string') {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid chain name: must be a non-empty string');
    }
    
    const cleaned = input.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
    
    if (cleaned.length === 0) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid chain name: no valid characters found');
    }
    
    if (cleaned.length > 50) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid chain name: exceeds maximum length of 50');
    }
    
    return cleaned.toLowerCase();
  }
  
  static validateSortBy(sortBy: string): 'id' | 'marketCap' | 'stability' | 'growth' | 'name' {
    const validOptions = ['id', 'marketCap', 'stability', 'growth', 'name'] as const;
    
    if (!validOptions.includes(sortBy as any)) {
      throw AppError.newError400(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid sortBy parameter. Must be one of: ${validOptions.join(', ')}`
      );
    }
    
    return sortBy as 'id' | 'marketCap' | 'stability' | 'growth' | 'name';
  }
  
  static validateSortOrder(sortOrder: string): 'asc' | 'desc' {
    const validOrders = ['asc', 'desc'] as const;
    
    if (!validOrders.includes(sortOrder as any)) {
      throw AppError.newError400(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid sortOrder parameter. Must be one of: ${validOrders.join(', ')}`
      );
    }
    
    return sortOrder as 'asc' | 'desc';
  }
  
  static validatePositiveNumber(input: string, fieldName: string, max?: number): number {
    const parsed = parseFloat(input);
    
    if (isNaN(parsed)) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must be a valid number`);
    }
    
    if (parsed < 0) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must be a positive number`);
    }
    
    if (max !== undefined && parsed > max) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must not exceed ${max}`);
    }
    
    return parsed;
  }
  
  static validateInteger(input: string, fieldName: string, min: number = 0, max?: number): number {
    const parsed = parseInt(input, 10);
    
    if (isNaN(parsed)) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must be a valid integer`);
    }
    
    if (parsed < min) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must be at least ${min}`);
    }
    
    if (max !== undefined && parsed > max) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must not exceed ${max}`);
    }
    
    return parsed;
  }
  
  static validateBoolean(input: string): boolean {
    const normalized = input.toLowerCase().trim();
    
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid boolean value: must be "true", "false", "1", or "0"');
  }
  
  static validatePegType(pegType: string): string {
    const validTypes = ['peggedUSD', 'peggedEUR', 'peggedGBP', 'peggedCHF', 'peggedJPY'];
    const normalized = pegType.toLowerCase();
    
    const matchedType = validTypes.find(type => type.toLowerCase().includes(normalized));
    
    if (!matchedType) {
      throw AppError.newError400(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid peg type. Supported types: ${validTypes.join(', ')}`
      );
    }
    
    return matchedType;
  }
  
  static validateMechanism(mechanism: string): string {
    const validMechanisms = ['fiat-backed', 'crypto-backed', 'algorithmic', 'hybrid'];
    const normalized = mechanism.toLowerCase().replace(/[^a-z-]/g, '');
    
    const matchedMechanism = validMechanisms.find(m => m.includes(normalized) || normalized.includes(m));
    
    if (!matchedMechanism) {
      throw AppError.newError400(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid mechanism. Supported mechanisms: ${validMechanisms.join(', ')}`
      );
    }
    
    return matchedMechanism;
  }
  
  static sanitizeUserAgent(userAgent: string): boolean {
    if (!userAgent || typeof userAgent !== 'string') {
      return false;
    }
    
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /http/i
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
  
  static validateThreshold(threshold: string): number {
    const parsed = parseFloat(threshold);
    
    if (isNaN(parsed)) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid threshold: must be a valid number');
    }
    
    if (parsed < 0 || parsed > 100) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid threshold: must be between 0 and 100');
    }
    
    return parsed;
  }
}