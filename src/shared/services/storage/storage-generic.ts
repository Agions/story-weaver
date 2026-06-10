/**
 * 通用存储 (storage.set/get/remove + clearAll/exportAll/importAll/getSize)
 * =====================================================================
 * 不属于任何具体仓库的"通用 set/get/remove" + "全量管理"。
 */
import {
  safeJsonGet,
  safeJsonSet,
  safeRemove,
  iterateFrameFabKeys,
  withPrefix,
} from './storage-helpers';
import { STORAGE_KEYS, STORAGE_KEY_PREFIX, STORAGE_TOTAL_BYTES } from './storage-keys';

/** 通用 set：自动加 framefab_ 前缀 */
export function setGeneric<T>(key: string, value: T): void {
  safeJsonSet(withPrefix(key), value);
}

/** 通用 get */
export function getGeneric<T>(key: string, defaultValue?: T): T | undefined {
  return safeJsonGet<T>(withPrefix(key), defaultValue as T);
}

/** 通用 remove */
export function removeGeneric(key: string): void {
  safeRemove(withPrefix(key));
}

/** 清空所有 framefab 数据 */
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    safeRemove(key);
  });
  // 清理所有 framefab_ 前缀的 key (含带 _provider 后缀的)
  for (const [key] of iterateFrameFabKeys()) {
    safeRemove(key);
  }
}

/** 导出所有 framefab 数据为 JSON 字符串 */
export function exportAllStorage(): string {
  const data: Record<string, any> = {};
  for (const [key, raw] of iterateFrameFabKeys()) {
    data[key] = raw ? JSON.parse(raw) : null;
  }
  return JSON.stringify(data, null, 2);
}

/** 从 JSON 字符串导入 (替换所有 framefab 数据) */
export function importAllStorage(json: string): boolean {
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
    Object.entries(data).forEach(([key, value]) => {
      safeJsonSet(key, value);
    });
    return true;
  } catch {
    return false;
  }
}

/** 存储占用统计 */
export function getStorageSize(): { used: number; total: number } {
  let used = 0;
  for (const [key, raw] of iterateFrameFabKeys()) {
    if (raw) {
      used += key.length + raw.length;
    }
  }
  return { used, total: STORAGE_TOTAL_BYTES };
}

// Re-export prefix for callers
export { STORAGE_KEY_PREFIX };
