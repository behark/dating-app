/**
 * Type definitions for logger utility
 */

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error | null, ...args: any[]): void;
  apiError(endpoint: string, method: string, status: number, error?: Error | null): void;
  apiRequest(endpoint: string, method: string): void;
}

export const LOG_LEVELS: {
  DEBUG: number;
  INFO: number;
  WARN: number;
  ERROR: number;
  NONE: number;
};

declare const logger: Logger;
export default logger;
export { Logger as LoggerClass };
