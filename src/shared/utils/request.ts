/**
 * frame-fab Shared Utils - Request Utilities & Request Cache
 */

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
    delay = 1000,
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
        let actualDelay = delay;
        if (backoff === 'exponential') actualDelay = delay * Math.pow(2, attempt);
        else if (backoff === 'linear') actualDelay = delay * (attempt + 1);

        if (onRetry) onRetry(attempt + 1, error);
        await new Promise((resolve) => setTimeout(resolve, actualDelay));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
};

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(timeoutError ?? new Error(`请求超时: ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

export const retryWithTimeout = async <T>(
  fn: () => Promise<T>,
  retryOptions: Partial<RetryOptions> = {},
  timeoutMs?: number
): Promise<T> => {
  const execute = () => (timeoutMs ? withTimeout(fn(), timeoutMs) : fn());
  return retryRequest(execute, retryOptions);
};

export const createCancellableRequest = <T>(
  fn: () => Promise<T>
): { request: Promise<T>; cancel: () => void } => {
  let cancelled = false;

  const request = (async () => {
    const result = await fn();
    if (cancelled) throw new Error('请求已取消');
    return result;
  })();

  const cancel = () => {
    cancelled = true;
  };
  return { request, cancel };
};

export const batchRequests = async <T>(
  items: unknown[],
  processor: (item: unknown) => Promise<T>,
  options: { concurrency?: number; onProgress?: (completed: number, total: number) => void } = {}
): Promise<T[]> => {
  const { concurrency = 3, onProgress } = options;
  const results: T[] = new Array(items.length);
  let completed = 0;

  const processItem = async (item: unknown, index: number) => {
    const result = await processor(item);
    results[index] = result;
    completed++;
    if (onProgress) onProgress(completed, items.length);
    return result;
  };

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    await Promise.all(batch.map((item, batchIndex) => processItem(item, i + batchIndex)));
  }

  return results;
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

export const withCache = async <T>(
  cache: RequestCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
};
