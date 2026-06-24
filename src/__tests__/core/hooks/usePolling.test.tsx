/**
 * usePolling Hook 测试
 */
import { renderHook, act } from '@testing-library/react';

import { usePolling } from '@/core/hooks/usePolling';

describe('usePolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('应该返回初始状态 isPolling 为 true 当 immediate 为 true', () => {
    const { result } = renderHook(() => usePolling(jest.fn().mockResolvedValue('data')));
    expect(result.current.isPolling).toBe(true);
  });

  it('应该返回初始状态 isPolling 为 false 当 immediate 为 false', () => {
    const { result } = renderHook(() =>
      usePolling(jest.fn().mockResolvedValue('data'), { immediate: false })
    );
    expect(result.current.isPolling).toBe(false);
  });

  it('start 和 stop 应该能够控制轮询状态', () => {
    const { result } = renderHook(() =>
      usePolling(jest.fn().mockResolvedValue('data'), { immediate: false })
    );

    expect(result.current.isPolling).toBe(false);

    act(() => {
      result.current.start();
    });
    expect(result.current.isPolling).toBe(true);

    act(() => {
      result.current.stop();
    });
    expect(result.current.isPolling).toBe(false);
  });
});
