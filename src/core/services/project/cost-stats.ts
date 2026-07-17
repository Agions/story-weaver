/**
 * 成本统计计算
 *
 * 把"按时间段 + 维度聚合"的纯计算逻辑从 CostService 类剥离，
 * 便于单测与未来支持更多维度。
 */

import type { CostRecord, CostStats } from './cost-types';

/** 7 天前的起点（用于本周聚合） */
const WEEK_WINDOW_DAYS = 7;
/** 30 天前的起点（用于本月聚合） */
const MONTH_WINDOW_DAYS = 30;

/**
 * 计算一组记录的成本统计。
 *
 * 行为与原 CostService.calculateStats 完全一致：
 * - today/thisWeek/thisMonth 按时间窗口累计
 * - byType/byProvider/byModel 按维度累计
 */
export function calculateCostStats(records: CostRecord[]): CostStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - WEEK_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const monthStart = new Date(todayStart.getTime() - MONTH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const stats: CostStats = {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    byType: {},
    byProvider: {},
    byModel: {},
  };

  for (const record of records) {
    const recordDate = new Date(record.timestamp);
    const cost = record.cost;

    stats.total += cost;
    stats.byType[record.type] = (stats.byType[record.type] ?? 0) + cost;
    stats.byProvider[record.provider] = (stats.byProvider[record.provider] ?? 0) + cost;

    if (record.model) {
      stats.byModel[record.model] = (stats.byModel[record.model] ?? 0) + cost;
    }

    if (recordDate >= todayStart) stats.today += cost;
    if (recordDate >= weekStart) stats.thisWeek += cost;
    if (recordDate >= monthStart) stats.thisMonth += cost;
  }

  return stats;
}

/** 按 projectId 过滤记录后再聚合 */
export function calculateProjectStats(records: CostRecord[], projectId: string): CostStats {
  const scoped = records.filter((record) => record.metadata?.projectId === projectId);
  return calculateCostStats(scoped);
}

/** 按 projectId 过滤并按 timestamp 倒序排 */
export function filterRecordsByProject(records: CostRecord[], projectId?: string): CostRecord[] {
  const scoped = projectId
    ? records.filter((record) => record.metadata?.projectId === projectId)
    : records;
  return [...scoped].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
