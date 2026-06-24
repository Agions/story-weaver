/**
 * useAsync Hook 测试
 */
import { renderHook, act } from '@testing-library/react';

import { useAsync } from '@/core/hooks/useAsync';

describe('useAsync', () => {
  it('应该返回初始状态', () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve('data')));
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应该能够执行异步函数', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve('test-data')));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('test-data');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应该处理异步错误', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject(new Error('test error'))));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('test error');
    expect(result.current.data).toBeUndefined();
  });

  it('应该调用 onSuccess 回调', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useAsync(() => Promise.resolve('success'), { onSuccess }));

    await act(async () => {
      await result.current.execute();
    });

    expect(onSuccess).toHaveBeenCalledWith('success');
  });

  it('应该调用 onError 回调', async () => {
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject(new Error('error')), { onError })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(onError).toHaveBeenCalled();
  });

  it('应该能够重置状态', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve('data'), { defaultValue: 'default' })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('data');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe('default');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('应该处理非 Error 类型的错误', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject('string error')));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string error');
  });
});
