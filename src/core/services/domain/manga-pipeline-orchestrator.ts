/**
 * 漫画流水线编排
 *
 * 基于 PipelineEngine 实现，使用单个 PipelineStep 执行 4 阶段串行任务：
 *   images → audio → lipsync → compose
 *
 * @module core/services/domain/manga-pipeline-orchestrator
 */

import {
  createMangaPipelineEngine,
  createMangaPipelineStep,
} from './manga-pipeline-steps';
import {
  type PipelineConfig,
  type PipelineScene,
  type PipelineProgress,
  type PipelineResult,
} from './manga-pipeline-types';

/** 构造失败的 PipelineResult */
export function buildFailedResult(
  scenes: PipelineScene[],
  startTime: number,
  errorMessage: string
): PipelineResult {
  return {
    scenes,
    totalProcessingTime: Date.now() - startTime,
    status: 'failed',
    error: errorMessage,
  };
}

/** 构造成功的 PipelineResult */
export function buildCompletedResult(
  scenes: PipelineScene[],
  startTime: number
): PipelineResult {
  return {
    scenes,
    finalVideoUrl: scenes[0]?.finalVideoUrl,
    totalProcessingTime: Date.now() - startTime,
    status: 'completed',
  };
}

/**
 * 判断一个错误是否为"取消"
 */
export function isPipelineCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as Error;
  return (
    e.name === 'AbortError' ||
    e.message.includes('已被取消') ||
    e.message.includes('cancelled')
  );
}

/**
 * 漫画流水线主流程编排
 *
 * 通过 PipelineEngine 执行单个漫画流水线步骤，
 * 统一管理取消信号、进度推送、异常包装。
 */
export async function runPipeline(
  novelContent: string,
  scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[],
  config: PipelineConfig,
  options: { signal?: AbortSignal } = {},
  onProgress?: (progress: PipelineProgress) => void
): Promise<PipelineResult> {
  const startTime = Date.now();
  const totalScenes = scenes.length;
  const workflowId = `manga-${Date.now()}`;

  // 构建引擎
  const engine = createMangaPipelineEngine({
    workflowId,
    enableCheckpoint: false,
    onProgress,
  });

  // 添加漫画流水线步骤
  engine.addStep(createMangaPipelineStep(onProgress));

  // 构造步骤输入
  const input = {
    scenes: scenes as PipelineScene[],
    config,
    signal: options.signal ?? new AbortController().signal,
    totalScenes,
    progressCallback: onProgress,
  };

  try {
    const output = (await engine.run(input)) as unknown as { scenes: PipelineScene[]; durationMs: number };
    return buildCompletedResult(output.scenes, startTime);
  } catch (error) {
    const errorMessage = isPipelineCancelled(error)
      ? '流水线已被取消'
      : error instanceof Error
        ? error.message
        : '未知错误';
    return buildFailedResult(input.scenes, startTime, errorMessage);
  }

  // 静默吞掉未使用变量警告
  void novelContent;
}
