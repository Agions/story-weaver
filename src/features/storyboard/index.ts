/**
 * Storyboard Feature Slice
 *
 * 分镜设计垂直切片：聚合分镜编辑 + 帧管理 + 版本协作。
 * 对应 pipeline 步骤: step-storyboard
 *
 * @module features/storyboard
 */

import { getStoryboardService, type StoryboardServiceOptions } from '@/core/services/storyboard-service';

// ========== 类型定义 ==========

/** 分镜导出格式 */
export type StoryboardExportFormat = 'json' | 'pdf' | 'csv';

/** 分镜版本快照 */
export interface StoryboardVersionSnapshot {
  id: string;
  storyboardId: string;
  label: string;
  frames: unknown[];
  createdAt: string;
}

// ========== 服务胶水 ==========

/**
 * 获取分镜服务实例（带 feature 级默认配置）
 */
export function getStoryboardServiceInstance(options?: Partial<StoryboardServiceOptions>) {
  return getStoryboardService(options);
}

/**
 * 快照当前分镜版本（用于协作对比）
 */
export function snapshotStoryboardVersion(
  storyboardId: string,
  label: string
): StoryboardVersionSnapshot | null {
  const service = getStoryboardService();
  const frames = service.getAll();

  return {
    id: `ver_${Date.now()}`,
    storyboardId,
    label,
    frames: frames.map((f) => ({ ...f })),
    createdAt: new Date().toISOString(),
  };
}

// ========== 导出 ==========

export const storyboardFeatureService = {
  getStoryboardServiceInstance,
  snapshotStoryboardVersion,
};

export default storyboardFeatureService;
