/**
 * useStepper Hook 测试
 */
import { renderHook, act } from '@testing-library/react';

import { useStepper } from '@/core/hooks/useStepper';

describe('useStepper', () => {
  it('应该返回初始值 0', () => {
    const { result } = renderHook(() => useStepper());
    expect(result.current.value).toBe(0);
  });

  it('应该接受 initial 选项', () => {
    const { result } = renderHook(() => useStepper({ initial: 10 }));
    expect(result.current.value).toBe(10);
  });

  it('increment 应该增加值', () => {
    const { result } = renderHook(() => useStepper());

    act(() => {
      result.current.increment();
    });
    expect(result.current.value).toBe(1);

    act(() => {
      result.current.increment();
    });
    expect(result.current.value).toBe(2);
  });

  it('increment 不应该超过 max', () => {
    const { result } = renderHook(() => useStepper({ max: 5 }));

    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.increment();
      });
    }

    expect(result.current.value).toBe(5);
  });

  it('decrement 应该减少值', () => {
    const { result } = renderHook(() => useStepper({ initial: 5 }));

    act(() => {
      result.current.decrement();
    });
    expect(result.current.value).toBe(4);
  });

  it('decrement 不应该小于 min', () => {
    const { result } = renderHook(() => useStepper({ min: 0 }));

    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.decrement();
      });
    }

    expect(result.current.value).toBe(0);
  });

  it('reset 应该重置为初始值', () => {
    const { result } = renderHook(() => useStepper({ initial: 10 }));

    act(() => {
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.value).toBe(12);

    act(() => {
      result.current.reset();
    });
    expect(result.current.value).toBe(10);
  });

  it('setValue 应该直接设置值', () => {
    const { result } = renderHook(() => useStepper());

    act(() => {
      result.current.setValue(100);
    });
    expect(result.current.value).toBe(100);
  });

  it('onChange 回调应该在值变化时调用', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useStepper({ onChange }));

    act(() => {
      result.current.increment();
    });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('应该按 step 步进', () => {
    const { result } = renderHook(() => useStepper({ step: 5 }));

    act(() => {
      result.current.increment();
    });
    expect(result.current.value).toBe(5);

    act(() => {
      result.current.decrement();
    });
    expect(result.current.value).toBe(0);
  });
});
