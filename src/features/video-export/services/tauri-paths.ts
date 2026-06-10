/**
 * Tauri 系统路径 API
 * ===================
 * 6 个原生路径 API：appConfigDir / appDataDir / documentDir / videoDir / downloadDir
 *
 * 历史 Bug 保留说明：
 * - 原 `getAppDir()` 错误地返回 `appConfigDir()`（应是 `appDir`），
 *   与 `getConfigDir()` 完全重复。
 * - 本次重构**保留字节级一致**：getAppDir 仍然返回 appConfigDir。
 * - 真正的 appDir 可以从 @tauri-apps/api/path 导入（未在原文件用）。
 */
import { appConfigDir, appDataDir, documentDir, videoDir, downloadDir } from '@tauri-apps/api/path';

/** 应用配置目录（与原 getAppDir 行为一致：返回 appConfigDir） */
export async function getAppDir(): Promise<string> {
  return appConfigDir();
}

/** 应用配置目录 */
export async function getConfigDir(): Promise<string> {
  return appConfigDir();
}

/** 应用数据目录 */
export async function getDataDir(): Promise<string> {
  return appDataDir();
}

/** 系统文档目录 */
export async function getDocumentDir(): Promise<string> {
  return documentDir();
}

/** 系统视频目录 */
export async function getVideoDir(): Promise<string> {
  return videoDir();
}

/** 系统下载目录 */
export async function getDownloadDir(): Promise<string> {
  return downloadDir();
}
