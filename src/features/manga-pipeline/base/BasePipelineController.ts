/**
 * BasePipelineController
 * 漫剧流水线步骤的基类，统一处理检查点、暂停/恢复、质量门控等公共逻辑
 *
 * 已统一为 PipelineStep 接口：
 *   - process()     ← 实现 PipelineStep.process()（引擎驱动入口）
 *   - pause()       ← 暂停（引擎在循环中检测 isPaused）
 *   - resume()      ← 恢复
 *   - cancel()      ← 取消
 *   - getCheckpoint/restore ← 检查点
 */

import {
  CheckpointState,
  PipelineStep,
  StepInput,
  StepOutput,
} from '@/core/pipeline/step.interface';

export enum StepState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface PipelineControllerOptions {
  id: string;
  name: string;
  enableCheckpoint?: boolean;
  enableQualityGate?: boolean;
}

/**
 * BasePipelineController — 统一 PipelineStep 接口
 *
 * 同时支持：
 * 1. PipelineEngine 驱动（引擎调用 process()）
 * 2. MangaPipelineController 直接编排（调用 processStep()）
 */
export abstract class BasePipelineController implements PipelineStep<unknown> {
  abstract id: string;
  abstract name: string;

  // PipelineStep required fields
  protected _checkpoint: CheckpointState<unknown> | null = null;

  // Extended state (not in PipelineStep but used internally)
  protected _state: StepState = StepState.IDLE;
  protected _progress: number = 0;
  protected _error: Error | null = null;
  protected _pauseResolver: (() => void) | null = null;
  protected _isPaused: boolean = false;

  // Sub-classes should set their sub-steps here
  protected subSteps: string[] = [];
  protected currentSubStep: number = 0;

  get state() {
    return this._state;
  }
  get progress() {
    return this._progress;
  }
  get error() {
    return this._error;
  }
  /** Used by PipelineEngine to detect pause requests */
  get isPaused() {
    return this._isPaused;
  }

  // ========== PipelineStep Interface ==========

  /**
   * execute() — PipelineStep interface entry point (called by PipelineEngine)
   * Subclasses implement _doProcess() for actual logic.
   */
  async execute(input: StepInput): Promise<StepOutput> {
    return this.process(input);
  }

  /**
   * process() — alias for _doProcess() to avoid name collision with execute().
   * Subclasses implement _doProcess() method.
   */
  async process(input: StepInput): Promise<StepOutput> {
    return this._doProcess(input);
  }

  getCheckpoint(): CheckpointState<unknown> | null {
    return this._checkpoint;
  }

  restore(state: CheckpointState<unknown>): void {
    this._checkpoint = state;
  }

  // ========== Pause/Resume/Cancel API ==========

  /** Request pause — engine checks isPaused flag */
  pause(): Promise<void> {
    if (this._state === StepState.RUNNING) {
      this._isPaused = true;
      this._state = StepState.PAUSED;
      return new Promise((resolve) => {
        this._pauseResolver = resolve;
      });
    }
    return Promise.resolve();
  }

  resume(): void {
    if (this._isPaused || this._state === StepState.PAUSED) {
      this._isPaused = false;
      this._state = StepState.RUNNING;
      if (this._pauseResolver) {
        this._pauseResolver();
        this._pauseResolver = null;
      }
    }
  }

  cancel(): void {
    this._isPaused = false;
    this._state = StepState.FAILED;
    this._error = new Error('Cancelled by user');
    if (this._pauseResolver) {
      this._pauseResolver();
      this._pauseResolver = null;
    }
  }

  reset(): void {
    this._state = StepState.IDLE;
    this._progress = 0;
    this._error = null;
    this._isPaused = false;
    this._pauseResolver = null;
    this._checkpoint = null;
  }

  // ========== Template Method (子类实现) ==========

  /**
   * Template method — 子类实现实际处理逻辑
   * 在长时间操作中定期调用 pauseCheck() 以支持暂停
   */
  protected abstract _doProcess(input: StepInput): Promise<StepOutput>;

  /**
   * 子类在循环中调用此方法检测暂停请求
   */
  protected async pauseCheck(): Promise<void> {
    if (this._isPaused) {
      await new Promise<void>((resolve) => {
        this._pauseResolver = resolve;
      });
    }
  }

  /**
   * 进度更新 — 子类通过此方法报告进度
   */
  protected updateProgress(value: number, subStepName?: string) {
    this._progress = Math.min(100, Math.max(0, value));
    if (subStepName && this.subSteps.length > 0) {
      const idx = this.subSteps.indexOf(subStepName);
      if (idx >= 0) this.currentSubStep = idx;
    }
    this.onProgressCallback?.({
      stepId: this.id,
      progress: this._progress,
      message: subStepName || this.name,
    });
  }

  /**
   * 保存检查点
   */
  protected saveCheckpoint(data: unknown) {
    this._checkpoint = {
      stepId: this.id,
      completed: false,
      data,
      timestamp: Date.now(),
    };
  }

  checkpointOnError(data: unknown) {
    this._checkpoint = {
      stepId: this.id,
      completed: false,
      data,
      timestamp: Date.now(),
    };
  }

  // Progress callback for UI binding
  onProgressCallback?: (event: { stepId: string; progress: number; message: string }) => void;
  setProgressHandler(handler: NonNullable<typeof this.onProgressCallback>) {
    this.onProgressCallback = handler;
    return this;
  }
}
