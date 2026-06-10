/**
 * Tauri 文件系统 API
 * ===================
 * 7 个原生 fs 调用：readText / writeText / writeBinary /
 * fileExists / createDirectory / removeDirectory / listDirectory
 * 单一职责：把 Tauri plugin-fs 包装成 facade 友好接口。
 */
import {
  readTextFile,
  writeTextFile,
  writeFile,
  exists,
  mkdir,
  remove,
  readDir,
} from '@tauri-apps/plugin-fs';

import type { DirInfo } from './tauri-types';

/** 读文本文件 */
export async function readText(path: string): Promise<string> {
  return readTextFile(path);
}

/** 写文本文件 */
export async function writeText(path: string, content: string): Promise<void> {
  await writeTextFile(path, content);
}

/** 写二进制文件 */
export async function writeBinary(path: string, data: Uint8Array): Promise<void> {
  await writeFile(path, data);
}

/** 路径是否存在 */
export async function fileExists(path: string): Promise<boolean> {
  return exists(path);
}

/** 创建目录（recursive 选项） */
export async function createDirectory(path: string, recursive: boolean = false): Promise<void> {
  await mkdir(path, { recursive });
}

/** 删除目录（recursive 选项） */
export async function removeDirectory(path: string, recursive: boolean = false): Promise<void> {
  await remove(path, { recursive });
}

/**
 * 列出目录条目
 * 注：plugin-fs 的 DirEntry 不暴露完整 path，这里用 name 作为 path 字段
 * （与原行为保持一致）
 */
export async function listDirectory(path: string): Promise<DirInfo[]> {
  const entries = await readDir(path);
  return entries.map((entry) => ({
    name: entry.name,
    path: entry.name, // plugin-fs DirEntry doesn't have path property
    isDirectory: entry.isDirectory,
  }));
}
