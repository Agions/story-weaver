/**
 * BaseService - 服务基类
 * 提供通用功能：日志、错误处理、重试机制
 */

import { logger } from '@/core/utils/logger';

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

export abstract class BaseService {
  protected readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  protected log = {
    info: (message: string, ...args: unknown[]) => logger.info(`[${this.name}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(`[${this.name}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => logger.error(`[${this.name}] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => logger.debug(`[${this.name}] ${message}`, ...args),
  };

  /**
   * 带重试的异步操作
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const { maxAttempts, delayMs, backoffMultiplier } = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.log.warn(`Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);

        if (attempt < maxAttempts) {
          const delay = delayMs * Math.pow(backoffMultiplier || 1, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * 睡眠函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 安全的异步操作，即使失败也不抛出
   */
  protected async safeAsync<T>(fn: () => Promise<T>, defaultValue: T): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.log.error('Safe async operation failed:', error);
      return defaultValue;
    }
  }

  /**
   * 超时包装
   */
  protected withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}
