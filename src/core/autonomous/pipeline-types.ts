/**
 * AutoPipelineEngine 内部 Step 类型
 *
 * 把原文件里的 PipelineStep / StepInput / StepCheckpoint 接口抽离。
 * 这些类型仅供 auto-pipeline-engine 内部及其子模块使用，不属于外部 API。
 */

import type { StepOutput } from './autonomous.types';

/** Pipeline 中单个步骤的配置与执行器 */
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

/** 步骤输入（合并前序步骤的输出 + 全局输入） */
export interface StepInput {
  [key: string]: unknown;
}

/** 单步骤检查点 */
export interface StepCheckpoint {
  stepId: string;
  completed: boolean;
  data: StepOutput;
  reviewCount: number;
  retryIndex: number;
  timestamp: number;
}
