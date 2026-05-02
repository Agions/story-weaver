/**
 * Tauri Utilities
 * @description File system and dialog utilities for Tauri desktop integration
 */
import { open } from '@tauri-apps/plugin-dialog';
import * as fs from '@tauri-apps/plugin-fs';
import { logger } from './logger';

export const selectFile = async (options: {
  extensions?: string[];
  title?: string;
}): Promise<string> => {
  try {
    const selected = await open({
      multiple: false,
      filters: options.extensions
        ? [{ name: '视频文件', extensions: options.extensions }]
        : undefined,
      title: options.title || '选择文件',
    });
    return selected as string || '';
  } catch (error) {
    logger.error('选择文件时出错:', error);
    return '';
  }
};

export const readTextFile = async (path: string): Promise<string> => {
  try {
    return await fs.readTextFile(path);
  } catch (error) {
    logger.error('读取文件时出错:', error);
    throw error;
  }
};

export const writeTextFile = async (path: string, contents: string): Promise<void> => {
  try {
    await fs.writeTextFile(path, contents);
  } catch (error) {
    logger.error('写入文件时出错:', error);
    throw error;
  }
};

export const fileExists = async (path: string): Promise<boolean> => {
  try {
    return await fs.exists(path);
  } catch (error) {
    logger.error('检查文件是否存在时出错:', error);
    return false;
  }
};
