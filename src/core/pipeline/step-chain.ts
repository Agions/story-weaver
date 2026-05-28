/**
 * StepChain - 流水线责任链模式
 *
 * 统一 step.interface.ts 与 pipeline.types.ts 中的重复接口
 * 提供：前置校验 → 执行 → 后置处理 三段式责任链
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

  constructor(config: {
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
    delegate?: StepChain['delegate'];
  }) {
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

    const status: StepStatus = lastError ? 'failed' : 'completed';
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
        await this.rollbackStep.execute(input, context);
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

export class StepChainBuilder {
  private _id = '';
  private _stepId!: PipelineStepId;
  private _name = '';
  private _phase = StepPhase.EXEC;
  private _direction = ChainDirection.FORWARD;
  private _preCondition?: PreCondition;
  private _executor!: StepExecutor;
  private _postHandler?: PostHandler;
  private _branchSelector?: BranchSelector;
  private _parallelKeys?: string[];
  private _maxRetries = 0;
  private _retryDelayMs = 1000;
  private _delegate?: StepChain['delegate'];

  id(v: string): this {
    this._id = v;
    return this;
  }
  stepId(v: PipelineStepId): this {
    this._stepId = v;
    return this;
  }
  name(v: string): this {
    this._name = v;
    return this;
  }
  phase(v: StepPhase): this {
    this._phase = v;
    return this;
  }
  direction(v: ChainDirection): this {
    this._direction = v;
    return this;
  }
  preCondition(fn: PreCondition): this {
    this._preCondition = fn;
    return this;
  }
  executor(fn: StepExecutor): this {
    this._executor = fn;
    return this;
  }
  postHandler(fn: PostHandler): this {
    this._postHandler = fn;
    return this;
  }
  branchSelector(fn: BranchSelector): this {
    this._branchSelector = fn;
    return this;
  }
  parallelKeys(keys: string[]): this {
    this._parallelKeys = keys;
    return this;
  }
  maxRetries(n: number): this {
    this._maxRetries = n;
    return this;
  }
  retryDelayMs(ms: number): this {
    this._retryDelayMs = ms;
    return this;
  }
  delegate(d: StepChain['delegate']): this {
    this._delegate = d;
    return this;
  }

  build(): AsyncStepChain {
    return new AsyncStepChain({
      id: this._id,
      stepId: this._stepId,
      name: this._name,
      phase: this._phase,
      direction: this._direction,
      preCondition: this._preCondition,
      executor: this._executor,
      postHandler: this._postHandler,
      branchSelector: this._branchSelector,
      parallelKeys: this._parallelKeys,
      maxRetries: this._maxRetries,
      retryDelayMs: this._retryDelayMs,
      delegate: this._delegate,
    });
  }
}
