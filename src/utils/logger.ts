interface LogLevel {
  INFO: string;
  WARN: string;
  ERROR: string;
  DEBUG: string;
}

const LOG_LEVELS: LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN', 
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private sanitizeLogData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'secret', 'token', 'key', 'apiKey', 'auth', 'authorization',
      'cookie', 'session', 'csrf', 'jwt', 'bearer', 'credentials', 'private',
      'ssn', 'social', 'credit', 'card', 'cvv', 'pin', 'account', 'banking'
    ];

    const redactValue = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(redactValue);
      }
      
      if (obj && typeof obj === 'object') {
        const redacted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            redacted[key] = '[REDACTED]';
          } else {
            redacted[key] = redactValue(value);
          }
        }
        return redacted;
      }
      
      return obj;
    };

    return redactValue(sanitized);
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = this.getTimestamp();
    const sanitizedMeta = this.sanitizeLogData(meta);
    const metaStr = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  info(message: string, meta?: any): void {
    console.log(this.formatMessage(LOG_LEVELS.INFO, message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
  }

  error(message: string, meta?: any): void {
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  // Security-focused logging methods
  security(message: string, meta?: any): void {
    const securityMeta = {
      ...this.sanitizeLogData(meta),
      severity: 'SECURITY',
      timestamp: this.getTimestamp()
    };
    console.warn(this.formatMessage('SECURITY', message, securityMeta));
  }

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