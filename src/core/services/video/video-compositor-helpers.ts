/**
 * 视频合成辅助函数
 *
 * 集中"非调度类"的小工具：
 *   - toBlob()                 URL/string → Blob
 *   - getExportProgress()      仅 Tauri 模式有意义；非 Tauri 直接返回 100% completed
 *   - cancelExport()           仅 Tauri 模式有意义；非 Tauri 静默
 *   - extractFrames()          通过 FFmpeg.wasm 抽帧（writeFile → exec → readFile 循环）
 *   - getVideoInfo()           委托给 ffmpegWasmService
 *   - downloadVideo()          委托给 file-saver saveAs
 *
 * 单一职责：每个函数一个用途，不涉及 Tauri/FFmpeg 双模式调度。
 */

import { fetchFile } from '@ffmpeg/util';
import { saveAs } from 'file-saver';

import {
  ffmpegWasmService,
  isFFmpegWasmAvailable,
  type ExportProgress,
  type ProgressCallback,
} from '@/core/services/video/ffmpeg-wasm.service';
import { logger } from '@/core/utils/logger';

import { isTauri } from './video-compositor-environment';
import { tauriCancelExport, tauriGetExportProgress } from './video-compositor-tauri';

/**
 * 把 URL / string / Blob 统一转为 Blob。
 *  - string：fetch 拿到 response 后 .blob()
 *  - Blob  ：原样返回
 * 抛错：fetch 失败时抛 `Failed to fetch: <status>`
 */
export async function toBlob(input: Blob | string): Promise<Blob> {
  if (typeof input === 'string') {
    const response = await fetch(input);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    return await response.blob();
  }
  return input;
}

/**
 * 获取导出进度。
 * - 非 Tauri 环境：直接返回 100% completed（避免 UI 卡住）
 * - Tauri 环境：invoke('get_export_progress')
 * - 失败时也返回 100% completed（容错）
 */
export async function getExportProgress(): Promise<ExportProgress> {
  if (!isTauri()) {
    return { progress: 100, status: 'completed' };
  }
  try {
    return (await tauriGetExportProgress()) as ExportProgress;
  } catch {
    return { progress: 100, status: 'completed' };
  }
}

/**
 * 取消导出。
 * - 非 Tauri 环境：no-op
 * - Tauri 环境：invoke('cancel_export')；失败静默忽略
 */
export async function cancelExport(): Promise<void> {
  if (!isTauri()) return;
  try {
    await tauriCancelExport();
  } catch {
    // 静默
  }
}

/**
 * 通过 FFmpeg.wasm 抽帧，返回 ObjectURL 数组。
 * 流程：writeFile → createDir → exec(fps=N) → readFile 循环 → 清理
 * 必须 FFmpeg.wasm 可用，否则抛错。
 */
export async function extractFrames(videoBlob: Blob, fps: number = 1): Promise<string[]> {
  if (!isFFmpegWasmAvailable()) {
    throw new Error('提取帧需要支持 SharedArrayBuffer 的浏览器');
  }

  try {
    const ff = await ffmpegWasmService.getInstance();
    const inputName = 'input_video.mp4';
    const frameDir = 'frames';

    await ff.writeFile(inputName, await fetchFile(videoBlob));

    // 帧输出目录（可能已存在，静默吞错）
    await ff.createDir?.(frameDir).catch(() => {
      /* 目录已存在 */
    });

    // 抽帧
    await ff.exec(['-i', inputName, '-vf', `fps=${fps}`, `${frameDir}/frame_%04d.png`]);

    // 顺序读帧直到 404
    const frameFiles: string[] = [];
    let i = 1;
    while (true) {
      const frameName = `frame_${String(i).padStart(4, '0')}.png`;
      try {
        const data = await ff.readFile(`${frameDir}/${frameName}`);
        const blob = new Blob([data as BlobPart], { type: 'image/png' });
        frameFiles.push(URL.createObjectURL(blob));
        i++;
      } catch {
        break;
      }
    }

    // 清理：删输入 + 撤销 ObjectURL
    await ff.deleteFile(inputName);
    for (const frame of frameFiles) {
      URL.revokeObjectURL(frame);
    }

    return frameFiles;
  } catch (error) {
    logger.error('[VideoCompositor] FFmpeg.wasm 提取帧失败:', error);
    throw error;
  }
}

/** 获取视频元信息（直接委托 ffmpegWasmService） */
export async function getVideoInfo(videoBlob: Blob): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}> {
  return ffmpegWasmService.getVideoInfo(videoBlob);
}

/** 浏览器端下载视频 */
export function downloadVideo(blob: Blob, fileName: string): void {
  saveAs(blob, fileName);
}

/** 重新导出 ProgressCallback 类型供上游使用 */
export type { ProgressCallback } from '@/core/services/video/ffmpeg-wasm.service';
