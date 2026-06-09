/**
 * FFmpeg 流程通用工具
 *
 * 提取原 composeVideoWithFFmpeg/addSubtitlesWithFFmpeg 等函数中
 * 反复出现的"写入输入 → exec → 读取输出 → 清理临时文件"骨架，
 * 消除重复代码。
 *
 * 业务侧组合：loadInputFiles → runFFmpeg → readOutputFile → cleanupFiles。
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

import { logger } from '@/core/utils/logger';

/**
 * 把一组外部资源（URL/Blob）写入 FFmpeg 虚拟文件系统。
 * 返回 FFmpeg 内对应的文件名数组。
 *
 * 命名规则：scene-0、scene-1 …… 保证调用方可预测文件名。
 */
export async function writeInputFiles(
  ff: FFmpeg,
  sources: Array<{ source: Blob | string; name: string }>,
  onProgress?: (loaded: number, total: number) => void
): Promise<string[]> {
  const writtenNames: string[] = [];

  for (let i = 0; i < sources.length; i++) {
    const { source, name } = sources[i];
    onProgress?.(i + 1, sources.length);
    const data = await fetchFile(source);
    await ff.writeFile(name, data);
    writtenNames.push(name);
  }

  return writtenNames;
}

/**
 * 从 FFmpeg 读取输出文件并包装为指定 MIME 的 Blob。
 */
export async function readOutputAsBlob(
  ff: FFmpeg,
  fileName: string,
  mimeType: string
): Promise<{ blob: Blob; fileSize: number }> {
  const data = await ff.readFile(fileName);
  const blob = new Blob([data as BlobPart], { type: mimeType });
  return { blob, fileSize: blob.size };
}

/**
 * 静默删除一组 FFmpeg 临时文件 —— 任何失败都吞掉（清理阶段不抛错）。
 */
export async function safeDeleteFiles(ff: FFmpeg, fileNames: readonly string[]): Promise<void> {
  for (const name of fileNames) {
    try {
      await ff.deleteFile(name);
    } catch (error) {
      // 清理阶段的失败不影响主流程
      logger.debug(`[FFmpeg.wasm] 清理临时文件失败（忽略）: ${name}`, error);
    }
  }
}

/**
 * 触发 FFmpeg 命令并把抛出的异常统一包装为可读消息。
 */
export async function execFFmpegCommand(ff: FFmpeg, args: string[]): Promise<void> {
  logger.debug('[FFmpeg.wasm] 执行命令:', args);
  await ff.exec(args);
}
