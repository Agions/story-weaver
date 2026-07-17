/**
 * FFmpeg.wasm 视频合成增强服务（Facade）
 *
 * 此文件保留为对外统一入口，从前 717 行单文件拆分为：
 * - ffmpeg-instance.ts  单例与全局进度回调
 * - srt-builder.ts      SRT 字幕文本生成
 * - ffmpeg-pipeline.ts  写入/读取/清理通用工具
 * - filter-builder.ts   filter_complex 字符串构造
 * - composer.ts         多场景合成编排
 * - video-operations.ts 字幕烧录/混音/导出/拼接
 * - video-metadata.ts   <video> 元素读 metadata
 *
 * 重构原则：业务行为完全不变，仅按职责拆分。所有外部调用方
 * 继续从 '@/core/services/video/ffmpeg-wasm-service' 导入，行为透明。
 */

import { composeVideoWithFFmpeg } from './ffmpeg/composer';
import { getFFmpegInstance, isFFmpegWasmAvailable, loadFFmpeg } from './ffmpeg/ffmpeg-instance';
import { getVideoInfoFromBlob } from './ffmpeg/video-metadata';
import {
  addBackgroundMusicWithFFmpeg,
  addSubtitlesWithFFmpeg,
  concatenateVideosWithFFmpeg,
  exportVideoWithFFmpeg,
} from './ffmpeg/video-operations';

// 重新导出所有具名函数与类型，保持 API 表面兼容
export {
  composeVideoWithFFmpeg,
  getVideoInfoFromBlob,
  addBackgroundMusicWithFFmpeg,
  addSubtitlesWithFFmpeg,
  concatenateVideosWithFFmpeg,
  exportVideoWithFFmpeg,
  getFFmpegInstance,
  isFFmpegWasmAvailable,
  loadFFmpeg,
} from './ffmpeg';

export type {
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
  ProgressCallback,
  CompositionScene,
  SceneEffect,
  Subtitle,
  SubtitleStyle,
  SubtitleTrack,
  VideoMetadata,
} from './ffmpeg/types';

// 服务对象（兼容历史用法：ffmpegWasmService.xxx）
export const ffmpegWasmService = {
  load: loadFFmpeg,
  isAvailable: isFFmpegWasmAvailable,
  compose: composeVideoWithFFmpeg,
  addSubtitles: addSubtitlesWithFFmpeg,
  addBackgroundMusic: addBackgroundMusicWithFFmpeg,
  export: exportVideoWithFFmpeg,
  concatenate: concatenateVideosWithFFmpeg,
  getVideoInfo: getVideoInfoFromBlob,
  getInstance: getFFmpegInstance,
};

export default ffmpegWasmService;
