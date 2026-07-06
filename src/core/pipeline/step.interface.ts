import type { QualityGateDecision, PipelineExecutionMode } from './pipeline.types';

// ========== 从 pipeline.types.ts re-export PipelineStep（统一接口定义来源） ==========
// 注意：StepInput/StepOutput 保持 Record<string, unknown> 宽松定义，
// 因为 features/manga-pipeline 控制器通过附加自定义字段使用 StepInput。
// 核心 pipeline 代码应使用 pipeline.types.ts 中的严格定义。

export type StepInput = Record<string, unknown>;
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

// ========== PipelineStep 宽松接口（含 validate/rollback/getCheckpoint/restore 等可选方法） ==========
// 与 pipeline.types.ts 中的 PipelineStep 并存，各自服务不同层级的代码。
// 新代码优先使用 pipeline.types.ts 中的定义。

export interface PipelineStep<S = unknown> {
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
