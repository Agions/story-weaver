/**
 * AutoPipelineEngine — 全自动流水线引擎（Facade）
 *
 * 核心能力（保持不变）：
 * 1. 端到端自动化：输入原材料 → 输出成片，无需用户介入
 * 2. Self-Review Loop：每个 Step 配备自审，不合格自动修复重做
 * 3. Quality Gate：关键节点设置质量门禁，不达标不推进
 * 4. 断点续传：支持暂停/恢复，中断后可继续
 * 5. 降级策略：主模型不可用时自动切换备选
 *
 * 重构思路：原 634 行单类混合了6类职责，现拆为5个子模块：
 * - pipeline-types           PipelineStep / StepInput / StepCheckpoint
 * - pipeline-step-state      applyStepStateTransition / collectStepDurations / computeProgressPercent
 * - pipeline-checkpoint      buildPipelineId / save/load + applyCheckpointToEngine + interval 常量
 * - pipeline-event-dispatcher 13 个 dispatchXxx 替代原 emit 大 switch
 * - pipeline-executor        executeStepWithTimeout / buildStepInput
 *
 * 主类保留对外 API：run / pause / resume / cancel / getStatus / getStepStates
 * / onEvents / isRunning + 工厂函数 createAutoPipelineEngine。
 */

import { logger } from '@/core/utils/logger';

import { QualityGate, createQualityGate } from './evaluator/quality-gate';
import { SelfReviewLoop, createSelfReviewLoop } from './evaluator/self-review-loop';
import {
  buildCheckpointSnapshot,
  buildPipelineId,
  CHECKPOINT_INTERVAL_MS,
  loadCheckpointFromStorage,
  saveCheckpointToStorage,
} from './pipeline-checkpoint';
import { PipelineEventDispatcher } from './pipeline-event-dispatcher';
import { buildStepInput, executeStepWithTimeout } from './pipeline-executor';
import {
  applyStepStateTransition,
  collectStepDurations,
  computeProgressPercent,
} from './pipeline-step-state';
import type { PipelineStep, StepInput } from './pipeline-types';
import type {
  AutoPipelineInput,
  AutoPipelineResult,
  PipelineEventHandler,
  PipelineStatus,
  StepOutput,
} from './types/autonomous.types';

/**
 * 步骤默认实现集合（占位）。
 * 实际步骤从 core/pipeline/steps/ 动态导入。
 */
const AUTONOMOUS_STEPS: PipelineStep[] = [];

export class AutoPipelineEngine {
  private status: PipelineStatus = 'idle';
  private currentStepId: string | null = null;
  private stepStates: Map<string, import('./types/autonomous.types').StepState> = new Map();
  private selfReview: SelfReviewLoop;
  private handlers: PipelineEventHandler[];
  private events: PipelineEventDispatcher;
  private abortController: AbortController | null = null;
  private checkpointInterval: ReturnType<typeof setInterval> | null = null;
  private context: Map<string, StepOutput> = new Map();
  private steps: PipelineStep[] = [];

  constructor(
    options: {
      selfReview?: SelfReviewLoop;
      maxReviewRetries?: number;
      reviewModel?: string;
    } = {}
  ) {
    this.selfReview =
      options.selfReview ??
      createSelfReviewLoop({
        maxRetries: options.maxReviewRetries ?? 3,
        model: options.reviewModel ?? 'glm-5',
      });
    this.handlers = [];
    this.events = new PipelineEventDispatcher(this.handlers);
  }

  // ============================================================================
  // 公共 API
  // ============================================================================

  async run(input: AutoPipelineInput): Promise<AutoPipelineResult> {
    if (this.status === 'running') {
      throw new Error('Pipeline already running');
    }

    this.status = 'running';
    this.abortController = new AbortController();
    this.context.clear();
    this.stepStates.clear();

    this.steps = await this.loadSteps();
    this.context.set('__input__', input as unknown as StepOutput);

    const startTime = Date.now();
    this.events.dispatchPipelineStart();

    try {
      for (const step of this.steps) {
        if (!step.enabled) {
          applyStepStateTransition(this.stepStates, step.stepId, 'skipped');
          continue;
        }

        if (this.abortController.signal.aborted) {
          this.status = 'cancelled';
          this.events.dispatchPipelineCancel();
          return { success: false, error: 'Pipeline cancelled by user' };
        }

        this.currentStepId = step.stepId;
        const stepResult = await this.executeStep(step);

        if (!stepResult.success) {
          this.status = 'failed';
          this.events.dispatchPipelineFail(`Step ${step.name} failed: ${stepResult.error}`);
          return {
            success: false,
            error: `Step ${step.name} failed: ${stepResult.error}`,
          };
        }
      }

      this.status = 'completed';
      const duration = Date.now() - startTime;
      const result: AutoPipelineResult = {
        success: true,
        outputPath: this.context.get('step_export')?.outputPath as string | undefined,
        duration: this.context.get('step_export')?.duration as number | undefined,
        resolution: '1080p',
        fileSize: this.context.get('step_export')?.fileSize as number | undefined,
        stepDurations: collectStepDurations(this.stepStates),
        sceneCount: (this.context.get('step_script') as unknown as { scenes?: { length: number } })
          ?.scenes?.length as number | undefined,
        characterCount: (
          this.context.get('step_character') as unknown as { characters?: { length: number } }
        )?.characters?.length as number | undefined,
        renderedFrames: (
          this.context.get('step_render') as unknown as { renderedFrames?: { length: number } }
        )?.renderedFrames?.length as number | undefined,
      };

      this.events.dispatchPipelineComplete({ ...result, duration });
      return result;
    } catch (error) {
      this.status = 'failed';
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.events.dispatchPipelineFail(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.stopCheckpointInterval();
    }
  }

  pause(): boolean {
    if (this.status !== 'running') return false;
    this.status = 'paused';
    this.events.dispatchPipelinePause();
    return true;
  }

  async resume(_input?: AutoPipelineInput): Promise<AutoPipelineResult> {
    if (this.status !== 'paused') {
      throw new Error('Pipeline is not paused');
    }

    this.status = 'running';
    this.events.dispatchPipelineResume();

    const pipelineId = buildPipelineId(
      this.context.get('__input__') as unknown as AutoPipelineInput | undefined
    );
    const checkpoint = loadCheckpointFromStorage(pipelineId);
    if (checkpoint) {
      this.restoreFromCheckpoint(checkpoint);
    }

    const fallbackInput = this.context.get('__input__') as unknown as AutoPipelineInput;
    return this.run(_input ?? fallbackInput);
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.status = 'cancelled';
    this.events.dispatchPipelineCancel();
  }

  getStatus(): { status: PipelineStatus; currentStepId: string | null; progress: number } {
    return {
      status: this.status,
      currentStepId: this.currentStepId,
      progress: computeProgressPercent(this.stepStates, this.steps.length),
    };
  }

  getStepStates(): Map<string, import('./types/autonomous.types').StepState> {
    return new Map(this.stepStates);
  }

  onEvents(handler: PipelineEventHandler): void {
    this.handlers.push(handler);
  }

  isRunning(): boolean {
    return this.status === 'running';
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 执行单个步骤（带自审循环 + 质量门禁）。
   * 行为与原 executeStep 逐字一致。
   */
  private async executeStep(step: PipelineStep): Promise<{ success: boolean; error?: string }> {
    applyStepStateTransition(this.stepStates, step.stepId, 'running');
    logger.info(`[AutoPipeline] Starting step: ${step.name} (${step.stepId})`);
    this.events.dispatchStepStart(step.stepId);

    const qualityGate = createQualityGate(step.stepId);

    const input = buildStepInput(step, this.context);

    let output: StepOutput;
    try {
      output = await executeStepWithTimeout(step, input);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      applyStepStateTransition(this.stepStates, step.stepId, 'failed', { error: errorMessage });
      this.events.dispatchStepFail(step.stepId, errorMessage);
      return { success: false, error: errorMessage };
    }

    let reviewCount = 0;
    const maxRetries = qualityGate.isSelfReviewEnabled() ? qualityGate.getMaxReviewRetries() : 0;

    while (true) {
      const gateResult = qualityGate.evaluate(step.stepId, output);

      if (gateResult.passed) {
        logger.info(
          `[AutoPipeline] Step ${step.name} passed quality gate (score: ${gateResult.score})`
        );
        this.events.dispatchQualityGate(step.stepId, { passed: true, score: gateResult.score });
        break;
      }

      reviewCount += 1;
      logger.warn(
        `[AutoPipeline] Step ${step.name} failed quality gate (attempt ${reviewCount}), score: ${gateResult.score}`
      );

      applyStepStateTransition(this.stepStates, step.stepId, 'reviewing', { reviewCount });
      this.events.dispatchStepReviewStart(step.stepId, reviewCount);

      if (reviewCount > maxRetries) {
        logger.error(
          `[AutoPipeline] Step ${step.name} exceeded max review retries (${maxRetries})`
        );
        this.events.dispatchStepFail(
          step.stepId,
          `Quality gate failed after ${maxRetries} retries`
        );
        applyStepStateTransition(this.stepStates, step.stepId, 'failed', {
          error: `Quality gate failed: ${gateResult.details}`,
        });
        return { success: false, error: `Quality gate failed: ${gateResult.details}` };
      }

      const reviewResult = await this.selfReview.review(step.stepId, output);

      if (reviewResult.passed) {
        logger.info(
          `[AutoPipeline] Review passed, but repairing dimensions: ${reviewResult.dimensions
            .filter((d) => !d.passed)
            .map((d) => d.dimension)
            .join(', ')}`
        );
      }

      const repairedOutput = await this.selfReview.repair(step.stepId, output, reviewResult);

      if (repairedOutput !== output) {
        output = repairedOutput;
        logger.info(`[AutoPipeline] Step ${step.name} output repaired (attempt ${reviewCount})`);
      }

      this.events.dispatchStepReviewComplete(step.stepId, reviewResult);
    }

    this.context.set(step.stepId, output);
    applyStepStateTransition(this.stepStates, step.stepId, 'completed', { output });
    this.events.dispatchStepComplete(step.stepId, output);
    this.saveCheckpoint(step.stepId, output, reviewCount);

    return { success: true };
  }

  /** 保存检查点（pipelineId + 状态快照 → localStorage） */
  private saveCheckpoint(stepId: string, output: StepOutput, reviewCount: number): void {
    const checkpoint = buildCheckpointSnapshot({
      pipelineId: buildPipelineId(
        this.context.get('__input__') as unknown as AutoPipelineInput | undefined
      ),
      status: this.status,
      currentStepId: stepId,
      stepStates: this.stepStates,
      context: this.context as unknown as Map<string, unknown>,
      now: Date.now(),
    });
    saveCheckpointToStorage(checkpoint);
    void reviewCount; // 保持调用签名不变（原行为也不使用）
  }

  /** 从 checkpoint 恢复 stepStates + context */
  private restoreFromCheckpoint(
    checkpoint: import('./types/autonomous.types').PipelineCheckpoint
  ): void {
    for (const [stepId, stepState] of Object.entries(checkpoint.steps)) {
      const state = stepState as unknown as import('./types/autonomous.types').StepState;
      this.stepStates.set(stepId, state);
      if (stepState.data) {
        this.context.set(stepId, stepState.data);
      }
    }
  }

  /** 启动自动检查点定时器（30 秒） */
  private startCheckpointInterval(): void {
    this.checkpointInterval = setInterval(() => {
      if (this.status === 'running' && this.currentStepId) {
        const currentOutput = this.context.get(this.currentStepId) as StepOutput | undefined;
        if (currentOutput) {
          this.saveCheckpoint(this.currentStepId, currentOutput, 0);
        }
      }
    }, CHECKPOINT_INTERVAL_MS);
  }

  /** 停止检查点定时器 */
  private stopCheckpointInterval(): void {
    if (this.checkpointInterval) {
      clearInterval(this.checkpointInterval);
      this.checkpointInterval = null;
    }
  }

  /** 动态加载步骤链（占位实现） */
  private async loadSteps(): Promise<PipelineStep[]> {
    // 实际从 core/pipeline/steps/ 动态导入
    void AUTONOMOUS_STEPS;
    return [];
  }
}

/**
 * 工厂函数：创建 AutoPipelineEngine，可选注入步骤链。
 */
export function createAutoPipelineEngine(options?: {
  maxReviewRetries?: number;
  reviewModel?: string;
  steps?: PipelineStep[];
}): AutoPipelineEngine {
  const engine = new AutoPipelineEngine(options);

  if (options?.steps) {
    // @ts-expect-error 动态注入步骤
    engine.steps = options.steps;
  }

  return engine;
}
