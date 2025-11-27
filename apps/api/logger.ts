/**
 * logger.ts - Application Logger
 * 
 * Location: apps/api/ → Core Application Files → logger.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Structured logger using Pino. Provides:
 * - Structured JSON logging
 * - Log levels (debug, info, warn, error)
 * - Pretty printing in development
 * 
 * Related Files:
 * - Used throughout the application for logging
 */

import pino from 'pino';
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
