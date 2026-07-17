/**
 * 成本报告与优化建议
 *
 * 把"渲染 Markdown 报告 + 优化建议 + 模型推荐"这三块
 * 纯展示逻辑从 CostService 类剥离，便于独立测试。
 */

import type { CostBudget, CostStats } from './cost-types';

/** 高成本模型列表（与原实现一致） */
const HIGH_COST_MODELS = ['gpt-5', 'claude-4-opus', 'qwen-max'];

/** LLM 占比超过该阈值时给出缓存/分级建议 */
const LLM_RATIO_ALERT_THRESHOLD = 0.6;
/** 视频占比超过该阈值时给出参数建议 */
const VIDEO_RATIO_ALERT_THRESHOLD = 0.3;
/** 单模型成本占比超过该阈值时提示降级 */
const MODEL_RATIO_ALERT_THRESHOLD = 0.3;

/** 任务复杂度对应的模型候选清单 */
type TaskComplexity = 'simple' | 'standard' | 'complex' | 'creative';
type BudgetConstraint = 'low' | 'medium' | 'high';

interface ModelOption {
  model: string;
  provider: string;
  cost: number;
}

/** 任务复杂度 → 候选模型（按成本升序，与原表完全一致） */
const MODEL_SUGGESTIONS: Record<TaskComplexity, ModelOption[]> = {
  simple: [
    { model: 'qwen-turbo', provider: 'alibaba', cost: 0.0003 },
    { model: 'ernie-speed', provider: 'baidu', cost: 0.0001 },
    { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 },
  ],
  standard: [
    { model: 'qwen-plus', provider: 'alibaba', cost: 0.0008 },
    { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 },
    { model: 'glm-5', provider: 'zhipu', cost: 0.001 },
  ],
  complex: [
    { model: 'qwen-max', provider: 'alibaba', cost: 0.002 },
    { model: 'gpt-5', provider: 'openai', cost: 0.005 },
    { model: 'claude-4-sonnet', provider: 'anthropic', cost: 0.003 },
  ],
  creative: [
    { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 },
    { model: 'claude-4-sonnet', provider: 'anthropic', cost: 0.003 },
    { model: 'gpt-5', provider: 'openai', cost: 0.005 },
  ],
};

/**
 * 根据任务复杂度 + 预算约束推荐模型。
 * 行为与原 getModelSuggestion 完全一致：
 * - low   → 选成本最低
 * - high  → 选表尾"最佳"
 * - 其他  → 选中间档
 */
export function getModelSuggestion(
  taskComplexity: TaskComplexity,
  budgetConstraint?: BudgetConstraint
): { model: string; provider: string; estimatedCost: number } {
  const options = MODEL_SUGGESTIONS[taskComplexity] ?? MODEL_SUGGESTIONS.standard;

  if (budgetConstraint === 'low') {
    const cheapest = options.reduce((min, curr) => (curr.cost < min.cost ? curr : min));
    return { ...cheapest, estimatedCost: cheapest.cost };
  }

  if (budgetConstraint === 'high') {
    const best = options[options.length - 1];
    return { ...best, estimatedCost: best.cost };
  }

  // 默认平衡选择：取中间档
  const balanced = options[Math.floor(options.length / 2)];
  return { ...balanced, estimatedCost: balanced.cost };
}

/**
 * 根据成本分布给出可执行的优化建议列表。
 * 行为与原 getOptimizationSuggestions 完全一致。
 */
export function generateOptimizationSuggestions(stats: CostStats): string[] {
  const suggestions: string[] = [];
  const llmCost = stats.byType['llm'] ?? 0;
  const videoCost = stats.byType['video'] ?? 0;
  const totalCost = stats.total;

  if (totalCost === 0) {
    return ['暂无成本数据，开始使用后会生成优化建议'];
  }

  if (llmCost / totalCost > LLM_RATIO_ALERT_THRESHOLD) {
    suggestions.push(
      '💡 LLM 成本占比超过 60%，建议：\n' +
        '  - 启用响应缓存\n' +
        '  - 使用模型分级策略（简单任务用 Turbo 模型）\n' +
        '  - 压缩提示词长度'
    );
  }

  if (videoCost / totalCost > VIDEO_RATIO_ALERT_THRESHOLD) {
    suggestions.push(
      '💡 视频生成成本较高，建议：\n' +
        '  - 使用智能参数选择\n' +
        '  - 优先使用本地生成\n' +
        '  - 降低分辨率和帧率'
    );
  }

  for (const model of HIGH_COST_MODELS) {
    const modelCost = stats.byModel[model];
    if (modelCost && modelCost > totalCost * MODEL_RATIO_ALERT_THRESHOLD) {
      suggestions.push(`💡 ${model} 使用成本较高，建议评估是否可以降级到 Plus 或 Turbo 模型`);
    }
  }

  return suggestions.length > 0 ? suggestions : ['✅ 成本结构良好，暂无优化建议'];
}

/**
 * 渲染 Markdown 格式的成本报告。
 * 行为与原 exportReport 完全一致。
 */
export function renderCostReport(
  stats: CostStats,
  budget: CostBudget,
  suggestions: string[]
): string {
  return `
# Story Weaver AI 成本报告

生成时间: ${new Date().toLocaleString('zh-CN')}

## 成本概览

| 周期 | 成本 (USD) | 占比 |
|------|-----------|------|
| 今日 | $${stats.today.toFixed(2)} | ${((stats.today / budget.daily) * 100).toFixed(1)}% |
| 本周 | $${stats.thisWeek.toFixed(2)} | ${((stats.thisWeek / budget.weekly) * 100).toFixed(1)}% |
| 本月 | $${stats.thisMonth.toFixed(2)} | ${((stats.thisMonth / budget.monthly) * 100).toFixed(1)}% |
| 总计 | $${stats.total.toFixed(2)} | - |

## 成本分布

### 按类型
${Object.entries(stats.byType)
  .map(([type, cost]) => `- ${type}: $${cost.toFixed(2)}`)
  .join('\n')}

### 按提供商
${Object.entries(stats.byProvider)
  .map(([provider, cost]) => `- ${provider}: $${cost.toFixed(2)}`)
  .join('\n')}

### 按模型
${Object.entries(stats.byModel)
  .map(([model, cost]) => `- ${model}: $${cost.toFixed(2)}`)
  .join('\n')}

## 优化建议

${suggestions.join('\n\n')}

---
*报告由 Story Weaver AI 成本追踪服务生成*
  `.trim();
}
