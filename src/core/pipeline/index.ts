/**
 * frame-fab Pipeline 统一入口
 *
 * 提供流水线创建、执行、状态查询的统一接口
 */

import { logger } from '@/core/utils/logger';

import { PipelineEngine, createPipelineEngine } from './pipeline-engine';
import {
  PipelineStepId,
  PipelineExecutionMode,
  PipelineStatus,
  type PipelineConfig,
  type PipelineExecutionState,
} from './pipeline.types';
import { createAnalysisStep } from './step-analysis';
import { createAudioSynthesisStep, type AudioSynthesisOutput } from './step-audio-synthesis';
import { createCharacterStep, type CharacterOutput } from './step-character';
import { createCompositionStep, type CompositionOutput } from './step-composition';
import { createImportStep, type ImportInput, type ImportOutput } from './step-import';
import { createRenderStep, type RenderOutput } from './step-render';
import { createScriptStep, type ScriptOutput } from './step-script';
import { createStoryboardStep, type StoryboardOutput } from './step-storyboard';
import { createVideoEditingStep, type VideoEditingOutput } from './step-video-editing';

// ========== PipelineService 主类 ==========

export class PipelineService {
  private engines: Map<string, PipelineEngine> = new Map();

  /**
   * 创建默认7步流水线
   */
  createDefaultPipeline(workflowId: string, projectId?: string): PipelineEngine {
    const config: PipelineConfig = {
      workflowId,
      name: '漫剧创作流水线',
      mode: PipelineExecutionMode.SEQUENCE,
      projectId,
      enableCheckpoint: true,
      enableQualityGate: true,
      steps: [
        createImportStep(),
        createAnalysisStep(),
        createScriptStep(),
        createAudioSynthesisStep(), // 生成配音 + BGM（在渲染之前）
        createCharacterStep(),
        createStoryboardStep(),
        createRenderStep(),
        createVideoEditingStep(),
        createCompositionStep(),
      ],
    };

    const engine = createPipelineEngine(config);
    this.engines.set(workflowId, engine);

    logger.info(`[PipelineService] Created default pipeline: ${workflowId}`, {
      steps: config.steps.map((s) => s.stepId),
    });

    return engine;
  }

  /**
   * 运行流水线（快捷方法）
   */
  async run(
    workflowId: string,
    initialData: ImportInput,
    projectId?: string
  ): Promise<Map<PipelineStepId, unknown>> {
    const engine = this.createDefaultPipeline(workflowId, projectId);

    engine.onEvents({
      onStepProgress: (stepId, progress, message) => {
        logger.debug(`[Pipeline] ${stepId} ${progress}% ${message ?? ''}`);
      },
      onStepFail: (stepId, error) => {
        logger.error(`[Pipeline] Step ${stepId} failed: ${error}`);
      },
      onQualityGate: (stepId, decision, details) => {
        if (decision !== 'pass') {
          logger.warn(`[Pipeline] Quality gate ${decision} at ${stepId}: ${details ?? ''}`);
        }
      },
    });

    const results = await engine.run(initialData);

    // 转换为通用类型
    const output = new Map<PipelineStepId, unknown>();
    output.set(PipelineStepId.IMPORT, results);

    return output;
  }

  /**
   * 获取流水线状态
   */
  getPipelineStatus(workflowId: string): PipelineExecutionState | undefined {
    const engine = this.engines.get(workflowId);
    return engine?.getStatus();
  }

  /**
   * 暂停流水线
   */
  pausePipeline(workflowId: string): boolean {
    const engine = this.engines.get(workflowId);
    return engine?.pause() ?? false;
  }

  /**
   * 恢复流水线
   */
  async resumePipeline(workflowId: string): Promise<Map<PipelineStepId, unknown>> {
    const engine = this.engines.get(workflowId);
    if (!engine) {
      throw new Error(`Pipeline ${workflowId} not found`);
    }

    const results = await engine.resume();
    const output = new Map<PipelineStepId, unknown>();
    output.set(PipelineStepId.IMPORT, results);
    return output;
  }

  /**
   * 取消流水线
   */
  cancelPipeline(workflowId: string): void {
    const engine = this.engines.get(workflowId);
    engine?.cancel();
    this.engines.delete(workflowId);
  }
}

// ========== 导出单例 ==========

export const pipelineService = new PipelineService();

// ========== 类型重新导出 ==========

export type {
  ImportInput,
  ImportOutput,
  ScriptOutput,
  CharacterOutput,
  StoryboardOutput,
  RenderOutput,
  AudioSynthesisOutput,
  VideoEditingOutput,
  CompositionOutput,
};

export { PipelineStepId, PipelineExecutionMode, PipelineStatus };

export default pipelineService;
