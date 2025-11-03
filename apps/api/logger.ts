import pino from 'pino';

/**
 * Structured logger using Pino
 * Provides structured JSON logging with log levels
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Legacy log function for backward compatibility
 * @deprecated Use logger.info(), logger.error(), etc. directly
 */
export function log(message: string, source = "express") {
  logger.info({ source }, message);
}
