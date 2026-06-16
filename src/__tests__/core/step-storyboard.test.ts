import {
  PipelineStepId,
  StepStatus,
  QualityGateDecision,
  PipelineExecutionMode,
} from '../../core/pipeline/pipeline.types';
import {
  StoryboardStep,
  createStoryboardStep,
  type StoryboardOutput,
} from '../../core/pipeline/step-storyboard';
import { createMockStepContext } from '../utils/mock-context';

describe('StoryboardStep', () => {
  // Sample scenes data
  const mockScenes = [
    { id: 'scene-1', title: '开场', description: '主角站在城市天际线上' },
    { id: 'scene-2', title: '相遇', description: '两个角色在咖啡馆交谈' },
  ];

  // Sample characters data
  const mockCharacters = [
    { name: '张三', appearance: { hair: '黑色', eyes: '棕色' } },
    { name: '李四', appearance: { hair: '金色', eyes: '蓝色' } },
  ];

  describe('constructor', () => {
    it('should have correct default stepId', () => {
      const step = new StoryboardStep();
      expect(step.stepId).toBe(PipelineStepId.STORYBOARD);
    });

    it('should have correct default values', () => {
      const step = new StoryboardStep();
      expect(step.id).toBe('step-storyboard');
      expect(step.name).toBe('分镜设计');
      expect(step.mode).toBe(PipelineExecutionMode.SEQUENCE);
      expect(step.dependencies).toEqual([PipelineStepId.SCRIPT, PipelineStepId.CHARACTER]);
    });

    it('should apply custom retry policy', () => {
      const step = new StoryboardStep({
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
      const step = new StoryboardStep({ id: 'custom-storyboard', name: 'Custom Storyboard Step' });
      expect(step.id).toBe('custom-storyboard');
      expect(step.name).toBe('Custom Storyboard Step');
    });
  });

  describe('execute', () => {
    it('should complete successfully with valid scenes and characters', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      expect(result.stepId).toBe(PipelineStepId.STORYBOARD);
      expect(result.qualityGate).toBe(QualityGateDecision.PASS);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
    });

    it('should generate frames for each scene', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as StoryboardOutput;

      // Each scene should have 2-4 frames
      expect(data.frames.length).toBeGreaterThanOrEqual(4); // 2 scenes * minimum 2 shots
      expect(data.frames.length).toBeLessThanOrEqual(8); // 2 scenes * maximum 4 shots
      expect(data.totalFrames).toBe(data.frames.length);
    });

    it('should set frames and totalFrames in context', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const calls: Array<{ key: string; value: unknown }> = [];
      context.setVariable = <T>(key: string, value: T) => {
        calls.push({ key, value });
      };

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      await step.execute(input);
      expect(calls).toContainEqual({ key: 'frames', value: expect.any(Array) });
      expect(calls).toContainEqual({ key: 'totalFrames', value: expect.any(Number) });
    });

    it('should report progress during execution', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const progressEvents: Array<{ progress: number; message: string }> = [];
      step.onProgress = (event) => {
        progressEvents.push({ progress: event.progress, message: event.message });
      };

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      await step.execute(input);
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0].progress).toBe(10);
      expect(progressEvents[progressEvents.length - 1].progress).toBe(80);
    });

    it('should return correct metrics', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.metrics).toBeDefined();
      expect(result.metrics!.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics!.framesProcessed).toBeDefined();
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.retryCount).toBe(0);
    });

    it('should handle empty scenes array', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', []);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      const data = result.data as StoryboardOutput;
      expect(data.frames).toHaveLength(0);
      expect(data.totalFrames).toBe(0);
    });

    it('should handle missing characters', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      // No characters set
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      const data = result.data as StoryboardOutput;
      // Should use default character name '主角'
      expect(data.frames.length).toBeGreaterThan(0);
    });

    it('should handle undefined scenes and characters', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      // Neither scenes nor characters set
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      const data = result.data as StoryboardOutput;
      expect(data.frames).toHaveLength(0);
    });

    it('should generate frames with valid shot properties', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as StoryboardOutput;

      const shotTypes = ['ECU', 'CU', 'MCU', 'MS', 'WS', 'EWS'];
      const cameraAngles = ['仰拍', '俯拍', '平拍', '侧拍'];
      const lightingTypes = ['顺光', '侧光', '逆光', '顶光'];

      for (const frame of data.frames) {
        expect(frame.id).toBeDefined();
        expect(frame.sceneId).toBeDefined();
        expect(frame.shotNumber).toBeGreaterThan(0);
        expect(shotTypes).toContain(frame.shotType);
        expect(cameraAngles).toContain(frame.cameraAngle);
        expect(lightingTypes).toContain(frame.lighting);
        expect(frame.description).toBeDefined();
        expect(frame.prompt).toBeDefined();
        expect(frame.duration).toBeGreaterThan(0);
      }
    });

    it('should increment shot numbers sequentially', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as StoryboardOutput;

      for (let i = 0; i < data.frames.length; i++) {
        expect(data.frames[i].shotNumber).toBe(i + 1);
      }
    });

    it('should include scene id in each frame', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as StoryboardOutput;

      // All frames from scene-1 should have sceneId = 'scene-1'
      const scene1Frames = data.frames.filter((f) => f.sceneId === 'scene-1');
      const scene2Frames = data.frames.filter((f) => f.sceneId === 'scene-2');

      expect(scene1Frames.length).toBeGreaterThan(0);
      expect(scene2Frames.length).toBeGreaterThan(0);
    });

    it('should build prompt with main character name', async () => {
      const step = new StoryboardStep();
      const variables = new Map<string, unknown>();
      variables.set('scenes', mockScenes);
      variables.set('characters', mockCharacters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as StoryboardOutput;

      // Prompt should contain the main character's name
      for (const frame of data.frames) {
        expect(frame.prompt).toContain('张三');
      }
    });

    it('should return FAILED status on error', async () => {
      const step = new StoryboardStep();
      // Pass invalid context that throws
      const context = {
        getVariable: <T>(_key: string) => {
          throw new Error('Context error');
        },
        setVariable: <T>(_key: string, _value: T) => {},
        log: () => {},
        getCheckpoint: () => undefined,
        saveCheckpoint: () => {},
        emit: () => {},
      };

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.STORYBOARD,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.FAILED);
      expect(result.error).toBe('Context error');
    });
  });

  describe('createStoryboardStep factory', () => {
    it('should create StoryboardStep instance with defaults', () => {
      const step = createStoryboardStep();
      expect(step).toBeInstanceOf(StoryboardStep);
      expect(step.stepId).toBe(PipelineStepId.STORYBOARD);
    });

    it('should create StoryboardStep with custom config', () => {
      const step = createStoryboardStep({
        id: 'my-storyboard',
        name: 'My Storyboard',
      });
      expect(step.id).toBe('my-storyboard');
      expect(step.name).toBe('My Storyboard');
    });
  });
});
