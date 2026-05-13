/**
 * Pipeline 步骤5：视频剪辑合成 (Video Editing & Composition)
 *
 * 负责：转场效果、字幕叠加、音频混音、最终导出
 */

import { logger } from '@/core/utils/logger';

import type {
  PipelineStep,
  StepInput,
  StepOutput,
  StepProgressEvent,
  RetryPolicy,
} from './pipeline.types';
import {
  PipelineStepId,
  StepStatus,
  QualityGateDecision,
  PipelineExecutionMode,
} from './pipeline.types';

// ========== 类型定义 ==========

export interface VideoClip {
  id: string;
  path: string;
  type: 'image' | 'video';
  startTime: number; // 在最终视频中的起始时间
  duration: number; // 持续时长（秒）
  sourceStart?: number; // 对于视频片段：源素材的起始点
  sourceEnd?: number; // 对于视频片段：源素材的结束点
}

export interface Transition {
  type: 'fade' | 'dissolve' | 'slide_left' | 'slide_right' | 'zoom' | 'blur';
  duration: number; // 秒
  easing: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out';
}

export interface SubtitleBlock {
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  position?: 'top' | 'center' | 'bottom';
  margin?: number;
}

export interface AudioTrack {
  type: 'dialogue' | 'bgm' | 'sfx';
  path: string;
  startTime: number;
  duration: number;
  volume: number; // 0.0 - 1.0
  fadeIn?: number; // 秒
  fadeOut?: number; // 秒
}

export interface VideoEditingOutput {
  finalVideoUrl: string;
  duration: number;
  resolution: { width: number; height: number };
  format: 'mp4';
  fileSize?: number;
  subtitleUrl?: string;
  audioMixUrl?: string;
}

interface VideoEditingConfig {
  resolution?: { width: number; height: number };
  fps?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  outputFormat?: 'mp4';
  enableHardwareAccel?: boolean;
}

// ========== 辅助函数 ==========

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ========== 核心编辑器类 ==========

export class VideoEditor {
  private clips: VideoClip[];
  private transitions: Map<string, Transition>;
  private subtitles: SubtitleBlock[];
  private audioTracks: AudioTrack[];
  private config: VideoEditingConfig;

  constructor(config?: VideoEditingConfig) {
    this.clips = [];
    this.transitions = new Map();
    this.subtitles = [];
    this.audioTracks = [];
    this.config = config ?? {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      videoBitrate: '8M',
      audioBitrate: '192k',
      outputFormat: 'mp4',
      enableHardwareAccel: true,
    };
  }

  // 添加片段
  addClip(clip: VideoClip): this {
    this.clips.push(clip);
    this.clips.sort((a, b) => a.startTime - b.startTime);
    return this;
  }

  // 设置转场效果
  setTransition(clipId1: string, clipId2: string, transition: Transition): this {
    this.transitions.set(`${clipId1}->${clipId2}`, transition);
    return this;
  }

  // 添加字幕轨道
  addSubtitleTrack(subtitles: SubtitleBlock[]): this {
    this.subtitles = subtitles.sort((a, b) => a.startTime - b.startTime);
    return this;
  }

  // 添加音频轨道
  addAudioTrack(track: AudioTrack): this {
    this.audioTracks.push(track);
    return this;
  }

  // 获取总时长
  getDuration(): number {
    if (this.clips.length === 0) return 0;
    const lastClip = this.clips[this.clips.length - 1];
    return lastClip.startTime + lastClip.duration;
  }

  // 获取所有转场点
  getTransitionPoints(): Array<{
    clipId1: string;
    clipId2: string;
    transition: Transition;
    time: number;
  }> {
    const points: Array<{
      clipId1: string;
      clipId2: string;
      transition: Transition;
      time: number;
    }> = [];
    for (let i = 0; i < this.clips.length - 1; i++) {
      const curr = this.clips[i];
      const next = this.clips[i + 1];
      const transition = this.transitions.get(`${curr.id}->${next.id}`);
      if (transition) {
        const junctionTime = curr.startTime + curr.duration;
        points.push({ clipId1: curr.id, clipId2: next.id, transition, time: junctionTime });
      }
    }
    return points;
  }

  // 获取指定时间点的可见字幕
  getSubtitlesAtTime(time: number): SubtitleBlock[] {
    return this.subtitles.filter((sub) => time >= sub.startTime && time <= sub.endTime);
  }

  // 获取指定时间点的音频混合音量
  getMixedAudioVolumeAtTime(time: number): number {
    let totalVolume = 0;
    let activeTracks = 0;

    for (const track of this.audioTracks) {
      if (time >= track.startTime && time <= track.startTime + track.duration) {
        let volume = track.volume;

        // 计算淡入淡出
        if (track.fadeIn && time < track.startTime + track.fadeIn) {
          volume *= (time - track.startTime) / track.fadeIn;
        }
        if (track.fadeOut && time > track.startTime + track.duration - track.fadeOut) {
          volume *= (track.startTime + track.duration - time) / track.fadeOut;
        }

        // 叠加逻辑：对白优先，BGM 次之
        const weight = track.type === 'dialogue' ? 1.0 : track.type === 'bgm' ? 0.4 : 0.6;
        totalVolume += volume * weight;
        activeTracks++;
      }
    }

    // 归一化：避免超过 1.0
    return Math.min(1.0, totalVolume / (activeTracks || 1));
  }

  // 渲染一帧（用于调试/预览）
  renderFrame(time: number): {
    clipId: string | null;
    opacity: number;
    subtitles: SubtitleBlock[];
    audioVolume: number;
  } {
    // 找到当前时间对应的片段
    let activeClip: VideoClip | null = null;
    for (let i = this.clips.length - 1; i >= 0; i--) {
      if (time >= this.clips[i].startTime) {
        activeClip = this.clips[i];
        break;
      }
    }

    let opacity = 1.0;
    const effectiveClip: VideoClip | null = activeClip;

    // 处理转场效果
    const transitions = this.getTransitionPoints();
    for (const tp of transitions) {
      const t = tp.time;
      const td = tp.transition.duration;

      if (time >= t - td && time < t + td) {
        const localTime = (time - (t - td)) / (td * 2);
        const eased = easeInOut(localTime);

        if (tp.transition.type === 'fade') {
          if (time < t) {
            // 淡入前一个片段
            opacity = eased;
          } else {
            // 淡出到后一个片段
            opacity = 1 - eased;
          }
        } else if (tp.transition.type === 'dissolve') {
          opacity = time < t ? (1 - eased) * 0.5 + 0.5 : eased * 0.5 + 0.5;
        }
        break;
      }
    }

    return {
      clipId: effectiveClip?.id ?? null,
      opacity,
      subtitles: this.getSubtitlesAtTime(time),
      audioVolume: this.getMixedAudioVolumeAtTime(time),
    };
  }

  // 导出完整配置
  exportConfig(): {
    clips: VideoClip[];
    transitions: Array<{ from: string; to: string; transition: Transition }>;
    subtitles: SubtitleBlock[];
    audioTracks: AudioTrack[];
    config: VideoEditingConfig;
  } {
    const transitionList: Array<{ from: string; to: string; transition: Transition }> = [];
    this.transitions.forEach((transition, key) => {
      const [from, to] = key.split('->');
      transitionList.push({ from, to, transition });
    });

    return {
      clips: this.clips,
      transitions: transitionList,
      subtitles: this.subtitles,
      audioTracks: this.audioTracks,
      config: this.config,
    };
  }
}

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
    this.retryPolicy = config?.retryPolicy ?? {
      maxRetries: 2,
      initialDelayMs: 5000,
      backoffMultiplier: 2,
      maxDelayMs: 30000,
    };
  }

  async execute(input: StepInput): Promise<StepOutput> {
    const startTime = Date.now();
    const context = input.context;

    logger.info(`[VideoEditingStep] Starting video editing for workflow ${input.workflowId}`);

    try {
      // 1. 收集渲染好的帧和音频数据
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

      // 2. 构建视频编辑器
      const editor = new VideoEditor();
      const FRAME_DURATION = 5; // 每帧默认5秒

      // 2.1 添加视频片段（从渲染帧）
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

      // 2.2 添加转场效果
      for (let i = 0; i < clips.length - 1; i++) {
        const transCfg = transitions.find(
          (t) => t.from === clips[i].id && t.to === clips[i + 1].id
        );
        if (transCfg) {
          editor.setTransition(clips[i].id, clips[i + 1].id, {
            type: transCfg.type as Transition['type'],
            duration: transCfg.duration,
            easing: 'ease_in_out',
          });
        } else {
          // 默认淡入淡出
          editor.setTransition(clips[i].id, clips[i + 1].id, {
            type: 'fade',
            duration: 0.5,
            easing: 'ease_in_out',
          });
        }
      }

      this.reportProgress(30, '正在混合音频轨道...');

      // 2.3 添加音频轨道
      const totalDuration = clips.length * FRAME_DURATION;

      // 对白轨道
      for (let i = 0; i < dialogueAudio.length; i++) {
        const audio = dialogueAudio[i];
        editor.addAudioTrack({
          type: 'dialogue',
          path: audio.audioUrl,
          startTime: i * FRAME_DURATION, // 假设每段对话对应一个场景
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

      // 2.4 添加字幕轨道
      editor.addSubtitleTrack(subtitles);

      this.reportProgress(70, '正在编码输出视频...');

      // 2.5 执行渲染导出
      const finalVideoUrl = await this.exportVideo(editor, input.workflowId);

      this.reportProgress(90, '视频剪辑完成');

      // 3. 保存上下文变量
      context.setVariable('finalVideoUrl', finalVideoUrl);
      context.setVariable('videoEditingConfig', editor.exportConfig());
      context.setVariable('finalVideoDuration', editor.getDuration());
      context.setVariable('finalVideoResolution', { width: 1920, height: 1080 });

      const totalMs = Date.now() - startTime;
      logger.success(
        `[VideoEditingStep] Video editing completed in ${(totalMs / 1000).toFixed(1)}s`
      );

      return {
        stepId: this.stepId,
        status: StepStatus.COMPLETED,
        data: {
          finalVideoUrl,
          duration: editor.getDuration(),
          resolution: { width: 1920, height: 1080 },
          format: 'mp4' as const,
          clips: clips.map((c) => ({ id: c.id, startTime: c.startTime, duration: c.duration })),
          transitionsCount: transitions.length,
          audioTracksCount: dialogueAudio.length + (bgmPath ? 1 : 0),
          subtitlesCount: subtitles.length,
        } as VideoEditingOutput,
        metrics: {
          durationMs: totalMs,
          framesProcessed: clips.length,
        },
        qualityGate: QualityGateDecision.PASS,
        startTime,
        endTime: Date.now(),
        retryCount: 0,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[VideoEditingStep] Video editing failed: ${errorMsg}`);

      return {
        stepId: this.stepId,
        status: StepStatus.FAILED,
        data: undefined,
        error: errorMsg,
        startTime,
        endTime: Date.now(),
        retryCount: 0,
      };
    }
  }

  private async exportVideo(editor: VideoEditor, workflowId: string): Promise<string> {
    // 模拟导出过程
    const duration = editor.getDuration();
    const clips = editor.exportConfig().clips;

    // 生成输出路径
    const outputPath = `output/${workflowId}/final_${Date.now()}.mp4`;

    // 模拟 Tauri 后端调用
    if (this.isTauriEnvironment()) {
      // TODO: 真实视频合成待 Tauri 后端实现
      // 追踪 issue: https://github.com/Agions/panel-flow/issues/Y
      // await tauriInvoke('export_video', { config: editor.exportConfig(), outputPath });
    }

    logger.info(
      `[VideoEditingStep] Export configured: ${outputPath}, ${clips.length} clips, ${duration}s`
    );

    // 返回配置的输出路径（实际合成由 Tauri 后端完成）
    return outputPath;
  }

  private isTauriEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return '__TAURI__' in window;
  }

  private reportProgress(progress: number, message: string): void {
    this.onProgress?.({ stepId: this.stepId, progress, message });
  }
}

// ========== 工厂函数 ==========

export function createVideoEditingStep(config?: Partial<PipelineStep>): VideoEditingStep {
  return new VideoEditingStep(config);
}

export default VideoEditingStep;
