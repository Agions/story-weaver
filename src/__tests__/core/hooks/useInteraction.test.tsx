/**
 * useInteraction Hook 测试
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import * as sonner from 'sonner';

import {
  useLoading,
  useAsync,
  usePolling,
  useMessage,
  useModalConfirm,
  useTabs,
  useCollapse,
  useStepper,
} from '@/core/hooks/useInteraction';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(() => 'loading-id'),
    dismiss: jest.fn(),
  },
}));

// Mock toast from shared components
jest.mock('@/shared/components/ui', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock useConfirm
jest.mock('@/shared/components/ui/confirm-dialog', () => ({
  useConfirm: jest.fn(() => ({
    confirm: jest.fn(() => Promise.resolve(true)),
    ConfirmDialog: jest.fn().mockReturnValue(null),
  })),
}));

describe('useInteraction Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      const { result } = renderHook(() =>
        useAsync(() => Promise.resolve('success'), { onSuccess })
      );

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

  describe('useMessage', () => {
    it('应该返回所有消息方法', () => {
      const { result } = renderHook(() => useMessage());
      expect(result.current.success).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.info).toBeDefined();
      expect(result.current.warning).toBeDefined();
      expect(result.current.loading).toBeDefined();
    });

    it('success 应该调用 toast.success', () => {
      const { result } = renderHook(() => useMessage());
      const { toast } = require('@/shared/components/ui');

      result.current.success('操作成功');

      expect(toast.success).toHaveBeenCalledWith('操作成功', 3);
    });

    it('error 应该调用 toast.error', () => {
      const { result } = renderHook(() => useMessage());
      const { toast } = require('@/shared/components/ui');

      result.current.error('操作失败');

      expect(toast.error).toHaveBeenCalledWith('操作失败', 4);
    });

    it('info 应该调用 toast.info', () => {
      const { result } = renderHook(() => useMessage());
      const { toast } = require('@/shared/components/ui');

      result.current.info('提示信息');

      expect(toast.info).toHaveBeenCalledWith('提示信息', 3);
    });

    it('warning 应该调用 toast.warning', () => {
      const { result } = renderHook(() => useMessage());
      const { toast } = require('@/shared/components/ui');

      result.current.warning('警告');

      expect(toast.warning).toHaveBeenCalledWith('警告', 4);
    });

    it('loading 应该调用 sonnerToast.loading', () => {
      const { result } = renderHook(() => useMessage());
      const { toast: sonnerToast } = require('sonner');

      result.current.loading('加载中');

      expect(sonnerToast.loading).toHaveBeenCalledWith('加载中');
    });
  });

  describe('useModalConfirm', () => {
    it('应该返回 confirm 方法和 ModalConfirm 组件', () => {
      const { result } = renderHook(() => useModalConfirm());
      expect(result.current.confirm).toBeDefined();
      expect(result.current.ModalConfirm).toBeDefined();
    });

    it('confirm 应该返回一个 Promise', async () => {
      const { result } = renderHook(() => useModalConfirm());
      const { useConfirm } = require('@/shared/components/ui/confirm-dialog');

      // Mock confirm to resolve true
      (useConfirm as jest.Mock).mockReturnValue({
        confirm: jest.fn(() => Promise.resolve(true)),
        ConfirmDialog: jest.fn().mockReturnValue(null),
      });

      const promise = result.current.confirm({ title: '确认' });
      expect(promise).toBeInstanceOf(Promise);

      const resolved = await promise;
      expect(resolved).toBe(true);
    });
  });

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
});
