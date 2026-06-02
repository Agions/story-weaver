/**
 * FFmpeg.wasm 视频合成 — 类型定义
 * ================================
 * 共享类型已抽取到 @/shared/types/video-composition.types.ts
 * 此文件保留 FFmpeg.wasm 专用类型。
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg';

import type {
  Scene,
  SceneEffect,
  SubtitleTrack,
  Subtitle,
  SubtitleStyle,
  BackgroundMusic,
  ExportProgress,
  CompositionOptions,
  CompositionResult,
  ProgressCallback,
} from '@/shared/types/video-composition.types';

// Re-export 共享类型（保持向后兼容）
export type {
  Scene,
  SceneEffect,
  SubtitleTrack,
  Subtitle,
  SubtitleStyle,
  BackgroundMusic,
  ExportProgress,
  CompositionOptions,
  CompositionResult,
  ProgressCallback,
};

// FFmpeg 实例状态（仅 FFmpeg.wasm 使用）
export interface FFmpegState {
  instance: FFmpeg | null;
  loaded: boolean;
}
