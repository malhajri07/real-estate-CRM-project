/**
 * Frontend Logger Utility
 * 
 * Provides structured logging for the frontend application.
 * In development, logs are shown in the console.
 * In production, logs are suppressed or sent to a logging service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  level?: LogLevel;
  context?: string;
  data?: Record<string, any>;
}

class Logger {
  private isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment) {
      // In production, only log errors and warnings
      return level === 'error' || level === 'warn';
    }
    return true;
  }

  private formatMessage(message: string, options?: LogOptions): string {
    const context = options?.context ? `[${options.context}]` : '';
    return `${context} ${message}`.trim();
  }

  debug(message: string, options?: LogOptions): void {
    if (!this.shouldLog('debug')) return;
    const formatted = this.formatMessage(message, options);
    if (options?.data) {
      console.debug(formatted, options.data);
    } else {
      console.debug(formatted);
    }
  }

  info(message: string, options?: LogOptions): void {
    if (!this.shouldLog('info')) return;
    const formatted = this.formatMessage(message, options);
    if (options?.data) {
      console.info(formatted, options.data);
    } else {
      console.info(formatted);
    }
  }

  warn(message: string, options?: LogOptions): void {
    if (!this.shouldLog('warn')) return;
    const formatted = this.formatMessage(message, options);
    if (options?.data) {
      console.warn(formatted, options.data);
    } else {
      console.warn(formatted);
    }
  }

  error(message: string, options?: LogOptions): void {
    // Always log errors, even in production
    const formatted = this.formatMessage(message, options);
    if (options?.data) {
      console.error(formatted, options.data);
    } else {
      console.error(formatted);
    }
  }
}

export const logger = new Logger();

/**
 * Legacy log function for backward compatibility
 * @deprecated Use logger.info(), logger.error(), etc. directly
 */
export function log(message: string, context?: string): void {
  logger.info(message, { context });
}

