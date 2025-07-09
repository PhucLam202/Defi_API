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

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = this.getTimestamp();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
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
}

export const logger = new Logger();