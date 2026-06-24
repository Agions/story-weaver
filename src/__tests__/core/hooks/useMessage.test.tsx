/**
 * useMessage Hook 测试
 */
import { renderHook } from '@testing-library/react';
import * as sonner from 'sonner';

import { useMessage } from '@/core/hooks/useMessage';

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
