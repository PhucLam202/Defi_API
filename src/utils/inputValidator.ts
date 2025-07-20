/// # Input Validation Utility
/// 
/// Comprehensive input validation and sanitization utility providing
/// enterprise-grade security for all user inputs across the API.
/// 
/// ## Security Features:
/// - **Injection Prevention**: Blocks SQL, XSS, command injection attempts
/// - **DoS Protection**: Length limits and resource exhaustion prevention
/// - **Format Validation**: Strict pattern matching for expected formats
/// - **Type Safety**: Runtime type checking with TypeScript integration
/// - **Sanitization**: Automatic cleaning of suspicious characters
/// 
/// ## Validation Categories:
/// 
/// ### String Validation:
/// - **General Strings**: Configurable length and character restrictions
/// - **Alphanumeric**: Numbers and letters only
/// - **Chain Names**: Blockchain network identifiers
/// 
/// ### Numeric Validation:
/// - **Positive Numbers**: Float validation with optional maximum
/// - **Integers**: Integer validation with min/max bounds
/// - **Thresholds**: Percentage validation (0-100)
/// 
/// ### Enumeration Validation:
/// - **Sort Options**: Predefined sorting criteria
/// - **Boolean Values**: Flexible true/false parsing
/// - **Peg Types**: Stablecoin peg mechanism validation
/// 
/// ### Security Validation:
/// - **User Agent**: Suspicious pattern detection
/// - **Chain Names**: Network identifier sanitization
/// - **Mechanism Types**: DeFi mechanism validation

import { AppError } from '../middleware/e/AppError.js';
import { ErrorCode } from '../middleware/e/ErrorCode.js';

/// ## InputValidator Class
/// 
/// Static utility class providing comprehensive input validation methods
/// with security-first approach and consistent error handling.
/// 
/// ### Design Principles:
/// - **Static Methods**: No state, pure validation functions
/// - **Fail-Safe**: Throws structured errors for invalid input
/// - **Consistent**: Uniform validation patterns across methods
/// - **Configurable**: Flexible parameters for different use cases
export class InputValidator {
  
  /// ## General String Sanitization
  /// 
  /// Validates and sanitizes general string input with configurable length
  /// and character restrictions for injection prevention.
  /// 
  /// **@param {string} input** - Input string to validate
  /// **@param {number} maxLength** - Maximum allowed length (default: 100)
  /// **@param {RegExp} allowedChars** - Allowed character pattern (default: alphanumeric + safe symbols)
  /// **@returns {string}** - Trimmed and validated string
  /// **@throws {AppError}** - 400 error for invalid input
  /// 
  /// ### Security Features:
  /// - **Null Safety**: Prevents null/undefined injection
  /// - **Length Limits**: DoS protection via size constraints
  /// - **Character Filtering**: Blocks special characters used in injection attacks
  /// - **Whitespace Handling**: Automatic trimming with empty string detection
  /// 
  /// ### Default Allowed Characters:
  /// - **Letters**: a-z, A-Z
  /// - **Numbers**: 0-9
  /// - **Safe Symbols**: space, hyphen, underscore, period
  static sanitizeString(input: string, maxLength: number = 100, allowedChars: RegExp = /^[a-zA-Z0-9\s\-_\.]+$/): string {
    /// NULL SAFETY: Prevent null/undefined injection
    if (!input || typeof input !== 'string') {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: must be a non-empty string');
    }
    
    /// WHITESPACE HANDLING: Trim and check for empty strings
    const trimmed = input.trim();
    
    if (trimmed.length === 0) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: cannot be empty');
    }
    
    /// DOS PROTECTION: Prevent oversized inputs
    if (trimmed.length > maxLength) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid input: exceeds maximum length of ${maxLength}`);
    }
    
    /// INJECTION PREVENTION: Block suspicious characters
    if (!allowedChars.test(trimmed)) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: contains forbidden characters');
    }
    
    return trimmed;
  }
  
  /// ## Alphanumeric String Sanitization
  /// 
  /// Aggressively sanitizes input to contain only alphanumeric characters.
  /// Removes all special characters, symbols, and whitespace.
  /// 
  /// **@param {string} input** - Input string to sanitize
  /// **@param {number} maxLength** - Maximum allowed length (default: 50)
  /// **@returns {string}** - Cleaned alphanumeric string
  /// **@throws {AppError}** - 400 error for invalid input
  /// 
  /// ### Security Features:
  /// - **Aggressive Cleaning**: Removes ALL non-alphanumeric characters
  /// - **Injection Prevention**: Eliminates potential injection vectors
  /// - **Length Validation**: DoS protection with shorter default limit
  /// - **Empty String Detection**: Prevents submission of cleaned empty strings
  /// 
  /// ### Use Cases:
  /// - Token symbols (e.g., "USDT", "vDOT")
  /// - Stablecoin IDs (e.g., "tether", "usdcoin")
  /// - Simple identifiers requiring strict format
  static sanitizeAlphanumeric(input: string, maxLength: number = 50): string {
    /// NULL SAFETY: Prevent null/undefined injection
    if (!input || typeof input !== 'string') {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: must be a non-empty string');
    }
    
    /// AGGRESSIVE SANITIZATION: Remove all non-alphanumeric characters
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, '');
    
    /// EMPTY RESULT CHECK: Ensure cleaning didn't remove all content
    if (cleaned.length === 0) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid input: no valid characters found');
    }
    
    /// DOS PROTECTION: Shorter length limit for stricter validation
    if (cleaned.length > maxLength) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid input: exceeds maximum length of ${maxLength}`);
    }
    
    return cleaned;
  }
  
  /// ## Blockchain Name Sanitization
  /// 
  /// Sanitizes and normalizes blockchain network names for consistent
  /// identification and comparison across the system.
  /// 
  /// **@param {string} input** - Chain name to sanitize
  /// **@returns {string}** - Normalized lowercase chain name
  /// **@throws {AppError}** - 400 error for invalid chain name
  /// 
  /// ### Security Features:
  /// - **Character Filtering**: Allows only safe blockchain name characters
  /// - **Case Normalization**: Converts to lowercase for consistency
  /// - **Length Limits**: Prevents abuse with reasonable 50-character limit
  /// - **Whitespace Handling**: Trims and allows internal spaces
  /// 
  /// ### Allowed Characters:
  /// - **Letters**: a-z, A-Z (normalized to lowercase)
  /// - **Numbers**: 0-9
  /// - **Separators**: space, hyphen, underscore
  /// 
  /// ### Examples:
  /// - "Ethereum" → "ethereum"
  /// - "Binance Smart Chain" → "binance smart chain"
  /// - "polygon-matic" → "polygon-matic"
  static sanitizeChainName(input: string): string {
    /// NULL SAFETY: Prevent null/undefined injection
    if (!input || typeof input !== 'string') {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid chain name: must be a non-empty string');
    }
    
    /// SANITIZATION: Remove suspicious characters, keep chain-safe separators
    const cleaned = input.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
    
    /// EMPTY RESULT CHECK: Ensure cleaning didn't remove all content
    if (cleaned.length === 0) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid chain name: no valid characters found');
    }
    
    /// LENGTH VALIDATION: Reasonable limit for blockchain names
    if (cleaned.length > 50) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid chain name: exceeds maximum length of 50');
    }
    
    /// NORMALIZATION: Convert to lowercase for consistent comparison
    return cleaned.toLowerCase();
  }
  
  /// ## Sort Field Validation
  /// 
  /// Validates sort field parameters against allowed options with strict
  /// type checking and enumeration enforcement.
  /// 
  /// **@param {string} sortBy** - Sort field to validate
  /// **@returns {'id' | 'marketCap' | 'stability' | 'growth' | 'name'}** - Validated sort field
  /// **@throws {AppError}** - 400 error for invalid sort option
  /// 
  /// ### Allowed Sort Fields:
  /// - **id**: Sort by unique identifier
  /// - **marketCap**: Sort by market capitalization
  /// - **stability**: Sort by peg stability percentage
  /// - **growth**: Sort by growth rate metrics
  /// - **name**: Sort alphabetically by name
  /// 
  /// ### Security Features:
  /// - **Enumeration Validation**: Prevents injection via invalid sort fields
  /// - **Type Safety**: Returns strictly typed union type
  /// - **Clear Error Messages**: Provides list of valid options
  static validateSortBy(sortBy: string): 'id' | 'marketCap' | 'stability' | 'growth' | 'name' {
    const validOptions = ['id', 'marketCap', 'stability', 'growth', 'name'] as const;
    
    /// ENUMERATION CHECK: Ensure sort field is in allowed list
    if (!validOptions.includes(sortBy as any)) {
      throw AppError.newError400(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid sortBy parameter. Must be one of: ${validOptions.join(', ')}`
      );
    }
    
    /// TYPE CAST: Return with strict type safety
    return sortBy as 'id' | 'marketCap' | 'stability' | 'growth' | 'name';
  }
  
  /// ## Sort Direction Validation
  /// 
  /// Validates sort direction parameters with strict enumeration checking.
  /// 
  /// **@param {string} sortOrder** - Sort direction to validate
  /// **@returns {'asc' | 'desc'}** - Validated sort direction
  /// **@throws {AppError}** - 400 error for invalid sort direction
  /// 
  /// ### Allowed Sort Directions:
  /// - **asc**: Ascending order (smallest to largest)
  /// - **desc**: Descending order (largest to smallest)
  /// 
  /// ### Security Features:
  /// - **Enumeration Validation**: Prevents injection via invalid sort directions
  /// - **Type Safety**: Returns strictly typed union type
  /// - **Simple Validation**: Binary choice with clear error messaging
  static validateSortOrder(sortOrder: string): 'asc' | 'desc' {
    const validOrders = ['asc', 'desc'] as const;
    
    /// ENUMERATION CHECK: Ensure sort direction is valid
    if (!validOrders.includes(sortOrder as any)) {
      throw AppError.newError400(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid sortOrder parameter. Must be one of: ${validOrders.join(', ')}`
      );
    }
    
    /// TYPE CAST: Return with strict type safety
    return sortOrder as 'asc' | 'desc';
  }
  
  /// ## Positive Number Validation
  /// 
  /// Validates and parses positive floating-point numbers with optional
  /// maximum value constraints.
  /// 
  /// **@param {string} input** - String representation of number
  /// **@param {string} fieldName** - Field name for error messages
  /// **@param {number} max** - Optional maximum value constraint
  /// **@returns {number}** - Validated positive number
  /// **@throws {AppError}** - 400 error for invalid number
  /// 
  /// ### Validation Rules:
  /// - **Format**: Must be parseable as float
  /// - **Sign**: Must be positive (>= 0)
  /// - **Range**: Optional maximum value checking
  /// - **NaN Protection**: Explicit NaN checking
  /// 
  /// ### Use Cases:
  /// - Market cap filters (minMarketCap)
  /// - APY thresholds
  /// - Amount validations
  /// - Percentage values
  static validatePositiveNumber(input: string, fieldName: string, max?: number): number {
    /// PARSING: Convert string to float with NaN detection
    const parsed = parseFloat(input);
    
    if (isNaN(parsed)) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must be a valid number`);
    }
    
    /// SIGN CHECK: Ensure non-negative value
    if (parsed < 0) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must be a positive number`);
    }
    
    /// RANGE CHECK: Optional maximum value constraint
    if (max !== undefined && parsed > max) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must not exceed ${max}`);
    }
    
    return parsed;
  }
  
  /// ## Integer Validation
  /// 
  /// Validates and parses integer values with configurable min/max bounds
  /// for pagination and limit parameters.
  /// 
  /// **@param {string} input** - String representation of integer
  /// **@param {string} fieldName** - Field name for error messages
  /// **@param {number} min** - Minimum allowed value (default: 0)
  /// **@param {number} max** - Optional maximum allowed value
  /// **@returns {number}** - Validated integer
  /// **@throws {AppError}** - 400 error for invalid integer
  /// 
  /// ### Validation Rules:
  /// - **Format**: Must be parseable as integer (base 10)
  /// - **Range**: Configurable minimum and maximum bounds
  /// - **NaN Protection**: Explicit NaN checking
  /// - **Bounds Checking**: Prevents out-of-range values
  /// 
  /// ### Use Cases:
  /// - Pagination limits (1-100)
  /// - Pagination offsets (>= 0)
  /// - Count parameters
  /// - Index values
  static validateInteger(input: string, fieldName: string, min: number = 0, max?: number): number {
    /// PARSING: Convert string to integer with explicit base 10
    const parsed = parseInt(input, 10);
    
    if (isNaN(parsed)) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must be a valid integer`);
    }
    
    /// MINIMUM CHECK: Ensure value meets minimum requirement
    if (parsed < min) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must be at least ${min}`);
    }
    
    /// MAXIMUM CHECK: Optional upper bound validation
    if (max !== undefined && parsed > max) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, `Invalid ${fieldName}: must not exceed ${max}`);
    }
    
    return parsed;
  }
  
  /// ## Boolean Validation
  /// 
  /// Flexible boolean parsing supporting multiple string representations
  /// for user-friendly API parameter handling.
  /// 
  /// **@param {string} input** - String representation of boolean
  /// **@returns {boolean}** - Parsed boolean value
  /// **@throws {AppError}** - 400 error for invalid boolean format
  /// 
  /// ### Accepted True Values:
  /// - "true" (case-insensitive)
  /// - "1"
  /// 
  /// ### Accepted False Values:
  /// - "false" (case-insensitive)
  /// - "0"
  /// 
  /// ### Security Features:
  /// - **Case Insensitive**: Accepts "TRUE", "True", "true"
  /// - **Whitespace Handling**: Automatic trimming
  /// - **Strict Validation**: Only accepts defined values
  /// - **Clear Error Messages**: Lists accepted formats
  static validateBoolean(input: string): boolean {
    /// NORMALIZATION: Convert to lowercase and trim whitespace
    const normalized = input.toLowerCase().trim();
    
    /// TRUE VALUE CHECK: Accept "true" and "1"
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    
    /// FALSE VALUE CHECK: Accept "false" and "0"
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    
    /// VALIDATION ERROR: Reject unrecognized boolean formats
    throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid boolean value: must be "true", "false", "1", or "0"');
  }
  
  /// ## Stablecoin Peg Type Validation
  /// 
  /// Validates stablecoin peg types with flexible matching for user convenience
  /// while maintaining strict output format.
  /// 
  /// **@param {string} pegType** - Peg type to validate
  /// **@returns {string}** - Validated canonical peg type
  /// **@throws {AppError}** - 400 error for unsupported peg type
  /// 
  /// ### Supported Peg Types:
  /// - **peggedUSD**: US Dollar pegged stablecoins
  /// - **peggedEUR**: Euro pegged stablecoins
  /// - **peggedGBP**: British Pound pegged stablecoins
  /// - **peggedCHF**: Swiss Franc pegged stablecoins
  /// - **peggedJPY**: Japanese Yen pegged stablecoins
  /// 
  /// ### Matching Strategy:
  /// - **Case Insensitive**: "USD" matches "peggedUSD"
  /// - **Partial Matching**: "usd" matches "peggedUSD"
  /// - **Canonical Return**: Always returns official format
  static validatePegType(pegType: string): string {
    const validTypes = ['peggedUSD', 'peggedEUR', 'peggedGBP', 'peggedCHF', 'peggedJPY'];
    const normalized = pegType.toLowerCase();
    
    /// FLEXIBLE MATCHING: Find type containing the input (case-insensitive)
    const matchedType = validTypes.find(type => type.toLowerCase().includes(normalized));
    
    /// VALIDATION CHECK: Ensure peg type is supported
    if (!matchedType) {
      throw AppError.newError400(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid peg type. Supported types: ${validTypes.join(', ')}`
      );
    }
    
    /// CANONICAL RETURN: Return official format
    return matchedType;
  }
  
  /// ## Stablecoin Mechanism Validation
  /// 
  /// Validates stablecoin peg mechanisms with flexible input matching
  /// and normalization for consistent mechanism identification.
  /// 
  /// **@param {string} mechanism** - Mechanism type to validate
  /// **@returns {string}** - Validated canonical mechanism type
  /// **@throws {AppError}** - 400 error for unsupported mechanism
  /// 
  /// ### Supported Mechanisms:
  /// - **fiat-backed**: Backed by traditional fiat currency reserves
  /// - **crypto-backed**: Collateralized by cryptocurrency
  /// - **algorithmic**: Algorithmic supply management
  /// - **hybrid**: Combination of multiple mechanisms
  /// 
  /// ### Matching Strategy:
  /// - **Normalization**: Converts to lowercase, removes non-alphanumeric except hyphens
  /// - **Bidirectional Matching**: "fiat" matches "fiat-backed", "crypto-backed" matches "crypto"
  /// - **Flexible Input**: Accepts variations like "algorithmic", "algo", "fiat", etc.
  static validateMechanism(mechanism: string): string {
    const validMechanisms = ['fiat-backed', 'crypto-backed', 'algorithmic', 'hybrid'];
    /// NORMALIZATION: Clean input for flexible matching
    const normalized = mechanism.toLowerCase().replace(/[^a-z-]/g, '');
    
    /// BIDIRECTIONAL MATCHING: Check both directions for partial matches
    const matchedMechanism = validMechanisms.find(m => m.includes(normalized) || normalized.includes(m));
    
    /// VALIDATION CHECK: Ensure mechanism is supported
    if (!matchedMechanism) {
      throw AppError.newError400(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid mechanism. Supported mechanisms: ${validMechanisms.join(', ')}`
      );
    }
    
    /// CANONICAL RETURN: Return official format
    return matchedMechanism;
  }
  
  /// ## User Agent Security Validation
  /// 
  /// Analyzes User-Agent strings to detect suspicious automated clients
  /// that may be attempting to abuse the API.
  /// 
  /// **@param {string} userAgent** - User-Agent header value
  /// **@returns {boolean}** - true if User-Agent appears legitimate, false if suspicious
  /// 
  /// ### Suspicious Patterns Detected:
  /// - **Bots**: "bot", "crawler", "spider"
  /// - **Scrapers**: "scraper"
  /// - **Automated Tools**: "curl", "wget"
  /// - **Programming Libraries**: "python", "http"
  /// 
  /// ### Security Purpose:
  /// - **Abuse Prevention**: Identifies automated clients for stricter rate limiting
  /// - **Resource Protection**: Helps prevent scraping and excessive API usage
  /// - **Behavioral Analysis**: Assists in identifying non-human traffic patterns
  /// 
  /// ### Usage in Rate Limiting:
  /// - **Legitimate Clients**: 100 requests per minute
  /// - **Suspicious Clients**: 20 requests per minute (stricter limits)
  static sanitizeUserAgent(userAgent: string): boolean {
    /// NULL SAFETY: Handle missing or invalid User-Agent headers
    if (!userAgent || typeof userAgent !== 'string') {
      return false; // Missing User-Agent is considered suspicious
    }
    
    /// SUSPICIOUS PATTERN DETECTION: Case-insensitive pattern matching
    const suspiciousPatterns = [
      /bot/i,       // Bot indicators
      /crawler/i,   // Web crawlers
      /spider/i,    // Web spiders
      /scraper/i,   // Data scrapers
      /curl/i,      // cURL command line tool
      /wget/i,      // wget download tool
      /python/i,    // Python HTTP libraries
      /http/i       // Generic HTTP client libraries
    ];
    
    /// LEGITIMACY CHECK: Return true if NO suspicious patterns found
    return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
  
  /// ## Percentage Threshold Validation
  /// 
  /// Validates percentage thresholds for stability and risk metrics
  /// with strict range checking.
  /// 
  /// **@param {string} threshold** - Threshold percentage as string
  /// **@returns {number}** - Validated threshold value (0-100)
  /// **@throws {AppError}** - 400 error for invalid threshold
  /// 
  /// ### Validation Rules:
  /// - **Range**: Must be between 0 and 100 (inclusive)
  /// - **Format**: Must be parseable as float
  /// - **Precision**: Supports decimal values (e.g., 99.5)
  /// 
  /// ### Use Cases:
  /// - **Depegging Thresholds**: Stability percentage for risk monitoring
  /// - **Performance Filters**: APY percentage thresholds
  /// - **Risk Assessment**: Stability criteria for categorization
  /// 
  /// ### Examples:
  /// - "99" → 99.0 (depegging threshold)
  /// - "99.5" → 99.5 (precise stability threshold)
  /// - "0" → 0.0 (include all, no filtering)
  static validateThreshold(threshold: string): number {
    /// PARSING: Convert string to float with NaN detection
    const parsed = parseFloat(threshold);
    
    if (isNaN(parsed)) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid threshold: must be a valid number');
    }
    
    /// RANGE VALIDATION: Ensure percentage is within valid bounds
    if (parsed < 0 || parsed > 100) {
      throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid threshold: must be between 0 and 100');
    }
    
    return parsed;
  }
}