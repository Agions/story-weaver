/**
 * 漫画流水线步骤适配器
 *
 * 将 manga-pipeline 的 4 个阶段函数包装为单个 PipelineStep，
 * 保持原有编排逻辑不变，通过 PipelineEngine 统一管理执行。
 *
 * @module core/services/domain/manga-pipeline-steps
 */

import type {
  PipelineConfig,
  PipelineProgress,
  PipelineScene,
  PipelineStage,
  StageProgressEmitter,
} from './manga-pipeline-types';
import { generateSceneImages } from './manga-pipeline-stage-images';
import { generateSceneAudio } from './manga-pipeline-stage-audio';
import { applyLipSync } from './manga-pipeline-stage-lipsync';
import { composePipelineVideo } from './manga-pipeline-stage-compose';
import {
  STAGE_PROGRESS_START,
  STAGE_PROGRESS_WIDTH,
} from './manga-pipeline-types';
import type {
  PipelineStep,
  StepInput,
  StepOutput,
  PipelineStepId,
} from '@/core/pipeline/pipeline-types';
import { PipelineExecutionMode } from '@/core/pipeline/pipeline-types';
import { DEFAULT_RETRY_POLICY } from '@/core/pipeline/step-helpers';
import { PipelineEngine } from '@/core/pipeline/pipeline-engine';

// ============================================
// 漫画流水线步骤 ID
// ============================================

export const MANGA_STEP_IDS = {
  IMAGES: 'manga-images',
  AUDIO: 'manga-audio',
  LIPSYNC: 'manga-lipsync',
  COMPOSE: 'manga-compose',
} as const;

// ============================================
// 输入/输出类型
// ============================================

export interface MangaStepInput extends StepInput {
  scenes: PipelineScene[];
  config: PipelineConfig;
  signal: AbortSignal;
  totalScenes: number;
  progressCallback?: (progress: PipelineProgress) => void;
}

export interface MangaStepOutput extends StepOutput {
  scenes: PipelineScene[];
}

// ============================================
// 阶段映射
// ============================================

function mapEngineStepToStage(stepId: string): PipelineStage {
  switch (stepId) {
    case MANGA_STEP_IDS.IMAGES:
      return 'generating_images';
    case MANGA_STEP_IDS.AUDIO:
      return 'generating_audio';
    case MANGA_STEP_IDS.LIPSYNC:
      return 'syncing_lips';
    case MANGA_STEP_IDS.COMPOSE:
      return 'composing';
    default:
      return 'processing';
  }
}

// ============================================
// 单个 PipelineStep 实现（4 阶段串行）
// ============================================

/**
 * 漫画流水线统一步骤
 *
 * 在单个 PipelineStep 内执行 images → audio → lipsync → compose，
 * 保持原有编排逻辑和进度推送行为，供 PipelineEngine 编排使用。
 */
export class MangaPipelineStep implements PipelineStep {
  readonly id: string;
  readonly name = '漫画流水线';
  readonly stepId: PipelineStepId = MANGA_STEP_IDS.IMAGES as PipelineStepId;
  readonly mode = PipelineExecutionMode.SEQUENCE;
  readonly retryPolicy = DEFAULT_RETRY_POLICY;
  onProgress?: (event: { stepId: string; progress: number; message?: string }) => void;

  constructor(
    private progressCallback?: (progress: PipelineProgress) => void
  ) {
    this.id = 'manga-pipeline';
  }

  async execute(input: unknown): Promise<StepOutput> {
    const ctx = input as MangaStepInput;
    this.progressCallback = ctx.progressCallback;
    const startTime = Date.now();
    const totalScenes = ctx.totalScenes;

    try {
      // 阶段 1：图像生成
      this.emitProgress('generating_images', STAGE_PROGRESS_START.images, 0, 0, totalScenes, '开始生成场景图像');
      const scenes = await generateSceneImages(
        ctx.scenes,
        ctx.config,
        ctx.signal,
        createProgressProxy(this.progressCallback, MANGA_STEP_IDS.IMAGES, totalScenes),
        totalScenes
      );
      this.emitProgress('generating_images', STAGE_PROGRESS_START.images + STAGE_PROGRESS_WIDTH.images, 100, scenes.length, totalScenes, '场景图像生成完成');

      // 阶段 2：语音合成
      this.emitProgress('generating_audio', STAGE_PROGRESS_START.audio, 0, scenes.length, totalScenes, '开始生成语音');
      await generateSceneAudio(
        scenes,
        ctx.config,
        ctx.signal,
        createProgressProxy(this.progressCallback, MANGA_STEP_IDS.AUDIO, totalScenes),
        totalScenes
      );
      this.emitProgress('generating_audio', STAGE_PROGRESS_START.audio + STAGE_PROGRESS_WIDTH.audio, 100, scenes.length, totalScenes, '语音生成完成');

      // 阶段 3：唇同步
      this.emitProgress('syncing_lips', STAGE_PROGRESS_START.lipsync, 0, scenes.length, totalScenes, '开始唇同步');
      await applyLipSync(
        scenes,
        ctx.config,
        ctx.signal,
        createProgressProxy(this.progressCallback, MANGA_STEP_IDS.LIPSYNC, totalScenes),
        totalScenes
      );
      this.emitProgress('syncing_lips', STAGE_PROGRESS_START.lipsync + STAGE_PROGRESS_WIDTH.lipsync, 100, scenes.length, totalScenes, '唇同步完成');

      // 阶段 4：视频合成
      this.emitProgress('composing', STAGE_PROGRESS_START.compose, 0, scenes.length, totalScenes, '开始合成视频');
      await composePipelineVideo(
        scenes,
        ctx.config,
        createProgressProxy(this.progressCallback, MANGA_STEP_IDS.COMPOSE, totalScenes),
        totalScenes
      );
      this.emitProgress('composing', STAGE_PROGRESS_START.compose + STAGE_PROGRESS_WIDTH.compose, 100, scenes.length, totalScenes, '视频合成完成');

      this.emitProgress('completed', 100, 100, scenes.length, totalScenes, '生成完成');

        return {
          scenes,
          durationMs: Date.now() - startTime,
        } as unknown as StepOutput;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.progressCallback?.({
        stage: 'failed',
        overallProgress: 0,
        stageProgress: 0,
        currentSceneIndex: 0,
        totalScenes: totalScenes,
        message: `漫画流水线失败: ${msg}`,
      });
      throw error;
    }
  }

  private emitProgress(
    stage: PipelineStage,
    overallProgress: number,
    stageProgress: number,
    currentSceneIndex: number,
    totalScenes: number,
    message: string
  ): void {
    this.progressCallback?.({
      stage,
      overallProgress,
      stageProgress,
      currentSceneIndex,
      totalScenes,
      message,
    });
  }
}

/** 创建漫画流水线步骤实例 */
export function createMangaPipelineStep(
  progressCallback?: (progress: PipelineProgress) => void
): PipelineStep {
  return new MangaPipelineStep(progressCallback);
}

// ============================================
// 引擎构建器
// ============================================

export interface CreateMangaPipelineEngineOptions {
  workflowId: string;
  projectId?: string;
  enableCheckpoint?: boolean;
  onProgress?: (progress: PipelineProgress) => void;
  onComplete?: (result: { scenes: PipelineScene[]; finalVideoUrl?: string; totalProcessingTime: number; status: string; error?: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * 创建漫画流水线引擎（单个 PipelineStep 的 PipelineEngine 实例）
 *
 * 将 MangaPipelineService 的 4 阶段编排以单个 PipelineStep 形式
 * 注册到 PipelineEngine，复用引擎的 cancel / checkpoint / event 能力。
 */
export function createMangaPipelineEngine(
  options: CreateMangaPipelineEngineOptions
): PipelineEngine {
  const engine = new PipelineEngine({
    workflowId: options.workflowId,
    projectId: options.projectId,
    enableCheckpoint: options.enableCheckpoint ?? true,
    enableQualityGate: false,
    middlewares: [],
  });

  const mangaProgress = options.onProgress;

  engine.onEvents({
    onStepStart: (stepId) => {
      mangaProgress?.({
        stage: mapEngineStepToStage(stepId),
        overallProgress: 0,
        stageProgress: 0,
        currentSceneIndex: 0,
        totalScenes: 0,
        message: `开始步骤: ${stepId}`,
      });
    },
    onStepComplete: (stepId, output) => {
      const stepOutput = output as MangaStepOutput;
      mangaProgress?.({
        stage: 'completed',
        overallProgress: 100,
        stageProgress: 100,
        currentSceneIndex: stepOutput.scenes?.length ?? 0,
        totalScenes: stepOutput.scenes?.length ?? 0,
        message: `步骤完成: ${stepId}`,
      });
    },
    onStepFail: (stepId, errorMessage) => {
      mangaProgress?.({
        stage: 'failed',
        overallProgress: 0,
        stageProgress: 0,
        currentSceneIndex: 0,
        totalScenes: 0,
        message: `步骤失败: ${stepId} - ${errorMessage}`,
      });
    },
  });

  return engine;
}

/**
 * 创建进度回调代理
 *
 * 将 MangaPipeline 阶段函数的 StageProgressEmitter 转换为
 * PipelineStep 的 progressCallback 调用。
 */
function createProgressProxy(
  callback: ((progress: PipelineProgress) => void) | undefined,
  stepId: string,
  totalScenes: number
): StageProgressEmitter {
  return {
    emit: (_stage: PipelineStage, overallProgress: number, _stageProgress: number, currentSceneIndex: number, _total: number, message?: string) => {
      callback?.({
        stage: mapEngineStepToStage(stepId),
        overallProgress,
        stageProgress: _stageProgress,
        currentSceneIndex,
        totalScenes,
        message,
      });
    },
  };
}
