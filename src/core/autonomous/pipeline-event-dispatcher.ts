/**
 * Pipeline 事件分发器
 *
 * 把原 AutoPipelineEngine.emit 中的 13-case switch 拆为独立的派发函数。
 * - 类型安全：每个事件有独立签名
 * - 调用方通过 dispatchXxxEvent(...) 调用，避免字符串魔数
 * - 兼容旧 emit(eventType, ...args) 调用方式（保留兼容层）
 */

import type {
  AutoPipelineResult,
  PipelineEventHandler,
  QualityGateResult,
  ReviewResult,
  StepOutput,
} from './autonomous.types';

// ─────────── 事件类型常量（保留兼容旧 emit 字符串协议） ───────────

export const PIPELINE_EVENT = {
  STEP_START: 'step_start',
  STEP_PROGRESS: 'step_progress',
  STEP_COMPLETE: 'step_complete',
  STEP_FAIL: 'step_fail',
  STEP_REVIEW_START: 'step_review_start',
  STEP_REVIEW_COMPLETE: 'step_review_complete',
  QUALITY_GATE: 'quality_gate',
  PIPELINE_START: 'pipeline_start',
  PIPELINE_COMPLETE: 'pipeline_complete',
  PIPELINE_FAIL: 'pipeline_fail',
  PIPELINE_PAUSE: 'pipeline_pause',
  PIPELINE_RESUME: 'pipeline_resume',
  PIPELINE_CANCEL: 'pipeline_cancel',
} as const;

export type PipelineEventType = (typeof PIPELINE_EVENT)[keyof typeof PIPELINE_EVENT];

/**
 * 类型化的事件派发器：把单 case 的实现拆成独立函数，
 * 避免巨型 switch 难以阅读与扩展。
 */
export class PipelineEventDispatcher {
  constructor(private handlers: PipelineEventHandler[]) {}

  /** step_start(stepId) */
  dispatchStepStart(stepId: string): void {
    for (const handler of this.handlers) {
      handler.onStepStart?.(stepId);
    }
  }

  /** step_progress(stepId, progress, message) */
  dispatchStepProgress(stepId: string, progress: number, message: string): void {
    for (const handler of this.handlers) {
      handler.onStepProgress?.(stepId, progress, message);
    }
  }

  /** step_complete(stepId, output) */
  dispatchStepComplete(stepId: string, output: StepOutput): void {
    for (const handler of this.handlers) {
      handler.onStepComplete?.(stepId, output);
    }
  }

  /** step_fail(stepId, errorMessage) */
  dispatchStepFail(stepId: string, errorMessage: string): void {
    for (const handler of this.handlers) {
      handler.onStepFail?.(stepId, errorMessage);
    }
  }

  /** step_review_start(stepId, reviewCount) */
  dispatchStepReviewStart(stepId: string, reviewCount: number): void {
    for (const handler of this.handlers) {
      handler.onStepReviewStart?.(stepId, reviewCount);
    }
  }

  /** step_review_complete(stepId, reviewResult) */
  dispatchStepReviewComplete(stepId: string, reviewResult: ReviewResult): void {
    for (const handler of this.handlers) {
      handler.onStepReviewComplete?.(stepId, reviewResult);
    }
  }

  /** quality_gate(stepId, result) */
  dispatchQualityGate(stepId: string, result: QualityGateResult): void {
    for (const handler of this.handlers) {
      handler.onQualityGate?.(stepId, result);
    }
  }

  /** pipeline_start() */
  dispatchPipelineStart(): void {
    for (const handler of this.handlers) {
      handler.onPipelineStart?.();
    }
  }

  /** pipeline_complete(result) */
  dispatchPipelineComplete(result: AutoPipelineResult): void {
    for (const handler of this.handlers) {
      handler.onPipelineComplete?.(result);
    }
  }

  /** pipeline_fail(errorMessage) */
  dispatchPipelineFail(errorMessage: string): void {
    for (const handler of this.handlers) {
      handler.onPipelineFail?.(errorMessage);
    }
  }

  /** pipeline_pause() */
  dispatchPipelinePause(): void {
    for (const handler of this.handlers) {
      handler.onPipelinePause?.();
    }
  }

  /** pipeline_resume() */
  dispatchPipelineResume(): void {
    for (const handler of this.handlers) {
      handler.onPipelineResume?.();
    }
  }

  /** pipeline_cancel() */
  dispatchPipelineCancel(): void {
    for (const handler of this.handlers) {
      handler.onPipelineCancel?.();
    }
  }
}
