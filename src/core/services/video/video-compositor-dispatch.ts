/**
 * 视频合成双模式调度器（消除 5 处 3 段式重复）
 *
 * 原 video-compositor.service.ts 中 5 个公开函数（composeVideo /
 * addSubtitles / addBackgroundMusic / exportVideo / concatenateVideos）
 * 都有同样的 3 段结构：
 *
 *   if (isTauri()) {
 *     try { await invoke(...); } catch (e) { logger.error; throw }
 *   }
 *   if (checkFFmpegWasmAvailable()) {
 *     try { await ffmpegWasmService.xxx(...); } catch (e) { logger.error; throw }
 *   }
 *   throw new Error('需要 Tauri 或 SharedArrayBuffer');
 *
 * 用 dispatchByMode<TResult>(options) 一个高阶函数收口：
 *   - tauriBranch: 在 Tauri 环境调用的实现
 *   - ffmpegBranch: 在 FFmpeg.wasm 环境调用的实现
 *   - errorMessage: 两边都没匹配时抛的错误文案
 *
 * 抽离后 5 处"3 段式 if-else"变成 5 个 dispatchByMode 调用 + 5 个
 * 简单业务函数（每个就 2-3 行）。新增模式时只要再写一个 dispatchByMode
 * 即可。
 *
 * 实现说明：
 *   tauriBranch / ffmpegBranch 用 (...args: unknown[]) => Promise<TResult>
 *   签名是 unknown[] 变参——这样调用方传 tuple 时 TS 不会做 union
 *   collapse，简化泛型推断。
 */

import { logger } from '@/core/utils/logger';

import { isTauri, isFFmpegWasmAvailable } from './video-compositor-environment';

/** 双模式分支的通用签名：接任意参数，返回 Promise */
type ModeBranch<TResult> = (...args: unknown[]) => Promise<TResult>;

/**
 * 根据当前运行环境自动选择 Tauri 或 FFmpeg.wasm 实现。
 *
 * @param tauriBranch  在 Tauri 环境调用的实现
 * @param ffmpegBranch 在 FFmpeg.wasm 环境调用的实现
 * @param args         透传给两个分支的参数
 * @param errorMessage 两边都没匹配时抛的错误文案
 */
export async function dispatchByMode<TResult>(
  tauriBranch: ModeBranch<TResult>,
  ffmpegBranch: ModeBranch<TResult>,
  args: unknown[],
  errorMessage: string
): Promise<TResult> {
  if (isTauri()) {
    try {
      return await tauriBranch(...args);
    } catch (error) {
      logger.error('[VideoCompositor] Tauri 调用失败:', error);
      throw error;
    }
  }

  if (isFFmpegWasmAvailable()) {
    try {
      return await ffmpegBranch(...args);
    } catch (error) {
      logger.error('[VideoCompositor] FFmpeg.wasm 调用失败:', error);
      throw error;
    }
  }

  throw new Error(errorMessage);
}

/**
 * 把 ffmpegWasmService 的"内层返回 resultBlob + outputPath"转换为
 * 上层 CompositionResult 形状（outputPath/outputBlob/duration/
 * width/height/fileSize）。
 *
 * 原代码 4 处出现几乎相同的映射逻辑：
 *   { outputPath, outputBlob: result.resultBlob, duration: 0,
 *     width: 1920, height: 1080, fileSize: result.resultBlob.size }
 * 收口为一个 mapWasmResultToComposition 函数。
 */
export function mapWasmResultToComposition(
  wasmResult: { outputPath: string; resultBlob: Blob },
  resolution?: { width?: number; height?: number }
): {
  outputPath: string;
  outputBlob: Blob;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
} {
  return {
    outputPath: wasmResult.outputPath,
    outputBlob: wasmResult.resultBlob,
    duration: 0,
    width: resolution?.width ?? 1920,
    height: resolution?.height ?? 1080,
    fileSize: wasmResult.resultBlob.size,
  };
}
