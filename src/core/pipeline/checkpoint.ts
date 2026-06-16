/**
 * Checkpoint Service - 流水线检查点管理
 * 使用安全存储替代 localStorage，支持断点续传
 *
 * @deprecated 请使用 secureStorage service 替代
 */

import type { CheckpointData } from '@/core/services/project/secure-storage-types';
import { secureStorage } from '@/core/services/project/secure-storage.service';
export type { CheckpointData };

/**
 * 保存检查点数据（安全版本）
 */
export async function saveCheckpoint(stepId: string, data: unknown): Promise<void> {
  await secureStorage.saveCheckpoint(stepId, data);
}

/**
 * 加载检查点数据
 */
export async function loadCheckpoint(stepId: string): Promise<CheckpointData | null> {
  return await secureStorage.loadCheckpoint(stepId);
}

/**
 * 清除单个检查点
 */
export async function clearCheckpoint(stepId: string): Promise<void> {
  await secureStorage.clearCheckpoint(stepId);
}

/**
 * 清除所有检查点
 */
export async function clearAllCheckpoints(): Promise<void> {
  await secureStorage.clearAllCheckpoints();
}

/**
 * 检查是否存在有效的检查点
 */
export async function hasCheckpoint(stepId: string): Promise<boolean> {
  const checkpoint = await loadCheckpoint(stepId);
  return checkpoint?.completed ?? false;
}
