/**
 * Pipeline Service - 类型定义
 * 拆出 types 以减小 pipeline.service.ts 体积
 *
 * 注: PipelineStep 在两处定义 (service 层 / core pipeline 层) 签名不同
 *   - service 层: execute(input, context) 显式 context 传参
 *   - core 层:    execute(input) context 通过 closure 注入
 * 故保留两套独立类型, 不做硬合并, 仅对齐字段语义.
 */

export type PipelineStepId =
  | 'import'
  | 'analysis'
  | 'script'
  | 'storyboard'
  | 'character'
  | 'render'
  | 'export';

export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface PipelineStep {
  id: string;
  name: string;
  stepId: PipelineStepId;
  execute(input: unknown, context: PipelineContext): Promise<unknown>;
  onProgress?: (progress: number, message?: string) => void;
}

export interface PipelineContext {
  workflowId: string;
  episodeId?: string;
  projectId?: string;
  getVariable: (name: string) => unknown;
  setVariable: (name: string, value: unknown) => void;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
}

export interface PipelineResult {
  workflowId: string;
  status: PipelineStatus;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  steps: PipelineStepResult[];
}

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

export interface PipelineConfig {
  workflowId?: string;
  projectId?: string;
  episodeId?: string;
  steps: PipelineStep[];
  onStepChange?: (step: PipelineStep) => void;
  onProgress?: (stepId: string, progress: number, message?: string) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: string, step?: PipelineStep) => void;
}
