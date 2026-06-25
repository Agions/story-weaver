import { createMockStepContext } from '@/__tests__/fixtures';

import { PipelineStepId, StepStatus } from '../../core/pipeline/pipeline.types';
import {
  CompositionStep,
  createCompositionStep,
  type CompositionOutput,
} from '../../core/pipeline/step-composition';

// Mock the video compositor service at module level
jest.mock('../../core/services/video/video-compositor.service', () => ({
  videoCompositorService: {
    composeVideo: jest.fn().mockResolvedValue({
      outputPath: 'mock://output.mp4',
      duration: 10,
      width: 1920,
      height: 1080,
      fileSize: 1024000,
    }),
    addSubtitles: jest.fn().mockResolvedValue({
      outputPath: 'mock://output_with_subtitles.mp4',
      duration: 10,
      width: 1920,
      height: 1080,
      fileSize: 1024000,
    }),
  },
}));

describe('CompositionStep', () => {
  describe('constructor', () => {
    it('should have correct default stepId', () => {
      const step = new CompositionStep();
      expect(step.stepId).toBe(PipelineStepId.COMPOSITION);
    });

    it('should apply custom retry policy', () => {
      const step = new CompositionStep({
        retryPolicy: {
          maxRetries: 5,
          initialDelayMs: 2000,
          backoffMultiplier: 2.5,
          maxDelayMs: 45000,
        },
      });
      expect(step.retryPolicy.maxRetries).toBe(5);
      expect(step.retryPolicy.initialDelayMs).toBe(2000);
    });

    it('should use custom id and name', () => {
      const step = new CompositionStep({
        id: 'custom-composition',
        name: 'Custom Composition Step',
      });
      expect(step.id).toBe('custom-composition');
      expect(step.name).toBe('Custom Composition Step');
    });

    it('should have correct dependencies', () => {
      const step = new CompositionStep();
      expect(step.dependencies).toContain(PipelineStepId.RENDER);
    });
  });

  describe('execute', () => {
    it('should fail when no rendered frames available', async () => {
      const step = new CompositionStep();
      const variables = new Map<string, unknown>();
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.COMPOSITION,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.FAILED);
      expect(result.error).toContain('No rendered frames to compose');
    });

    it('should compose video from rendered frames', async () => {
      const step = new CompositionStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [
        { frameId: 'f1', imageUrl: '/img/frame1.jpg' },
        { frameId: 'f2', imageUrl: '/img/frame2.jpg' },
        { frameId: 'f3', imageUrl: '/img/frame3.jpg' },
      ]);
      variables.set('subtitles', [
        { start: 0, end: 3, text: 'First line' },
        { start: 5, end: 8, text: 'Second line' },
      ]);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.COMPOSITION,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      expect(result.data).toMatchObject({
        format: 'mp4',
        resolution: '1920x1080',
      });
    });

    it('should calculate correct duration from frames', async () => {
      const step = new CompositionStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [
        { frameId: 'f1', imageUrl: '/img/frame1.jpg' },
        { frameId: 'f2', imageUrl: '/img/frame2.jpg' },
      ]);
      variables.set('subtitles', []);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.COMPOSITION,
        context: context as any,
      };

      const result = await step.execute(input);
      // Each frame defaults to 5s duration in CompositionStep
      expect((result.data as any).duration).toBeGreaterThanOrEqual(10);
    });

    it('should set composedVideoUrl in context on success', async () => {
      const step = new CompositionStep();
      const variables = new Map<string, unknown>();
      let savedUrl: any = null;
      variables.set('renderedFrames', [{ frameId: 'f1', imageUrl: '/img/frame1.jpg' }]);
      variables.set('subtitles', []);

      const context = createMockStepContext(variables);
      context.setVariable = <T>(_key: string, value: T) => {
        savedUrl = value;
      };

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.COMPOSITION,
        context: context as any,
      };

      await step.execute(input);
      expect(typeof savedUrl).toBe('string');
      expect(savedUrl.length).toBeGreaterThan(0);
    });

    it('should pass quality gate on success', async () => {
      const step = new CompositionStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [{ frameId: 'f1', imageUrl: '/img/frame1.jpg' }]);
      variables.set('subtitles', []);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.COMPOSITION,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.qualityGate).toBe('pass');
    });

    it('should track framesProcessed in metrics', async () => {
      const step = new CompositionStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [
        { frameId: 'f1', imageUrl: '/img/frame1.jpg' },
        { frameId: 'f2', imageUrl: '/img/frame2.jpg' },
        { frameId: 'f3', imageUrl: '/img/frame3.jpg' },
        { frameId: 'f4', imageUrl: '/img/frame4.jpg' },
      ]);
      variables.set('subtitles', []);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.COMPOSITION,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.metrics?.framesProcessed).toBe(4);
    });

    it('should complete successfully with valid frames', async () => {
      const step = new CompositionStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [{ frameId: 'f1', imageUrl: '/img/frame1.jpg' }]);
      variables.set('subtitles', []);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.COMPOSITION,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
    });

    it('should handle empty subtitles array', async () => {
      const step = new CompositionStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [{ frameId: 'f1', imageUrl: '/img/frame1.jpg' }]);
      variables.set('subtitles', []);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.COMPOSITION,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
    });
  });

  describe('createCompositionStep factory', () => {
    it('should create CompositionStep instance with defaults', () => {
      const step = createCompositionStep();
      expect(step).toBeInstanceOf(CompositionStep);
      expect(step.stepId).toBe(PipelineStepId.COMPOSITION);
    });

    it('should create CompositionStep with custom config', () => {
      const step = createCompositionStep({
        id: 'my-composition',
        name: 'My Composition',
      });
      expect(step.id).toBe('my-composition');
      expect(step.name).toBe('My Composition');
    });
  });
});

describe('CompositionOutput type', () => {
  it('should have correct shape', () => {
    const output: CompositionOutput = {
      videoUrl: 'https://example.com/output.mp4',
      duration: 120,
      format: 'mp4',
      resolution: '1920x1080',
      fileSize: 52428800,
    };

    expect(output.videoUrl).toBe('https://example.com/output.mp4');
    expect(output.duration).toBe(120);
    expect(output.format).toBe('mp4');
    expect(output.resolution).toBe('1920x1080');
    expect(output.fileSize).toBe(52428800);
  });

  it('should support webm format', () => {
    const output: CompositionOutput = {
      videoUrl: 'https://example.com/output.webm',
      duration: 90,
      format: 'webm',
      resolution: '1920x1080',
    };

    expect(output.format).toBe('webm');
  });

  it('should allow optional fileSize', () => {
    const output: CompositionOutput = {
      videoUrl: 'https://example.com/output.mp4',
      duration: 60,
      format: 'mp4',
      resolution: '1920x1080',
    };

    expect(output.fileSize).toBeUndefined();
  });
});
