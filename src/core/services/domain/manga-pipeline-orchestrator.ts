/**
 * 流水线编排
 * @module core/services/domain/manga-pipeline-orchestrator
 *
 * 提取自原 MangaPipelineService.generateFromNovel 主流程 + cancelled / failed 包装。
 * 4 阶段串行：images → audio → lipsync → compose
 */

import { applyLipSync } from './manga-pipeline-stage-lipsync';
import { composePipelineVideo } from './manga-pipeline-stage-compose';
import { generateSceneAudio } from './manga-pipeline-stage-audio';
import { generateSceneImages } from './manga-pipeline-stage-images';
import { ProgressEmitter } from './manga-pipeline-progress';
import {
  ABORT_ERROR_NAME,
  PIPELINE_CANCELLED_MESSAGE,
  type PipelineConfig,
  type PipelineProgress,
  type PipelineResult,
  type PipelineScene,
} from './manga-pipeline-types';

export type ProgressListener = (progress: PipelineProgress) => void;

/** 构造失败的 PipelineResult（status='failed'） */
export function buildFailedResult(
  scenes: PipelineScene[],
  startTime: number,
  errorMessage: string
): PipelineResult {
  return {
    scenes,
    totalProcessingTime: Date.now() - startTime,
    status: 'failed',
    error: errorMessage,
  };
}

/** 构造成功的 PipelineResult（status='completed'） */
export function buildCompletedResult(
  scenes: PipelineScene[],
  startTime: number
): PipelineResult {
  return {
    scenes,
    finalVideoUrl: scenes[0]?.finalVideoUrl,
    totalProcessingTime: Date.now() - startTime,
    status: 'completed',
  };
}

/** 判断一个错误是否为"取消" */
export function isPipelineCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as Error;
  return e.name === ABORT_ERROR_NAME || e.message === PIPELINE_CANCELLED_MESSAGE;
}

/**
 * 流水线主流程编排
 *
 * 行为与原 `MangaPipelineService.generateFromNovel` 字节级一致：
 *   1. 准备 AbortController（外部传 signal 优先）
 *   2. 阶段 1 图像 → 阶段 2 音频 → 阶段 3 唇同步 → 阶段 4 合成
 *   3. catch 中：cancelled → failed("流水线已被取消")；其余 → failed(error.message)
 *   4. 任意失败前 emit('failed', 100, 100, 0, 0, message)
 */
export async function runPipeline(
  novelContent: string,
  scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[],
  config: PipelineConfig,
  options: { signal?: AbortSignal } = {},
  emit: ProgressEmitter
): Promise<PipelineResult> {
  const startTime = Date.now();
  const totalScenes = scenes.length;
  // 优先使用外部 signal，否则由调用方负责 abortController
  const signal = options.signal ?? new AbortController().signal;
  let pipelineScenes: PipelineScene[] = [];

  try {
    // 阶段 1：图像
    pipelineScenes = await generateSceneImages(scenes, config, signal, emit, totalScenes);
    // 阶段 2：语音
    await generateSceneAudio(pipelineScenes, config, signal, emit, totalScenes);
    // 阶段 3：唇同步
    await applyLipSync(pipelineScenes, config, signal, emit, totalScenes);
    // 阶段 4：合成
    await composePipelineVideo(pipelineScenes, config, emit, totalScenes);

    emit.emit('completed', 100, 100, totalScenes, totalScenes, '生成完成');
    return buildCompletedResult(pipelineScenes, startTime);
  } catch (error) {
    const errorMessage = isPipelineCancelled(error)
      ? PIPELINE_CANCELLED_MESSAGE
      : error instanceof Error
        ? error.message
        : '未知错误';
    emit.emit('failed', 100, 100, 0, 0, errorMessage);
    return buildFailedResult(pipelineScenes, startTime, errorMessage);
  }
  // 静默吞掉未使用变量警告（novelContent 暂未使用，保留参数兼容性）
  void novelContent;
}
