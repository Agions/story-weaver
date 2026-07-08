/**
 * 防抖存储中间件
 * 用于减少 localStorage 写入频率，提高性能
 */

import { StateStorage } from 'zustand/middleware';

import { logger } from '@/core/utils/logger';

/**
 * 创建防抖存储
 * @param storage 原始存储对象
 * @param delay 防抖延迟（毫秒）
 * @returns 防抖存储对象
 */
export const createDebouncedStorage = (storage: Storage, delay: number = 1000): StateStorage => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const pendingWrites: Map<string, string> = new Map();

  const flushWrites = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    pendingWrites.forEach((value, key) => {
      try {
        storage.setItem(key, value);
      } catch (error) {
        logger.error(`[DebouncedStorage] Failed to save "${key}":`, error);
      }
    });
    pendingWrites.clear();
  };

  return {
    getItem: (name: string): string | null => {
      // 先刷新待写入的数据
      flushWrites();
      const value = storage.getItem(name);
      return value;
    },

    setItem: (name: string, value: string): void => {
      // 合并待写入的数据
      pendingWrites.set(name, value);

      // 清除之前的定时器，设置新的定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        flushWrites();
      }, delay);
    },

    removeItem: (name: string): void => {
      // 清除待写入的数据
      pendingWrites.delete(name);

      // 立即删除
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      storage.removeItem(name);
    },
  };
};

// createDebouncedStorage 是唯一被消费的导出；增量/压缩变体已删除（无使用方）
