/**
 * Pipeline 步骤：合成与导出 (Composition & Export)
 *
 * 视频合成、字幕添加、音频混音
 */

import { videoCompositorService } from '@/core/services/video/video-compositor-service';

import { BasePipelineStep } from './base-pipeline-step';
import type { StepInput } from './pipeline-types';
import { PipelineStepId } from './pipeline-types';
import { getContext } from './step-helpers';

export interface CompositionOutput {
  videoUrl: string;
  duration: number;
  format: 'mp4' | 'webm';
  resolution: string;
  fileSize?: number;
}

export class CompositionStep extends BasePipelineStep {
  readonly stepId = PipelineStepId.COMPOSITION;
  readonly dependencies = [PipelineStepId.RENDER];

  constructor() {
    super({
      id: 'step-composition',
      name: '视频合成',
      stepId: PipelineStepId.COMPOSITION,
      retryPolicy: {
        maxRetries: 3,
        initialDelayMs: 5000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
      },
    });
  }

  protected async executeImpl(input: StepInput): Promise<CompositionOutput> {
    const context = getContext(input)!;

    const renderedFrames =
      context.getVariable<Array<{ frameId: string; imageUrl: string }>>('renderedFrames') ?? [];

    if (renderedFrames.length === 0) {
      throw new Error('No rendered frames to compose');
    }

    this.reportProgress(10, '正在构建场景序列...');

    const scenes = renderedFrames.map((frame, idx) => ({
      id: frame.frameId,
      mediaPath: frame.imageUrl,
      mediaType: 'image' as const,
      startTime: idx * 5,
      duration: 5,
    }));

    this.reportProgress(30, '正在合成视频...');

    const result = await videoCompositorService.compose(scenes, { format: 'mp4' });

    this.reportProgress(90, '合成完成');

    context.setVariable('composedVideoUrl', result.outputPath);

    return {
      videoUrl: result.outputPath || '',
      duration: result.duration || scenes.length * 5,
      format: 'mp4',
      resolution: '1920x1080',
    };
  }

  protected override computeMetrics(result: CompositionOutput) {
    return {
      framesProcessed: Math.round(result.duration / 5),
    };
  }
}

export function createCompositionStep(): CompositionStep {
  return new CompositionStep();
}

export default CompositionStep;
