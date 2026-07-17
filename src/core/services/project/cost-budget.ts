/**
 * 预算与告警管理
 *
 * 把 "检查预算阈值 → 触发告警" 的纯逻辑从 CostService 类剥离，
 * 配合调用方传入的 listeners 集合使用。
 */

import { logger } from '@/core/utils/logger';

import { calculateCostStats } from './cost-stats';
import type { BudgetStatus, CostAlert, CostBudget, CostRecord, CostStats } from './cost-types';

/** 预算告警冷却时间（毫秒），与原实现一致 */
export const BUDGET_ALERT_COOLDOWN_MS = 10 * 60 * 1000;

/** 预算周期维度 */
type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

/**
 * 把 stats + budget 投影成结构化的 BudgetStatus（含百分比）。
 */
export function buildBudgetStatus(stats: CostStats, budget: CostBudget): BudgetStatus {
  const dailyPercent = budget.daily > 0 ? (stats.today / budget.daily) * 100 : 0;
  const weeklyPercent = budget.weekly > 0 ? (stats.thisWeek / budget.weekly) * 100 : 0;
  const monthlyPercent = budget.monthly > 0 ? (stats.thisMonth / budget.monthly) * 100 : 0;

  return {
    daily: { used: stats.today, limit: budget.daily, percent: dailyPercent },
    weekly: { used: stats.thisWeek, limit: budget.weekly, percent: weeklyPercent },
    monthly: { used: stats.thisMonth, limit: budget.monthly, percent: monthlyPercent },
  };
}

/**
 * 检查三个周期是否触发告警，返回需要分发的告警列表。
 *
 * 行为与原 checkBudgetAlert 完全一致：
 * - 任一周期超阈值且不在冷却期 → 触发
 * - 触发后写入 cooldown map（外部持有引用）
 */
export function evaluateBudgetAlerts(
  records: CostRecord[],
  budget: CostBudget,
  lastAlertTimestamps: Record<BudgetPeriod, number>,
  now: number = Date.now()
): CostAlert[] {
  const stats = calculateCostStats(records);
  const status = buildBudgetStatus(stats, budget);
  const alerts: CostAlert[] = [];

  const checks: Array<{ period: BudgetPeriod; percent: number; threshold: number }> = [
    { period: 'daily', percent: status.daily.percent, threshold: budget.alerts.daily },
    { period: 'weekly', percent: status.weekly.percent, threshold: budget.alerts.weekly },
    { period: 'monthly', percent: status.monthly.percent, threshold: budget.alerts.monthly },
  ];

  for (const check of checks) {
    if (
      check.percent >= check.threshold &&
      now - lastAlertTimestamps[check.period] >= BUDGET_ALERT_COOLDOWN_MS
    ) {
      lastAlertTimestamps[check.period] = now;
      const alert: CostAlert = {
        id: `alert_${check.period}_${now}`,
        period: check.period,
        percent: check.percent,
        threshold: check.threshold,
        timestamp: new Date().toISOString(),
      };
      logger.warn(`⚠️ ${check.period} 预算告警: ${check.percent.toFixed(1)}%`);
      alerts.push(alert);
    }
  }

  return alerts;
}
