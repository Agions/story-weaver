/**
 * FFmpeg.wasm 实例管理
 *
 * 单一职责：维护单例 FFmpeg 实例与全局进度回调的连接。
 * 把"创建/获取实例、注册 log/progress 监听"从业务流程中剥离。
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

import { logger } from '@/core/utils/logger';

import type { ProgressCallback } from './types';

// 单例状态 —— 模块作用域内共享
let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

// 当前进度回调（全局，FFmpeg 内部 progress 事件无 scene 上下文）
let activeProgressCallback: ProgressCallback | null = null;

const FFMPEG_CORE_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

/**
 * 获取/创建 FFmpeg.wasm 实例（懒加载单例）。
 * 第一次调用时创建实例并注册全局 log/progress 监听。
 */
export async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  const instance = new FFmpeg();

  // 透传 FFmpeg 内部日志，便于排查编码问题
  instance.on('log', ({ message }) => {
    logger.debug('[FFmpeg.wasm]', message);
  });

  // 把 FFmpeg 的进度事件翻译成业务侧 ExportProgress
  instance.on('progress', ({ progress, time }) => {
    if (!activeProgressCallback) {
      return;
    }
    activeProgressCallback({
      progress: Math.round(progress * 100),
      status: 'encoding',
      message: `处理中... ${Math.round(progress * 100)}%`,
      eta: time > 0 ? Math.round(((1 - progress) * time) / 1000) : undefined,
    });
  });

  ffmpegInstance = instance;
  return instance;
}

/**
 * 实际下载 FFmpeg core（js + wasm）。
 * 已加载则直接返回成功。
 */
export async function loadFFmpeg(progressCallback?: ProgressCallback): Promise<boolean> {
  if (isLoaded) {
    return true;
  }

  try {
    progressCallback?.({
      progress: 0,
      status: 'loading',
      message: '正在加载 FFmpeg 核心...',
    });

    const ff = await getFFmpegInstance();

    await ff.load({
      coreURL: await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    isLoaded = true;
    logger.info('[FFmpeg.wasm] 加载完成');

    progressCallback?.({
      progress: 100,
      status: 'completed',
      message: 'FFmpeg 加载完成',
    });

    return true;
  } catch (error) {
    logger.error('[FFmpeg.wasm] 加载失败:', error);
    progressCallback?.({
      progress: 0,
      status: 'failed',
      message: `加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
    return false;
  }
}

/** 检查运行环境是否支持 FFmpeg.wasm（需要 SharedArrayBuffer） */
export function isFFmpegWasmAvailable(): boolean {
  return typeof window !== 'undefined' && typeof SharedArrayBuffer !== 'undefined';
}

/** 注册当前进度的全局回调（业务流程在 exec 前调用） */
export function setActiveProgressCallback(callback: ProgressCallback | null): void {
  activeProgressCallback = callback;
}

/** 测试/调试用：强制重置单例与加载状态 */
export function resetFFmpegInstanceForTesting(): void {
  ffmpegInstance = null;
  isLoaded = false;
  activeProgressCallback = null;
}
