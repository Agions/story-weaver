/**
 * frame-fab Shared Utils - Request Utilities & Request Cache
 */
import { delay } from '@/shared/utils/timing';

export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff?: 'linear' | 'exponential' | 'none';
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const defaultRetryCondition = (error: unknown): boolean => {
  if (error instanceof TypeError) return true;
  if (error instanceof Response) return error.status >= 500 || error.status === 429;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('econnrefused')
    );
  }
  return false;
};

export const retryRequest = async <T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay: delayMs = 1000,
    backoff = 'exponential',
    retryCondition = defaultRetryCondition,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && retryCondition(error)) {
        let actualDelay = delayMs;
        if (backoff === 'exponential') actualDelay = delayMs * Math.pow(2, attempt);
        else if (backoff === 'linear') actualDelay = delayMs * (attempt + 1);

        if (onRetry) onRetry(attempt + 1, error);
        await delay(actualDelay);
      } else {
        throw error;
      }
    }
  }

  throw lastError;
};

// ========== Request Cache ==========

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 5 * 60 * 1000;
    this.maxSize = options.maxSize ?? 100;
  }

  private generateKey(...args: unknown[]): string {
    return JSON.stringify(args);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttl ?? this.ttl });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  deleteByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) keysToDelete.push(key);
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  size(): number {
    return this.cache.size;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export const requestCache = new RequestCache();
