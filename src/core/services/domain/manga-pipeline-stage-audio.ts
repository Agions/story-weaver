/**
 * 流水线阶段 2：语音合成
 * @module core/services/domain/manga-pipeline-stage-audio
 *
 * 提取自原 generateFromNovel "阶段 2" 循环（ttsService.synthesize + 进度推送 + 占位 URL）。
 */

import { ttsService } from '@/core/services/audio/tts-service';

import { ensureNotAborted } from './manga-pipeline-stage-images';
import type { StageProgressEmitter } from './manga-pipeline-types';
import {
  DEFAULT_TTS_CONFIG,
  STAGE_PROGRESS_START,
  STAGE_PROGRESS_WIDTH,
  TTS_AUDIO_URL_PREFIX,
  type PipelineConfig,
  type PipelineScene,
} from './manga-pipeline-types';

/**
 * 阶段 2：遍历 pipelineScenes，对有 dialogue 的场景调 ttsService
 *
 * 行为与原 generateFromNovel 阶段 2 字节级一致：
 *   - 起始 overallProgress=40，每场景 +20/N
 *   - 无 dialogue 的场景跳过（pipelineScenes 不写入 audioUrl）
 *   - audioUrl 使用占位字符串 `tts_audio_${i}`，原实现如此
 */
export async function generateSceneAudio(
  pipelineScenes: PipelineScene[],
  _config: PipelineConfig,
  signal: AbortSignal,
  emit: StageProgressEmitter,
  totalScenes: number
): Promise<void> {
  emit.emit('generating_audio', STAGE_PROGRESS_START.audio, 0, 0, totalScenes, '开始生成语音');

  for (let i = 0; i < pipelineScenes.length; i++) {
    ensureNotAborted(signal);
    const scene = pipelineScenes[i];
    if (!scene.dialogue) continue;

    emit.emit(
      'generating_audio',
      STAGE_PROGRESS_START.audio + (i / totalScenes) * STAGE_PROGRESS_WIDTH.audio,
      ((i + 1) / totalScenes) * 100,
      i,
      totalScenes,
      `生成语音 ${i + 1}`
    );

    await ttsService.synthesize({
      text: scene.dialogue,
      config: { ...DEFAULT_TTS_CONFIG },
      signal,
    });
    pipelineScenes[i].audioUrl = TTS_AUDIO_URL_PREFIX + i;
  }
}
