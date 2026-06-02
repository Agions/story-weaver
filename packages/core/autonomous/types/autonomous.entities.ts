/**
 * 流水线领域实体类型
 * @file AutoPipelineEngine / SelfReviewLoop / QualityGate 的内部接口定义
 */

import type {
  AutoPipelineInput,
  AutoPipelineResult,
  PipelineStatus,
  StepState,
  StepOutput,
  PipelineCheckpoint,
  PipelineEventHandler,
  QualityGateResult,
  ReviewResult,
  ReviewCriteria,
} from './autonomous.types';

// ============================================================================
// Pipeline Step 接口
// ============================================================================

/** Pipeline 步骤接口 */
export interface PipelineStep {
  id: string;
  name: string;
  stepId: string;
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  dependencies?: string[];
  execute(input: StepInput): Promise<StepOutput>;
  getCheckpoint?(): StepCheckpoint | null;
  restore?(state: StepCheckpoint): void;
  onProgress?: (event: { stepId: string; progress: number; message: string }) => void;
}

/** 步骤输入 */
export interface StepInput {
  [key: string]: unknown;
}

/** 步骤检查点 */
export interface StepCheckpoint {
  stepId: string;
  completed: boolean;
  data: StepOutput;
  reviewCount: number;
  retryIndex: number;
  timestamp: number;
}

// ============================================================================
// SelfReviewLoop 状态
// ============================================================================

/** 自审循环状态 */
export interface SelfReviewState {
  reviewCount: Map<string, number>;
  currentStepId: string | null;
  lastReviewResult: ReviewResult | null;
}

// ============================================================================
// QualityGate 配置
// ============================================================================

/** 质量门禁配置 */
export interface QualityGateConfig {
  stepId: string;
  enabled: boolean;
  minScore: number;
  selfReviewEnabled: boolean;
  maxReviewRetries: number;
  criteria: ReviewCriteria[];
}

// ============================================================================
// Checkpoint 持久化
// ============================================================================

/** 检查点数据（用于 localStorage 序列化） */
export interface CheckpointData {
  pipelineId: string;
  status: PipelineStatus;
  currentStepId: string | null;
  steps: Record<string, StepCheckpoint>;
  input: AutoPipelineInput;
  startedAt: number;
  updatedAt: number;
}

// ============================================================================
// Engine 状态快照（用于 UI 展示）
// ============================================================================

/** 引擎状态快照 */
export interface EngineStatus {
  status: PipelineStatus;
  currentStepId: string | null;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  elapsed: number;
  stepDurations: Record<string, number>;
}

/** 步骤执行摘要 */
export interface StepSummary {
  stepId: string;
  name: string;
  status: StepState['status'];
  duration: number | null;
  retryCount: number;
  error: string | null;
  score: number | null;
}
