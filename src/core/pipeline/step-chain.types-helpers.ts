/**
 * AsyncStepChainConfig - 构造器配置类型
 *
 * 拆分自 step-chain.types 以避免循环依赖：
 * step-chain.types → step.interface（基础类型）
 * step-chain.types-helpers（这里）→ step-chain.types（运行时构造）
 */

import type { PipelineStepId } from './pipeline.types';
import type {
  StepPhase,
  ChainDirection,
  PreCondition,
  PostHandler,
  StepExecutor,
  BranchSelector,
} from './step-chain.types';
import type { StepInput } from './step.interface';

export interface AsyncStepChainConfig {
  id: string;
  stepId: PipelineStepId;
  name: string;
  phase?: StepPhase;
  direction?: ChainDirection;
  preCondition?: PreCondition;
  executor: StepExecutor;
  postHandler?: PostHandler;
  branchSelector?: BranchSelector;
  parallelKeys?: string[];
  maxRetries?: number;
  retryDelayMs?: number;
  delegate?: {
    execute: (input: StepInput) => Promise<any>;
    onProgress?: (event: { stepId: string; progress: number; message: string }) => void;
  };
}
