/**
 * 视频合成共享类型 — FFmpeg.wasm / 字幕服务共用
 */

export interface SubtitleStyle {
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
  style?: SubtitleStyle;
}

export interface SubtitleTrack {
  id: string;
  label?: string;
  language?: string;
  subtitles: SubtitleItem[];
}

export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'txt';

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
