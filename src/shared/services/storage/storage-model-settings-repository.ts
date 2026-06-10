/**
 * 模型设置仓库 (storage.modelSettings)
 * =====================================
 * 4 个公共方法：get(provider) / set / delete / getAll (扫所有)
 * 命名空间前缀 STORAGE_KEYS.MODEL_SETTINGS，下挂 provider
 */
import { safeJsonGet, safeJsonSet, safeRemove } from './storage-helpers';
import { STORAGE_KEYS, modelSettingsKey } from './storage-keys';

/** 读某个 provider 的设置 */
export function getModelSettings(provider: string): unknown {
  return safeJsonGet<unknown>(modelSettingsKey(provider), null);
}

/** 写某个 provider 的设置 */
export function setModelSettings(provider: string, settings: unknown): void {
  safeJsonSet(modelSettingsKey(provider), settings);
}

/** 删除某个 provider 的设置 */
export function deleteModelSettings(provider: string): void {
  safeRemove(modelSettingsKey(provider));
}

/** 扫所有 framefab_model_settings_* 的 key，汇总为 map */
export function getAllModelSettings(): Record<string, any> {
  const settings: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEYS.MODEL_SETTINGS)) {
      const provider = key.replace(`${STORAGE_KEYS.MODEL_SETTINGS}_`, '');
      settings[provider] = getModelSettings(provider);
    }
  }
  return settings;
}
