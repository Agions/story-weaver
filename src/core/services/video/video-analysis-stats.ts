/**
 * 视频分析统计信息
 * @module core/services/video/video-analysis-stats
 *
 * 提取自原 `VideoAnalysisService.calculateStats`。
 */

import type { VideoAnalysis } from '@/shared/types';

/** 通用 Record<string, number> 计数器（消除 3 处 `record[key] = (record[key] ?? 0) + 1` 重复） */
export function countBy<T>(
  items: T[],
  keyFn: (item: T) => string | undefined
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item) ?? 'unknown';
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

/**
 * 计算视频分析的完整统计信息
 *
 * 行为与原 `VideoAnalysisService.calculateStats` 字节级一致。
 */
export function calculateStats(analysis: VideoAnalysis): VideoAnalysis['stats'] {
  const totalDuration = analysis.scenes.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  const avgSceneDuration = analysis.scenes.length > 0 ? totalDuration / analysis.scenes.length : 0;

  return {
    sceneCount: analysis.scenes.length,
    objectCount: analysis.objects.length,
    avgSceneDuration,
    sceneTypes: countBy(analysis.scenes, (s) => s.type),
    objectCategories: countBy(analysis.objects, (o) => o.category),
    dominantEmotions: countBy(analysis.emotions, (e) => e.dominant),
  };
}
