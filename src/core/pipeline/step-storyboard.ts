import { logger } from '@/core/utils/logger';

import { BasePipelineStep } from './base-pipeline-step';
import { PipelineStepId, PipelineStep, StepInput, PipelineExecutionMode } from './pipeline.types';

export interface StoryboardOutput {
  frames: Array<{
    id: string;
    sceneId: string;
    shotNumber: number;
    shotType: 'ECU' | 'CU' | 'MCU' | 'MS' | 'WS' | 'EWS';
    cameraAngle: '仰拍' | '俯拍' | '平拍' | '侧拍';
    lighting: '顺光' | '侧光' | '逆光' | '顶光';
    description: string;
    prompt: string;
    duration: number;
  }>;
  totalFrames: number;
}

const SHOT_TYPES = ['ECU', 'CU', 'MCU', 'MS', 'WS', 'EWS'] as const;
const CAMERA_ANGLES = ['仰拍', '俯拍', '平拍', '侧拍'] as const;
const LIGHTING_TYPES = ['顺光', '侧光', '逆光', '顶光'] as const;

// ========== StoryboardStep 实现 ==========

export class StoryboardStep extends BasePipelineStep {
  constructor(config?: Partial<PipelineStep>) {
    super({
      ...config,
      id: config?.id ?? 'step-storyboard',
      name: config?.name ?? '分镜设计',
      stepId: config?.stepId ?? PipelineStepId.STORYBOARD,
      dependencies: config?.dependencies ?? [PipelineStepId.SCRIPT, PipelineStepId.CHARACTER],
    });
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = input.context;
    logger.info(`[StoryboardStep] Generating storyboard for workflow ${input.workflowId}`);

    const scenes =
      context.getVariable<Array<{ id: string; title: string; description: string }>>('scenes') ??
      [];
    const characters =
      context.getVariable<Array<{ name: string; appearance: Record<string, string> }>>(
        'characters'
      ) ?? [];

    this.reportProgress(10, '正在分析场景...');

    const frames: StoryboardOutput['frames'] = [];
    let shotNumber = 1;

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      this.reportProgress(10 + (i * 60) / scenes.length, `处理场景: ${scene.title}`);

      const shotCount = 2 + Math.floor(Math.random() * 3);

      for (let j = 0; j < shotCount; j++) {
        const shotType = SHOT_TYPES[Math.floor(Math.random() * SHOT_TYPES.length)];
        const cameraAngle = CAMERA_ANGLES[Math.floor(Math.random() * CAMERA_ANGLES.length)];
        const lighting = LIGHTING_TYPES[Math.floor(Math.random() * LIGHTING_TYPES.length)];

        const mainCharacter = characters[0]?.name || '主角';
        const prompt = this.buildShotPrompt(scene, shotType, cameraAngle, lighting, mainCharacter);

        frames.push({
          id: `frame-${i}-${j}`,
          sceneId: scene.id || `scene-${i}`,
          shotNumber: shotNumber++,
          shotType,
          cameraAngle,
          lighting,
          description: scene.description || '场景描述',
          prompt,
          duration: 3 + Math.random() * 5,
        });
      }
    }

    this.reportProgress(80, '正在保存分镜...');
    context.setVariable('frames', frames);
    context.setVariable('totalFrames', frames.length);

    logger.success(`[StoryboardStep] Generated ${frames.length} frames`);

    return { frames, totalFrames: frames.length };
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    if (result && typeof result === 'object' && 'frames' in (result as Record<string, unknown>)) {
      return { framesProcessed: (result as { frames: unknown[] }).frames.length };
    }
    return {};
  }

  private buildShotPrompt(
    scene: { title: string; description: string },
    shotType: string,
    cameraAngle: string,
    lighting: string,
    mainCharacter: string
  ): string {
    return `${mainCharacter}, ${shotType} shot, ${cameraAngle}, ${lighting}, ${scene.description || scene.title}, high detail, 8k`;
  }
}

// ========== 工厂函数 ==========

export function createStoryboardStep(config?: Partial<PipelineStep>): StoryboardStep {
  return new StoryboardStep(config);
}

export default StoryboardStep;
