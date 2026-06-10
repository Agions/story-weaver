/**
 * 用户偏好仓库 (storage.preferences)
 * ==================================
 * 3 个公共方法：get / set (浅合并) / reset
 * 默认值从 storage-defaults 导入
 */
import type { UserPreferences } from '@/shared/types';

import { DEFAULT_USER_PREFERENCES } from './storage-defaults';
import { safeJsonGet, safeJsonSet, safeRemove } from './storage-helpers';
import { STORAGE_KEYS } from './storage-keys';

/** 读用户偏好 (与默认值浅合并) */
export function getUserPreferences(): UserPreferences {
  const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
  if (!data) return DEFAULT_USER_PREFERENCES;
  try {
    return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(data) };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

/** 写用户偏好 (浅合并) */
export function setUserPreferences(prefs: Partial<UserPreferences>): void {
  const current = getUserPreferences();
  safeJsonSet(STORAGE_KEYS.USER_PREFERENCES, { ...current, ...prefs });
}

/** 重置为默认 */
export function resetUserPreferences(): void {
  safeRemove(STORAGE_KEYS.USER_PREFERENCES);
}
