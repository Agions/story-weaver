/**
 * StepChain - 类型定义层
 *
 * 统一 step.interface.ts 与 pipeline.types.ts 中的重复接口。
 * 这里是纯类型，零运行时副作用。
 */

import type { PipelineStepId, StepStatus } from './pipeline.types';
import type { StepInput, StepOutput } from './step.interface';

/** 步骤执行阶段 */
export enum StepPhase {
  PRE = 'pre',
  EXEC = 'exec',
  POST = 'post',
}

/** 责任链方向 */
export enum ChainDirection {
  FORWARD = 'forward',
  BRANCH = 'branch',
  ROLLBACK = 'rollback',
}

/** 步骤结果 */
export interface StepResult {
  stepId: string;
  phase: StepPhase;
  status: StepStatus;
  output: StepOutput;
  durationMs: number;
  error?: string;
}

/** 前置过滤器：返回 true 继续，false 跳过，抛 Error 中断 */
export type PreCondition = (input: StepInput) => Promise<boolean> | boolean;

/** 后置处理器：无论主执行成功/失败都调用 */
export type PostHandler = (result: StepResult, input: StepInput) => Promise<void> | void;

/** 步骤执行器 */
export type StepExecutor = (input: StepInput, context: StepChainContext) => Promise<StepOutput>;

/** 条件分支选择器（DAG 模式） */
export type BranchSelector = (input: StepInput, output: StepOutput) => string;

/** 步骤链上下文 */
export interface StepChainContext {
  workflowId: string;
  stepId: string;
  engine?: {
    pause: () => boolean;
    cancel: () => void;
    getStatus: () => unknown;
  };
  metrics: {
    startTime: number;
    preDurationMs: number;
    execDurationMs: number;
    postDurationMs: number;
    retryCount: number;
  };
  shared: Map<string, unknown>;
}

/** StepChain 接口 */
export interface StepChain {
  id: string;
  stepId: PipelineStepId;
  name: string;
  phase: StepPhase;
  direction: ChainDirection;
  preCondition?: PreCondition;
  executor: StepExecutor;
  postHandler?: PostHandler;
  branchSelector?: BranchSelector;
  parallelKeys?: string[];
  maxRetries: number;
  retryDelayMs: number;
  delegate?: {
    execute: (input: StepInput) => Promise<StepOutput>;
    onProgress?: (event: { stepId: string; progress: number; message: string }) => void;
  };
}
