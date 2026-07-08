/**
 * 分镜持久化
 * @module core/services/storyboard-persistence
 *
 * 提取自原 `StoryboardService.loadFromStorage` + `saveToStorage`。
 * 抽出为纯函数（接收 projectId / frames / autoSave），不再耦合于类成员。
 */

import { logger } from '@/core/utils/logger';

import { buildStoryboardStorageKey, type StoryboardFrame } from './storyboard-types';

/**
 * 从 localStorage 加载当前项目的分镜
 *
 * @param projectId 当前项目 ID（可选）
 * @returns 加载到的帧数组；若不存在或解析失败，返回空数组
 */
export function loadStoryboardsFromStorage(projectId?: string): StoryboardFrame[] {
  try {
    const key = buildStoryboardStorageKey(projectId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as StoryboardFrame[];
    }
  } catch (error) {
    logger.error('Failed to load storyboards from storage:', error);
  }
  return [];
}

/**
 * 把分镜数组写入 localStorage
 *
 * @param projectId 当前项目 ID（可选）
 * @param frames 待保存帧数组
 * @param autoSave false 时跳过保存（与原 StoryboardService.autoSave 开关对齐）
 * @returns 写入成功与否
 */
export function saveStoryboardsToStorage(
  projectId: string | undefined,
  frames: StoryboardFrame[],
  autoSave: boolean
): boolean {
  if (!autoSave) return false;

  try {
    const key = buildStoryboardStorageKey(projectId);
    localStorage.setItem(key, JSON.stringify(frames));
    return true;
  } catch (error) {
    logger.error('Failed to save storyboards to storage:', error);
    return false;
  }
}

/** 把已加载的帧塞回 Map（构造时一次性使用） */
