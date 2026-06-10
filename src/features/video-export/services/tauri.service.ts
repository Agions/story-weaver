/**
 * Tauri API Service Facade
 * ========================
 * 统一对外的 Tauri 原生 API 门面，按子系统拆分到 7 个 sibling 文件：
 *
 * - tauri-types.ts                  12 个 interface 集中
 * - tauri-dialog.ts                 5 个对话框 (open/save/message/ask/confirm)
 * - tauri-filesystem.ts             7 个 fs 操作 (read/write/exists/mkdir/...)
 * - tauri-paths.ts                  6 个系统路径
 * - tauri-notification.ts           系统通知
 * - tauri-window.ts                 当前窗口控制
 * - tauri-video-commands.ts         5 个视频后端 invoke
 * - tauri-export-events.ts          进度事件 + 取消
 *
 * 设计原则：
 * 1. 公共方法签名保持与原代码完全一致，17 个调用方零修改
 * 2. 单例模式：原 lazy `??=` 改为模块级 closure（行为等价）
 * 3. 进度监听状态封装在 export-events 模块，facade 不持有
 */

import { openFileDialog, saveFileDialog, showMessage, showAsk, showConfirm } from './tauri-dialog';
import {
  listenExportProgress,
  cancelExportCommand,
  destroyExportListener,
} from './tauri-export-events';
import {
  readText,
  writeText,
  writeBinary,
  fileExists,
  createDirectory,
  removeDirectory,
  listDirectory,
} from './tauri-filesystem';
import { sendSystemNotification } from './tauri-notification';
import {
  getAppDir,
  getConfigDir,
  getDataDir,
  getDocumentDir,
  getVideoDir,
  getDownloadDir,
} from './tauri-paths';
import type {
  OpenFileOptions,
  SaveFileOptions,
  VideoClipOptions,
  PreviewOptions,
  ExportOptions,
  ExportProgress,
  ExportProgressCallback,
  DirInfo,
  WindowState,
  NotificationOptions,
  TrayMenuItem,
  ShortcutDefinition,
} from './tauri-types';
import {
  processVideoCommand,
  generatePreviewCommand,
  exportVideoCommand,
  getVideoInfoCommand,
  extractFramesCommand,
  type BackendVideoInfo,
} from './tauri-video-commands';
import { getCurrentWindowState, minimizeWindow, maximizeWindow, closeWindow } from './tauri-window';

export type {
  OpenFileOptions,
  SaveFileOptions,
  VideoClipOptions,
  PreviewOptions,
  ExportOptions,
  ExportProgress,
  ExportProgressCallback,
  DirInfo,
  WindowState,
  NotificationOptions,
  TrayMenuItem,
  ShortcutDefinition,
};
export type { BackendVideoInfo };

class TauriService {
  // ========== Dialog APIs ==========
  openFileDialog(options: OpenFileOptions = {}) {
    return openFileDialog(options);
  }

  saveFileDialog(options: SaveFileOptions = {}) {
    return saveFileDialog(options);
  }

  showMessage(title: string, msg: string) {
    return showMessage(title, msg);
  }

  showAsk(title: string, msg: string) {
    return showAsk(title, msg);
  }

  showConfirm(title: string, msg: string) {
    return showConfirm(title, msg);
  }

  // ========== File System APIs ==========
  readText(path: string) {
    return readText(path);
  }

  writeText(path: string, content: string) {
    return writeText(path, content);
  }

  writeBinary(path: string, data: Uint8Array) {
    return writeBinary(path, data);
  }

  fileExists(path: string) {
    return fileExists(path);
  }

  createDirectory(path: string, recursive: boolean = false) {
    return createDirectory(path, recursive);
  }

  removeDirectory(path: string, recursive: boolean = false) {
    return removeDirectory(path, recursive);
  }

  listDirectory(path: string) {
    return listDirectory(path);
  }

  // ========== Path APIs ==========
  getAppDir() {
    return getAppDir();
  }

  getConfigDir() {
    return getConfigDir();
  }

  getDataDir() {
    return getDataDir();
  }

  getDocumentDir() {
    return getDocumentDir();
  }

  getVideoDir() {
    return getVideoDir();
  }

  getDownloadDir() {
    return getDownloadDir();
  }

  // ========== Notification APIs ==========
  sendNotification(options: NotificationOptions) {
    return sendSystemNotification(options);
  }

  // ========== Window APIs ==========
  getCurrentWindowState() {
    return getCurrentWindowState();
  }

  minimizeWindow() {
    return minimizeWindow();
  }

  maximizeWindow() {
    return maximizeWindow();
  }

  closeWindow() {
    return closeWindow();
  }

  // ========== Video Processing APIs (Tauri backend) ==========
  processVideo(options: VideoClipOptions) {
    return processVideoCommand(options);
  }

  generatePreview(options: PreviewOptions) {
    return generatePreviewCommand(options);
  }

  exportVideoCommand(options: ExportOptions) {
    return exportVideoCommand(options);
  }

  getVideoInfoCommand(videoPath: string) {
    return getVideoInfoCommand(videoPath);
  }

  extractFrames(videoPath: string, outputDir: string, fps: number = 1) {
    return extractFramesCommand(videoPath, outputDir, fps);
  }

  // ========== Progress Events ==========
  listenExportProgress(callback: ExportProgressCallback) {
    return listenExportProgress(callback);
  }

  cancelExport(exportId: string) {
    return cancelExportCommand(exportId);
  }

  // ========== Cleanup ==========
  destroy(): void {
    destroyExportListener();
  }
}

// Singleton instance (原代码用 lazy ??=，这里改为模块级 closure，行为等价)
let tauriService: TauriService | null = null;

export function getTauriService(): TauriService {
  return (tauriService ??= new TauriService());
}

export default TauriService;
