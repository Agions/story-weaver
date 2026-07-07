/**
 * Telemetry — 遥测埋点工具
 * 在生成流程的关键节点注入埋点，支持日志上报 + 自定义 exporter
 */

import { logger } from '@/core/utils/logger';

export enum TelemetryEvent {
  PIPELINE_START = 'pipeline:start',
  PIPELINE_COMPLETE = 'pipeline:complete',
  PIPELINE_FAIL = 'pipeline:fail',
  PIPELINE_STEP_START = 'step:start',
  PIPELINE_STEP_COMPLETE = 'step:complete',
  PIPELINE_STEP_RETRY = 'step:retry',
  PIPELINE_STEP_FAIL = 'step:fail',
  QUALITY_CHECK_PASS = 'quality:pass',
  QUALITY_CHECK_FAIL = 'quality:fail',
  REVIEW_REQUESTED = 'review:requested',
  REVIEW_APPROVED = 'review:approved',
  ASSET_GENERATED = 'asset:generated',
  VIDEO_EXPORTED = 'video:exported',
  USER_ACTION = 'user:action',
  ERROR_OCCURRED = 'error:occurred',
}

export interface TelemetryPayload {
  event: TelemetryEvent;
  timestamp: number;
  projectId?: string;
  stepId?: string;
  duration?: number;
  error?: string;
  errorStack?: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetryExporter {
  export(payload: TelemetryPayload): void | Promise<void>;
}

class ConsoleExporter implements TelemetryExporter {
  export(payload: TelemetryPayload): void {
    logger.info('[Telemetry] ' + payload.event, {
      ts: new Date(payload.timestamp).toISOString(),
      projectId: payload.projectId,
      stepId: payload.stepId,
      dur: payload.duration,
      err: payload.error,
      meta: payload.metadata,
    });
  }
}

class TelemetryService {
  private static instance: TelemetryService;
  private exporters: TelemetryExporter[] = [new ConsoleExporter()];
  private enabled = true;

  private constructor() {}

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  addExporter(exporter: TelemetryExporter): void {
    this.exporters.push(exporter);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  track(payload: TelemetryPayload): void {
    if (!this.enabled) return;
    for (const exporter of this.exporters) {
      try {
        void exporter.export(payload);
      } catch (err) {
        logger.error('[Telemetry] Exporter error', err);
      }
    }
  }

  /**
   * 构造 telemetry 事件基础 payload。
   * 内部 helper — 消除 trackPipeline / trackStep / trackError 重复字段。
   */
  private buildBasePayload(params: {
    event: TelemetryEvent;
    projectId?: string;
    duration?: number;
    error?: string;
    metadata?: Record<string, unknown>;
  }) {
    return {
      event: params.event,
      timestamp: Date.now(),
      projectId: params.projectId,
      duration: params.duration,
      error: params.error,
      metadata: params.metadata,
    };
  }

  trackPipeline(params: {
    event: TelemetryEvent;
    projectId: string;
    duration?: number;
    error?: string;
    metadata?: Record<string, unknown>;
  }): void {
    this.track(this.buildBasePayload(params));
  }

  trackStep(params: {
    projectId: string;
    stepId: string;
    event: TelemetryEvent;
    duration?: number;
    error?: string;
    metadata?: Record<string, unknown>;
  }): void {
    this.track({
      ...this.buildBasePayload(params),
      stepId: params.stepId,
    });
  }

  trackError(params: {
    projectId?: string;
    stepId?: string;
    error: Error;
    metadata?: Record<string, unknown>;
  }): void {
    this.track({
      event: TelemetryEvent.ERROR_OCCURRED,
      timestamp: Date.now(),
      projectId: params.projectId,
      stepId: params.stepId,
      error: params.error.message,
      errorStack: params.error.stack,
      metadata: params.metadata,
    });
  }
}

export const telemetry = TelemetryService.getInstance();
export default telemetry;
