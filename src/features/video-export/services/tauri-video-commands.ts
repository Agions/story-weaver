/**
 * Tauri 视频后端命令
 * ===================
 * 5 个视频处理后端 invoke：processVideo / generatePreview /
 * exportVideoCommand / getVideoInfoCommand / extractFrames
 * 单一职责：把 Tauri invoke 包装成 facade 友好接口。
 */
import { invoke } from '@tauri-apps/api/core';

import type { VideoClipOptions, PreviewOptions, ExportOptions } from './tauri-types';

/** 视频后端返回的视频元信息 */
export interface BackendVideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

/** 调用后端 process_video 命令 */
export async function processVideoCommand(options: VideoClipOptions): Promise<string> {
  return invoke<string>('process_video', { options });
}

/** 调用后端 generate_preview 命令 */
export async function generatePreviewCommand(options: PreviewOptions): Promise<string> {
  return invoke<string>('generate_preview', { options });
}

/** 调用后端 export_video 命令 */
export async function exportVideoCommand(options: ExportOptions): Promise<string> {
  return invoke<string>('export_video', { options });
}

/** 调用后端 get_video_info 命令 */
export async function getVideoInfoCommand(videoPath: string): Promise<BackendVideoInfo> {
  return invoke<BackendVideoInfo>('get_video_info', { videoPath });
}

/** 调用后端 extract_frames 命令 */
export async function extractFramesCommand(
  videoPath: string,
  outputDir: string,
  fps: number = 1
): Promise<string[]> {
  return invoke<string[]>('extract_frames', { videoPath, outputDir, fps });
}
