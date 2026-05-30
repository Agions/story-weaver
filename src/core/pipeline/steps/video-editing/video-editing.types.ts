/**
 * Video Editing Step — 类型定义
 * ==============================
 * 所有与视频剪辑合成相关的类型、接口、配置常量。
 */

import type { PipelineStep } from '@/core/pipeline/step.interface';
import type { RetryPolicy } from '@/core/pipeline/pipeline.types';

// ========== 核心类型 ==========

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

export interface VideoEditingConfig {
  resolution?: { width: number; height: number };
  fps?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  outputFormat?: 'mp4';
  enableHardwareAccel?: boolean;
}

// ========== 步骤工厂 Props ==========

export type VideoEditingStepProps = Partial<PipelineStep>;