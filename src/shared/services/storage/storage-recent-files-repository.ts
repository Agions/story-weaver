/**
 * 最近文件仓库 (storage.recentFiles)
 * ==================================
 * 4 个公共方法：get / add (去重 + 上限 20) / remove / clear
 */
import { safeJsonGet, safeJsonSet, safeRemove } from './storage-helpers';
import { STORAGE_KEYS, RECENT_FILES_MAX_COUNT } from './storage-keys';

/** 读最近文件列表 */
export function getRecentFiles(): string[] {
  return safeJsonGet<string[]>(STORAGE_KEYS.RECENT_FILES, []);
}

/** 添加 (新文件移到队首，去重，上限 RECENT_FILES_MAX_COUNT) */
export function addRecentFile(path: string): void {
  const files = getRecentFiles();
  const updated = [path, ...files.filter((f) => f !== path)].slice(0, RECENT_FILES_MAX_COUNT);
  safeJsonSet(STORAGE_KEYS.RECENT_FILES, updated);
}

/** 移除 */
export function removeRecentFile(path: string): void {
  const files = getRecentFiles().filter((f) => f !== path);
  safeJsonSet(STORAGE_KEYS.RECENT_FILES, files);
}

/** 清空 */
export function clearRecentFiles(): void {
  safeRemove(STORAGE_KEYS.RECENT_FILES);
}
