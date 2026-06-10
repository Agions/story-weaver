/**
 * 流水线扩展入口
 * @module core/services/domain/manga-pipeline-extra
 *
 * 提取自原 MangaPipelineService.generateFromImages + generateTalkingVideo。
 * 两个独立轻量方法：图生视频 + 口型视频委托。
 */

import { generateVideo } from '@/core/services/ai/image/image-generation.service';
import type { VideoGenerationResult } from '@/core/services/ai/image/image-generation.service';
import { generateTalkingHead } from '@/core/services/audio/lip-sync.service';
import type { TalkingFaceResult } from '@/core/services/audio/lip-sync.service';

import type { ProgressEmitter } from './manga-pipeline-progress';
import {
  DEFAULT_VIDEO_MODEL,
  PIPELINE_CANCELLED_MESSAGE,
  type PipelineConfig,
} from './manga-pipeline-types';

/**
 * 从图像生成视频（独立轻量入口，无 AbortController 内部维护）
 *
 * 行为与原 generateFromImages 字节级一致：
 *   - options.signal?.aborted → 抛 '流水线已被取消'
 *   - 缺省模型 DEFAULT_VIDEO_MODEL
 *   - overallProgress = (i/N)*100
 */
export async function generateFromImages(
  images: { url: string; prompt: string }[],
  config: PipelineConfig,
  options: { signal?: AbortSignal } = {},
  emit: ProgressEmitter
): Promise<VideoGenerationResult[]> {
  const results: VideoGenerationResult[] = [];
  for (let i = 0; i < images.length; i++) {
    if (options.signal?.aborted) {
      throw new Error(PIPELINE_CANCELLED_MESSAGE);
    }
    const { url, prompt } = images[i];
    emit.emit(
      'generating_images',
      (i / images.length) * 100,
      100,
      i,
      images.length,
      `生成视频 ${i + 1}`
    );
    const videoResult = await generateVideo(prompt, {
      ...config.video,
      model: config.video?.model || DEFAULT_VIDEO_MODEL,
      referenceImage: url,
      signal: options.signal,
    });
    results.push(videoResult);
  }
  return results;
}

/** 口型视频生成（单行委托） */
export function generateTalkingVideo(
  imageUrl: string,
  audioUrl: string
): Promise<TalkingFaceResult> {
  return generateTalkingHead(imageUrl, audioUrl);
}
