/**
 * Pipeline Step 宽松接口层
 *
 * 提供 StepInput/StepOutput 的宽松 Record 定义，
 * 兼容需要附加自定义字段的 step 实现和旧版控制器。
 *
 * 核心 pipeline 代码(步骤执行器、质量门禁)应使用
 * pipeline.types.ts 中的严格类型定义。
 */

export type {
  PipelineStep,
  PipelineStepId,
  StepInput as StrictStepInput,
  StepOutput as StrictStepOutput,
  StepStatus,
  StepMetrics,
  StepCheckpoint,
  StepProgressEvent,
  PipelineStatus,
  PipelineContext,
  PipelineEvent,
  PipelineConfig,
  PipelineExecutionState,
  PipelineEngineEvent,
  RetryPolicy,
  QualityGateConfig,
} from './pipeline.types';

// 以下两个枚举在本地接口中被引用，需要显式 import type
import type { PipelineExecutionMode, QualityGateDecision } from './pipeline.types';

export type { PipelineExecutionMode, QualityGateDecision };

/** 宽松 StepInput — 允许任意自定义字段 */
export type StepInput = Record<string, unknown>;

/** 宽松 StepOutput — 允许任意自定义字段 */
export type StepOutput = Record<string, unknown>;

export interface CheckpointState<S = unknown> {
  stepId: string;
  completed: boolean;
  data: S;
  timestamp: number;
}

export interface PipelineOptions {
  onProgress?: (stepId: string, progress: number) => void;
  onComplete?: (output: StepOutput) => void;
  onError?: (stepId: string, error: Error) => void;
}

/**
 * 宽松 PipelineStep 接口 — 含 validate/rollback/getCheckpoint/restore 等可选扩展方法。
 * 与 pipeline.types.ts 中的 PipelineStep 并存，各自服务不同层级的代码。
 * 新代码优先使用 pipeline.types.ts 中的严格定义。
 */
export interface LoosePipelineStep<S = unknown> {
  id: string;
  name: string;
  order?: number;
  stepId?: string;
  mode?: PipelineExecutionMode;
  execute(input: StepInput): Promise<StepOutput>;
  validate?(output: StepOutput): Promise<QualityGateDecision>;
  rollback?(output: StepOutput): Promise<void>;
  getCheckpoint?(): CheckpointState<S> | null;
  restore?(state: CheckpointState<S>): void;
  onProgress?: (event: { stepId: string; progress: number; message: string }) => void;
}
