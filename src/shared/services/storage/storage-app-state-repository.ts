/**
 * 应用状态仓库 (storage.appState)
 * ===============================
 * 3 个公共方法：get / set (浅合并) / clear
 */
import type { AppState } from '@/shared/stores/app.store';

import { safeJsonGet, safeJsonSet, safeRemove } from './storage-helpers';
import { STORAGE_KEYS } from './storage-keys';

/** 读全部应用状态 (局部) */
export function getAppState(): Partial<AppState> {
  return safeJsonGet<Partial<AppState>>(STORAGE_KEYS.APP_STATE, {});
}

/** 写应用状态 (与现有浅合并) */
export function setAppState(state: Partial<AppState>): void {
  const current = getAppState();
  safeJsonSet(STORAGE_KEYS.APP_STATE, { ...current, ...state });
}

/** 清空应用状态 */
export function clearAppState(): void {
  safeRemove(STORAGE_KEYS.APP_STATE);
}
