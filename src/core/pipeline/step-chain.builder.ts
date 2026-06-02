/**
 * StepChainBuilder - 链式构造器
 *
 * 拆分自原 step-chain.ts (Phase 4, 355 → 240 + builder 分文件)。
 * Builder 模式让 step 配置更易读：
 *
 *   const step = new StepChainBuilder()
 *     .id('import')
 *     .stepId('import')
 *     .name('视频导入')
 *     .executor(async (input) => ...)
 *     .maxRetries(3)
 *     .build();
 */

import { AsyncStepChain } from './async-step-chain';
import type { PipelineStepId } from './pipeline.types';
import { StepPhase, ChainDirection } from './step-chain.types';
import type { PreCondition, PostHandler, StepExecutor, BranchSelector } from './step-chain.types';
import type { AsyncStepChainConfig } from './step-chain.types-helpers';

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
  private _delegate?: AsyncStepChainConfig['delegate'];

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
  delegate(d: AsyncStepChainConfig['delegate']): this {
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
