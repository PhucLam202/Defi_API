/// # Security-Focused Logger Utility
/// 
/// Enterprise-grade logging system with automatic sensitive data sanitization,
/// structured formatting, and specialized logging methods for security monitoring.
/// 
/// ## Security Features:
/// - **Automatic Data Sanitization**: Removes sensitive fields from log entries
/// - **Structured Logging**: Consistent timestamp and metadata formatting
/// - **Security Event Logging**: Specialized methods for audit and security events
/// - **Performance Monitoring**: Built-in performance tracking capabilities
/// - **Environment-Aware**: Debug logging only in development mode
/// 
/// ## Sensitive Data Protection:
/// Automatically redacts fields containing:
/// - Authentication data (tokens, keys, passwords)
/// - Personal information (SSN, account numbers)
/// - Payment data (credit cards, CVV, banking info)
/// - Session data (cookies, CSRF tokens)
/// 
/// ## Log Levels:
/// - **INFO**: General application information
/// - **WARN**: Warning conditions that need attention
/// - **ERROR**: Error conditions that affect functionality
/// - **DEBUG**: Detailed debugging information (dev only)
/// - **SECURITY**: Security-related events requiring monitoring
/// - **AUDIT**: User action tracking for compliance
/// - **PERFORMANCE**: Operation timing and performance metrics

/// ## Log Level Interface
/// 
/// Defines the structure for available log levels in the system.
interface LogLevel {
  INFO: string;
  WARN: string;
  ERROR: string;
  DEBUG: string;
}

/// ## Log Level Constants
/// 
/// Centralized log level definitions for consistent logging across the application.
const LOG_LEVELS: LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN', 
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

/// ## Logger Class
/// 
/// Main logging implementation with security-focused data sanitization
/// and structured message formatting.
/// 
/// ### Features:
/// - **Automatic Sanitization**: Prevents sensitive data leakage
/// - **Structured Output**: Consistent timestamp and metadata formatting
/// - **Specialized Methods**: Security, audit, and performance logging
/// - **Environment Awareness**: Debug logging control based on NODE_ENV
class Logger {
  /// ## Timestamp Generator
  /// 
  /// Generates ISO 8601 formatted timestamps for consistent log formatting.
  /// 
  /// **@returns {string}** - ISO 8601 timestamp string
  /// **@example** "2024-01-01T00:00:00.000Z"
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /// ## Data Sanitization Method
  /// 
  /// Recursively sanitizes log data to prevent sensitive information disclosure.
  /// Uses comprehensive pattern matching to identify and redact sensitive fields.
  /// 
  /// **@param {any} data** - Data object to sanitize
  /// **@returns {any}** - Sanitized data with sensitive fields redacted
  /// **@security** Critical for preventing sensitive data leakage in logs
  /// 
  /// ### Sensitive Field Categories:
  /// 1. **Authentication**: password, secret, token, key, apiKey, auth
  /// 2. **Session Management**: cookie, session, csrf, jwt, bearer
  /// 3. **Personal Data**: ssn, social, account, banking
  /// 4. **Payment Data**: credit, card, cvv, pin
  /// 5. **Credentials**: credentials, private, authorization
  /// 
  /// ### Security Approach:
  /// - **Deep Recursion**: Sanitizes nested objects and arrays
  /// - **Case-Insensitive**: Matches field names regardless of case
  /// - **Partial Matching**: Detects sensitive fields within longer names
  /// - **Safe Defaults**: Returns original data for non-objects
  private sanitizeLogData(data: any): any {
    /// PRIMITIVE DATA: Return as-is for non-objects
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    
    /// SENSITIVE FIELD PATTERNS: Comprehensive list of sensitive data indicators
    /// These patterns catch common sensitive field names across different naming conventions
    const sensitiveFields = [
      'password', 'secret', 'token', 'key', 'apiKey', 'auth', 'authorization',
      'cookie', 'session', 'csrf', 'jwt', 'bearer', 'credentials', 'private',
      'ssn', 'social', 'credit', 'card', 'cvv', 'pin', 'account', 'banking'
    ];

    /// RECURSIVE REDACTION: Deep sanitization for complex data structures
    const redactValue = (obj: any): any => {
      /// ARRAY HANDLING: Recursively sanitize array elements
      if (Array.isArray(obj)) {
        return obj.map(redactValue);
      }
      
      /// OBJECT HANDLING: Field-by-field sanitization
      if (obj && typeof obj === 'object') {
        const redacted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          /// SENSITIVE FIELD CHECK: Case-insensitive partial matching
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            redacted[key] = '[REDACTED]'; // Replace sensitive data
          } else {
            redacted[key] = redactValue(value); // Recursively process nested data
          }
        }
        return redacted;
      }
      
      /// PRIMITIVE VALUES: Return unchanged
      return obj;
    };

    return redactValue(sanitized);
  }

  /// ## Message Formatting Method
  /// 
  /// Formats log messages with consistent structure including timestamp,
  /// log level, message, and sanitized metadata.
  /// 
  /// **@param {string} level** - Log level (INFO, WARN, ERROR, etc.)
  /// **@param {string} message** - Primary log message
  /// **@param {any} meta** - Optional metadata object
  /// **@returns {string}** - Formatted log message
  /// 
  /// ### Format Structure:
  /// ```
  /// [2024-01-01T00:00:00.000Z] [INFO] Message text {"meta": "data"}
  /// ```
  /// 
  /// ### Security Features:
  /// - Automatic metadata sanitization
  /// - Structured JSON metadata formatting
  /// - Consistent timestamp formatting
  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = this.getTimestamp();
    const sanitizedMeta = this.sanitizeLogData(meta);
    const metaStr = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  /// ## Info Logging Method
  /// 
  /// Logs general information messages with sanitized metadata.
  /// 
  /// **@param {string} message** - Information message
  /// **@param {any} meta** - Optional metadata object
  /// **@use_case** Application flow, successful operations, status updates
  info(message: string, meta?: any): void {
    console.log(this.formatMessage(LOG_LEVELS.INFO, message, meta));
  }

  /// ## Warning Logging Method
  /// 
  /// Logs warning conditions that need attention but don't prevent operation.
  /// 
  /// **@param {string} message** - Warning message
  /// **@param {any} meta** - Optional metadata object
  /// **@use_case** Rate limit warnings, deprecated features, recoverable errors
  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
  }

  /// ## Error Logging Method
  /// 
  /// Logs error conditions that affect application functionality.
  /// 
  /// **@param {string} message** - Error message
  /// **@param {any} meta** - Optional metadata object
  /// **@use_case** API failures, validation errors, system exceptions
  error(message: string, meta?: any): void {
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
  }

  /// ## Debug Logging Method
  /// 
  /// Logs detailed debugging information (development mode only).
  /// 
  /// **@param {string} message** - Debug message
  /// **@param {any} meta** - Optional metadata object
  /// **@environment** Only active when NODE_ENV === 'development'
  /// **@use_case** Debugging, development troubleshooting, detailed tracing
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /// ## Security Event Logging Method
  /// 
  /// Specialized logging for security-related events requiring immediate attention.
  /// Enhanced with security-specific metadata and elevated severity.
  /// 
  /// **@param {string} message** - Security event description
  /// **@param {any} meta** - Optional metadata object
  /// **@use_case** Rate limit violations, suspicious requests, authentication failures
  /// **@monitoring** Should trigger alerting in production environments
  security(message: string, meta?: any): void {
    const securityMeta = {
      ...this.sanitizeLogData(meta),
      severity: 'SECURITY',
      timestamp: this.getTimestamp()
    };
    console.warn(this.formatMessage('SECURITY', message, securityMeta));
  }

  /// ## Audit Trail Logging Method
  /// 
  /// Logs user actions for compliance and security auditing.
  /// Includes structured metadata for action tracking.
  /// 
  /// **@param {string} action** - Action performed by user
  /// **@param {string} userId** - User identifier (optional, defaults to 'anonymous')
  /// **@param {string} resource** - Resource accessed (optional, defaults to 'unknown')
  /// **@param {any} meta** - Additional audit metadata
  /// **@use_case** User action tracking, compliance logging, security audits
  /// **@retention** Audit logs typically require long-term retention
  audit(action: string, userId?: string, resource?: string, meta?: any): void {
    const auditMeta = {
      action,
      userId: userId || 'anonymous',
      resource: resource || 'unknown',
      timestamp: this.getTimestamp(),
      ...this.sanitizeLogData(meta)
    };
    console.log(this.formatMessage('AUDIT', `User action: ${action}`, auditMeta));
  }

  /// ## Performance Monitoring Logging Method
  /// 
  /// Logs operation performance metrics for monitoring and optimization.
  /// Includes timing data and operation context.
  /// 
  /// **@param {string} operation** - Operation name or identifier
  /// **@param {number} duration** - Operation duration in milliseconds
  /// **@param {any} meta** - Additional performance metadata
  /// **@use_case** Performance monitoring, bottleneck identification, SLA tracking
  /// **@analysis** Used for performance trending and optimization
  performance(operation: string, duration: number, meta?: any): void {
    const perfMeta = {
      operation,
      duration,
      unit: 'ms',
      ...this.sanitizeLogData(meta)
    };
    console.log(this.formatMessage('PERFORMANCE', `Operation completed: ${operation}`, perfMeta));
  }
}

export const logger = new Logger();