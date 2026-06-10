/**
 * Pipeline 检查点管理
 *
 * 把原 AutoPipelineEngine 中关于"检查点持久化"的几块逻辑集中：
 * - 构造 pipelineId
 * - 保存到 localStorage（容错 + 写 warn 日志）
 * - 从 localStorage 读取（容错 + 返回 null）
 * - 把检查点恢复回 stepStates + context
 * - 30 秒定时保存 interval（启动/停止）
 *
 * 单一职责：检查点生命周期与持久化。
 */

import { logger } from '@/core/utils/logger';

import type {
  AutoPipelineInput,
  PipelineCheckpoint,
  PipelineStatus,
  StepState,
} from './autonomous.types';

/** 检查点 localStorage key 前缀 */
const CHECKPOINT_KEY_PREFIX = 'autopipeline_checkpoint_';

/** 自动检查点保存间隔（毫秒），与原实现一致 */
export const CHECKPOINT_INTERVAL_MS = 30000;

/**
 * 构造 pipeline 唯一 ID。
 * 行为与原 getPipelineId 逐字一致：优先使用输入的 title，否则 fallback 到 `pipeline_<timestamp>`。
 */
export function buildPipelineId(input: AutoPipelineInput | undefined | null): string {
  return input?.title ?? `pipeline_${Date.now()}`;
}

/**
 * 把检查点写入 localStorage。失败时 warn 但不抛出。
 */
export function saveCheckpointToStorage(checkpoint: PipelineCheckpoint): boolean {
  try {
    const key = `${CHECKPOINT_KEY_PREFIX}${checkpoint.pipelineId}`;
    localStorage.setItem(key, JSON.stringify(checkpoint));
    return true;
  } catch (error) {
    logger.warn('[AutoPipeline] Failed to save checkpoint:', error);
    return false;
  }
}

/**
 * 从 localStorage 读取检查点。失败/缺失一律返回 null。
 */
export function loadCheckpointFromStorage(pipelineId: string): PipelineCheckpoint | null {
  try {
    const key = `${CHECKPOINT_KEY_PREFIX}${pipelineId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as PipelineCheckpoint;
    }
  } catch {
    // 忽略错误（原行为）
  }
  return null;
}

/**
 * 构造一个 PipelineCheckpoint 快照（不负责持久化）。
 * 把 stepStates 转换为 Record<string, StepCheckpoint>。
 */
export function buildCheckpointSnapshot(params: {
  pipelineId: string;
  status: PipelineStatus;
  currentStepId: string;
  stepStates: Map<string, StepState>;
  context: Map<string, unknown>;
  now: number;
}): PipelineCheckpoint {
  const entries = Array.from(params.stepStates.entries());
  return {
    pipelineId: params.pipelineId,
    status: params.status,
    currentStepId: params.currentStepId,
    steps: Object.fromEntries(entries) as unknown as PipelineCheckpoint['steps'],
    input: params.context.get('__input__') as unknown as AutoPipelineInput,
    startedAt: params.now,
    updatedAt: params.now,
  };
}

/**
 * 把 checkpoint.steps 还原到 stepStates Map，并把每个 step 的 data 还原到 context。
 *
 * 行为与原 restoreFromCheckpoint 逐字一致。
 */
export function applyCheckpointToEngine(
  checkpoint: PipelineCheckpoint,
  stepStates: Map<string, StepState>,
  context: Map<string, unknown>
): void {
  const stepsRecord = checkpoint.steps as unknown as Record<string, { data?: unknown }>;
  for (const [stepId, stepState] of Object.entries(stepsRecord)) {
    const state = stepState as unknown as StepState;
    stepStates.set(stepId, state);
    if (stepState.data) {
      context.set(stepId, stepState.data);
    }
  }
}
