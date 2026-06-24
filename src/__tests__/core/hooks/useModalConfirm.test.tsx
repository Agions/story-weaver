/**
 * useModalConfirm Hook 测试
 */
import { renderHook } from '@testing-library/react';

import { useModalConfirm } from '@/core/hooks/useModalConfirm';

// Mock useConfirm
jest.mock('@/shared/components/ui/confirm-dialog', () => ({
  useConfirm: jest.fn(() => ({
    confirm: jest.fn(() => Promise.resolve(true)),
    ConfirmDialog: jest.fn().mockReturnValue(null),
  })),
}));

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
