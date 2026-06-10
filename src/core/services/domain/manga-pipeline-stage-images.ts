/**
 * 流水线阶段 1：图像生成
 * @module core/services/domain/manga-pipeline-stage-images
 *
 * 提取自原 generateFromNovel "阶段 1" 循环（generateImage 调用 + 进度推送）。
 */

import { generateImage } from '@/core/services/ai/image/image-generation.service';

import type { ProgressEmitter } from './manga-pipeline-progress';
import {
  DEFAULT_IMAGE_MODEL,
  PIPELINE_CANCELLED_MESSAGE,
  STAGE_PROGRESS_START,
  STAGE_PROGRESS_WIDTH,
  type PipelineConfig,
  type PipelineScene,
} from './manga-pipeline-types';

/** 抛出"流水线已被取消"错误的统一入口（与原 3 处 if (signal.aborted) throw 字节级一致） */
export function ensureNotAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new Error(PIPELINE_CANCELLED_MESSAGE);
  }
}

/**
 * 阶段 1：遍历 scenes，逐场景调 generateImage
 *
 * 行为与原 generateFromNovel 阶段 1 字节级一致：
 *   - 起始 overallProgress=10，每场景 +30/N
 *   - 起始 stageProgress=0，每场景更新为 (i+1)/N * 100
 *   - signal.aborted → 抛错
 *   - 缺省模型用 DEFAULT_IMAGE_MODEL
 */
export async function generateSceneImages(
  scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[],
  config: PipelineConfig,
  signal: AbortSignal,
  emit: ProgressEmitter,
  totalScenes: number
): Promise<PipelineScene[]> {
  const pipelineScenes: PipelineScene[] = [];
  emit.emit('generating_images', STAGE_PROGRESS_START.images, 0, 0, totalScenes, '开始生成场景图像');

  for (let i = 0; i < scenes.length; i++) {
    ensureNotAborted(signal);
    const scene = scenes[i];
    emit.emit(
      'generating_images',
      STAGE_PROGRESS_START.images + (i / totalScenes) * STAGE_PROGRESS_WIDTH.images,
      ((i + 1) / totalScenes) * 100,
      i,
      totalScenes,
      `生成场景 ${i + 1}: ${scene.description}`
    );

    const imageResult = await generateImage(scene.imagePrompt, {
      ...config.image,
      model: config.image?.model || DEFAULT_IMAGE_MODEL,
      signal,
    });
    pipelineScenes.push({ ...scene, imageUrl: imageResult.url });
  }
  return pipelineScenes;
}
