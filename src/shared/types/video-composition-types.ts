/**
 * 视频合成共享类型
 *
 * Canonical definitions — migrated from deleted @/types/media.
 */

// ========== 字幕类型（Subtitle） ==========

/** 渲染时用的扁平可选字段（FFmpeg / 合成管线用） */
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

/** 字幕轨道（完整版，含 label / language） */
export interface SubtitleTrack {
  id: string;
  label?: string;
  language?: string;
  subtitles: SubtitleItem[];
}

/** 字幕文件格式 */
export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'txt';

/** 单条字幕（无 id 版本，兼容 FFmpeg/VideoCompositor） */
export type Subtitle = Omit<SubtitleItem, 'id'>;

// ========== 合成类型（Composition） ==========

export interface SceneEffect {
  type: 'fade_in' | 'fade_out' | 'zoom' | 'slide' | 'blur';
  duration: number;
  params?: Record<string, number | string>;
}

export interface CompositionScene {
  id: string;
  mediaPath: string;
  mediaType: 'video' | 'image';
  startTime: number;
  duration: number;
  volume?: number;
  effects?: SceneEffect[];
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

// ========== 音频类型兼容 re-export ==========

/** @deprecated Use @/shared/types/audio instead */
export type { BackgroundMusic } from './audio';

// ========== 视频元信息 ==========

/** 视频元信息（从浏览器 video 元素读取的粗粒度信息） */
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}