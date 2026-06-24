/**
 * useCollapse Hook 测试
 */
import { renderHook, act } from '@testing-library/react';

import { useCollapse } from '@/core/hooks/useCollapse';

describe('useCollapse', () => {
  it('应该返回初始 expandedKeys 为空数组', () => {
    const { result } = renderHook(() => useCollapse());
    expect(result.current.expandedKeys).toEqual([]);
  });

  it('应该接受 defaultExpandedKeys 选项', () => {
    const { result } = renderHook(() => useCollapse({ defaultExpandedKeys: ['key-1', 'key-2'] }));
    expect(result.current.expandedKeys).toEqual(['key-1', 'key-2']);
  });

  it('toggle 应该切换展开状态', () => {
    const { result } = renderHook(() => useCollapse());

    act(() => {
      result.current.toggle('key-1');
    });
    expect(result.current.expandedKeys).toContain('key-1');

    act(() => {
      result.current.toggle('key-1');
    });
    expect(result.current.expandedKeys).not.toContain('key-1');
  });

  it('expand 应该展开指定的 key', () => {
    const { result } = renderHook(() => useCollapse());

    act(() => {
      result.current.expand('key-1');
    });
    expect(result.current.expandedKeys).toContain('key-1');

    // 重复展开不应该添加重复
    act(() => {
      result.current.expand('key-1');
    });
    expect(result.current.expandedKeys).toEqual(['key-1']);
  });

  it('collapse 应该收起指定的 key', () => {
    const { result } = renderHook(() => useCollapse({ defaultExpandedKeys: ['key-1', 'key-2'] }));

    act(() => {
      result.current.collapse('key-1');
    });
    expect(result.current.expandedKeys).not.toContain('key-1');
    expect(result.current.expandedKeys).toContain('key-2');
  });

  it('expandAll 应该展开所有指定的 keys', () => {
    const { result } = renderHook(() => useCollapse());

    act(() => {
      result.current.expandAll(['key-1', 'key-2', 'key-3']);
    });
    expect(result.current.expandedKeys).toEqual(['key-1', 'key-2', 'key-3']);
  });

  it('collapseAll 应该收起所有 keys', () => {
    const { result } = renderHook(() => useCollapse({ defaultExpandedKeys: ['key-1', 'key-2'] }));

    act(() => {
      result.current.collapseAll();
    });
    expect(result.current.expandedKeys).toEqual([]);
  });

  it('isExpanded 应该正确判断 key 是否展开', () => {
    const { result } = renderHook(() => useCollapse({ defaultExpandedKeys: ['key-1'] }));

    expect(result.current.isExpanded('key-1')).toBe(true);
    expect(result.current.isExpanded('key-2')).toBe(false);
  });
});
