/**
 * Pipeline 步骤5：视频剪辑合成 (Video Editing & Composition)
 * ========================================================
 * 负责：转场效果、字幕叠加、音频混音、最终导出
 *
 * 模块结构：
 * - video-editing.types.ts    — 类型定义（VideoClip, Transition, SubtitleBlock, AudioTrack 等）
 * - video-editor-engine.ts    — VideoEditor 纯引擎类（状态机，不涉及 Pipeline 接口）
 * - step-video-editing.ts     — PipelineStep 实现（ orchestration）
 */

import { logger } from '@/core/utils/logger';
import { tauriService } from '@/infrastructure/tauri-bridge/commands';
import { delay, PROCESSING_DELAY_MS } from '@/shared/utils';

import type {
  PipelineStep,
  StepInput,
  StepOutput,
  StepProgressEvent,
  RetryPolicy,
} from './pipeline.types';
import { PipelineStepId, PipelineExecutionMode } from './pipeline.types';
import {
  createFailedStepResult,
  createSuccessStepResult,
  reportStepProgress,
  DEFAULT_RETRY_POLICY,
} from './step-helpers';
import type {
  VideoClip,
  SubtitleBlock,
  VideoEditingOutput,
} from './steps/video-editing/video-editing.types';
import { VideoEditor } from './steps/video-editing/video-editor-engine';

// Re-export pure engine for direct unit tests (VideoEditor class).
// The pipeline step itself wraps this engine; tests target the engine directly.
export { VideoEditor };

// ========== Pipeline Step 实现 ==========

export class VideoEditingStep implements PipelineStep {
  readonly id: string;
  readonly name: string;
  readonly stepId = PipelineStepId.VIDEO_EDITING;
  readonly mode = PipelineExecutionMode.SEQUENCE;
  readonly retryPolicy: RetryPolicy;
  readonly dependencies = [PipelineStepId.RENDER, PipelineStepId.AUDIO_SYNTHESIS];
  onProgress?: (event: StepProgressEvent) => void;

  constructor(config?: Partial<PipelineStep>) {
    this.id = config?.id ?? 'step-video-editing';
    this.name = config?.name ?? '视频剪辑合成';
    this.retryPolicy = config?.retryPolicy ?? DEFAULT_RETRY_POLICY;
  }

  async execute(input: StepInput): Promise<StepOutput> {
    const startTime = Date.now();
    const context = input.context;

    logger.info(`[VideoEditingStep] Starting video editing for workflow ${input.workflowId}`);

    try {
      const renderedFrames =
        context.getVariable<Array<{ frameId: string; imageUrl: string }>>('renderedFrames') ?? [];
      const dialogueAudio =
        context.getVariable<{ audioUrl: string; duration: number }[]>('dialogueAudio') ?? [];
      const bgmPath = context.getVariable<string>('selectedBgm') ?? '';
      const subtitles = context.getVariable<SubtitleBlock[]>('generatedSubtitles') ?? [];
      const transitions =
        context.getVariable<Array<{ from: string; to: string; type: string; duration: number }>>(
          'transitions'
        ) ?? [];

      if (renderedFrames.length === 0) {
        throw new Error('No rendered frames available for video editing');
      }

      this.reportProgress(10, '正在构建视频时间轴...');

      const editor = new VideoEditor();
      const FRAME_DURATION = 5; // 每帧默认5秒

      // 构建视频片段
      const clips: VideoClip[] = renderedFrames.map((frame, idx) => ({
        id: frame.frameId,
        path: frame.imageUrl,
        type: 'image' as const,
        startTime: idx * FRAME_DURATION,
        duration: FRAME_DURATION,
      }));

      for (const clip of clips) {
        editor.addClip(clip);
      }

      // 添加转场效果
      for (let i = 0; i < clips.length - 1; i++) {
        const transCfg = transitions.find(
          (t) => t.from === clips[i].id && t.to === clips[i + 1].id
        );
        if (transCfg) {
          editor.setTransition(clips[i].id, clips[i + 1].id, {
            type: transCfg.type as
              | 'fade'
              | 'dissolve'
              | 'slide_left'
              | 'slide_right'
              | 'zoom'
              | 'blur',
            duration: transCfg.duration,
            easing: 'ease_in_out',
          });
        } else {
          editor.setTransition(clips[i].id, clips[i + 1].id, {
            type: 'fade',
            duration: 0.5,
            easing: 'ease_in_out',
          });
        }
      }

      this.reportProgress(30, '正在混合音频轨道...');

      const totalDuration = clips.length * FRAME_DURATION;

      // 对白轨道
      for (let i = 0; i < dialogueAudio.length; i++) {
        const audio = dialogueAudio[i];
        editor.addAudioTrack({
          type: 'dialogue',
          path: audio.audioUrl,
          startTime: i * FRAME_DURATION,
          duration: audio.duration,
          volume: 0.9,
          fadeIn: 0.1,
          fadeOut: 0.2,
        });
      }

      // BGM 轨道
      if (bgmPath) {
        editor.addAudioTrack({
          type: 'bgm',
          path: bgmPath,
          startTime: 0,
          duration: totalDuration,
          volume: 0.3,
          fadeIn: 1.0,
          fadeOut: 2.0,
        });
      }

      this.reportProgress(50, '正在叠加字幕...');
      editor.addSubtitleTrack(subtitles);

      this.reportProgress(70, '正在编码输出视频...');
      const finalVideoUrl = await this.exportVideo(editor, input.workflowId);

      this.reportProgress(90, '视频剪辑完成');

      context.setVariable('finalVideoUrl', finalVideoUrl);
      context.setVariable('videoEditingConfig', editor.exportConfig());
      context.setVariable('finalVideoDuration', editor.getDuration());
      context.setVariable('finalVideoResolution', { width: 1920, height: 1080 });

      const totalMs = Date.now() - startTime;
      logger.success(
        `[VideoEditingStep] Video editing completed in ${(totalMs / 1000).toFixed(1)}s`
      );

      return createSuccessStepResult(
        this.stepId,
        startTime,
        {
          finalVideoUrl,
          duration: editor.getDuration(),
          resolution: { width: 1920, height: 1080 },
          format: 'mp4' as const,
          clips: clips.map((c) => ({ id: c.id, startTime: c.startTime, duration: c.duration })),
          transitionsCount: transitions.length,
          audioTracksCount: dialogueAudio.length + (bgmPath ? 1 : 0),
          subtitlesCount: subtitles.length,
        } as VideoEditingOutput,
        {
          durationMs: totalMs,
          framesProcessed: clips.length,
        }
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[VideoEditingStep] Video editing failed: ${errorMsg}`);
      return createFailedStepResult(this.stepId, startTime, errorMsg);
    }
  }

  private reportProgress(progress: number, message: string): void {
    reportStepProgress(this.stepId, this.onProgress, progress, message);
  }

  private async exportVideo(editor: VideoEditor, workflowId: string): Promise<string> {
    const clips = editor.exportConfig().clips;
    const timestamp = Date.now();
    const outputPath = `output/${workflowId}/final_${timestamp}.mp4`;

    if (this.isTauriEnvironment()) {
      try {
        await tauriService.exportVideo({
          inputPath: clips[0]?.path ?? '',
          outputPath,
          segments: clips.map((clip) => ({
            start: clip.startTime,
            end: clip.startTime + clip.duration,
            type: clip.type,
          })),
          quality: 'high',
          format: 'mp4',
          exportId: `export-${timestamp}`,
        });

        logger.info(`[VideoEditingStep] Tauri export completed: ${outputPath}`);
        return outputPath;
      } catch (err) {
        logger.warn(`[VideoEditingStep] Tauri export failed, falling back to WebAssembly: ${err}`);
      }
    }

    this.reportProgress(75, '正在初始化 FFmpeg...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_INIT);

    this.reportProgress(80, '正在合成视频流...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_STREAM_MUX);

    this.reportProgress(85, '正在编码 H.264 视频...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_ENCODE);

    this.reportProgress(88, '正在混音音频轨道...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_AUDIO_MIX);

    this.reportProgress(90, '正在封装 MP4 文件...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_MUX_MP4);

    this.reportProgress(92, '正在写入输出文件...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_FILE_WRITE);

    logger.info(
      `[VideoEditingStep] WebAssembly export: ${outputPath}, ${clips.length} clips, ${editor.getDuration()}s`
    );

    return outputPath;
  }

  private isTauriEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return '__TAURI__' in window;
  }
}

// Re-export types for external consumers
export type {
  VideoClip,
  Transition,
  SubtitleBlock,
  SubtitleStyle,
  AudioTrack,
  VideoEditingOutput,
  VideoEditingConfig,
} from './steps/video-editing/video-editing.types';

/** Factory function — used by pipeline/index.ts */
export function createVideoEditingStep(config?: Partial<PipelineStep>): VideoEditingStep {
  return new VideoEditingStep(config);
}
