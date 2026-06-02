/**
 * frame-forge Pipeline 核心类型定义
 *
 * 定义流水线步骤的标准化接口、数据契约和质量门控
 */

import type { QualityGateThresholds } from '@/core/services/pipeline/quality-gate.service';

// ========== 流水线步骤 ID 枚举 ==========

export enum PipelineStepId {
  IMPORT = 'import',
  ANALYSIS = 'analysis',
  SCRIPT = 'script',
  CHARACTER = 'character',
  STORYBOARD = 'storyboard',
  RENDER = 'render',
  VIDEO_EDITING = 'video-editing',
  COMPOSITION = 'composition',
  AUDIO_SYNTHESIS = 'audio-synthesis',
  EXPORT = 'export',
}

// ========== 流水线执行模式 ==========

export enum PipelineExecutionMode {
  SEQUENCE = 'sequence', // 严格顺序执行
  PARALLEL = 'parallel', // 全部并行
  DAG = 'dag', // 有向无环图（条件分支）
  LOOP = 'loop', // 循环（批量场景迭代）
}

// ========== 流水线状态枚举 ==========

export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ========== 步骤级状态 ==========

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
}

// ========== 质量门控决策 ==========

export enum QualityGateDecision {
  PASS = 'pass', // 通过，可继续
  FAIL = 'fail', // 失败，终止
  WARN = 'warn', // 警告但可继续
  BLOCK = 'block', // 必须修复才可继续
}

// ========== 步骤输入/输出契约 ==========

export interface StepInput {
  workflowId: string;
  stepId: PipelineStepId;
  /** 前置步骤的输出映射 */
  prevStepOutputs?: Map<PipelineStepId, StepOutput>;
  /** 跨步骤共享上下文 */
  context: PipelineContext;
  /** 断点续跑数据 */
  checkpoint?: StepCheckpoint;
}

export interface StepOutput {
  stepId: PipelineStepId;
  status: StepStatus;
  /** 步骤输出数据 */
  data: unknown;
  /** 执行指标 */
  metrics?: StepMetrics;
  /** 质量门控结果 */
  qualityGate?: QualityGateDecision;
  /** 错误信息 */
  error?: string;
  startTime: number;
  endTime?: number;
  retryCount: number;
}

// ========== 步骤执行指标 ==========

export interface StepMetrics {
  durationMs: number;
  tokensUsed?: number;
  costEstimate?: number;
  framesProcessed?: number;
  qualityScore?: number;
}

// ========== 断点续跑检查点 ==========

export interface StepCheckpoint {
  stepId: PipelineStepId;
  /** 已完成的帧 ID 列表 */
  completedFrames: string[];
  /** 上次处理到的索引 */
  lastProcessedIndex: number;
  /** 部分输出（用于恢复） */
  partialOutput: unknown;
  timestamp: number;
}

// ========== PipelineContext - 跨步骤共享上下文 ==========

export interface PipelineContext {
  workflowId: string;
  projectId?: string;
  episodeId?: string;
  variables: Map<string, unknown>;

  getVariable: <T>(key: string) => T | undefined;
  setVariable: <T>(key: string, value: T) => void;
  log: (msg: string, level?: 'debug' | 'info' | 'warn' | 'error') => void;
  getCheckpoint: (stepId: PipelineStepId) => StepCheckpoint | undefined;
  saveCheckpoint: (checkpoint: StepCheckpoint) => void;
  emit: (event: PipelineEvent) => void;
}

// ========== Pipeline 事件 ==========

export interface PipelineEvent {
  type:
    | 'step_start'
    | 'step_progress'
    | 'step_complete'
    | 'step_fail'
    | 'quality_gate'
    | 'checkpoint';
  workflowId: string;
  stepId?: PipelineStepId;
  progress?: number;
  message?: string;
  data?: unknown;
  timestamp: number;
}

// ========== 标准化 PipelineStep 接口 ==========

export interface PipelineStep {
  id: string;
  name: string;
  stepId: PipelineStepId;
  mode: PipelineExecutionMode;
  retryPolicy: RetryPolicy;
  qualityGate?: QualityGateConfig;
  /** DAG 依赖（前置步骤 ID） */
  dependencies?: PipelineStepId[];
  /** 并行分组键（如帧 ID 列表） */
  parallelKeys?: string[];

  /** 标准化入口 */
  execute(input: StepInput): Promise<StepOutput>;

  /** 进度回调 */
  onProgress?: (event: StepProgressEvent) => void;
}

export interface StepProgressEvent {
  stepId: PipelineStepId;
  progress: number; // 0-100
  message: string;
  detail?: string;
}

// ========== 重试策略 ==========

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableErrors?: string[];
}

// ========== 质量门控配置 ==========

export interface QualityGateConfig {
  enabled: boolean;
  thresholds: QualityGateThresholds;
  onFail: 'block' | 'warn' | 'skip';
}

// ========== 流水线配置 ==========

export interface PipelineConfig {
  workflowId: string;
  name: string;
  mode: PipelineExecutionMode;
  steps: PipelineStep[];
  projectId?: string;
  episodeId?: string;
  enableCheckpoint?: boolean;
  enableQualityGate?: boolean;
}

// ========== 流水线执行状态 ==========

export interface PipelineExecutionState {
  workflowId: string;
  status: PipelineStatus;
  currentStepId?: PipelineStepId;
  stepStates: Map<PipelineStepId, StepStatus>;
  context: PipelineContext;
  startTime?: number;
  endTime?: number;
  error?: string;
}

// ========== 批量渲染 Checkpoint ==========

export interface BatchRenderCheckpoint {
  stepId: PipelineStepId.RENDER;
  workflowId: string;
  completedFrames: Array<{
    frameId: string;
    imageUrl: string;
    qualityScore?: number;
    timestamp: number;
  }>;
  failedFrames: string[];
  skippedFrames: string[];
  totalFrames: number;
  lastBatchIndex: number;
  modelVersion: string;
}

// ========== PipelineEngine 事件 ==========

export interface PipelineEngineEvent {
  onStepStart?: (stepId: PipelineStepId) => void;
  onStepProgress?: (stepId: PipelineStepId, progress: number, message?: string) => void;
  onStepComplete?: (stepId: PipelineStepId, output: StepOutput) => void;
  onStepFail?: (stepId: PipelineStepId, error: string) => void;
  onQualityGate?: (stepId: PipelineStepId, decision: QualityGateDecision, details?: string) => void;
  onCheckpoint?: (stepId: PipelineStepId, checkpoint: StepCheckpoint) => void;
  onPipelineComplete?: (results: Map<PipelineStepId, StepOutput>) => void;
  onPipelineFail?: (error: string, failedStepId?: PipelineStepId) => void;
}
