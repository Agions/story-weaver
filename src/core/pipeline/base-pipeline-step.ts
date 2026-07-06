import { logger } from '@/core/utils/logger';

import type {
  PipelineStep,
  StepInput,
  StepOutput,
  StepProgressEvent,
  RetryPolicy,
  PipelineStepId,
} from './pipeline.types';
import { PipelineExecutionMode } from './pipeline.types';
import {
  createFailedStepResult,
  createSuccessStepResult,
  reportStepProgress,
  DEFAULT_RETRY_POLICY,
} from './step-helpers';

/**
 * Pipeline Step 基类
 *
 * 子类只需实现 executeImpl() 和配置属性，无需重复：
 * - 统一构造器样板（id/name/stepId/mode/retryPolicy/onProgress/dependencies）
 * - 统一 execute()（耗时统计 + try/catch + 标准化 StepOutput）
 * - 统一 reportProgress()
 */
export abstract class BasePipelineStep implements PipelineStep {
  readonly id: string;
  readonly name: string;
  readonly stepId: PipelineStepId;
  readonly mode: PipelineExecutionMode = PipelineExecutionMode.SEQUENCE;
  readonly retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY;
  readonly dependencies?: PipelineStepId[];
  readonly parallelKeys?: string[];
  onProgress?: (event: StepProgressEvent) => void;

  constructor(config?: Partial<PipelineStep>) {
    this.id = config?.id ?? '';
    this.name = config?.name ?? '';
    this.stepId = config?.stepId ?? ('' as PipelineStepId);
    this.mode = config?.mode ?? PipelineExecutionMode.SEQUENCE;
    this.retryPolicy = config?.retryPolicy ?? DEFAULT_RETRY_POLICY;
    this.dependencies = config?.dependencies;
    this.parallelKeys = config?.parallelKeys;
    this.onProgress = config?.onProgress;
  }

  async execute(input: StepInput): Promise<StepOutput> {
    const startTime = Date.now();
    try {
      const result = await this.executeImpl(input);
      return createSuccessStepResult(this.stepId, startTime, result, {
        durationMs: Date.now() - startTime,
        ...this.computeMetrics(result),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[${this.name}] failed: ${msg}`);
      return createFailedStepResult(this.stepId, startTime, msg);
    }
  }

  protected reportProgress(progress: number, message: string): void {
    reportStepProgress(this.stepId, this.onProgress, progress, message);
  }

  /** 子类实现具体业务逻辑，返回步骤数据（自动包装为 StepOutput） */
  protected abstract executeImpl(input: StepInput): Promise<unknown>;

  /** 子类可覆盖，返回额外的 metrics 字段（framesProcessed / tokensUsed 等） */
  protected computeMetrics(_result: unknown): Record<string, unknown> {
    return {};
  }
}
