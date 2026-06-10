/**
 * 导出历史仓库 (storage.exportHistory)
 * ====================================
 * 3 个公共方法：get / add (自动加时间戳 + 上限 100) / clear
 */
import { safeJsonGet, safeJsonSet, safeRemove } from './storage-helpers';
import { STORAGE_KEYS, EXPORT_HISTORY_MAX_COUNT } from './storage-keys';

/** 读导出历史 */
export function getExportHistory(): unknown[] {
  return safeJsonGet<unknown[]>(STORAGE_KEYS.EXPORT_HISTORY, []);
}

/** 添加一条 (新条目加到队首，保留 EXPORT_HISTORY_MAX_COUNT 条) */
export function addExportRecord(record: unknown): void {
  const history = getExportHistory();
  const recordObj =
    typeof record === 'object' && record !== null ? (record as Record<string, unknown>) : {};
  history.unshift({ ...recordObj, timestamp: new Date().toISOString() });
  safeJsonSet(STORAGE_KEYS.EXPORT_HISTORY, history.slice(0, EXPORT_HISTORY_MAX_COUNT));
}

/** 清空 */
export function clearExportHistory(): void {
  safeRemove(STORAGE_KEYS.EXPORT_HISTORY);
}
