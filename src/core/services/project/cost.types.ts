/**
 * 成本追踪 - 类型定义
 * 拆出 types 以减小 cost.service.ts 体积
 */

export interface CostRecord {
  id: string;
  type: 'llm' | 'video' | 'audio' | 'storage';
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost: number;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CostStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
}

export interface BudgetStatus {
  daily: { used: number; limit: number; percent: number };
  weekly: { used: number; limit: number; percent: number };
  monthly: { used: number; limit: number; percent: number };
}

export interface CostAlert {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  percent: number;
  threshold: number;
  timestamp: string;
}

export interface CostBudget {
  daily: number;
  weekly: number;
  monthly: number;
  alerts: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}
