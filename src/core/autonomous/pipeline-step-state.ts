/**
 * Pipeline 步骤状态管理
 *
 * 把 AutoPipelineEngine 中的
 * - updateStepState
 * - collectStepDurations
 * - createInitialStepState
 * 三个纯函数 / Map 更新操作抽离。
 *
 * 单一职责：管理 StepState Map 的状态转换与统计。
 */

import type { StepState } from './autonomous.types';

/** 创建步骤的初始 pending 状态 */
export function createInitialStepState(stepId: string): StepState {
  return {
    stepId,
    name: stepId,
    status: 'pending',
    progress: 0,
    reviewCount: 0,
  };
}

/**
 * 更新某个步骤的状态，自动维护 startedAt/completedAt 时间戳。
 * 行为与原 AutoPipelineEngine.updateStepState 逐字一致：
 * - 进入 running 状态时设置 startedAt
 * - 进入 completed/failed 时设置 completedAt
 */
export function applyStepStateTransition(
  stepStates: Map<string, StepState>,
  stepId: string,
  status: StepState['status'],
  extra: Partial<Pick<StepState, 'error' | 'output' | 'reviewCount'>> = {}
): void {
  const existing = stepStates.get(stepId) ?? createInitialStepState(stepId);

  const updated: StepState = {
    ...existing,
    status,
    ...extra,
    startedAt: existing.startedAt ?? (status === 'running' ? Date.now() : undefined),
    completedAt: status === 'completed' || status === 'failed' ? Date.now() : undefined,
  };

  stepStates.set(stepId, updated);
}

/**
 * 收集所有有 start/end 时间的步骤的耗时。
 * 返回值：Record<stepId, durationMs>
 */
export function collectStepDurations(stepStates: Map<string, StepState>): Record<string, number> {
  const durations: Record<string, number> = {};
  for (const [stepId, state] of Array.from(stepStates.entries())) {
    if (state.startedAt && state.completedAt) {
      durations[stepId] = state.completedAt - state.startedAt;
    }
  }
  return durations;
}

/**
 * 计算当前进度百分比（按已完成 + 跳过 步骤占总步骤的比例）。
 */
export function computeProgressPercent(
  stepStates: Map<string, StepState>,
  totalSteps: number
): number {
  if (totalSteps <= 0) return 0;
  const completed = Array.from(stepStates.values()).filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length;
  return Math.round((completed / totalSteps) * 100);
}
