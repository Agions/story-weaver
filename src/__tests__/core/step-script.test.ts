import {
  PipelineStepId,
  StepStatus,
  QualityGateDecision,
} from '../../core/pipeline/pipeline-types';
import {
  ScriptStep,
  createScriptStep,
  type ScriptOutput,
  type ImportOutput,
} from '../../core/pipeline/step-script';

// Mock aiService
jest.mock('@/core/services/ai/text/ai-service', () => ({
  aiService: {
    generate: jest.fn(),
  },
}));

import { aiService } from '@/core/services/ai/text/ai-service';
import { createMockStepContext } from '@/__tests__/fixtures';

describe('ScriptStep', () => {
  const mockAiService = aiService as jest.Mocked<typeof aiService>;

  // Sample chapters data
  const mockChapters: ImportOutput['chapters'] = [
    {
      id: 'ch1',
      title: '第一章 起始',
      content: '张三分李四王五赵六来到一个新的地方。这里是第一章的内容。',
      wordCount: 100,
    },
    {
      id: 'ch2',
      title: '第二章 发展',
      content: '第二幕开始，孙七周八在这里相遇。',
      wordCount: 80,
    },
  ];

  const mockMetadata: ImportOutput['metadata'] = {
    title: 'Test Novel',
    sourceType: 'novel',
    language: 'zh',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should have correct default stepId', () => {
      const step = new ScriptStep();
      expect(step.stepId).toBe(PipelineStepId.SCRIPT);
    });

    it('should have correct default values', () => {
      const step = new ScriptStep();
      expect(step.id).toBe('step-script');
      expect(step.name).toBe('剧本生成');
      expect(step.mode).toBe('sequence');
      expect(step.dependencies).toEqual([PipelineStepId.IMPORT, PipelineStepId.ANALYSIS]);
    });

    it('should apply custom retry policy', () => {
      const step = new ScriptStep({
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

    it('should use custom model and provider', () => {
      const step = new ScriptStep({
        model: 'gpt-4',
        provider: 'openai',
      });
      // Model and provider are private, but execute uses them
      expect(step).toBeInstanceOf(ScriptStep);
    });

    it('should use custom id and name', () => {
      const step = new ScriptStep({ id: 'custom-script', name: 'Custom Script Step' });
      expect(step.id).toBe('custom-script');
      expect(step.name).toBe('Custom Script Step');
    });
  });

  describe('execute', () => {
    it('should fail when no chapters available', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.FAILED);
      expect(result.error).toContain('No content to generate script from');
    });

    it('should fail when chapters array is empty', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', []);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.FAILED);
      expect(result.error).toContain('No content to generate script from');
    });

    it('should complete successfully with valid chapters', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      variables.set('analysisResult', { metadata: mockMetadata });
      const context = createMockStepContext(variables);

      mockAiService.generate.mockResolvedValue(
        JSON.stringify({
          title: '测试剧本',
          scenes: [
            {
              id: 'scene-1',
              title: '开场',
              description: '主角出现在新环境中',
              dialogue: '你好世界',
              duration: 30,
              shots: 2,
            },
          ],
        })
      );

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      expect(result.stepId).toBe(PipelineStepId.SCRIPT);
      expect(result.qualityGate).toBe(QualityGateDecision.PASS);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
    });

    it('should set scriptOutput and scenes in context', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      variables.set('analysisResult', { metadata: mockMetadata });
      const context = createMockStepContext(variables);

      let capturedKey = '';
      let capturedValue: any;
      context.setVariable = <T>(_key: string, _value: T) => {
        capturedKey = _key as string;
        capturedValue = _value;
      };

      mockAiService.generate.mockResolvedValue(
        JSON.stringify({
          title: '测试剧本',
          scenes: [],
        })
      );

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      await step.execute(input);
      // setVariable is called twice - once for scriptOutput, once for scenes
      expect(['scriptOutput', 'scenes']).toContain(capturedKey);
      expect(capturedValue).toBeDefined();
    });

    it('should call aiService.generate with correct parameters', async () => {
      const step = new ScriptStep({ model: 'custom-model', provider: 'custom-provider' });
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      variables.set('analysisResult', { metadata: mockMetadata });
      const context = createMockStepContext(variables);

      mockAiService.generate.mockResolvedValue(
        JSON.stringify({
          title: '测试剧本',
          scenes: [],
        })
      );

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      await step.execute(input);
      expect(mockAiService.generate).toHaveBeenCalledWith(expect.any(String), {
        model: 'custom-model',
        provider: 'custom-provider',
        max_tokens: 8192,
      });
    });

    it('should report progress during execution', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      const progressEvents: Array<{ progress: number; message: string }> = [];
      step.onProgress = (event) => {
        progressEvents.push({ progress: event.progress, message: event.message });
      };

      mockAiService.generate.mockResolvedValue(
        JSON.stringify({
          title: '测试剧本',
          scenes: [],
        })
      );

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      await step.execute(input);
      expect(progressEvents).toContainEqual({ progress: 10, message: '正在构建剧本生成提示词...' });
      expect(progressEvents).toContainEqual({ progress: 30, message: '正在生成剧本结构...' });
      expect(progressEvents).toContainEqual({ progress: 70, message: '正在解析生成结果...' });
      expect(progressEvents).toContainEqual({ progress: 90, message: '剧本生成完成' });
    });

    it('should return correct metrics', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      mockAiService.generate.mockResolvedValue(
        JSON.stringify({
          title: '测试剧本',
          scenes: [],
        })
      );

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.metrics).toBeDefined();
      expect(result.metrics!.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.retryCount).toBe(0);
    });

    it('should handle aiService error gracefully', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      mockAiService.generate.mockRejectedValue(new Error('AI service unavailable'));

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.FAILED);
      expect(result.error).toBe('AI service unavailable');
    });

    it('should parse JSON response correctly', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      mockAiService.generate.mockResolvedValue(
        JSON.stringify({
          title: '测试剧本标题',
          scenes: [
            {
              id: 'scene-1',
              title: '开场场景',
              description: '主角登场',
              dialogue: '你好',
              narration: '旁白内容',
              duration: 45,
              shots: 3,
            },
            {
              id: 'scene-2',
              title: '发展场景',
              description: '剧情推进',
              dialogue: '继续',
              duration: 60,
              shots: 4,
            },
          ],
        })
      );

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      const data = result.data as ScriptOutput;
      expect(data.title).toBe('测试剧本标题');
      expect(data.scenes).toHaveLength(2);
      expect(data.scenes[0].id).toBe('scene-1');
      expect(data.scenes[0].title).toBe('开场场景');
      expect(data.totalDuration).toBe(105); // 45 + 60
    });

    it('should use fallback parsing when JSON parse fails', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      // Return content that cannot be parsed as JSON but has colon separators
      mockAiService.generate.mockResolvedValue('场景一：这是描述\n场景二：另一个描述');

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      const data = result.data as ScriptOutput;
      expect(data.scenes).toHaveLength(2);
      expect(data.scenes[0].description).toContain('场景一');
    });

    it('should calculate totalDuration from scenes', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      mockAiService.generate.mockResolvedValue(
        JSON.stringify({
          title: '时长测试剧本',
          scenes: [
            { id: 's1', title: '场景1', description: 'desc', dialogue: '', duration: 30, shots: 1 },
            { id: 's2', title: '场景2', description: 'desc', dialogue: '', duration: 60, shots: 2 },
            { id: 's3', title: '场景3', description: 'desc', dialogue: '', duration: 45, shots: 3 },
          ],
        })
      );

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as ScriptOutput;
      expect(data.totalDuration).toBe(135); // 30 + 60 + 45
    });

    it('should use default duration when scene duration is missing', async () => {
      const step = new ScriptStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      mockAiService.generate.mockResolvedValue(
        JSON.stringify({
          title: '默认时长测试',
          scenes: [
            { id: 's1', title: '场景1', description: 'desc', dialogue: '' }, // no duration
            { id: 's2', title: '场景2', description: 'desc', dialogue: '', duration: 60 },
          ],
        })
      );

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.SCRIPT,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as ScriptOutput;
      // First scene uses default 30, second uses 60
      expect(data.totalDuration).toBe(90);
    });
  });

  describe('createScriptStep factory', () => {
    it('should create ScriptStep instance with defaults', () => {
      const step = createScriptStep();
      expect(step).toBeInstanceOf(ScriptStep);
      expect(step.stepId).toBe(PipelineStepId.SCRIPT);
    });

    it('should create ScriptStep with custom config', () => {
      const step = createScriptStep({
        id: 'my-script',
        name: 'My Script',
      });
      expect(step.id).toBe('my-script');
      expect(step.name).toBe('My Script');
    });
  });
});
