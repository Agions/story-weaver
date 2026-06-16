/**
 * 成本追踪服务（Facade）
 *
 * 重构思路：原文件 511 行混合了"记录构造 / 统计计算 / 预算告警 /
 * 持久化 / 报告渲染 / 优化建议 / 模型推荐 / 订阅分发" 8 种职责。
 * 现拆为 5 个子模块，主类只做编排：
 * - cost-record-builders  4 个 recordXxxCost 的纯函数构造器
 * - cost-stats            calculateCostStats / filterRecordsByProject
 * - cost-budget           buildBudgetStatus / evaluateBudgetAlerts
 * - cost-report           renderCostReport / generateOptimizationSuggestions / getModelSuggestion
 * - cost.types / cost.constants  类型与定价（既有）
 *
 * 业务行为完全不变，所有公开方法签名保留。测试用 `new CostService()`
 * 与 13 个调用方的 import 路径均无需修改。
 */

import { secureStorage } from '@/core/services/project/secure-storage.service';
import { logger } from '@/core/utils/logger';

import { buildBudgetStatus, evaluateBudgetAlerts } from './cost-budget';
import {
  buildAudioCostRecord,
  buildLLMCostRecord,
  buildStorageCostRecord,
  buildVideoCostRecord,
} from './cost-record-builders';
import {
  generateOptimizationSuggestions,
  getModelSuggestion,
  renderCostReport,
} from './cost-report';
import { calculateCostStats, calculateProjectStats, filterRecordsByProject } from './cost-stats';
import type { BudgetStatus, CostAlert, CostBudget, CostRecord, CostStats } from './cost.types';

// Re-export types —— 保持外部 from '@/core/services/project/cost.service' 的 import 路径有效
export type {
  BudgetStatus,
  CostAlert,
  CostBudget,
  CostRecord,
  CostRecordType,
  CostStats,
} from './cost.types';

class CostService {
  private records: CostRecord[] = [];
  private budget: CostBudget = {
    daily: 50,
    weekly: 300,
    monthly: 1000,
    alerts: {
      daily: 80,
      weekly: 80,
      monthly: 80,
    },
  };
  private listeners: Set<(stats: CostStats) => void> = new Set();
  private alertListeners: Set<(alert: CostAlert) => void> = new Set();

  /** 各周期最后一次告警时间戳（用于冷却控制） */
  private alertCooldown: Record<'daily' | 'weekly' | 'monthly', number> = {
    daily: 0,
    weekly: 0,
    monthly: 0,
  };

  constructor() {
    // 异步加载数据，不阻塞构造函数
    this.loadFromStorage();
  }

  // ─────────── 记录构造入口（薄包装，行为与原版逐字一致） ───────────

  recordLLMCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    metadata?: Record<string, any>
  ): CostRecord {
    const record = buildLLMCostRecord(provider, model, inputTokens, outputTokens, metadata);
    this.appendRecord(record);
    return record;
  }

  recordVideoCost(
    provider: string,
    duration: number,
    resolution: string,
    metadata?: Record<string, any>
  ): CostRecord {
    const record = buildVideoCostRecord(provider, duration, resolution, metadata);
    this.appendRecord(record);
    return record;
  }

  recordAudioCost(provider: string, duration: number, metadata?: Record<string, any>): CostRecord {
    const record = buildAudioCostRecord(provider, duration, metadata);
    this.appendRecord(record);
    return record;
  }

  recordStorageCost(provider: string, sizeMB: number, metadata?: Record<string, any>): CostRecord {
    const record = buildStorageCostRecord(provider, sizeMB, metadata);
    this.appendRecord(record);
    return record;
  }

  // ─────────── 统计查询 ───────────

  getStats(): CostStats {
    return calculateCostStats(this.records);
  }

  getProjectStats(projectId: string): CostStats {
    return calculateProjectStats(this.records, projectId);
  }

  getRecords(projectId?: string): CostRecord[] {
    return filterRecordsByProject(this.records, projectId);
  }

  // ─────────── 预算与告警 ───────────

  getBudgetStatus(stats: CostStats = this.getStats()): BudgetStatus {
    return buildBudgetStatus(stats, this.budget);
  }

  setBudget(budget: Partial<CostBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  getBudget(): CostBudget {
    return this.budget;
  }

  // ─────────── 模型推荐与报告 ───────────

  getModelSuggestion = getModelSuggestion;

  getOptimizationSuggestions(): string[] {
    return generateOptimizationSuggestions(this.getStats());
  }

  exportReport(): string {
    const stats = this.getStats();
    const suggestions = this.getOptimizationSuggestions();
    return renderCostReport(stats, this.budget, suggestions);
  }

  // ─────────── 订阅 ───────────

  subscribe(listener: (stats: CostStats) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeAlert(listener: (alert: CostAlert) => void): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  // ─────────── 维护 ───────────

  clear(): void {
    this.records = [];
    this.notifyListeners();
  }

  // ─────────── 持久化 ───────────

  async saveToStorage(): Promise<void> {
    try {
      await secureStorage.saveCostData('records', this.records);
      await secureStorage.saveCostData('budget', this.budget);
    } catch (error) {
      logger.error('保存成本记录失败:', error);
    }
  }

  async loadFromStorage(): Promise<boolean> {
    try {
      const records = await secureStorage.loadCostData<CostRecord[]>('records');
      const budget = await secureStorage.loadCostData<CostBudget>('budget');

      if (records) {
        this.records = records;
      }
      if (budget) {
        this.budget = budget;
      }

      return true;
    } catch (error) {
      logger.error('加载成本记录失败:', error);
      return false;
    }
  }

  // ─────────── 内部辅助 ───────────

  /** 通用记录追加：push → 评估告警 → 通知订阅者 */
  private appendRecord(record: CostRecord): void {
    this.records.push(record);
    this.checkBudgetAlert();
    this.notifyListeners();
  }

  /** 评估三个周期的预算阈值，触发告警 */
  private checkBudgetAlert(): void {
    const alerts = evaluateBudgetAlerts(this.records, this.budget, this.alertCooldown, Date.now());
    for (const alert of alerts) {
      this.notifyAlertListeners(alert);
    }
  }

  /** 通知统计订阅者并持久化 */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach((listener) => listener(stats));
    this.saveToStorage();
  }

  private notifyAlertListeners(alert: CostAlert): void {
    this.alertListeners.forEach((listener) => listener(alert));
  }
}

// 导出单例 + 类（与原版一致：测试用 new CostService()，调用方用 costService.xxx）
export const costService = new CostService();
export default CostService;
