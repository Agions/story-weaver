/**
 * Pipeline Engine - 流水线引擎
 * 重构版本：支持检查点恢复、中间件、事件驱动
 */

import { logger } from '@/core/utils/logger';

import { saveCheckpoint, loadCheckpoint, hasCheckpoint } from './checkpoint';
import { PipelineStatus, type PipelineExecutionState, PipelineContext } from './pipeline.types';
import { PipelineStep, StepInput, StepOutput, PipelineOptions } from './step.interface';

export type { PipelineStep };

export interface PipelineEngineEventHandler {
  onStepProgress?: (stepId: string, progress: number, message?: string) => void;
  onStepFail?: (stepId: string, error: string) => void;
  onQualityGate?: (stepId: string, decision: string, details?: string) => void;
  onComplete?: (results: Map<string, StepOutput>) => void;
  onStepStart?: (stepId: string) => void;
  onStepComplete?: (stepId: string, output: StepOutput) => void;
}

/**
 * Pipeline Middleware - 流水线中间件
 */
export interface PipelineMiddleware {
  name: string;
  onStepStart?: (stepId: string, input: StepInput) => void;
  onStepComplete?: (stepId: string, output: StepOutput) => void;
  onStepError?: (stepId: string, error: Error) => void;
  onPipelineStart?: () => void;
  onPipelineComplete?: (results: StepOutput) => void;
  onPipelineError?: (error: Error) => void;
}

/**
 * Pipeline Engine Options
 */
export interface PipelineEngineOptions extends PipelineOptions {
  enableCheckpoint?: boolean;
  enableQualityGate?: boolean;
  workflowId?: string;
  projectId?: string;
  middlewares?: PipelineMiddleware[];
}

/**
 * PipelineEngine - 流水线引擎
 * 支持：
 * - 检查点保存/恢复（断点续传）
 * - 中间件扩展
 * - 事件驱动
 * - 质量门禁
 */
export class PipelineEngine {
  private steps: PipelineStep[] = [];
  private options: PipelineEngineOptions;
  private status: PipelineStatus = PipelineStatus.IDLE;
  private eventHandler?: PipelineEngineEventHandler;
  private abortController: AbortController | null = null;

  constructor(options: PipelineEngineOptions = {}) {
    this.options = {
      enableCheckpoint: true,
      enableQualityGate: true,
      ...options,
    };
  }

  onEvents(handler: PipelineEngineEventHandler): void {
    this.eventHandler = handler;
  }

  getStatus(): PipelineExecutionState {
    return {
      workflowId: this.options.workflowId ?? '',
      status: this.status,
      stepStates: new Map(),
      context: new Map() as unknown as PipelineContext,
    } as PipelineExecutionState;
  }

  pause(): boolean {
    this.status = PipelineStatus.PAUSED;
    return true;
  }

  async resume(input?: StepInput): Promise<StepOutput> {
    this.status = PipelineStatus.RUNNING;
    this.abortController = new AbortController();

    const resumeInput = input || {};
    return this.runInternal(resumeInput, true);
  }

  cancel(): void {
    this.status = PipelineStatus.CANCELLED;
    this.abortController?.abort();
  }

  addStep(step: PipelineStep): this {
    this.steps.push(step);
    return this;
  }

  addMiddleware(middleware: PipelineMiddleware): this {
    if (!this.options.middlewares) {
      this.options.middlewares = [];
    }
    this.options.middlewares!.push(middleware);
    return this;
  }

  /**
   * 运行流水线
   */
  async run(input: StepInput): Promise<StepOutput> {
    this.status = PipelineStatus.RUNNING;
    this.abortController = new AbortController();

    logger.info('[PipelineEngine] Starting pipeline', {
      workflowId: this.options.workflowId,
      steps: this.steps.map((s) => s.id),
    });

    return this.runInternal(input, false);
  }

  /**
   * 内部运行方法
   */
  private async runInternal(input: StepInput, isResume: boolean): Promise<StepOutput> {
    let context: StepInput = { ...input };
    const enableCheckpoint = this.options.enableCheckpoint && this.options.workflowId;

    // Run pipeline start middlewares
    this.options.middlewares?.forEach((m) => m.onPipelineStart?.());

    try {
      for (const step of this.steps) {
        // Check if cancelled
        if (this.status === PipelineStatus.CANCELLED) {
          throw new Error('Pipeline cancelled');
        }

        // Check if paused - would need external handling to resume
        while (this.status === PipelineStatus.PAUSED) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Run step start middlewares
        this.options.middlewares?.forEach((m) => m.onStepStart?.(step.id, context));

        // Try to restore from checkpoint on resume
        if (isResume && enableCheckpoint) {
          const checkpoint = await loadCheckpoint(step.id);
          if (checkpoint?.completed) {
            logger.info(`[PipelineEngine] Restoring from checkpoint: ${step.id}`);
            context = { ...context, ...(checkpoint.data as StepInput) };
            this.eventHandler?.onStepComplete?.(step.id, checkpoint.data as StepOutput);
            continue;
          }
        }

        // Check for checkpoint
        if (enableCheckpoint) {
          const hasValidCheckpoint = await hasCheckpoint(step.id);
          if (hasValidCheckpoint) {
            logger.info(`[PipelineEngine] Skipping completed step: ${step.id}`);
            continue;
          }
        }

        // Execute step
        try {
          this.eventHandler?.onStepStart?.(step.id);
          this.options.onProgress?.(step.id, 0);

          const result = await step.execute(context);
          context = { ...context, ...result };

          // Save checkpoint
          if (enableCheckpoint) {
            await saveCheckpoint(step.id, result);
          }

          this.options.onProgress?.(step.id, 1);
          this.eventHandler?.onStepComplete?.(step.id, result);

          // Run step complete middlewares
          this.options.middlewares?.forEach((m) => m.onStepComplete?.(step.id, result));
        } catch (error) {
          this.options.onError?.(step.id, error as Error);
          this.eventHandler?.onStepFail?.(step.id, (error as Error).message);

          // Run error middlewares
          this.options.middlewares?.forEach((m) => m.onStepError?.(step.id, error as Error));

          throw error;
        }
      }

      this.status = PipelineStatus.COMPLETED;
      this.options.onComplete?.(context as StepOutput);

      // Run pipeline complete middlewares
      this.options.middlewares?.forEach((m) => m.onPipelineComplete?.(context as StepOutput));

      logger.info('[PipelineEngine] Pipeline completed successfully');
      return context as StepOutput;
    } catch (error) {
      this.status = PipelineStatus.FAILED;
      this.eventHandler?.onStepFail?.('pipeline', (error as Error).message);

      // Run pipeline error middlewares
      this.options.middlewares?.forEach((m) => m.onPipelineError?.(error as Error));

      logger.error('[PipelineEngine] Pipeline failed:', error);
      throw error;
    }
  }

  getSteps(): PipelineStep[] {
    return [...this.steps];
  }

  isRunning(): boolean {
    return this.status === PipelineStatus.RUNNING;
  }

  isCompleted(): boolean {
    return this.status === PipelineStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === PipelineStatus.FAILED;
  }
}

/**
 * Create Pipeline Engine Factory
 */
export function createPipelineEngine(config: {
  workflowId: string;
  projectId?: string;
  enableCheckpoint?: boolean;
  enableQualityGate?: boolean;
  middlewares?: PipelineMiddleware[];
}): PipelineEngine {
  const engine = new PipelineEngine({
    workflowId: config.workflowId,
    projectId: config.projectId,
    enableCheckpoint: config.enableCheckpoint ?? true,
    enableQualityGate: config.enableQualityGate ?? true,
    middlewares: config.middlewares,
  });

  return engine;
}

/**
 * Logger Middleware - 日志中间件
 */
export const LoggerMiddleware: PipelineMiddleware = {
  name: 'logger',
  onStepStart: (stepId, _input) => {
    logger.info(`[Pipeline:Step] Starting: ${stepId}`);
  },
  onStepComplete: (stepId, _output) => {
    logger.info(`[Pipeline:Step] Completed: ${stepId}`);
  },
  onStepError: (stepId, error) => {
    logger.error(`[Pipeline:Step] Error in ${stepId}:`, error);
  },
  onPipelineStart: () => {
    logger.info('[Pipeline] Pipeline started');
  },
  onPipelineComplete: () => {
    logger.info('[Pipeline] Pipeline completed');
  },
  onPipelineError: (error) => {
    logger.error('[Pipeline] Pipeline error:', error);
  },
};

/**
 * Pipeline Metrics - 独立模块，不污染 window 全局变量
 */
interface FrameForgeMetrics {
  steps: Record<string, { completedAt: number; success: boolean }>;
  completedAt?: number;
}

// Module-level singleton (accessible via getMetrics() for debugging)
let pipelineMetrics: FrameForgeMetrics = { steps: {} };

export const getMetrics = (): Readonly<FrameForgeMetrics> => Object.freeze({ ...pipelineMetrics });

export const resetMetrics = (): void => {
  pipelineMetrics = { steps: {} };
};

export const MetricsMiddleware: PipelineMiddleware = {
  name: 'metrics',
  onStepComplete: (stepId, _output) => {
    pipelineMetrics.steps[stepId] = { completedAt: Date.now(), success: true };
  },
  onPipelineComplete: () => {
    pipelineMetrics.completedAt = Date.now();
  },
};
