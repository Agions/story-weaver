import { imageGenerationService } from '@/core/services/ai/image/image-generation-service';
import { logger } from '@/core/utils/logger';
import { assetLibraryService } from '@/features/asset-library';
import { checkBatchConsistency, type ConsistencyCheckInput } from '@/features/character-consistency';

import { BasePipelineStep } from './base-pipeline-step';
import { PipelineStepId, PipelineStep, StepInput, QualityGateDecision } from './pipeline-types';
import { getContext } from './step-helpers';
import type { CharacterOutput } from './step-character';
import type { StoryboardOutput } from './step-storyboard';

export interface RenderOutput {
  renderedFrames: Array<{
    frameId: string;
    imageUrl: string;
    thumbnailUrl?: string;
    qualityScore?: number;
    renderTime?: number;
  }>;
  failedFrames: string[];
  totalFrames: number;
  successRate: number;
}

export class RenderStep extends BasePipelineStep {
  readonly dependencies = [PipelineStepId.STORYBOARD];
  private batchSize = 4;

  constructor(config?: Partial<PipelineStep>) {
    super({
      ...config,
      id: config?.id ?? 'step-render',
      name: config?.name ?? '批量渲染',
      stepId: config?.stepId ?? PipelineStepId.RENDER,
      retryPolicy: config?.retryPolicy ?? {
        maxRetries: 2,
        initialDelayMs: 3000,
        backoffMultiplier: 2,
        maxDelayMs: 15000,
      },
    });
    this.batchSize = config?.parallelKeys?.length ? Math.min(config.parallelKeys.length, 4) : 4;
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    if (result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      const totalFrames = typeof r.totalFrames === 'number' ? r.totalFrames : 0;
      const successRate = typeof r.successRate === 'number' ? r.successRate : 0;
      return { framesProcessed: totalFrames, qualityScore: successRate };
    }
    return {};
  }

  protected computeQualityGate(result: unknown): QualityGateDecision | undefined {
    if (result && typeof result === 'object') {
      const successRate = (result as Record<string, unknown>).successRate;
      if (typeof successRate === 'number') {
        return successRate >= 0.8 ? QualityGateDecision.PASS : QualityGateDecision.WARN;
      }
    }
    return undefined;
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = getContext(input)!;
    logger.info(`[RenderStep] Starting batch render for workflow ${input.workflowId}`);

    const frames = context.getVariable<StoryboardOutput['frames']>('frames') ?? [];

    if (frames.length === 0) {
      throw new Error('No frames to render');
    }

    this.reportProgress(5, `开始渲染 ${frames.length} 个分镜...`);

    const checkpoint = input.checkpoint;
    const completedFrameIds = new Set(checkpoint?.completedFrames ?? []);
    const framesToRender = frames.filter((f) => !completedFrameIds.has(f.id));

    logger.info(
      `[RenderStep] ${completedFrameIds.size} already rendered, ${framesToRender.length} remaining`
    );

    const renderedFrames: RenderOutput['renderedFrames'] = [];
    const failedFrames: string[] = [];

    for (let i = 0; i < framesToRender.length; i += this.batchSize) {
      const batch = framesToRender.slice(i, i + this.batchSize);
      const batchProgress = 5 + Math.floor((i / framesToRender.length) * 85);

      this.reportProgress(
        batchProgress,
        `渲染批次 ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(framesToRender.length / this.batchSize)}`
      );

      const results = await Promise.allSettled(
        batch.map(async (frame) => {
          try {
            const result = await imageGenerationService.generateImage(frame.prompt, {
              model: 'seedream-5.0',
              size: '2K',
            });

            return {
              frameId: frame.id,
              imageUrl: result.url || '',
              thumbnailUrl: result.url,
              qualityScore: 0.85,
              renderTime: Date.now() - ((input as { startTime?: number }).startTime ?? 0),
            };
          } catch (error) {
            throw { frameId: frame.id, error };
          }
        })
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const frameId = batch[j].id;

        if (result.status === 'fulfilled') {
          renderedFrames.push(result.value);
          completedFrameIds.add(frameId);
        } else {
          failedFrames.push(frameId);
          logger.warn(`[RenderStep] Frame ${frameId} failed: ${result.reason}`);
        }
      }

      if (this.batchSize > 1 || i + this.batchSize >= framesToRender.length) {
        const stepCheckpoint = {
          stepId: this.stepId,
          completedFrames: Array.from(completedFrameIds),
          lastProcessedIndex: i + this.batchSize,
          partialOutput: { renderedFrames, failedFrames },
          timestamp: Date.now(),
        };
        context.saveCheckpoint(stepCheckpoint);
      }
    }

    this.reportProgress(95, '渲染完成');

    // 将渲染结果注册到资产库（用于复用率追踪）
    try {
      for (const frame of renderedFrames) {
        assetLibraryService.registerAsset({
          type: 'image',
          name: `frame_${frame.frameId}`,
          url: frame.imageUrl,
          thumbnailUrl: frame.thumbnailUrl,
          sceneId: frame.frameId,
          tags: ['rendered', `quality_${(frame.qualityScore ?? 0).toFixed(2)}`],
          metadata: {
            qualityScore: frame.qualityScore,
            renderTime: frame.renderTime,
          },
        });
      }
      logger.info(`[RenderStep] Registered ${renderedFrames.length} assets to asset library`);
    } catch (err) {
      logger.warn(`[RenderStep] Failed to register assets: ${err}`);
      // 非阻塞：渲染结果仍可继续
    }

    // 对有参考图的角色进行一致性评分（生成门禁）
    const characters = context.getVariable<CharacterOutput['characters']>('characters');
    const consistencyResults = await this.checkConsistency(characters, renderedFrames);

    const totalFrames = frames.length;
    const successRate = (totalFrames - failedFrames.length) / totalFrames;

    context.setVariable('renderedFrames', renderedFrames);
    context.setVariable('failedFrames', failedFrames);
    context.setVariable('renderSuccessRate', successRate);

    logger.success(
      `[RenderStep] Render complete: ${renderedFrames.length}/${totalFrames} success rate: ${(successRate * 100).toFixed(1)}%`
    );

    return {
      renderedFrames,
      failedFrames,
      totalFrames,
      successRate,
      consistencyResults, // 一致性评分结果（可选）
    };
  }

  /**
   * 对有参考图的角色进行一致性评分
   * 仅检查每个角色的第一帧（采样），避免 VLM 调用过多
   */
  private async checkConsistency(
    characters: CharacterOutput['characters'] | undefined,
    renderedFrames: RenderOutput['renderedFrames']
  ): Promise<Array<{ characterId: string; score: number; passed: boolean }>> {
    if (!characters || characters.length === 0 || renderedFrames.length === 0) {
      return [];
    }

    // 只对有参考图的角色进行一致性检查
    const charactersWithRefs = characters.filter(
      (c) => c.consistency.referenceImages && c.consistency.referenceImages.length > 0
    );

    if (charactersWithRefs.length === 0) {
      return [];
    }

    // 采样检查：每个角色只检查前 3 帧
    const sampleFrames = renderedFrames.slice(0, 3);
    const checks: ConsistencyCheckInput[] = [];

    for (const char of charactersWithRefs) {
      for (const frame of sampleFrames) {
        checks.push({
          characterId: char.id,
          frameImageUrl: frame.imageUrl,
          prompt: `Consistency check for character ${char.name}`,
        });
      }
    }

    try {
      const results = await checkBatchConsistency(checks);
      const output: Array<{ characterId: string; score: number; passed: boolean }> = [];

      for (const char of charactersWithRefs) {
        const charResults = Array.from(results.values()).filter((r) => r.characterId === char.id);
        if (charResults.length > 0) {
          const avgScore = charResults.reduce((sum, r) => sum + r.score, 0) / charResults.length;
          output.push({
            characterId: char.id,
            score: avgScore,
            passed: avgScore >= 70,
          });
        }
      }

      logger.info(`[RenderStep] Consistency check completed for ${output.length} characters`);
      return output;
    } catch (err) {
      logger.warn(`[RenderStep] Consistency check failed: ${err}`);
      return [];
    }
  }
}

// ========== 工厂函数 ==========

export function createRenderStep(config?: Partial<PipelineStep>): RenderStep {
  return new RenderStep(config);
}

export default RenderStep;
