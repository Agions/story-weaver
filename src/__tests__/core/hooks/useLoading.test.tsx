/**
 * useLoading Hook 测试
 */
import { renderHook, act, waitFor } from '@testing-library/react';

import { useLoading } from '@/core/hooks/useLoading';

describe('useLoading', () => {
  it('应该返回初始状态 loading 为 false', () => {
    const { result } = renderHook(() => useLoading());
    expect(result.current.loading).toBe(false);
  });

  it('应该接受 defaultLoading 选项', () => {
    const { result } = renderHook(() => useLoading({ defaultLoading: true }));
    expect(result.current.loading).toBe(true);
  });

  it('应该可以设置 loading 状态', () => {
    const { result } = renderHook(() => useLoading());
    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.loading).toBe(true);
  });

  it('withLoading 应该自动管理 loading 状态', async () => {
    const { result } = renderHook(() => useLoading());
    const mockPromise = Promise.resolve('success');

    act(() => {
      result.current.withLoading(mockPromise);
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('withLoading 即使出错也应该关闭 loading', async () => {
    const { result } = renderHook(() => useLoading());
    const mockPromise = Promise.reject(new Error('error'));

    act(() => {
      result.current.withLoading(mockPromise.catch(() => {}));
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
