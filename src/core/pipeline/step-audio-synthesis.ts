import { logger } from '@/core/utils/logger';

import { BasePipelineStep } from './base-pipeline-step';
import { PipelineStepId, PipelineStep, StepInput } from './pipeline.types';

export interface AudioSynthesisOutput {
  dialogueAudio: Array<{ audioUrl: string; duration: number; speakerId: string }>;
  selectedBgm: string;
  totalAudioDuration: number;
}

// ========== AudioSynthesisStep 实现 ==========

export class AudioSynthesisStep extends BasePipelineStep {
  constructor(config?: Partial<PipelineStep>) {
    super({
      ...config,
      id: config?.id ?? 'step-audio-synthesis',
      name: config?.name ?? '音频合成',
      stepId: config?.stepId ?? PipelineStepId.AUDIO_SYNTHESIS,
      dependencies: config?.dependencies ?? [PipelineStepId.SCRIPT],
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = input.context;
    logger.info(`[AudioSynthesisStep] Starting audio synthesis for workflow ${input.workflowId}`);

    const scriptOutput = context.getVariable<{
      scenes: Array<{
        dialogue?: Array<{ speaker: string; text: string; emotion?: string }>;
      }>;
    }>('scriptOutput');

    const selectedBgm = context.getVariable<string>('selectedBgm') ?? '';

    const dialogueAudio: AudioSynthesisOutput['dialogueAudio'] = [];
    if (scriptOutput?.scenes) {
      for (let i = 0; i < scriptOutput.scenes.length; i++) {
        const scene = scriptOutput.scenes[i];
        if (scene.dialogue && scene.dialogue.length > 0) {
          for (const line of scene.dialogue) {
            const charCount = line.text.length;
            const estimatedDuration = Math.max(1, charCount / 5);
            dialogueAudio.push({
              audioUrl: `tts://scene_${i}/${line.speaker}`,
              duration: estimatedDuration,
              speakerId: line.speaker,
            });
          }
        }
      }
    }

    this.reportProgress(50, '音频合成完成');

    const totalAudioDuration = dialogueAudio.reduce((sum, a) => sum + a.duration, 0);

    context.setVariable('dialogueAudio', dialogueAudio);
    context.setVariable('totalAudioDuration', totalAudioDuration);

    logger.success(
      `[AudioSynthesisStep] Audio synthesis completed: ${dialogueAudio.length} clips, ${totalAudioDuration.toFixed(1)}s`
    );

    return {
      dialogueAudio,
      selectedBgm,
      totalAudioDuration,
    } as AudioSynthesisOutput;
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    return this.computeCountMetric(result, 'dialogueAudio');
  }
}

// ========== 工厂函数 ==========

export function createAudioSynthesisStep(config?: Partial<PipelineStep>): AudioSynthesisStep {
  return new AudioSynthesisStep(config);
}

export default AudioSynthesisStep;
