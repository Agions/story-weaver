/**
 * 存储层通用 helper
 * ==================
 * 9 处 `localStorage.getItem(...) ? JSON.parse(...) : <default>` 模式 + 6 处 set/remove
 * + 4 处 `for i=0; i<localStorage.length; i++) { localStorage.key(i) }` 模式
 * 全部抽到 4 个 helper。
 */
import { isFrameFabKey, STORAGE_KEY_PREFIX } from './storage-keys';

/**
 * 读 JSON：失败/缺失返回 defaultValue
 */
export function safeJsonGet<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 写 JSON：直接调用 setItem，无错误处理
 */
export function safeJsonSet<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 删 key
 */
export function safeRemove(key: string): void {
  localStorage.removeItem(key);
}

/**
 * 遍历 localStorage 中所有 framefab_* 前缀的 key-value 对
 */
export function iterateFrameFabKeys(): Array<[string, string | null]> {
  const out: Array<[string, string | null]> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (isFrameFabKey(key)) {
      out.push([key!, localStorage.getItem(key!)]);
    }
  }
  return out;
}

/** 通用 storage key 的"加前缀"操作 (facade set/get/remove 内部用) */
export function withPrefix(key: string): string {
  return `${STORAGE_KEY_PREFIX}${key}`;
}
