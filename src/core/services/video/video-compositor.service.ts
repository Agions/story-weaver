/**
 * 视频合成服务门面
 *
 * 把原 454 行单文件拆为 6 个子模块：
 *   - video-compositor-environment.ts   isTauri / isFFmpegWasmAvailable /
 *                                       getSupportedFeatures
 *   - video-compositor-dispatch.ts      dispatchByMode 高阶函数 +
 *                                       mapWasmResultToComposition 转换器
 *   - video-compositor-tauri.ts         7 个 Tauri invoke 封装
 *   - video-compositor-ffmpeg.ts        5 个 FFmpeg.wasm 调用
 *   - video-compositor-helpers.ts       toBlob / extractFrames /
 *                                       getExportProgress / cancelExport /
 *                                       getVideoInfo / downloadVideo
 *
 * 本文件作为对外门面：
 *   - 完整保留 11 个具名导出（initializeVideoCompositor / composeVideo /
 *     addSubtitles / addBackgroundMusic / exportVideo / concatenateVideos /
 *     getExportProgress / cancelExport / extractFrames / getVideoInfo /
 *     downloadVideo / getSupportedFeatures）
 *   - 顶层 export 单例 videoCompositorService（11 个方法）
 *   - 默认导出 default videoCompositorService 保持兼容
 *   - manga-pipeline.service.ts 使用的 composeVideo / addSubtitles 具名
 *     导出保持完全一致
 *
 * 业务行为完全不变：
 *   - 5 个公开函数的 Tauri/FFmpeg 分发行为 1:1 保留
 *   - 错误日志文案 "[VideoCompositor] Tauri 调用失败" /
 *     "[VideoCompositor] FFmpeg.wasm 调用失败" 1:1 保留
 *   - "需要 Tauri 或 SharedArrayBuffer" 错误文案 5 种精确字符串 1:1
 *   - ffmpegInitialized 模块级状态保留（initializeVideoCompositor 内部）
 */

import {
  ffmpegWasmService,
  loadFFmpeg,
  isFFmpegWasmAvailable,
  type ProgressCallback,
} from '@/core/services/video/ffmpeg-wasm.service';
import { logger } from '@/core/utils/logger';

import { dispatchByMode } from './video-compositor-dispatch';
import {
  isTauri,
  isFFmpegWasmAvailable as isFFmpegWasmAvailableFromEnv,
  getSupportedFeatures,
} from './video-compositor-environment';
import {
  ffmpegComposeVideo,
  ffmpegAddSubtitles,
  ffmpegAddBackgroundMusic,
  ffmpegExportVideo,
  ffmpegConcatenateVideos,
} from './video-compositor-ffmpeg';
import {
  toBlob,
  getExportProgress,
  cancelExport,
  extractFrames,
  getVideoInfo,
  downloadVideo,
} from './video-compositor-helpers';
import {
  tauriComposeVideo,
  tauriAddSubtitles,
  tauriAddBackgroundMusic,
  tauriExportVideo,
  tauriConcatenateVideos,
} from './video-compositor-tauri';

// 类型 re-export（外部 import 路径完全不变）
export type {
  Scene,
  SubtitleTrack,
  SubtitleStyle,
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
  ProgressCallback,
} from '@/core/services/video/ffmpeg-wasm.service';

/** FFmpeg.wasm 是否已初始化（模块级状态，跨调用保持） */
let ffmpegInitialized = false;

/**
 * 初始化视频合成器：
 *   - Tauri 环境：直接返回 true（本地 FFmpeg 总是可用）
 *   - 浏览器：检查 SharedArrayBuffer → 调 loadFFmpeg
 * 保留模块级 ffmpegInitialized 状态（供外部查询 / 复用）
 */
export async function initializeVideoCompositor(
  progressCallback?: ProgressCallback
): Promise<boolean> {
  if (isTauri()) {
    logger.info('[VideoCompositor] 使用 Tauri 模式');
    return true;
  }

  if (!isFFmpegWasmAvailableFromEnv()) {
    logger.warn('[VideoCompositor] 当前环境不支持 FFmpeg.wasm (需要 SharedArrayBuffer)');
    return false;
  }

  try {
    progressCallback?.({
      progress: 0,
      status: 'loading',
      message: '正在加载 FFmpeg.wasm...',
    });

    const loaded = await loadFFmpeg(progressCallback);
    ffmpegInitialized = loaded;

    if (loaded) {
      logger.info('[VideoCompositor] FFmpeg.wasm 初始化成功');
    }

    return loaded;
  } catch (error) {
    logger.error('[VideoCompositor] FFmpeg.wasm 初始化失败:', error);
    return false;
  }
}

/**
 * 合成视频（双模式分发：Tauri invoke → FFmpeg.wasm）
 */
export async function composeVideo(
  scenes: Parameters<typeof tauriComposeVideo>[0],
  options: Parameters<typeof tauriComposeVideo>[1] = {},
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm.service').CompositionResult> {
  return dispatchByMode(
    (s, o) =>
      tauriComposeVideo(
        s as Parameters<typeof tauriComposeVideo>[0],
        o as Parameters<typeof tauriComposeVideo>[1]
      ),
    (s, o) =>
      ffmpegComposeVideo(
        s as Parameters<typeof ffmpegComposeVideo>[0],
        o as Parameters<typeof ffmpegComposeVideo>[1],
        progressCallback
      ),
    [scenes, options],
    '视频合成需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

/** 添加字幕（双模式分发） */
export async function addSubtitles(
  videoInput: Blob | string,
  subtitles: Parameters<typeof tauriAddSubtitles>[1],
  style: Parameters<typeof tauriAddSubtitles>[2] = {},
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm.service').CompositionResult> {
  const videoBlob = await toBlob(videoInput);

  return dispatchByMode(
    (b, s, st, f) =>
      tauriAddSubtitles(
        b as Blob,
        s as Parameters<typeof tauriAddSubtitles>[1],
        st as Parameters<typeof tauriAddSubtitles>[2],
        f as 'mp4' | 'webm'
      ),
    (b, s, st, f) =>
      ffmpegAddSubtitles(
        b as Blob,
        s as Parameters<typeof ffmpegAddSubtitles>[1],
        st as Parameters<typeof ffmpegAddSubtitles>[2],
        f as 'mp4' | 'webm',
        progressCallback
      ),
    [videoBlob, subtitles, style, outputFormat],
    '添加字幕需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

/** 添加背景音乐（双模式分发） */
export async function addBackgroundMusic(
  videoBlob: Blob,
  music: Parameters<typeof tauriAddBackgroundMusic>[1],
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm.service').CompositionResult> {
  return dispatchByMode(
    (b, m, f) =>
      tauriAddBackgroundMusic(
        b as Blob,
        m as Parameters<typeof tauriAddBackgroundMusic>[1],
        f as 'mp4' | 'webm'
      ),
    (b, m, f) =>
      ffmpegAddBackgroundMusic(
        b as Blob,
        m as Parameters<typeof ffmpegAddBackgroundMusic>[1],
        f as 'mp4' | 'webm',
        progressCallback
      ),
    [videoBlob, music, outputFormat],
    '添加背景音乐需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

/** 导出视频（双模式分发） */
export async function exportVideo(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: Parameters<typeof tauriExportVideo>[2] = {},
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm.service').CompositionResult> {
  return dispatchByMode(
    (b, f, o) =>
      tauriExportVideo(b as Blob, f as 'mp4' | 'webm', o as Parameters<typeof tauriExportVideo>[2]),
    (b, f, o) =>
      ffmpegExportVideo(
        b as Blob,
        f as 'mp4' | 'webm',
        o as Parameters<typeof ffmpegExportVideo>[2],
        progressCallback
      ),
    [inputBlob, outputFormat, options],
    '导出视频需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

/** 合并多个视频（双模式分发） */
export async function concatenateVideos(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm.service').CompositionResult> {
  return dispatchByMode(
    (b, f) => tauriConcatenateVideos(b as Blob[], f as 'mp4' | 'webm'),
    (b, f) => ffmpegConcatenateVideos(b as Blob[], f as 'mp4' | 'webm', progressCallback),
    [videoBlobs, outputFormat],
    '合并视频需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

// 服务对象（保留全部 11 个方法名 + 2 个 isXxxAvailable alias）
export const videoCompositorService = {
  initialize: initializeVideoCompositor,
  compose: composeVideo,
  addSubtitles,
  addBackgroundMusic,
  export: exportVideo,
  concatenate: concatenateVideos,
  getProgress: getExportProgress,
  cancelExport,
  extractFrames,
  getVideoInfo,
  download: downloadVideo,
  getSupportedFeatures,
  isFFmpegWasmAvailable: () => isFFmpegWasmAvailableFromEnv(),
  isTauriAvailable: isTauri,
};

export default videoCompositorService;
