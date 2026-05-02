/**
 * 统一日志管理工具
 * 替代全项目 console.log / console.warn / console.error
 *
 * 使用方式：
 *   import { logger } from '@/core/utils/logger';
 *   logger.info('message');
 *   logger.warn('warning');
 *   logger.error('error');
 *   logger.debug('debug info');
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
  enableColor?: boolean;
}

// 统一日志级别设置（兼容 Vite dev/build 和 Jest test 环境）
const DEFAULT_LEVEL = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ? LogLevel.INFO : LogLevel.DEBUG;

function getColorCode(color: string): string {
  const colors: Record<string, string> = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    info: '\x1b[36m',    // cyan
    warn: '\x1b[33m',    // yellow
    error: '\x1b[31m',   // red
    debug: '\x1b[90m',   // gray
    success: '\x1b[32m', // green
  };
  return colors[color] || colors.reset;
}

class Logger {
  private level: LogLevel;
  private prefix: string;
  private enableTimestamp: boolean;
  private enableColor: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? DEFAULT_LEVEL;
    this.prefix = options.prefix ?? '🐱';
    this.enableTimestamp = options.enableTimestamp ?? true;
    this.enableColor = options.enableColor ?? true;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string[] {
    const parts: string[] = [];
    const timestamp = this.enableTimestamp
      ? `[${new Date().toISOString().slice(11, 19)}]`
      : '';

    const levelTagMap: Record<number, string> = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO ',
      [LogLevel.WARN]: 'WARN ',
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.NONE]: 'NONE ',
    };
    const levelTag = levelTagMap[level] ?? 'INFO ';

    const colorFn = (text: string, color: string) =>
      this.enableColor ? `${getColorCode(color)}${text}${getColorCode('reset')}` : text;

    parts.push(colorFn(`${this.prefix} ${timestamp} ${levelTag}`, level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warn' : level === LogLevel.DEBUG ? 'debug' : 'info'));
    parts.push(message);

    if (data !== undefined) {
      try {
        if (typeof data === 'object') {
          parts.push(JSON.stringify(data, null, 2));
        } else {
          parts.push(String(data));
        }
      } catch {
        parts.push('[Object]');
      }
    }

    return parts;
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const parts = this.formatMessage(LogLevel.DEBUG, message, data);
    // eslint-disable-next-line no-console
    console.debug(...parts);
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const parts = this.formatMessage(LogLevel.INFO, message, data);
    // eslint-disable-next-line no-console
    console.info(...parts);
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const parts = this.formatMessage(LogLevel.WARN, message, data);
    console.warn(...parts);
  }

  error(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const parts = this.formatMessage(LogLevel.ERROR, message, data);
    console.error(...parts);
  }

  success(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const msg = `${getColorCode('success')}✓ ${message}${getColorCode('reset')}`;
    // eslint-disable-next-line no-console
    console.info(msg, data ?? '');
  }

  // 切换日志级别
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // 获取当前级别
  getLevel(): LogLevel {
    return this.level;
  }
}

// 默认导出单例，全项目共享
export const logger = new Logger({
  level: DEFAULT_LEVEL,
  prefix: '🎬',
  enableTimestamp: true,
  enableColor: true,
});

// 便捷函数
export const createLogger = (options: LoggerOptions) => new Logger(options);

// 快速替换 console 的兼容层
export const consoleLogger = {
  log: (...args: unknown[]) => logger.info(String(args[0]), args.slice(1)),
  warn: (...args: unknown[]) => logger.warn(String(args[0]), args.slice(1)),
  error: (...args: unknown[]) => logger.error(String(args[0]), args.slice(1)),
  info: (...args: unknown[]) => logger.info(String(args[0]), args.slice(1)),
  debug: (...args: unknown[]) => logger.debug(String(args[0]), args.slice(1)),
};

export default logger;
