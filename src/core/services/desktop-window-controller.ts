/**
 * 桌面窗口控制器
 *
 * 集中所有 Tauri Window API 操作。原 desktop-app-service.ts 中 13
 * 个窗口方法每个都是 `const window = getCurrentWindow(); await
 * window.xxx();` 的同质代码——拆出后所有方法仍保留原签名和原
 * 行为，差异只在具体调用的 window API。
 *
 * 单一职责：Tauri Window 操作的薄包装，不持有任何状态。
 *
 * 重复模式识别：
 *   - 13 处重复"const window = getCurrentWindow(); ..."
 *   - 2 处相同 isAlwaysOnTop 容错（try/catch + 默认 false）
 *   - 2 处 "isMaximized ? unmaximize : maximize" / "isFullscreen ? !isFullscreen"
 *     都属于"读状态 → 反向设"模式
 */

import { getCurrentWindow, LogicalSize, LogicalPosition } from '@tauri-apps/api/window';

import type { WindowState } from './desktop-app-types';

/**
 * 取当前 Window 实例——每个方法都需要做一次这行，提到工具层避免重复。
 */
function getCurrentAppWindow() {
  return getCurrentWindow();
}

/**
 * 读取 isAlwaysOnTop 并容错（旧版 Tauri 没有该 API）。
 * 原代码 2 处出现，行为完全相同。
 */
async function readAlwaysOnTopSafely(): Promise<boolean> {
  try {
    // isAlwaysOnTop 在部分 Tauri 版本不可用，optional chain + 容错保证兼容
    const win = getCurrentAppWindow() as { isAlwaysOnTop?: () => Promise<boolean> };
    return (await win?.isAlwaysOnTop?.()) ?? false;
  } catch {
    return false;
  }
}

/**
 * 构造 WindowState 快照——原 getWindowState 整段拼装逻辑。
 */
export async function getWindowState(): Promise<WindowState> {
  const window = getCurrentAppWindow();

  const [isMaximized, isMinimized, isFullscreen, isFocused, title, size, position] =
    await Promise.all([
      window.isMaximized(),
      window.isMinimized(),
      window.isFullscreen(),
      window.isFocused(),
      window.title(),
      window.innerSize(),
      window.innerPosition(),
    ]);

  const isAlwaysOnTop = await readAlwaysOnTopSafely();

  return {
    isMaximized,
    isMinimized,
    isFullscreen,
    isAlwaysOnTop,
    isFocused,
    title,
    size: { width: size.width, height: size.height },
    position: { x: position.x, y: position.y },
  };
}

/** 最小化窗口 */
export async function minimizeWindow(): Promise<void> {
  await getCurrentAppWindow().minimize();
}

/** 最大化（已最大化则还原） */
export async function toggleMaximizeWindow(): Promise<void> {
  const window = getCurrentAppWindow();
  const isMaximized = await window.isMaximized();
  if (isMaximized) {
    await window.unmaximize();
  } else {
    await window.maximize();
  }
}

/** 设置全屏状态 */
export async function setWindowFullscreen(fullscreen: boolean): Promise<void> {
  await getCurrentAppWindow().setFullscreen(fullscreen);
}

/** 切换全屏 */
export async function toggleWindowFullscreen(): Promise<void> {
  const window = getCurrentAppWindow();
  const isFullscreen = await window.isFullscreen();
  await window.setFullscreen(!isFullscreen);
}

/** 设置窗口置顶 */
export async function setWindowAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  await getCurrentAppWindow().setAlwaysOnTop(alwaysOnTop);
}

/** 切换窗口置顶（含 isAlwaysOnTop 容错） */
export async function toggleWindowAlwaysOnTop(): Promise<void> {
  const window = getCurrentAppWindow();
  const isOnTop = await readAlwaysOnTopSafely();
  await window.setAlwaysOnTop(!isOnTop);
}

/** 设置窗口标题 */
export async function setWindowTitle(title: string): Promise<void> {
  await getCurrentAppWindow().setTitle(title);
}

/** 设置窗口大小 */
export async function setWindowSize(width: number, height: number): Promise<void> {
  await getCurrentAppWindow().setSize(new LogicalSize(width, height));
}

/** 设置窗口位置 */
export async function setWindowPosition(x: number, y: number): Promise<void> {
  await getCurrentAppWindow().setPosition(new LogicalPosition(x, y));
}

/** 居中窗口 */
export async function centerWindow(): Promise<void> {
  await getCurrentAppWindow().center();
}

/** 显示 + 获取焦点 */
export async function showWindow(): Promise<void> {
  const window = getCurrentAppWindow();
  await window.show();
  await window.setFocus();
}

/** 隐藏窗口 */
export async function hideWindow(): Promise<void> {
  await getCurrentAppWindow().hide();
}

/** 关闭窗口 */
export async function closeWindow(): Promise<void> {
  await getCurrentAppWindow().close();
}

/** 退出应用（与 close 等价；保留独立命名以兼容外部调用） */
export async function quitApp(): Promise<void> {
  await getCurrentAppWindow().close();
}

/**
 * 请求用户关注（macOS dock 弹跳 / Windows 任务栏闪烁）。
 * Tauri 1.x UserAttentionType 数值：1 = critical, 0 = informational。
 */
export async function requestUserAttention(bounce: boolean = true): Promise<void> {
  // @ts-expect-error — requestUserAttention 类型在部分 Tauri 版本不完整
  await getCurrentAppWindow().requestUserAttention(bounce ? 1 : 0);
}
