/**
 * Composition 持久化
 *
 * 把 composition-service.ts 中的 localStorage 读写抽出来，
 * 并提供带错误日志的容错版本。
 */

import { logger } from '@/core/utils/logger';

import { COMPOSITION_STORAGE_KEY } from './composition-types';
import type { CompositionProject } from './composition-types';

/**
 * 持久化数据结构（来自 localStorage 的 JSON 解析结果）。
 * 与 CompositionProject 等价，但允许缺字段以便向后兼容。
 */
type StoredComposition = CompositionProject;

/**
 * 从 localStorage 读取所有合成项目。失败时返回空数组并写日志。
 */
export function loadCompositionsFromStorage(): CompositionProject[] {
  try {
    const stored = localStorage.getItem(COMPOSITION_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const data = JSON.parse(stored) as StoredComposition[];
    return data.map((comp) => ({ ...comp }));
  } catch (error) {
    logger.error('Failed to load compositions from storage:', error);
    return [];
  }
}

/**
 * 把所有合成项目写入 localStorage。失败时写日志但不抛出。
 *
 * @returns true 表示成功，false 表示失败
 */
export function saveCompositionsToStorage(compositions: CompositionProject[]): boolean {
  try {
    const data = compositions.map((comp) => ({ ...comp }));
    localStorage.setItem(COMPOSITION_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error('Failed to save compositions to storage:', error);
    return false;
  }
}

/**
 * 清空持久化数据（仅清 localStorage 键，不动内存）。
 */
