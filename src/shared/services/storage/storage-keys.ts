/**
 * 存储键名 + 前缀常量集中
 * =======================
 * 全部 localStorage key 在这里集中定义，调用方不应该硬编码字符串。
 * 单一职责：常量字典。
 */

/** 所有结构化命名空间的 storage key */
export const STORAGE_KEYS = {
  PROJECTS: 'framefab_projects',
  APP_STATE: 'framefab_app_state',
  USER_PREFERENCES: 'framefab_preferences',
  RECENT_FILES: 'framefab_recent_files',
  MODEL_SETTINGS: 'framefab_model_settings',
  EXPORT_HISTORY: 'framefab_export_history',
} as const;

/** 通用 storage 的 key 前缀（用于 set/get/remove / clearAll 等） */
export const STORAGE_KEY_PREFIX = 'framefab_';

/** 模型设置命名空间：单个 provider 的 key 形如 `${MODEL_SETTINGS}_${provider}` */
export function modelSettingsKey(provider: string): string {
  return `${STORAGE_KEYS.MODEL_SETTINGS}_${provider}`;
}

/** 判断 key 是否属于 framefab 命名空间 */
export function isFrameFabKey(key: string | null | undefined): boolean {
  return !!key && key.startsWith(STORAGE_KEY_PREFIX);
}

/** localStorage 默认总容量 (5MB) */
export const STORAGE_TOTAL_BYTES = 5 * 1024 * 1024;

/** 最近文件保留数量 */
export const RECENT_FILES_MAX_COUNT = 20;

/** 导出历史保留条数 */
export const EXPORT_HISTORY_MAX_COUNT = 100;
