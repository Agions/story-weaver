/**
 * Domain Events — 领域事件基类与预定义事件
 * 所有领域事件均实现 IEvent 接口，通过 EventBus 异步传播
 */

import { logger } from '@/core/utils/logger';

/**
 * 事件基类 — 所有领域事件的父类
 * @version 1.0 初始版本，未来可能演进需注意兼容性
 */
export abstract class DomainEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly correlationId?: string;
  /** 事件版本，用于前向兼容的事件演进 */
  readonly version: string;

  constructor(
    public readonly type: string,
    public readonly source: string,
    correlationId?: string,
    version: string = '1.0'
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.correlationId = correlationId ?? this.id;
    this.version = version;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      source: this.source,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      version: this.version,
    };
  }
}

// ========== Pipeline 事件 ==========

export class StepStartedEvent extends DomainEvent {
  constructor(source: string, public readonly stepId: string, public readonly stepName: string) {
    super('pipeline.step.started', source);
  }
}

export class StepProgressEvent extends DomainEvent {
  constructor(source: string, public readonly stepId: string, public readonly progress: number, public readonly message: string) {
    super('pipeline.step.progress', source);
  }
}

export class StepCompletedEvent extends DomainEvent {
  constructor(source: string, public readonly stepId: string, public readonly durationMs: number, public readonly metrics?: Record<string, unknown>) {
    super('pipeline.step.completed', source);
  }
}

export class StepFailedEvent extends DomainEvent {
  constructor(source: string, public readonly stepId: string, public readonly error: string, public readonly recoverable: boolean) {
    super('pipeline.step.failed', source);
  }
}

export class PipelineCompletedEvent extends DomainEvent {
  constructor(source: string, public readonly workflowId: string, public readonly totalDurationMs: number) {
    super('pipeline.completed', source);
  }
}

export class PipelineFailedEvent extends DomainEvent {
  constructor(source: string, public readonly workflowId: string, public readonly error: string) {
    super('pipeline.failed', source);
  }
}

export class CheckpointSavedEvent extends DomainEvent {
  constructor(source: string, public readonly stepId: string, public readonly timestamp: number) {
    super('pipeline.checkpoint.saved', source);
  }
}

// ========== Script 领域事件 ==========

export class ScriptGeneratedEvent extends DomainEvent {
  constructor(source: string, public readonly scriptId: string, public readonly title: string, public readonly sceneCount: number) {
    super('script.generated', source);
  }
}

export class ScriptParsedEvent extends DomainEvent {
  constructor(source: string, public readonly scriptId: string, public readonly scenes: string[]) {
    super('script.parsed', source);
  }
}

// ========== Asset 领域事件 ==========

export class ImageGeneratedEvent extends DomainEvent {
  constructor(source: string, public readonly assetId: string, public readonly frameId: string, public readonly imageUrl: string) {
    super('asset.image.generated', source);
  }
}

export class AudioGeneratedEvent extends DomainEvent {
  constructor(source: string, public readonly assetId: string, public readonly dialogueId: string, public readonly audioUrl: string) {
    super('asset.audio.generated', source);
  }
}

export class TtsCompletedEvent extends DomainEvent {
  constructor(source: string, public readonly dialogueId: string, public readonly audioUrl: string, public readonly durationSec: number) {
    super('asset.tts.completed', source);
  }
}

// ========== Render 领域事件 ==========

export class FrameRenderedEvent extends DomainEvent {
  constructor(source: string, public readonly frameId: string, public readonly qualityScore: number) {
    super('render.frame.completed', source);
  }
}

export class BatchRenderProgressEvent extends DomainEvent {
  constructor(source: string, public readonly completed: number, public readonly total: number, public readonly failed: number) {
    super('render.batch.progress', source);
  }
}

// ========== Quality Gate 事件 ==========

export class QualityGatePassedEvent extends DomainEvent {
  constructor(source: string, public readonly stepId: string, public readonly score: number) {
    super('quality.gate.passed', source);
  }
}

export class QualityGateFailedEvent extends DomainEvent {
  constructor(source: string, public readonly stepId: string, public readonly issues: QualityGateIssue[]) {
    super('quality.gate.failed', source);
  }
}

export interface QualityGateIssue {
  code: string;
  level: 'error' | 'warning';
  title: string;
  detail: string;
}

// ========== Review Gate 事件 ==========

export class ReviewRequestedEvent extends DomainEvent {
  constructor(source: string, public readonly afterStep: string, public readonly stepOutput: unknown) {
    super('review.requested', source);
  }
}

export class ReviewCompletedEvent extends DomainEvent {
  constructor(source: string, public readonly afterStep: string, public readonly approved: boolean, public readonly reviewerComment?: string) {
    super('review.completed', source);
  }
}

// ========== Plugin 事件 ==========

export class PluginRegisteredEvent extends DomainEvent {
  constructor(source: string, public readonly pluginType: 'style' | 'format', public readonly pluginId: string, public readonly pluginName: string) {
    super('plugin.registered', source);
  }
}

export class PluginActivatedEvent extends DomainEvent {
  constructor(source: string, public readonly pluginType: 'style' | 'format', public readonly pluginId: string) {
    super('plugin.activated', source);
  }
}

// ========== Event Factory ==========

export function createEvent<T extends DomainEvent>(
  eventClass: new (source: string, ...args: unknown[]) => T,
  source: string,
  ...args: unknown[]
): T {
  return new eventClass(source, ...args);
}