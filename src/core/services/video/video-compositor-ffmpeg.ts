/**
 * 视频合成 FFmpeg.wasm 调用层
 *
 * 把 5 个 ffmpegWasmService 调用（compose / addSubtitles /
 * addBackgroundMusic / export / concatenate）从 video-compositor.
 * service.ts 抽离到本模块。
 *
 * 每个 FFmpeg 调用都遵循：
 *   1. 调 ffmpegWasmService.xxx() 返回 wasmResult
 *   2. 用 mapWasmResultToComposition 把 {outputPath, resultBlob}
 *      转成上层 CompositionResult 形状
 *
 * 错误日志由 dispatchByMode 统一打，本模块只负责业务调用。
 */

import { ffmpegWasmService } from '@/core/services/video/ffmpeg-wasm.service';
import type {
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ProgressCallback,
  Scene,
  SubtitleStyle,
  SubtitleTrack,
} from '@/core/services/video/ffmpeg-wasm.service';

import { mapWasmResultToComposition } from './video-compositor-dispatch';

/** FFmpeg.wasm: 合成视频（composeVideoWithFFmpeg 已经直接返回 CompositionResult，无需 map） */
export async function ffmpegComposeVideo(
  scenes: Scene[],
  options: CompositionOptions,
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  return ffmpegWasmService.compose(scenes, options, progressCallback);
}

/** FFmpeg.wasm: 添加字幕 */
export async function ffmpegAddSubtitles(
  videoBlob: Blob,
  subtitles: SubtitleTrack,
  style: SubtitleStyle,
  outputFormat: 'mp4' | 'webm',
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  const result = await ffmpegWasmService.addSubtitles(
    videoBlob,
    subtitles,
    style,
    outputFormat,
    progressCallback
  );
  return mapWasmResultToComposition(result);
}

/** FFmpeg.wasm: 添加背景音乐 */
export async function ffmpegAddBackgroundMusic(
  videoBlob: Blob,
  music: BackgroundMusic,
  outputFormat: 'mp4' | 'webm',
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  const result = await ffmpegWasmService.addBackgroundMusic(
    videoBlob,
    music.path,
    {
      volume: music.volume,
      fadeIn: music.fadeIn,
      fadeOut: music.fadeOut,
      loop: music.loop,
    },
    outputFormat,
    progressCallback
  );
  return mapWasmResultToComposition(result);
}

/** FFmpeg.wasm: 导出视频（带分辨率回退到 1920x1080） */
export async function ffmpegExportVideo(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: {
    bitrate?: string;
    fps?: number;
    resolution?: { width: number; height: number };
  },
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  const result = await ffmpegWasmService.export(inputBlob, outputFormat, options, progressCallback);
  return mapWasmResultToComposition(result, options.resolution);
}

/** FFmpeg.wasm: 合并多个视频 */
export async function ffmpegConcatenateVideos(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm',
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  const result = await ffmpegWasmService.concatenate(videoBlobs, outputFormat, progressCallback);
  return mapWasmResultToComposition(result);
}
