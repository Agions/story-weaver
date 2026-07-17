/**
 * 流水线阶段 3：唇同步
 * @module core/services/domain/manga-pipeline-stage-lipsync
 *
 * 提取自原 generateFromNovel "阶段 3" 循环（syncLip + 进度推送）。
 */

import { syncLip } from '@/core/services/audio/lip-sync-service';

import { ensureNotAborted } from './manga-pipeline-stage-images';
import type { StageProgressEmitter } from './manga-pipeline-types';
import {
  STAGE_PROGRESS_START,
  STAGE_PROGRESS_WIDTH,
  type PipelineConfig,
  type PipelineScene,
} from './manga-pipeline-types';

/**
 * 阶段 3：遍历 pipelineScenes，对有 imageUrl + audioUrl 的场景调 syncLip
 *
 * 行为与原 generateFromNovel 阶段 3 字节级一致：
 *   - 起始 overallProgress=60，每场景 +20/N
 *   - 缺 imageUrl / audioUrl 的场景跳过
 *   - 结果写入 scene.videoUrl
 */
export async function applyLipSync(
  pipelineScenes: PipelineScene[],
  config: PipelineConfig,
  signal: AbortSignal,
  emit: StageProgressEmitter,
  totalScenes: number
): Promise<void> {
  emit.emit('syncing_lips', STAGE_PROGRESS_START.lipsync, 0, 0, totalScenes, '开始唇同步');

  for (let i = 0; i < pipelineScenes.length; i++) {
    ensureNotAborted(signal);
    const scene = pipelineScenes[i];
    if (!scene.imageUrl || !scene.audioUrl) continue;

    emit.emit(
      'syncing_lips',
      STAGE_PROGRESS_START.lipsync + (i / totalScenes) * STAGE_PROGRESS_WIDTH.lipsync,
      ((i + 1) / totalScenes) * 100,
      i,
      totalScenes,
      `唇同步 ${i + 1}`
    );

    const lipSyncResult = await syncLip(scene.imageUrl, scene.audioUrl, config.lipSync);
    scene.videoUrl = lipSyncResult.url;
  }
}
