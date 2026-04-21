/**
 * 全局 logger 声明
 * 所有文件可直接使用 logger，无需每次导入
 */
declare const logger: {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  success(message: string, data?: unknown): void;
  setLevel(level: number): void;
};
