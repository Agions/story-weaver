/**
 * @deprecated Pipeline service-layer type shim.
 *
 * Types defined in this file are incompatible with core versions:
 * - PipelineStatus lacks 'cancelled' status (core enum has it)
 * - PipelineContext.log lacks 'debug' level (core has it)
 * - PipelineStep.execute signature differs from core
 *
 * Migrate to:
 *   import { PipelineStatus, PipelineStepId, PipelineContext, PipelineStep, ... }
 *     from '@/core/pipeline/pipeline-types';
 *
 * This shim will be removed in a future PR after all 72+ callers migrate.
 */

/**
 * Service-layer pipeline 类型 — 向后兼容 shim
 *
 * 原独立类型定义已合并入 @/core/pipeline/pipeline-types。
 * 本文件保留 services/pipeline/ 内部消费者（pipeline-runner / pipeline-service）
 * 所需的类型桥接。
 *
 * 统一路径：
 *   - 核心类型（PipelineStep / PipelineContext / PipelineStatus）
 *     → import from '@/core/pipeline/pipeline-types'
 *   - 服务层特有类型（PipelineCallbacks / PipelineConfig）
 *     → 本文件保留，标记 @deprecated
 *
 * @deprecated 新代码请直接 import from '@/core/pipeline/pipeline-types'。
 */

// ========== 核心类型 re-export（仅导出无冲突的类型） ==========

export type {
  StepInput,
  StepOutput,
  StepStatus,
  StepMetrics,
  StepCheckpoint,
  StepProgressEvent,
  PipelineEvent,
  PipelineExecutionState,
  PipelineEngineEvent,
  RetryPolicy,
  QualityGateConfig,
  QualityGateDecision,
  PipelineExecutionMode,
} from '@/core/pipeline/pipeline-types';

// ========== 服务层旧版类型（保留以兼容 runner / step-factories） ===

/**
 * 服务层旧版 PipelineStatus — 字符串联合。
 *
 * @deprecated 使用核心 PipelineStatus 枚举：import { PipelineStatus } from '@/core/pipeline/pipeline-types'
 */
export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/**
 * 服务层旧版 PipelineStepId — 7 步字符串联合。
 *
 * @deprecated 使用核心 PipelineStepId 枚举：import { PipelineStepId } from '@/core/pipeline/pipeline-types'
 */
export type PipelineStepId =
  | 'import'
  | 'analysis'
  | 'script'
  | 'storyboard'
  | 'character'
  | 'render'
  | 'export';

/**
 * 服务层旧版 PipelineContext — log level 不含 'debug'，无 checkpoint/emit。
 *
 * @deprecated 使用核心 PipelineContext：import { PipelineContext } from '@/core/pipeline/pipeline-types'
 */
export interface PipelineContext {
  workflowId: string;
  episodeId?: string;
  projectId?: string;
  getVariable: (name: string) => unknown;
  setVariable: (name: string, value: unknown) => void;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
}

/**
 * 服务层旧版 PipelineStep — execute(input, context) 签名与核心不兼容。
 *
 * @deprecated 使用核心 PipelineStep 接口：import { PipelineStep } from '@/core/pipeline/pipeline-types'
 */
export interface PipelineStep {
  id: string;
  name: string;
  /** 兼容核心 PipelineStepId 枚举和旧版字符串联合 */
  stepId: import('@/core/pipeline/pipeline-types').PipelineStepId | PipelineStepId;
  execute(input: unknown, context: PipelineContext): Promise<unknown>;
  onProgress?: (progress: number, message?: string) => void;
}

/**
 * 服务层旧版 PipelineResult — 使用服务层 PipelineStatus / PipelineStepResult。
 *
 * @deprecated 使用核心 PipelineResult：import { PipelineResult } from '@/core/pipeline/pipeline-types'
 */
export interface PipelineResult {
  workflowId: string;
  status: PipelineStatus;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  steps: PipelineStepResult[];
}

/** @deprecated 使用核心 PipelineStepResult */
export interface PipelineStepResult {
  stepId: string;
  name: string;
  status: PipelineStatus;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * 服务层回调接口 — 核心层使用 PipelineEngine 事件系统替代。
 *
 * @deprecated 使用核心 PipelineEngine 的事件系统
 */
export interface PipelineCallbacks {
  onStepChange?: (step: PipelineStep) => void;
  onProgress?: (stepId: string, progress: number, message?: string) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: string, step?: PipelineStep) => void;
}

/**
 * 服务层 PipelineConfig — 使用服务层 PipelineStep（与核心不兼容）。
 *
 * @deprecated 使用核心 PipelineConfig：import { PipelineConfig } from '@/core/pipeline/pipeline-types'
 */
export interface PipelineConfig extends PipelineCallbacks {
  workflowId?: string;
  projectId?: string;
  episodeId?: string;
  steps: PipelineStep[];
}
