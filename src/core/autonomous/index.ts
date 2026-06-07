/**
 * frame-fab Autonomous Mode — Core Module
 *
 * 全自动 AI 漫剧制作系统核心模块
 *
 * @example
 * ```typescript
 * import { createAutoPipelineEngine } from './autonomous';
 *
 * const engine = createAutoPipelineEngine({ maxReviewRetries: 3 });
 *
 * engine.onEvents({
 *   onStepProgress: (stepId, progress) => {
 *     console.log(`[${stepId}] Progress: ${progress}%`);
 *   },
 *   onPipelineComplete: (result) => {
 *     console.log('Done! Output:', result.outputPath);
 *   },
 * });
 *
 * const result = await engine.run({
 *   content: '从前有座山，山里有座庙...',
 *   mode: 'novel',
 *   style: 'anime',
 *   qualityLevel: 'balanced',
 * });
 * ```
 */

export * from './types/autonomous.types';
export * from './evaluator/quality-gate';
export * from './evaluator/self-review-loop';
export * from './auto-pipeline-engine';
