/**
 * Desktop App Service 门面
 *
 * 把原 471 行单类（4 类职责 + 大量重复模式）拆为 6 个子模块：
 *   - desktop-app-types.ts                 4 个 interface + Platform type
 *   - desktop-window-controller.ts         16 个窗口方法（含 isAlwaysOnTop 容错）
 *   - desktop-notification-controller.ts   通知（5 个方法 + 3 个 notifyXxx 工厂）
 *   - desktop-shortcut-controller.ts       快捷键（5 个公开方法 + match/generate）
 *   - desktop-file-drop.ts                 文件拖放（enable/disable/onFileDrop）
 *   - desktop-app-info.ts                  应用信息（version/name/platform）
 *
 * 本文件作为对外门面：
 *   - 类 DesktopAppService 暴露全部原方法
 *   - 委托到上述子模块
 *   - 顶层 export 单例 desktopAppService + default export 保持兼容
 *
 * 业务行为完全不变：
 *   - 16 个窗口方法名（getWindowState/minimize/toggleMaximize/...）1:1
 *   - 通知默认 title "操作成功" / "操作失败" / "提示" 1:1
 *   - 快捷键注册 / 注销行为完全一致（含 shift 排除规则）
 *   - 平台检测（UA 嗅探）1:1
 *   - 文件拖放 onFileDrop 仅 type==='drop' 触发 1:1
 */

// 类型 re-export（外部 import 路径不变）
export type {
  ShortcutDefinition,
  TrayMenuItem,
  NotificationOptions,
  WindowState,
  Platform,
} from './desktop-app-types';

import * as appInfo from './desktop-app-info';
import type {
  ShortcutDefinition,
  NotificationOptions,
  WindowState,
  Platform,
} from './desktop-app-types';
import * as fileDropController from './desktop-file-drop';
import * as notificationController from './desktop-notification-controller';
import * as shortcutController from './desktop-shortcut-controller';
import * as windowController from './desktop-window-controller';

class DesktopAppService {
  // ========== 窗口操作 ==========

  async getWindowHandle(): Promise<unknown> {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    return getCurrentWindow();
  }

  async getWindowState(): Promise<WindowState> {
    return windowController.getWindowState();
  }

  async minimize(): Promise<void> {
    return windowController.minimizeWindow();
  }

  async toggleMaximize(): Promise<void> {
    return windowController.toggleMaximizeWindow();
  }

  async setFullscreen(fullscreen: boolean): Promise<void> {
    return windowController.setWindowFullscreen(fullscreen);
  }

  async toggleFullscreen(): Promise<void> {
    return windowController.toggleWindowFullscreen();
  }

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    return windowController.setWindowAlwaysOnTop(alwaysOnTop);
  }

  async toggleAlwaysOnTop(): Promise<void> {
    return windowController.toggleWindowAlwaysOnTop();
  }

  async setTitle(title: string): Promise<void> {
    return windowController.setWindowTitle(title);
  }

  async setSize(width: number, height: number): Promise<void> {
    return windowController.setWindowSize(width, height);
  }

  async setPosition(x: number, y: number): Promise<void> {
    return windowController.setWindowPosition(x, y);
  }

  async center(): Promise<void> {
    return windowController.centerWindow();
  }

  async show(): Promise<void> {
    return windowController.showWindow();
  }

  async hide(): Promise<void> {
    return windowController.hideWindow();
  }

  async close(): Promise<void> {
    return windowController.closeWindow();
  }

  async quit(): Promise<void> {
    return windowController.quitApp();
  }

  async requestAttention(bounce: boolean = true): Promise<void> {
    return windowController.requestUserAttention(bounce);
  }

  // ========== 通知功能 ==========

  async checkNotificationPermission(): Promise<boolean> {
    return notificationController.checkNotificationPermission();
  }

  async requestNotificationPermission(): Promise<boolean> {
    return notificationController.requestNotificationPermission();
  }

  async sendNotification(options: NotificationOptions): Promise<void> {
    return notificationController.sendDesktopNotification(options);
  }

  async notifySuccess(message: string, title: string = '操作成功'): Promise<void> {
    return notificationController.notifySuccess(message, title);
  }

  async notifyError(message: string, title: string = '操作失败'): Promise<void> {
    return notificationController.notifyError(message, title);
  }

  async notifyInfo(message: string, title: string = '提示'): Promise<void> {
    return notificationController.notifyInfo(message, title);
  }

  // ========== 快捷键功能 ==========

  registerShortcut(shortcut: ShortcutDefinition): void {
    return shortcutController.registerShortcut(shortcut);
  }

  unregisterShortcut(key: string, modifiers?: string[]): void {
    return shortcutController.unregisterShortcut(key, modifiers);
  }

  unregisterAllShortcuts(): void {
    return shortcutController.unregisterAllShortcuts();
  }

  // ========== 文件拖放 ==========

  async enableFileDrop(): Promise<void> {
    return fileDropController.enableFileDrop();
  }

  async disableFileDrop(): Promise<void> {
    return fileDropController.disableFileDrop();
  }

  async onFileDrop(callback: (paths: string[]) => void): Promise<() => void> {
    return fileDropController.onFileDrop(callback);
  }

  // ========== 应用信息 ==========

  getAppVersion(): string {
    return appInfo.getAppVersion();
  }

  getAppName(): string {
    return appInfo.getAppName();
  }

  getPlatform(): Platform {
    return appInfo.getPlatform();
  }

  isMacOS(): boolean {
    return appInfo.isMacOS();
  }

  isWindows(): boolean {
    return appInfo.isWindows();
  }
}

// 单例
export const desktopAppService = new DesktopAppService();
export default desktopAppService;
