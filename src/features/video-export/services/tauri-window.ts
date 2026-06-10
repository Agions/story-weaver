/**
 * Tauri 窗口 API
 * ===============
 * 当前窗口的状态查询 + 4 个控制方法：minimize / maximize / close / getState
 * 单一职责：把 Tauri window API 包装成 facade 友好接口。
 */
import { getCurrentWindow } from '@tauri-apps/api/window';

import type { WindowState } from './tauri-types';

/** 内部：复用 getCurrentWindow() 的引用 */
function getWinHandle() {
  return getCurrentWindow();
}

/** 获取当前窗口的尺寸/位置/最大化状态 */
export async function getCurrentWindowState(): Promise<WindowState> {
  const win = getWinHandle();
  const size = await win.innerSize();
  const position = await win.innerPosition();
  const maximized = await win.isMaximized();
  return {
    width: size.width,
    height: size.height,
    x: position.x,
    y: position.y,
    maximized,
  };
}

/** 最小化窗口 */
export async function minimizeWindow(): Promise<void> {
  const win = getWinHandle();
  await win.minimize();
}

/** 最大化窗口（已最大化则取消最大化） */
export async function maximizeWindow(): Promise<void> {
  const win = getWinHandle();
  const maximized = await win.isMaximized();
  if (maximized) {
    await win.unmaximize();
  } else {
    await win.maximize();
  }
}

/** 关闭窗口 */
export async function closeWindow(): Promise<void> {
  const win = getWinHandle();
  await win.close();
}
