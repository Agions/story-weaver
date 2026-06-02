/**
 * AsyncStepChain - 异步步骤链执行器
 *
 * 三段式责任链：前置校验 (PRE) → 主执行 (EXEC, 支持重试) → 后置处理 (POST)
 * 支持分支 (DAG) 和失败回滚 (ROLLBACK)。
 *
 * 从原 step-chain.ts 拆分而来 (Phase 4 重组, 355 → 240 + builder 分文件)。
 */

import type { PipelineStepId, StepStatus } from './pipeline.types';
import { StepChainBuilder } from './step-chain.builder';
import {
  StepPhase,
  ChainDirection,
  type PreCondition,
  type PostHandler,
  type StepExecutor,
  type BranchSelector,
  type StepChain,
  type StepResult,
  type StepChainContext,
} from './step-chain.types';
import type { AsyncStepChainConfig } from './step-chain.types-helpers';
import type { StepInput, StepOutput } from './step.interface';

export { StepPhase, ChainDirection, StepChainBuilder };
export type {
  PreCondition,
  PostHandler,
  StepExecutor,
  BranchSelector,
  StepChain,
  StepResult,
  StepChainContext,
};

export class AsyncStepChain implements StepChain {
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
  delegate?: StepChain['delegate'];

  private nextStep?: StepChain;
  private branchSteps: Map<string, StepChain> = new Map();
  private rollbackStep?: StepChain;

  constructor(config: AsyncStepChainConfig) {
    this.id = config.id;
    this.stepId = config.stepId;
    this.name = config.name;
    this.phase = config.phase ?? StepPhase.EXEC;
    this.direction = config.direction ?? ChainDirection.FORWARD;
    this.preCondition = config.preCondition;
    this.executor = config.executor;
    this.postHandler = config.postHandler;
    this.branchSelector = config.branchSelector;
    this.parallelKeys = config.parallelKeys;
    this.maxRetries = config.maxRetries ?? 0;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
    this.delegate = config.delegate;
  }

  setNext(step: StepChain): this {
    this.nextStep = step;
    return this;
  }
  addBranch(branchId: string, step: StepChain): this {
    this.branchSteps.set(branchId, step);
    return this;
  }
  setRollback(step: StepChain): this {
    this.rollbackStep = step;
    return this;
  }
  getNext(): StepChain | undefined {
    return this.nextStep;
  }
  getBranch(branchId: string): StepChain | undefined {
    return this.branchSteps.get(branchId);
  }

  async execute(input: StepInput, context: StepChainContext): Promise<StepResult> {
    context.metrics.startTime = Date.now();
    context.metrics.retryCount = 0;
    let lastError: Error | undefined;
    let output: StepOutput = {} as StepOutput;

    // PRE phase
    context.metrics.preDurationMs = 0;
    if (this.preCondition) {
      const preStart = Date.now();
      try {
        const proceed = await this.preCondition(input);
        if (!proceed) {
          return {
            stepId: this.id,
            phase: StepPhase.PRE,
            status: 'skipped' as StepStatus,
            output: {} as StepOutput,
            durationMs: Date.now() - preStart,
          };
        }
      } catch (err) {
        return {
          stepId: this.id,
          phase: StepPhase.PRE,
          status: 'failed' as StepStatus,
          output: {} as StepOutput,
          durationMs: Date.now() - preStart,
          error: String(err),
        };
      }
      context.metrics.preDurationMs = Date.now() - preStart;
    }

    // EXEC phase with retry
    context.metrics.execDurationMs = 0;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const execStart = Date.now();
      try {
        output = await this.executor(input, context);
        context.metrics.execDurationMs = Date.now() - execStart;
        break;
      } catch (err) {
        lastError = err as Error;
        context.metrics.execDurationMs = Date.now() - execStart;
        context.metrics.retryCount = attempt + 1;
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelayMs * Math.pow(2, attempt));
        }
      }
    }

    const status = (lastError ? 'failed' : 'completed') as StepStatus;
    const execResult: StepResult = {
      stepId: this.id,
      phase: StepPhase.EXEC,
      status,
      output,
      durationMs: context.metrics.execDurationMs,
      error: lastError ? String(lastError) : undefined,
    };

    this.delegate?.onProgress?.({ stepId: this.stepId, progress: 100, message: 'completed' });

    // POST phase
    context.metrics.postDurationMs = 0;
    if (this.postHandler) {
      const postStart = Date.now();
      try {
        await this.postHandler(execResult, input);
      } catch {
        /* swallow post errors */
      }
      context.metrics.postDurationMs = Date.now() - postStart;
    }

    // ROLLBACK on failure
    if (execResult.status === 'failed' && this.rollbackStep) {
      try {
        await (this.rollbackStep as AsyncStepChain).execute(input, context);
      } catch {
        /* swallow rollback errors */
      }
    }

    return execResult;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static fromPipelineStep(
    step: {
      id: string;
      name: string;
      stepId: PipelineStepId;
      execute: (input: StepInput) => Promise<StepOutput>;
      onProgress?: (event: { stepId: string; progress: number; message: string }) => void;
    },
    phase: StepPhase = StepPhase.EXEC
  ): AsyncStepChain {
    return new AsyncStepChain({
      id: step.id,
      stepId: step.stepId,
      name: step.name,
      phase,
      direction: ChainDirection.FORWARD,
      executor: async (input) => step.execute(input),
      delegate: { execute: step.execute, onProgress: step.onProgress },
      maxRetries: 0,
      retryDelayMs: 1000,
    });
  }
}
