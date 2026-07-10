/**
 * Service-layer pipeline 类型 — 向后兼容 shim
 *
 * 原独立类型定义已合并入 @/core/pipeline/pipeline.types。
 * 本文件保留旧消费者（pipeline-runner / pipeline.service）所需的局部适配。
 * 服务层 PipelineStep.execute(input, context) 签名与 core/pipeline 的
 * execute(input: StepInput) 不兼容，故此处定义完全独立的类型集。
 *
 * @deprecated 新代码请直接 import from '@/core/pipeline/pipeline.types'。
 */

/** 服务层 PipelineCallbacks — 使用服务层 PipelineStep（与 core/pipeline 不同） */
export interface PipelineCallbacks {
  onStepChange?: (step: PipelineStep) => void;
  onProgress?: (stepId: string, progress: number, message?: string) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: string, step?: PipelineStep) => void;
}

/** 服务层旧的 PipelineStatus 是字符串联合，与 core/pipeline 枚举略有差异 */
export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/** 服务层旧的 PipelineStepId 是字符串联合（7 步），与 core/pipeline 枚举不同 */
export type PipelineStepId =
  | 'import'
  | 'analysis'
  | 'script'
  | 'storyboard'
  | 'character'
  | 'render'
  | 'export';

/** 服务层 PipelineContext — log level 不含 'debug'（与 core/pipeline 略有差异） */
export interface PipelineContext {
  workflowId: string;
  episodeId?: string;
  projectId?: string;
  getVariable: (name: string) => unknown;
  setVariable: (name: string, value: unknown) => void;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
}

/** 服务层 PipelineStep — execute(input, context) 签名与 core/pipeline 不同 */
export interface PipelineStep {
  id: string;
  name: string;
  stepId: PipelineStepId;
  execute(input: unknown, context: PipelineContext): Promise<unknown>;
  onProgress?: (progress: number, message?: string) => void;
}

/** 服务层 PipelineResult */
export interface PipelineResult {
  workflowId: string;
  status: PipelineStatus;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  steps: PipelineStepResult[];
}

/** 服务层 PipelineStepResult */
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

/** 服务层 PipelineConfig — 完全独立定义（steps 使用服务层 PipelineStep） */
export interface PipelineConfig extends PipelineCallbacks {
  workflowId?: string;
  projectId?: string;
  episodeId?: string;
  steps: PipelineStep[];
}
