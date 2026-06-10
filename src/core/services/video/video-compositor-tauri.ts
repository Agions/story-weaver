/**
 * 视频合成 Tauri 命令调用层
 *
 * 把 5 个 invoke 调用（compose_video / add_subtitles / add_audio /
 * export_video / concat_videos）从 video-compositor.service.ts 中
 * 抽离到本模块。每个 invoke 仍然按"lazy import + 调用"两步走，
 * 因为 @tauri-apps/api/core 在非 Tauri 环境可能不可用。
 *
 * 单一职责：Tauri 命令调用封装。错误日志由 dispatchByMode 统一打，
 * 这里只负责把"懒加载 invoke + 命令名 + 参数"显式化。
 */

import type {
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  Scene,
  SubtitleStyle,
  SubtitleTrack,
} from '@/core/services/video/ffmpeg-wasm.service';

/**
 * 懒加载 @tauri-apps/api/core 并调用指定命令
 * （保留原代码 await import() 模式——避免非 Tauri 环境炸）
 */
async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

/** Tauri: 合成视频 */
export async function tauriComposeVideo(
  scenes: Scene[],
  options: CompositionOptions
): Promise<CompositionResult> {
  return tauriInvoke<CompositionResult>('compose_video', { scenes, options });
}

/** Tauri: 添加字幕 */
export async function tauriAddSubtitles(
  videoBlob: Blob,
  subtitles: SubtitleTrack,
  style: SubtitleStyle,
  outputFormat: 'mp4' | 'webm'
): Promise<CompositionResult> {
  return tauriInvoke<CompositionResult>('add_subtitles', {
    videoBlob,
    subtitles,
    style,
    outputPath: `output_with_subtitles.${outputFormat}`,
  });
}

/** Tauri: 添加背景音乐 */
export async function tauriAddBackgroundMusic(
  videoBlob: Blob,
  music: BackgroundMusic,
  outputFormat: 'mp4' | 'webm'
): Promise<CompositionResult> {
  return tauriInvoke<CompositionResult>('add_audio', {
    videoBlob,
    music,
    outputPath: `output_with_music.${outputFormat}`,
  });
}

/** Tauri: 导出视频 */
export async function tauriExportVideo(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: { bitrate?: string; fps?: number; resolution?: { width: number; height: number } }
): Promise<CompositionResult> {
  return tauriInvoke<CompositionResult>('export_video', { inputBlob, outputFormat, options });
}

/** Tauri: 合并多个视频 */
export async function tauriConcatenateVideos(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm'
): Promise<CompositionResult> {
  return tauriInvoke<CompositionResult>('concat_videos', {
    videoBlobs,
    outputPath: `concatenated.${outputFormat}`,
  });
}

/** Tauri: 获取导出进度 */
export async function tauriGetExportProgress(): Promise<unknown> {
  return tauriInvoke('get_export_progress');
}

/** Tauri: 取消导出 */
export async function tauriCancelExport(): Promise<unknown> {
  return tauriInvoke('cancel_export');
}
