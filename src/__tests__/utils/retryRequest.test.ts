/**
 * RetryRequest 工具测试
 */

import {
  retryRequest,
  withTimeout,
  retryWithTimeout,
  createCancellableRequest,
  batchRequests
} from '@/core/utils/retryRequest';

describe('retryRequest', () => {
  beforeEach(() => {
    // Mock Response for jsdom environment
    global.Response = class Response {
      status: number;
      constructor(body?: string, init?: { status?: number }) {
        this.status = init?.status ?? 200;
      }
      static error(): Response {
        return new Response(undefined, { status: 0 });
      }
      static redirect(url: string | URL, status?: number): Response {
        return new Response(undefined, { status: status ?? 302 });
      }
    } as unknown as typeof Response;
  });

  it('应该成功执行不重试', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    
    const result = await retryRequest(fn, { maxRetries: 3, delay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该重试网络错误', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce('success');
    
    const result = await retryRequest(fn, { maxRetries: 3, delay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('应该重试 HTTP 500 错误', async () => {
    const response = new global.Response('', { status: 500 });
    const fn = jest.fn()
      .mockRejectedValueOnce(response)
      .mockResolvedValueOnce('success');
    
    const result = await retryRequest(fn, { maxRetries: 3, delay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('应该重试 HTTP 429 错误', async () => {
    const response = new global.Response('', { status: 429 });
    const fn = jest.fn()
      .mockRejectedValueOnce(response)
      .mockResolvedValueOnce('success');
    
    const result = await retryRequest(fn, { maxRetries: 3, delay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('不应该重试 HTTP 400 错误', async () => {
    const response = new global.Response('', { status: 400 });
    const fn = jest.fn().mockRejectedValue(response);
    
    await expect(retryRequest(fn, { maxRetries: 3, delay: 10 })).rejects.toBe(response);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该使用指数退避策略', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce('success');
    
    const start = Date.now();
    await retryRequest(fn, { maxRetries: 3, delay: 10, backoff: 'exponential' });
    const elapsed = Date.now() - start;
    
    // 第一次重试延迟 10ms，指数退避
    expect(elapsed).toBeGreaterThanOrEqual(9);
  });

  it('应该使用线性退避策略', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce('success');
    
    const start = Date.now();
    await retryRequest(fn, { maxRetries: 3, delay: 10, backoff: 'linear' });
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeGreaterThanOrEqual(10);
  });

  it('应该调用 onRetry 回调', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce('success');
    const onRetry = jest.fn();
    
    await retryRequest(fn, { maxRetries: 3, delay: 10, onRetry });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(TypeError));
  });

  it('应该使用自定义 retryCondition', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Custom error'))
      .mockResolvedValueOnce('success');
    
    const result = await retryRequest(fn, {
      maxRetries: 3,
      delay: 10,
      retryCondition: (error) => error instanceof Error && error.message.includes('Custom')
    });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('应该抛出最后一次错误当超过最大重试次数', async () => {
    const fn = jest.fn().mockRejectedValue(new TypeError('Network error'));
    
    await expect(retryRequest(fn, { maxRetries: 2, delay: 5 })).rejects.toThrow('Network error');
    expect(fn).toHaveBeenCalledTimes(3); // 初始 + 2 次重试
  });
});

describe('withTimeout', () => {
  it('应该返回正常结果', async () => {
    const promise = new Promise<string>(resolve => setTimeout(() => resolve('result'), 50));
    
    const result = await withTimeout(promise, 5000);
    
    expect(result).toBe('result');
  });

  it('应该在超时时抛出错误', async () => {
    const promise = new Promise<string>(resolve => setTimeout(() => resolve('result'), 10000));
    
    await expect(withTimeout(promise, 50)).rejects.toThrow('请求超时: 50ms');
  });

  it('应该使用自定义超时错误', async () => {
    const promise = new Promise<string>(resolve => setTimeout(() => resolve('result'), 10000));
    const customError = new Error('Custom timeout');
    
    await expect(withTimeout(promise, 50, customError)).rejects.toThrow('Custom timeout');
  });
});

describe('retryWithTimeout', () => {
  it('应该组合重试和超时', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce('success');
    
    const result = await retryWithTimeout(fn, { maxRetries: 3, delay: 10 }, 5000);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('createCancellableRequest', () => {
  it('应该返回请求结果', async () => {
    const fn = jest.fn().mockResolvedValue('result');
    const { request } = createCancellableRequest(fn);
    
    const result = await request;
    
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel 应该取消请求', async () => {
    const fn = jest.fn().mockImplementation(() => 
      new Promise((resolve) => setTimeout(() => resolve('result'), 5000))
    );
    const { request, cancel } = createCancellableRequest(fn);
    
    cancel();
    
    await expect(request).rejects.toThrow('请求已取消');
  });
});

describe('batchRequests', () => {
  it('应该顺序处理项目', async () => {
    const processor = jest.fn().mockImplementation((item: unknown) => 
      Promise.resolve(`processed_${item}`)
    );
    
    const results = await batchRequests(['a', 'b', 'c'], processor, { concurrency: 1 });
    
    expect(results).toEqual(['processed_a', 'processed_b', 'processed_c']);
  });

  it('应该支持并发处理', async () => {
    let activeCount = 0;
    let maxActive = 0;
    
    const processor = jest.fn().mockImplementation(async (item: unknown) => {
      activeCount++;
      maxActive = Math.max(maxActive, activeCount);
      await new Promise(resolve => setTimeout(resolve, 20));
      activeCount--;
      return `processed_${item}`;
    });
    
    await batchRequests(['a', 'b', 'c', 'd'], processor, { concurrency: 2 });
    
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('应该支持进度回调', async () => {
    const processor = jest.fn().mockImplementation((item: unknown) => 
      Promise.resolve(`processed_${item}`)
    );
    const onProgress = jest.fn();
    
    await batchRequests(['a', 'b', 'c'], processor, { onProgress });
    
    expect(onProgress).toHaveBeenCalledWith(1, 3);
    expect(onProgress).toHaveBeenCalledWith(2, 3);
    expect(onProgress).toHaveBeenCalledWith(3, 3);
  });

  it('应该处理空数组', async () => {
    const processor = jest.fn();
    const onProgress = jest.fn();
    
    const results = await batchRequests([], processor, { onProgress });
    
    expect(results).toEqual([]);
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('应该保持原始顺序', async () => {
    const processor = jest.fn().mockImplementation((item: unknown) => 
      Promise.resolve(item)
    );
    
    const results = await batchRequests([3, 1, 4, 1, 5], processor, { concurrency: 2 });
    
    expect(results).toEqual([3, 1, 4, 1, 5]);
  });
});