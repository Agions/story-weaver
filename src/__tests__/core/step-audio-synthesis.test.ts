import {
  PipelineStepId,
  StepStatus,
  QualityGateDecision,
} from '../../core/pipeline/pipeline.types';
import {
  AudioSynthesisStep,
  createAudioSynthesisStep,
  type AudioSynthesisOutput,
} from '../../core/pipeline/step-audio-synthesis';
import { createMockStepContext } from '../utils/mock-context';

describe('AudioSynthesisStep', () => {
  describe('constructor', () => {
    it('should have correct default stepId', () => {
      const step = new AudioSynthesisStep();
      expect(step.stepId).toBe(PipelineStepId.AUDIO_SYNTHESIS);
    });

    it('should have correct default mode', () => {
      const step = new AudioSynthesisStep();
      expect(step.mode).toBe('sequence');
    });

    it('should have correct default dependencies', () => {
      const step = new AudioSynthesisStep();
      expect(step.dependencies).toEqual([PipelineStepId.SCRIPT]);
    });

    it('should apply custom retry policy', () => {
      const step = new AudioSynthesisStep({
        retryPolicy: {
          maxRetries: 5,
          initialDelayMs: 1000,
          backoffMultiplier: 3,
          maxDelayMs: 60000,
        },
      });
      expect(step.retryPolicy.maxRetries).toBe(5);
      expect(step.retryPolicy.backoffMultiplier).toBe(3);
    });

    it('should use custom id and name', () => {
      const step = new AudioSynthesisStep({ id: 'custom-audio', name: 'Custom Audio Step' });
      expect(step.id).toBe('custom-audio');
      expect(step.name).toBe('Custom Audio Step');
    });
  });

  describe('execute', () => {
    it('should complete successfully with dialogue data', async () => {
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [
          {
            dialogue: [
              { speaker: 'Alice', text: 'Hello, how are you?', emotion: 'happy' },
              { speaker: 'Bob', text: 'I am fine.', emotion: 'neutral' },
            ],
          },
          {
            dialogue: [{ speaker: 'Alice', text: 'Great!', emotion: 'excited' }],
          },
        ],
      });
      variables.set('selectedBgm', 'bgm_track_01.mp3');

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-test-001',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      const result = await step.execute(input);

      expect(result.status).toBe(StepStatus.COMPLETED);
      expect(result.stepId).toBe(PipelineStepId.AUDIO_SYNTHESIS);
      expect(result.qualityGate).toBe(QualityGateDecision.PASS);
      expect(result.data).toBeDefined();

      const output = result.data as AudioSynthesisOutput;
      expect(output.dialogueAudio).toHaveLength(3);
      expect(output.selectedBgm).toBe('bgm_track_01.mp3');
      expect(output.totalAudioDuration).toBeGreaterThan(0);

      // Verify audio clip structure
      expect(output.dialogueAudio[0]).toEqual({
        audioUrl: 'tts://scene_0/Alice',
        duration: expect.any(Number),
        speakerId: 'Alice',
      });
    });

    it('should calculate duration based on character count (5 chars/second)', async () => {
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [
          {
            dialogue: [
              { speaker: 'Test', text: 'Hello' }, // 5 chars = 1 second
            ],
          },
        ],
      });

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-duration-test',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const output = result.data as AudioSynthesisOutput;

      // 'Hello' = 5 chars, duration = 5/5 = 1 second
      expect(output.dialogueAudio[0].duration).toBe(1);
    });

    it('should enforce minimum duration of 1 second', async () => {
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [
          {
            dialogue: [
              { speaker: 'Test', text: 'Hi' }, // 2 chars = 0.4s, should be min 1
            ],
          },
        ],
      });

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-min-duration',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const output = result.data as AudioSynthesisOutput;

      expect(output.dialogueAudio[0].duration).toBe(1);
    });

    it('should handle empty scenes', async () => {
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [],
      });

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-empty-scenes',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      const result = await step.execute(input);

      expect(result.status).toBe(StepStatus.COMPLETED);
      const output = result.data as AudioSynthesisOutput;
      expect(output.dialogueAudio).toHaveLength(0);
      expect(output.totalAudioDuration).toBe(0);
    });

    it('should handle scenes without dialogue', async () => {
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [{ description: 'Scene without dialogue' }, { dialogue: [] }],
      });

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-no-dialogue',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      const result = await step.execute(input);

      expect(result.status).toBe(StepStatus.COMPLETED);
      const output = result.data as AudioSynthesisOutput;
      expect(output.dialogueAudio).toHaveLength(0);
    });

    it('should handle missing selectedBgm', async () => {
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [
          {
            dialogue: [{ speaker: 'Alice', text: 'Hello' }],
          },
        ],
      });
      // selectedBgm not set

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-no-bgm',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      const result = await step.execute(input);

      expect(result.status).toBe(StepStatus.COMPLETED);
      const output = result.data as AudioSynthesisOutput;
      expect(output.selectedBgm).toBe('');
    });

    it('should handle missing scriptOutput', async () => {
      const variables = new Map<string, unknown>();
      // scriptOutput not set

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-no-script',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      const result = await step.execute(input);

      expect(result.status).toBe(StepStatus.COMPLETED);
      const output = result.data as AudioSynthesisOutput;
      expect(output.dialogueAudio).toHaveLength(0);
      expect(output.totalAudioDuration).toBe(0);
    });

    it('should report progress during execution', async () => {
      const progressEvents: Array<{ stepId: string; progress: number; message: string }> = [];
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [
          {
            dialogue: [{ speaker: 'Alice', text: 'Hello world' }],
          },
        ],
      });

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();
      step.onProgress = (event) => progressEvents.push(event);

      const input = {
        workflowId: 'wf-progress',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      await step.execute(input);

      expect(progressEvents).toContainEqual({
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        progress: 50,
        message: '音频合成完成',
      });
    });

    it('should include metrics in result', async () => {
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [
          {
            dialogue: [{ speaker: 'Test', text: 'Duration test' }],
          },
        ],
      });

      const context = createMockStepContext(variables);
      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-metrics',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      const result = await step.execute(input);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.startTime).toBeLessThanOrEqual(result.endTime);
    });

    it('should return failed status on error', async () => {
      const variables = new Map<string, unknown>();
      // Create a context that throws when accessing getVariable
      const errorContext = {
        getVariable: <T>(_key: string) => {
          throw new Error('Context access error');
        },
        setVariable: <T>(_key: string, _value: T) => {},
        log: () => {},
        getCheckpoint: () => undefined,
        saveCheckpoint: () => {},
        emit: () => {},
      };

      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-error',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: errorContext as any,
      };

      const result = await step.execute(input);

      expect(result.status).toBe(StepStatus.FAILED);
      expect(result.error).toBe('Context access error');
      expect(result.data).toBeUndefined();
    });

    it('should set context variables for downstream steps', async () => {
      const variables = new Map<string, unknown>();
      variables.set('scriptOutput', {
        scenes: [
          {
            dialogue: [{ speaker: 'Alice', text: 'Test message' }],
          },
        ],
      });

      const setVariables: Array<{ key: string; value: unknown }> = [];
      const context = createMockStepContext(variables);
      context.setVariable = (key: string, value: unknown) => {
        setVariables.push({ key, value });
      };

      const step = new AudioSynthesisStep();

      const input = {
        workflowId: 'wf-context',
        stepId: PipelineStepId.AUDIO_SYNTHESIS,
        context: context as any,
      };

      await step.execute(input);

      expect(setVariables).toContainEqual({
        key: 'dialogueAudio',
        value: expect.any(Array),
      });
      expect(setVariables).toContainEqual({
        key: 'totalAudioDuration',
        value: expect.any(Number),
      });
    });
  });

  describe('createAudioSynthesisStep factory', () => {
    it('should create AudioSynthesisStep instance with defaults', () => {
      const step = createAudioSynthesisStep();
      expect(step).toBeInstanceOf(AudioSynthesisStep);
      expect(step.stepId).toBe(PipelineStepId.AUDIO_SYNTHESIS);
    });

    it('should create AudioSynthesisStep with custom config', () => {
      const step = createAudioSynthesisStep({
        id: 'my-audio-synthesis',
        name: 'My Audio Synthesis',
      });
      expect(step.id).toBe('my-audio-synthesis');
      expect(step.name).toBe('My Audio Synthesis');
    });
  });
});

describe('AudioSynthesisOutput type', () => {
  it('should have correct shape', () => {
    const output: AudioSynthesisOutput = {
      dialogueAudio: [
        { audioUrl: 'tts://scene_0/Alice', duration: 2.5, speakerId: 'Alice' },
        { audioUrl: 'tts://scene_0/Bob', duration: 1.8, speakerId: 'Bob' },
      ],
      selectedBgm: 'bgm_peaceful.mp3',
      totalAudioDuration: 4.3,
    };

    expect(output.dialogueAudio).toHaveLength(2);
    expect(output.selectedBgm).toBe('bgm_peaceful.mp3');
    expect(output.totalAudioDuration).toBe(4.3);
    expect(output.dialogueAudio[0].audioUrl).toBe('tts://scene_0/Alice');
    expect(output.dialogueAudio[0].duration).toBe(2.5);
    expect(output.dialogueAudio[0].speakerId).toBe('Alice');
  });

  it('should allow empty dialogueAudio', () => {
    const output: AudioSynthesisOutput = {
      dialogueAudio: [],
      selectedBgm: '',
      totalAudioDuration: 0,
    };

    expect(output.dialogueAudio).toHaveLength(0);
    expect(output.totalAudioDuration).toBe(0);
  });
});
