/**
 * 流水线进度推送器
 * @module core/services/domain/manga-pipeline-progress
 *
 * 提取自原 MangaPipelineService.updateProgress + progressCallback 字段。
 * 独立为可复用类，状态收敛，避免类成员四处透传。
 */

import type { ProgressCallback, PipelineProgress, PipelineStage } from './manga-pipeline-types';

/**
 * 进度推送器（封装 callback 状态）
 */
export class ProgressEmitter {
  private callback?: ProgressCallback;

  /** 设置 / 替换回调 */
  setCallback(callback: ProgressCallback | undefined): void {
    this.callback = callback;
  }

  /** 当前是否已设置回调 */
  hasCallback(): boolean {
    return this.callback !== undefined;
  }

  /** 获取当前回调（供外部传递为函数引用） */
  getCallback(): ProgressCallback | undefined {
    return this.callback;
  }

  /**
   * 推一次进度事件
   *
   * 行为与原 MangaPipelineService.updateProgress 字节级一致：
   *   - callback 未设置时静默跳过
   *   - 字段全部透传 + 透传 message
   */
  emit(
    stage: PipelineStage,
    overallProgress: number,
    stageProgress: number,
    currentSceneIndex: number,
    totalScenes: number,
    message?: string
  ): void {
    if (!this.callback) return;
    const payload: PipelineProgress = {
      stage,
      overallProgress,
      stageProgress,
      currentSceneIndex,
      totalScenes,
      message,
    };
    this.callback(payload);
  }
}
