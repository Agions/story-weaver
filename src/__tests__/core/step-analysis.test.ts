import { createMockStepContext } from '@/__tests__/fixtures';

import {
  PipelineStepId,
  StepStatus,
  QualityGateDecision,
} from '../../core/pipeline/pipeline-types';
import {
  AnalysisStep,
  createAnalysisStep,
  type ImportOutput,
} from '../../core/pipeline/step-analysis';

describe('AnalysisStep', () => {
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

  describe('constructor', () => {
    it('should have correct default stepId', () => {
      const step = new AnalysisStep();
      expect(step.stepId).toBe(PipelineStepId.ANALYSIS);
    });

    it('should have correct default values', () => {
      const step = new AnalysisStep();
      expect(step.id).toBe('step-analysis');
      expect(step.name).toBe('AI分析');
      expect(step.mode).toBe('sequence');
      expect(step.dependencies).toEqual([PipelineStepId.IMPORT]);
    });

    it('should apply custom retry policy', () => {
      const step = new AnalysisStep({
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
      const step = new AnalysisStep({ id: 'custom-analysis', name: 'Custom Analysis Step' });
      expect(step.id).toBe('custom-analysis');
      expect(step.name).toBe('Custom Analysis Step');
    });
  });

  describe('execute', () => {
    it('should fail when no chapters available', async () => {
      const step = new AnalysisStep();
      const variables = new Map<string, unknown>();
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.FAILED);
      expect(result.error).toContain('No chapters to analyze');
    });

    it('should fail when chapters array is empty', async () => {
      const step = new AnalysisStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', []);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.FAILED);
      expect(result.error).toContain('No chapters to analyze');
    });

    it('should complete successfully with valid chapters', async () => {
      const step = new AnalysisStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      variables.set('projectMetadata', mockMetadata);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      expect(result.stepId).toBe(PipelineStepId.ANALYSIS);
      expect(result.qualityGate).toBe(QualityGateDecision.PASS);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
    });

    it('should set analysis result in context', async () => {
      const step = new AnalysisStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      variables.set('projectMetadata', mockMetadata);
      const context = createMockStepContext(variables);

      let capturedKey = '';
      let capturedValue: any;
      context.setVariable = <T>(_key: string, _value: T) => {
        capturedKey = _key as string;
        capturedValue = _value;
      };

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      await step.execute(input);
      expect(capturedKey).toBe('estimatedScenes');
      expect(typeof capturedValue).toBe('number');
    });

    it('should report progress during execution', async () => {
      const step = new AnalysisStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      const progressEvents: Array<{ progress: number; message: string }> = [];
      step.onProgress = (event) => {
        progressEvents.push({ progress: event.progress, message: event.message });
      };

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      await step.execute(input);
      expect(progressEvents).toContainEqual({ progress: 20, message: '正在识别角色...' });
      expect(progressEvents).toContainEqual({ progress: 50, message: '正在识别场景...' });
      expect(progressEvents).toContainEqual({ progress: 80, message: '正在生成分析报告...' });
    });

    it('should return correct metrics', async () => {
      const step = new AnalysisStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.metrics).toBeDefined();
      expect(result.metrics!.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.retryCount).toBe(0);
    });

    it('should handle chapters without metadata', async () => {
      const step = new AnalysisStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      // No projectMetadata set
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      const data = result.data as any;
      expect(data.genre).toBe('通用');
      expect(data.language).toBe('zh');
    });

    it('should include chaptersSummary in result', async () => {
      const step = new AnalysisStep();
      const variables = new Map<string, unknown>();
      variables.set('chapters', mockChapters);
      variables.set('projectMetadata', mockMetadata);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as any;
      expect(data.chaptersSummary).toHaveLength(2);
      expect(data.chaptersSummary[0]).toEqual({
        id: 'ch1',
        title: '第一章 起始',
        wordCount: 100,
      });
    });
  });

  describe('estimateCharacterCount', () => {
    it('should identify Chinese names', async () => {
      const step = new AnalysisStep();
      const chapters: ImportOutput['chapters'] = [
        {
          id: 'ch1',
          title: 'Test',
          content: '张三 李四 王五 赵六',
          wordCount: 50,
        },
      ];
      const variables = new Map<string, unknown>();
      variables.set('chapters', chapters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as any;
      // 4 unique names (with spaces between them)
      expect(data.estimatedCharacters).toBe(4);
    });

    it('should identify English names', async () => {
      const step = new AnalysisStep();
      const chapters: ImportOutput['chapters'] = [
        {
          id: 'ch1',
          title: 'Test',
          content: 'John Mary Bob Alice David',
          wordCount: 30,
        },
      ];
      const variables = new Map<string, unknown>();
      variables.set('chapters', chapters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as any;
      expect(data.estimatedCharacters).toBe(5);
    });

    it('should cap at 20 characters', async () => {
      const step = new AnalysisStep();
      // Use distinct names that match the regex patterns
      const names =
        '张三 李四 王五 赵六 孙七 周八 吴九 郑十 沈十 袁十 冯十 陈十 褚十 卫十 蒋十 沈十 韩十 杨十 朱十 秦十 尤十 许十 何十 吕十 施十';
      const chapters: ImportOutput['chapters'] = [
        {
          id: 'ch1',
          title: 'Test',
          content: names,
          wordCount: 100,
        },
      ];
      const variables = new Map<string, unknown>();
      variables.set('chapters', chapters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as any;
      // More than 20 unique names, capped at 20
      expect(data.estimatedCharacters).toBe(20);
    });
  });

  describe('estimateSceneCount', () => {
    it('should count chapter markers', async () => {
      const step = new AnalysisStep();
      const chapters: ImportOutput['chapters'] = [
        {
          id: 'ch1',
          title: 'Test',
          content: '第一章的内容 第二章的内容',
          wordCount: 50,
        },
      ];
      const variables = new Map<string, unknown>();
      variables.set('chapters', chapters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as any;
      // 2 scene markers found
      expect(data.estimatedScenes).toBe(2);
    });

    it('should count section markers', async () => {
      const step = new AnalysisStep();
      const chapters: ImportOutput['chapters'] = [
        {
          id: 'ch1',
          title: 'Test',
          content: '第一幕的场景 第二幕的场景 第三节的内容',
          wordCount: 50,
        },
      ];
      const variables = new Map<string, unknown>();
      variables.set('chapters', chapters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as any;
      // 3 markers: 2 幕, 1 节
      expect(data.estimatedScenes).toBe(3);
    });

    it('should default to 1 scene per chapter if no markers found', async () => {
      const step = new AnalysisStep();
      const chapters: ImportOutput['chapters'] = [
        {
          id: 'ch1',
          title: 'Test',
          content: 'Some content without any markers',
          wordCount: 50,
        },
        {
          id: 'ch2',
          title: 'Test2',
          content: 'More content here',
          wordCount: 40,
        },
      ];
      const variables = new Map<string, unknown>();
      variables.set('chapters', chapters);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.ANALYSIS,
        context: context as any,
      };

      const result = await step.execute(input);
      const data = result.data as any;
      // 2 chapters, 1 scene each = 2
      expect(data.estimatedScenes).toBe(2);
    });
  });

  describe('createAnalysisStep factory', () => {
    it('should create AnalysisStep instance with defaults', () => {
      const step = createAnalysisStep();
      expect(step).toBeInstanceOf(AnalysisStep);
      expect(step.stepId).toBe(PipelineStepId.ANALYSIS);
    });

    it('should create AnalysisStep with custom config', () => {
      const step = createAnalysisStep({
        id: 'my-analysis',
        name: 'My Analysis',
      });
      expect(step.id).toBe('my-analysis');
      expect(step.name).toBe('My Analysis');
    });
  });
});
