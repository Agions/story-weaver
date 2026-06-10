/**
 * Tauri 导出进度事件
 * ===================
 * 监听 export-progress 事件 + 取消导出 + 清理。
 * 状态封装在闭包内，外部通过 listenExportProgress 接入。
 */
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

import type { ExportProgress, ExportProgressCallback } from './tauri-types';

let progressListener: UnlistenFn | null = null;

/**
 * 监听导出进度事件
 * 重复调用会先解除旧监听（与原实现一致）。
 */
export async function listenExportProgress(callback: ExportProgressCallback): Promise<void> {
  if (progressListener) {
    progressListener();
  }
  progressListener = await listen<ExportProgress>('export-progress', (event) => {
    callback(event.payload);
  });
}

/** 取消指定 exportId 的导出 */
export async function cancelExportCommand(exportId: string): Promise<void> {
  await invoke('cancel_export', { exportId });
}

/** 清理进度监听器 (在 facade.destroy 调用) */
export function destroyExportListener(): void {
  if (progressListener) {
    progressListener();
    progressListener = null;
  }
}
