/**
 * FFmpeg.wasm 服务类型定义
 *
 * 把原 ffmpeg-wasm.service.ts 中散落的 interface 集中到此文件，
 * 多个子模块共享，避免循环依赖。
 */

/** 单个场景的媒体信息 */
export interface Scene {
  id: string;
  mediaPath: string;
  mediaType: 'video' | 'image';
  startTime: number;
  duration: number;
  volume?: number;
  effects?: SceneEffect[];
}

/** 场景级转场/特效 */
export interface SceneEffect {
  type: 'fade_in' | 'fade_out' | 'zoom' | 'slide' | 'blur';
  duration: number;
  params?: Record<string, number | string>;
}

/** 字幕轨道（一个轨道含多条字幕） */
export interface SubtitleTrack {
  id: string;
  subtitles: Subtitle[];
}

/** 单条字幕 */
export interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

/** 字幕样式 */
export interface SubtitleStyle {
  font?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  position?: 'top' | 'center' | 'bottom';
  margin?: number;
}

/** 背景音乐参数 */
export interface BackgroundMusic {
  path: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
}

/** 合成参数 */
export interface CompositionOptions {
  format?: 'mp4' | 'webm' | 'mov' | 'avi';
  videoCodec?: 'h264' | 'h265' | 'vp9' | 'av1';
  audioCodec?: 'aac' | 'mp3' | 'opus' | 'flac';
  bitrate?: string;
  fps?: number;
  resolution?: { width: number; height: number };
  masterVolume?: number;
}

/** 合成结果 */
export interface CompositionResult {
  outputPath: string;
  outputBlob?: Blob;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
}

/** 进度上报 */
export interface ExportProgress {
  progress: number;
  status: 'preparing' | 'loading' | 'processing' | 'encoding' | 'completed' | 'failed';
  message?: string;
  eta?: number;
}

/** 进度回调签名 */
export type ProgressCallback = (progress: ExportProgress) => void;

/** 视频元信息（从浏览器 video 元素读取的粗粒度信息） */
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}
