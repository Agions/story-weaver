/**
 * 请求工具 - 统一封装 Fetch + 缓存 + 重试
 */

import { requestCache } from './requestCache';
import type { RetryConfig } from '@/core/di';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  cache?: RequestCacheOptions | false;
  retry?: Partial<RetryConfig> | false;
  timeout?: number;
}

export interface RequestCacheOptions {
  /** 缓存 key */
  key: string;
  /** 缓存有效期（毫秒） */
  ttl?: number;
  /** 是否启用缓存 */
  enabled?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

class HttpClient {
  private baseURL = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  setBaseURL(url: string): void {
    this.baseURL = url.replace(/\/$/, '');
  }

  setAuth(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => searchParams.append(key, String(value)));
      url += `?${searchParams.toString()}`;
    }
    return url;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout?: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    retry?: Partial<RetryConfig>
  ): Promise<T> {
    if (retry === false) return fn();

    const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2 } = retry || {};
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(backoffMultiplier, attempt - 1)));
        }
      }
    }

    throw lastError;
  }

  async request<T>(
    method: string,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, cache, retry, timeout, headers, ...fetchOptions } = options;

    // 检查缓存
    if (cache && cache.enabled !== false) {
      const cacheKey = `${method}:${endpoint}:${JSON.stringify(params || {})}`;
      const cached = requestCache.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 构建请求
    const url = this.buildURL(endpoint, params);
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    const doFetch = async (): Promise<ApiResponse<T>> => {
      const response = await this.fetchWithTimeout(url, {
        method,
        headers: requestHeaders,
        ...fetchOptions,
      }, timeout);

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, await response.text());
      }

      const data = await response.json();
      const result: ApiResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };

      // 写入缓存
      if (cache && cache.enabled !== false) {
        const cacheKey = `${method}:${endpoint}:${JSON.stringify(params || {})}`;
        requestCache.set(cacheKey, result, cache.ttl);
      }

      return result;
    };

    // 执行请求（可选重试）
    const result = retry === false ? await doFetch() : await this.withRetry(doFetch, retry);
    return result;
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { ...options, body: body ? JSON.stringify(body) : undefined });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { ...options, body: body ? JSON.stringify(body) : undefined });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: string
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export const httpClient = new HttpClient();
