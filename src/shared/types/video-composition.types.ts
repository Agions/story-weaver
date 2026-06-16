/**
 * 视频合成共享类型 — FFmpeg.wasm / 字幕服务共用
 * 单一来源：原 core/services/video/video-composition.types.ts 已删除，类型统一在此维护
 *
 * SubtitleRenderStyle：渲染时用的扁平可选字段（FFmpeg / 合成管线用）
 * 与 features/subtitle 的 SubtitleStyle (UI 编辑用, 全 required) 区别开。
 */

export interface SubtitleRenderStyle {
  font?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  position?: 'top' | 'center' | 'bottom';
  margin?: number;
}

export interface SubtitleItem {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleRenderStyle;
}

export interface SubtitleTrack {
  id: string;
  label?: string;
  language?: string;
  subtitles: SubtitleItem[];
}

// SubtitleFormat: re-export from canonical source (core/services/video/subtitle/types)
export type { SubtitleFormat } from '@/core/services/video/subtitle/types';

export interface SceneEffect {
  type: 'fade_in' | 'fade_out' | 'zoom' | 'slide' | 'blur';
  duration: number;
  params?: Record<string, number | string>;
}

export interface Scene {
  id: string;
  mediaPath: string;
  mediaType: 'video' | 'image';
  startTime: number;
  duration: number;
  volume?: number;
  effects?: SceneEffect[];
}

export interface BackgroundMusic {
  path: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
}

export interface CompositionOptions {
  format?: 'mp4' | 'webm' | 'mov' | 'avi';
  videoCodec?: 'h264' | 'h265' | 'vp9' | 'av1';
  audioCodec?: 'aac' | 'mp3' | 'opus' | 'flac';
  bitrate?: string;
  fps?: number;
  resolution?: { width: number; height: number };
  masterVolume?: number;
}

export interface CompositionResult {
  outputPath: string;
  outputBlob?: Blob;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
}

export interface ExportProgress {
  progress: number;
  status: 'preparing' | 'loading' | 'processing' | 'encoding' | 'completed' | 'failed';
  message?: string;
  eta?: number;
}

export type ProgressCallback = (progress: ExportProgress) => void;

/** 单条字幕（无 id 版本，兼容 FFmpeg/VideoCompositor） */
export type Subtitle = Omit<SubtitleItem, 'id'>;
