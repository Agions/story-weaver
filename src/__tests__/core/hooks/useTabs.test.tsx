/**
 * useTabs Hook 测试
 */
import { renderHook, act } from '@testing-library/react';

import { useTabs } from '@/core/hooks/useTabs';

describe('useTabs', () => {
  it('应该返回初始 activeKey 为 "1"', () => {
    const { result } = renderHook(() => useTabs());
    expect(result.current.activeKey).toBe('1');
  });

  it('应该接受 defaultActiveKey 选项', () => {
    const { result } = renderHook(() => useTabs({ defaultActiveKey: 'tab-2' }));
    expect(result.current.activeKey).toBe('tab-2');
  });

  it('setActiveKey 应该更新 activeKey', () => {
    const { result } = renderHook(() => useTabs());
    act(() => {
      result.current.setActiveKey('tab-3');
    });
    expect(result.current.activeKey).toBe('tab-3');
  });

  it('changeActiveKey 应该更新 activeKey 并触发 onChange', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabs({ onChange }));

    act(() => {
      result.current.changeActiveKey('tab-2');
    });

    expect(result.current.activeKey).toBe('tab-2');
    expect(onChange).toHaveBeenCalledWith('tab-2');
  });
});
