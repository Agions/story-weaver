/**
 * 桌面文件拖放监听
 *
 * 原 desktop-app-service.ts 中：
 *   - enableFileDrop / disableFileDrop 在 Tauri 1.5 不可用——保留为 no-op
 *     占位（避免破坏调用方期望的 API 形状）
 *   - onFileDrop 通过 window.onDragDropEvent 监听，回调仅在 drop 时触发
 *
 * 单一职责：文件拖放事件桥接（webview ↔ 应用层）。
 */

import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * 启用文件拖放（Tauri 1.5 不可用，保留为 no-op）
 *
 * 原代码注释：
 *   setFileDropEnabled is not available in Tauri 1.5;
 *   file drop handling is done via webview events.
 */
export async function enableFileDrop(): Promise<void> {
  // no-op — Tauri 1.5 不支持 setFileDropEnabled，文件拖放走 onDragDropEvent
}

/** 禁用文件拖放（同样 no-op） */
export async function disableFileDrop(): Promise<void> {
  // no-op
}

/**
 * 监听文件拖放事件。
 * @param callback 仅在 type==='drop' 时触发，参数为拖入的文件路径数组
 * @returns Tauri 的 unlisten 函数，调用即可停止监听
 */
export async function onFileDrop(callback: (paths: string[]) => void): Promise<() => void> {
  const window = getCurrentWindow();

  const unlisten = await window.onDragDropEvent((event) => {
    if (event.payload.type === 'drop') {
      callback(event.payload.paths);
    }
  });

  return unlisten;
}
