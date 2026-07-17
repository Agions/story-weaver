import { PipelineStepId, StepStatus, PipelineExecutionMode, QualityGateDecision } from '../../core/pipeline/pipeline-types';
import { ImportStep, createImportStep, ImportInput } from '../../core/pipeline/step-import';
import { novelService } from '../../core/services/ai/text/novel-service';

// Mock novelService
jest.mock('../../core/services/ai/text/novel-service', () => ({
  novelService: {
    parseNovel: jest.fn(),
  },
}));

// Mock logger to avoid console output
jest.mock('../../core/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ImportStep', () => {
  // Mock context factory - matches PipelineContext interface
  const createMockContext = (importInput?: ImportInput) => {
    const variables = new Map<string, unknown>();
    if (importInput) {
      variables.set('importInput', importInput);
    }
    return {
      workflowId: 'test-workflow-123',
      variables,
      getVariable: <T>(key: string): T | undefined => {
        if (key === 'importInput' && importInput) return importInput as unknown as T;
        return variables.get(key) as T | undefined;
      },
      setVariable: <T>(key: string, value: T) => variables.set(key, value),
      log: jest.fn(),
      getCheckpoint: () => undefined,
      saveCheckpoint: () => {},
      emit: () => {},
    };
  };

  const createStepInput = (context: ReturnType<typeof createMockContext>) => ({
    workflowId: 'test-workflow-123',
    stepId: PipelineStepId.IMPORT,
    prevStepOutputs: new Map(),
    context,
    checkpoint: undefined,
  });

  const mockNovelParseResult = {
    title: 'Test Novel',
    author: 'Test Author',
    summary: 'A test novel',
    characters: [],
    chapters: [
      { id: 'ch-1', title: '第1章', content: 'Content 1', wordCount: 100, order: 1 },
      { id: 'ch-2', title: '第2章', content: 'Content 2', wordCount: 150, order: 2 },
    ],
    totalWords: 250,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (novelService.parseNovel as jest.Mock).mockReset();
  });

  describe('constructor', () => {
    it('should create ImportStep with default config', () => {
      const step = new ImportStep();
      expect(step.id).toBe('step-import');
      expect(step.name).toBe('导入与解析');
      expect(step.stepId).toBe(PipelineStepId.IMPORT);
      expect(step.mode).toBe(PipelineExecutionMode.SEQUENCE);
    });

    it('should accept custom config', () => {
      const step = new ImportStep({ id: 'custom-id', name: 'Custom Name' });
      expect(step.id).toBe('custom-id');
      expect(step.name).toBe('Custom Name');
    });

    it('should create via factory function', () => {
      const step = createImportStep();
      expect(step).toBeInstanceOf(ImportStep);
    });
  });

  describe('execute()', () => {
    describe('novel content parsing', () => {
      it('should parse novel content successfully', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue(mockNovelParseResult);

        const importInput: ImportInput = {
          rawContent: '这是小说内容...',
          sourceType: 'novel',
          filename: 'test.txt',
          language: 'zh',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.COMPLETED);
        expect(result.stepId).toBe(PipelineStepId.IMPORT);
        expect(result.qualityGate).toBe(QualityGateDecision.PASS);
        expect(result.data).toBeDefined();

        const data = result.data as { chapters: Array<{ id: string; title: string }>; metadata: { title: string; author?: string; chapterCount: number; wordCount: number } };
        expect(data.chapters).toHaveLength(2);
        expect(data.chapters[0].id).toBe('ch-1');
        expect(data.chapters[0].title).toBe('第1章');
        expect(data.metadata.title).toBe('Test Novel');
        expect(data.metadata.author).toBe('Test Author');
        expect(data.metadata.chapterCount).toBe(2);
        expect(data.metadata.wordCount).toBe(250);
      });

      it('should use filename as title when parse result has no title', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue({
          ...mockNovelParseResult,
          title: '',
        });

        const importInput: ImportInput = {
          rawContent: '内容',
          sourceType: 'novel',
          filename: 'my-novel.txt',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));
        const data = result.data as { metadata: { title: string } };

        expect(data.metadata.title).toBe('my-novel.txt');
      });

      it('should detect novel type when sourceType is not novel but content looks like novel', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue(mockNovelParseResult);

        const importInput: ImportInput = {
          rawContent: '这是普通小说内容，没有场景标记，也没有提示词符号',
          sourceType: 'prompt',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        await step.execute(createStepInput(context));

        expect(novelService.parseNovel).toHaveBeenCalled();
      });

      it('should generate chapter id when chapter has no id', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue({
          ...mockNovelParseResult,
          chapters: [
            { title: '第1章', content: 'Content', wordCount: 100, order: 1 },
          ],
        });

        const importInput: ImportInput = {
          rawContent: '内容',
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));
        const data = result.data as { chapters: Array<{ id: string }> };

        expect(data.chapters[0].id).toBe('ch-0');
      });

      it('should use default title when chapter has no title', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue({
          ...mockNovelParseResult,
          chapters: [
            { id: 'ch-1', content: 'Content', wordCount: 100, order: 1 },
          ],
        });

        const importInput: ImportInput = {
          rawContent: '内容',
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));
        const data = result.data as { chapters: Array<{ title: string }> };

        expect(data.chapters[0].title).toBe('第1章');
      });

      it('should save chapters and metadata to context', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue(mockNovelParseResult);

        const importInput: ImportInput = {
          rawContent: '小说内容',
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const setVariableSpy = jest.spyOn(context, 'setVariable');

        const step = new ImportStep();
        await step.execute(createStepInput(context));

        expect(setVariableSpy).toHaveBeenCalledWith('chapters', expect.any(Array));
        expect(setVariableSpy).toHaveBeenCalledWith('projectMetadata', expect.any(Object));
        expect(setVariableSpy).toHaveBeenCalledWith('rawContent', '小说内容');
      });
    });

    describe('non-novel content handling', () => {
      it('should handle script content as single chapter', async () => {
        const scriptContent = '第1场 场景一\n\n角色对白...';

        const importInput: ImportInput = {
          rawContent: scriptContent,
          sourceType: 'script',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.COMPLETED);
        expect(novelService.parseNovel).not.toHaveBeenCalled();

        const data = result.data as { chapters: Array<{ id: string; title: string }>; metadata: { chapterCount: number } };
        expect(data.chapters).toHaveLength(1);
        expect(data.chapters[0].id).toBe('ch-1');
        expect(data.chapters[0].title).toBe('内容');
        expect(data.metadata.chapterCount).toBe(1);
      });

      it('should handle prompt content as single chapter', async () => {
        const promptContent = '# 提示词内容';

        const importInput: ImportInput = {
          rawContent: promptContent,
          sourceType: 'prompt',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.COMPLETED);
        expect(novelService.parseNovel).not.toHaveBeenCalled();

        const data = result.data as { chapters: Array<{ content: string }> };
        expect(data.chapters[0].content).toBe(promptContent);
      });

      it('should use filename as title for non-novel content', async () => {
        // Use content with actual script markers so detectContentType returns 'script'
        const importInput: ImportInput = {
          rawContent: '第一场 场景一\n\n角色对白...',
          sourceType: 'script',
          filename: 'my-script.txt',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.COMPLETED);
        expect(novelService.parseNovel).not.toHaveBeenCalled();

        const data = result.data as { metadata: { title: string } };
        expect(data.metadata.title).toBe('my-script.txt');
      });

      it('should calculate wordCount based on content length for non-novel', async () => {
        // Use content with actual script markers so detectContentType returns 'script'
        const content = '第一场 场景描述\n第二场 继续';

        const importInput: ImportInput = {
          rawContent: content,
          sourceType: 'script',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.COMPLETED);
        expect(novelService.parseNovel).not.toHaveBeenCalled();

        const data = result.data as { metadata: { wordCount: number } };
        expect(data.metadata.wordCount).toBe(content.length);
      });
    });

    describe('error handling', () => {
      it('should throw error when no content to import', async () => {
        const importInput: ImportInput = {
          rawContent: '',
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.FAILED);
        expect(result.error).toBe('No content to import');
      });

      it('should throw error when rawContent is missing', async () => {
        const importInput = { sourceType: 'novel' } as ImportInput;

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.FAILED);
        expect(result.error).toBe('No content to import');
      });

      it('should handle novelService.parseNovel error', async () => {
        (novelService.parseNovel as jest.Mock).mockRejectedValue(new Error('AI service error'));

        const importInput: ImportInput = {
          rawContent: '小说内容',
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.FAILED);
        expect(result.error).toBe('AI service error');
      });

      it('should handle non-Error thrown in parseNovel', async () => {
        (novelService.parseNovel as jest.Mock).mockRejectedValue('string error');

        const importInput: ImportInput = {
          rawContent: '小说内容',
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.status).toBe(StepStatus.FAILED);
        expect(result.error).toBe('string error');
      });
    });

    describe('progress reporting', () => {
      it('should report progress during execution', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue(mockNovelParseResult);

        const importInput: ImportInput = {
          rawContent: '小说内容',
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const progressEvents: Array<{ progress: number; message: string }> = [];
        const step = new ImportStep();
        step.onProgress = (event) => {
          progressEvents.push({ progress: event.progress, message: event.message });
        };

        await step.execute(createStepInput(context));

        expect(progressEvents).toContainEqual({ progress: 10, message: '正在识别内容格式...' });
        expect(progressEvents).toContainEqual({ progress: 30, message: '正在解析内容结构...' });
        expect(progressEvents).toContainEqual({ progress: 90, message: '解析完成' });
      });
    });

    describe('metrics', () => {
      it('should return correct metrics after execution', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue(mockNovelParseResult);

        const importInput: ImportInput = {
          rawContent: '小说内容',
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        const result = await step.execute(createStepInput(context));

        expect(result.metrics).toBeDefined();
        expect(result.metrics?.durationMs).toBeGreaterThanOrEqual(0);
        expect(result.metrics?.framesProcessed).toBe(2);
        expect(result.startTime).toBeDefined();
        expect(result.endTime).toBeDefined();
      });
    });

    describe('content type detection', () => {
      it('should detect script type by scene markers', async () => {
        // Content that matches script pattern: 第X场
        const scriptContent = '第一场 场景描述\n第二场 继续';

        const importInput: ImportInput = {
          rawContent: scriptContent,
          sourceType: 'script',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        await step.execute(createStepInput(context));

        // For script sourceType, novelService.parseNovel should not be called
        // because the code checks sourceType first
        expect(novelService.parseNovel).not.toHaveBeenCalled();
      });

      it('should detect prompt type by leading slash or hash', async () => {
        // Content that matches prompt pattern: starts with / or #
        const promptContent = '# 这是一个提示词';

        const importInput: ImportInput = {
          rawContent: promptContent,
          sourceType: 'prompt',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        await step.execute(createStepInput(context));

        // For prompt sourceType, novelService.parseNovel should not be called
        expect(novelService.parseNovel).not.toHaveBeenCalled();
      });

      it('should default to novel type and call parseNovel', async () => {
        (novelService.parseNovel as jest.Mock).mockResolvedValue(mockNovelParseResult);

        // Content without script or prompt markers
        const novelContent = '这是一个普通的小说内容段落，没有任何特殊标记';

        const importInput: ImportInput = {
          rawContent: novelContent,
          sourceType: 'novel',
        };

        const context = createMockContext(importInput);
        const step = new ImportStep();
        await step.execute(createStepInput(context));

        expect(novelService.parseNovel).toHaveBeenCalled();
      });
    });
  });
});
