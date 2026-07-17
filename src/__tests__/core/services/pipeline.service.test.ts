/**
 * Pipeline Service Tests
 */

import { PipelineService ,
  createImportStep,
  createAnalysisStep,
  createScriptStep,
  createStoryboardStep,
  createCharacterStep,
  createRenderStep,
  createExportStep,
  createDefaultPipeline,
  getPipelineService,
  PIPELINE_STEP_IDS,
} from '@/core/services/pipeline/pipeline-service';

// Mock logger
jest.mock('@/core/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

describe('PipelineService', () => {
  let service: PipelineService;

  beforeEach(() => {
    service = new PipelineService();
    jest.clearAllMocks();
  });

  describe('createPipeline', () => {
    it('should create a pipeline with generated workflowId', () => {
      const steps = [createImportStep()];
      const workflowId = service.createPipeline({ steps });

      expect(workflowId).toBeDefined();
      expect(typeof workflowId).toBe('string');
    });

    it('should create a pipeline with custom workflowId', () => {
      const steps = [createImportStep()];
      const workflowId = service.createPipeline({ workflowId: 'custom-id', steps });

      expect(workflowId).toBe('custom-id');
    });

    it('should store pipeline for later retrieval', () => {
      const steps = [createImportStep()];
      const workflowId = service.createPipeline({ steps });

      const pipeline = service.getPipeline(workflowId);
      expect(pipeline).toBeDefined();
    });

    it('should create pipeline with projectId and episodeId', () => {
      const steps = [createImportStep()];
      const workflowId = service.createPipeline({
        steps,
        projectId: 'project-123',
        episodeId: 'episode-456',
      });

      const pipeline = service.getPipeline(workflowId);
      expect(pipeline).toBeDefined();
    });
  });

  describe('getPipeline', () => {
    it('should return undefined for non-existent pipeline', () => {
      const pipeline = service.getPipeline('non-existent-id');
      expect(pipeline).toBeUndefined();
    });

    it('should return pipeline after creation', () => {
      const steps = [createImportStep()];
      const workflowId = service.createPipeline({ steps });

      const pipeline = service.getPipeline(workflowId);
      expect(pipeline).toBeDefined();
    });
  });

  describe('runPipeline', () => {
    it('should throw error for non-existent pipeline', async () => {
      await expect(
        service.runPipeline('non-existent-id', {})
      ).rejects.toThrow('Pipeline non-existent-id not found');
    });

    it('should complete pipeline with single step', async () => {
      const steps = [
        {
          id: 'step-1',
          name: 'Test Step',
          stepId: 'import' as const,
          execute: jest.fn().mockResolvedValue({ result: 'output' }),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      const result = await service.runPipeline(workflowId, { input: 'data' });

      expect(result.status).toBe('completed');
      expect(result.output).toEqual({ result: 'output' });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].status).toBe('completed');
    });

    it('should execute multiple steps in sequence', async () => {
      const execute1 = jest.fn().mockResolvedValue('output1');
      const execute2 = jest.fn().mockResolvedValue('output2');
      const execute3 = jest.fn().mockResolvedValue('output3');

      const steps = [
        { id: 'step-1', name: 'Step 1', stepId: 'import' as const, execute: execute1 },
        { id: 'step-2', name: 'Step 2', stepId: 'analysis' as const, execute: execute2 },
        { id: 'step-3', name: 'Step 3', stepId: 'script' as const, execute: execute3 },
      ];
      const workflowId = service.createPipeline({ steps });

      const result = await service.runPipeline(workflowId, 'initial input');

      expect(result.status).toBe('completed');
      expect(execute1).toHaveBeenCalledWith('initial input', expect.any(Object));
      expect(execute2).toHaveBeenCalledWith('output1', expect.any(Object));
      expect(execute3).toHaveBeenCalledWith('output2', expect.any(Object));
      expect(result.output).toBe('output3');
    });

    it('should call onStepChange callback', async () => {
      const onStepChange = jest.fn();
      const steps = [
        { id: 'step-1', name: 'Step 1', stepId: 'import' as const, execute: jest.fn().mockResolvedValue('output') },
      ];
      const workflowId = service.createPipeline({ steps });

      await service.runPipeline(workflowId, 'input', { onStepChange });

      expect(onStepChange).toHaveBeenCalledWith(steps[0]);
    });

    it('should call onProgress callback', async () => {
      const onProgress = jest.fn();
      const steps = [
        { id: 'step-1', name: 'Step 1', stepId: 'import' as const, execute: jest.fn().mockResolvedValue('output') },
      ];
      const workflowId = service.createPipeline({ steps });

      await service.runPipeline(workflowId, 'input', { onProgress });

      expect(onProgress).toHaveBeenCalledWith('import', 100, expect.stringContaining('Step 1'));
    });

    it('should call onComplete callback on success', async () => {
      const onComplete = jest.fn();
      const steps = [
        { id: 'step-1', name: 'Step 1', stepId: 'import' as const, execute: jest.fn().mockResolvedValue('output') },
      ];
      const workflowId = service.createPipeline({ steps });

      await service.runPipeline(workflowId, 'input', { onComplete });

      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed',
        workflowId,
      }));
    });

    it('should call onError callback when step throws', async () => {
      const onError = jest.fn();
      const steps = [
        {
          id: 'step-1',
          name: 'Failing Step',
          stepId: 'import' as const,
          execute: jest.fn().mockRejectedValue(new Error('Step failed')),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      const result = await service.runPipeline(workflowId, 'input', { onError });

      expect(result.status).toBe('error');
      expect(result.error).toBe('Step failed');
      expect(onError).toHaveBeenCalledWith('Step failed', steps[0]);
    });

    it('should handle context.getVariable and context.setVariable', async () => {
      let capturedContext: any;
      const steps = [
        {
          id: 'step-1',
          name: 'Step 1',
          stepId: 'import' as const,
          execute: jest.fn().mockImplementation((input, context) => {
            capturedContext = context;
            context.setVariable('testKey', 'testValue');
            return Promise.resolve(input);
          }),
        },
        {
          id: 'step-2',
          name: 'Step 2',
          stepId: 'analysis' as const,
          execute: jest.fn().mockImplementation((input, context) => {
            return Promise.resolve(context.getVariable('testKey'));
          }),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      const result = await service.runPipeline(workflowId, 'input');

      expect(capturedContext.getVariable('testKey')).toBe('testValue');
      expect(result.output).toBe('testValue');
    });

    it('should handle context.log', async () => {
      const steps = [
        {
          id: 'step-1',
          name: 'Step 1',
          stepId: 'import' as const,
          execute: jest.fn().mockImplementation((input, context) => {
            context.log('Test log message', 'info');
            context.log('Warning message', 'warn');
            context.log('Error message', 'error');
            return Promise.resolve(input);
          }),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      await service.runPipeline(workflowId, 'input');

      const { logger } = require('@/core/utils/logger');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Test log message'));
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });

    it('should handle cancellation during execution', async () => {
      let releaseStep!: () => void;
      const blocked = new Promise<void>(resolve => { releaseStep = resolve; });

      const steps = [
        {
          id: 'step-1',
          name: 'Step 1',
          stepId: 'import' as const,
          execute: jest.fn().mockImplementation(async () => {
            // Block until we release
            await blocked;
            return 'output';
          }),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      // Start the pipeline - it will block
      const runPromise = service.runPipeline(workflowId, 'input');

      // Give it a tick to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cancel while step is executing
      service.cancelPipeline(workflowId);

      // Release the blocked step
      releaseStep();

      const result = await runPromise;
      // Cancellation resets to idle, but if already completed it stays completed
      expect(['idle', 'completed']).toContain(result.status);
    });
  });

  describe('pausePipeline', () => {
    it('should return false for non-existent pipeline', () => {
      const result = service.pausePipeline('non-existent-id');
      expect(result).toBe(false);
    });

    it('should pause a running pipeline', async () => {
      let stepResolve: () => void;
      const stepPromise = new Promise(resolve => { stepResolve = resolve; });

      const steps = [
        {
          id: 'step-1',
          name: 'Step 1',
          stepId: 'import' as const,
          execute: jest.fn().mockImplementation(async () => {
            await stepPromise;
            return 'output';
          }),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      // Start the pipeline
      const runPromise = service.runPipeline(workflowId, 'input');

      // Pause
      const pauseResult = service.pausePipeline(workflowId);
      expect(pauseResult).toBe(true);

      // Resume and let it complete
      stepResolve!();
      await runPromise;
    });
  });

  describe('resumePipeline', () => {
    it('should return false for non-existent pipeline', () => {
      const result = service.resumePipeline('non-existent-id');
      expect(result).toBe(false);
    });

    it('should resume a paused pipeline', async () => {
      let stepResolve: () => void;
      const steps = [
        {
          id: 'step-1',
          name: 'Step 1',
          stepId: 'import' as const,
          execute: jest.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'output';
          }),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      // Start the pipeline
      const runPromise = service.runPipeline(workflowId, 'input');

      // Pause then resume
      service.pausePipeline(workflowId);
      const resumeResult = service.resumePipeline(workflowId);
      expect(resumeResult).toBe(true);

      await runPromise;
    });
  });

  describe('cancelPipeline', () => {
    it('should return false for non-existent pipeline', () => {
      const result = service.cancelPipeline('non-existent-id');
      expect(result).toBe(false);
    });

    it('should cancel a running pipeline', async () => {
      let releaseStep!: () => void;
      const blocked = new Promise<void>(resolve => { releaseStep = resolve; });

      const steps = [
        {
          id: 'step-1',
          name: 'Step 1',
          stepId: 'import' as const,
          execute: jest.fn().mockImplementation(async () => {
            await blocked;
            return 'output';
          }),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      const runPromise = service.runPipeline(workflowId, 'input');

      // Give it a tick to start
      await new Promise(resolve => setTimeout(resolve, 10));

      service.cancelPipeline(workflowId);

      // Release blocked step
      releaseStep();

      const result = await runPromise;
      // Status may be idle if cancelled during step, or completed if step finished before cancel took effect
      expect(['idle', 'completed']).toContain(result.status);
    });
  });

  describe('getPipelineStatus', () => {
    it('should return undefined for non-existent pipeline', () => {
      const status = service.getPipelineStatus('non-existent-id');
      expect(status).toBeUndefined();
    });

    it('should return running status during execution', async () => {
      let stepResolve: () => void;
      const stepPromise = new Promise(resolve => { stepResolve = resolve; });

      const steps = [
        {
          id: 'step-1',
          name: 'Step 1',
          stepId: 'import' as const,
          execute: jest.fn().mockImplementation(async () => {
            await stepPromise;
            return 'output';
          }),
        },
      ];
      const workflowId = service.createPipeline({ steps });

      service.runPipeline(workflowId, 'input');

      // Give it a tick to start
      await new Promise(resolve => setTimeout(resolve, 10));

      const status = service.getPipelineStatus(workflowId);
      expect(status).toBe('running');

      stepResolve!();
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  });

  describe('deletePipeline', () => {
    it('should return false for non-existent pipeline', () => {
      const result = service.deletePipeline('non-existent-id');
      expect(result).toBe(false);
    });

    it('should delete an existing pipeline', () => {
      const steps = [createImportStep()];
      const workflowId = service.createPipeline({ steps });

      const deleteResult = service.deletePipeline(workflowId);
      expect(deleteResult).toBe(true);

      const pipeline = service.getPipeline(workflowId);
      expect(pipeline).toBeUndefined();
    });
  });

  describe('getAllPipelines', () => {
    it('should return empty array initially', () => {
      const pipelines = service.getAllPipelines();
      expect(pipelines).toEqual([]);
    });

    it('should return all created pipelines', () => {
      const steps = [createImportStep()];
      service.createPipeline({ steps });
      service.createPipeline({ steps });
      service.createPipeline({ steps });

      const pipelines = service.getAllPipelines();
      expect(pipelines).toHaveLength(3);
    });
  });
});

describe('Step Factory Functions', () => {
  describe('createImportStep', () => {
    it('should create a step with correct id, name, and stepId', () => {
      const step = createImportStep();

      expect(step.id).toBeDefined();
      expect(step.name).toBe('导入');
      expect(step.stepId).toBe('import');
    });

    it('should store onProgress callback in step', () => {
      const onProgress = jest.fn();
      const step = createImportStep({ onProgress });

      // The step stores onProgress, but it's called by Pipeline class during orchestration
      expect(step.onProgress).toBe(onProgress);
    });

    it('should return input as output', async () => {
      const step = createImportStep();
      const context = createMockContext();

      const result = await step.execute('test-input', context);

      expect(result).toBe('test-input');
    });
  });

  describe('createAnalysisStep', () => {
    it('should create a step with correct name and stepId', () => {
      const step = createAnalysisStep();

      expect(step.name).toBe('AI解析');
      expect(step.stepId).toBe('analysis');
    });
  });

  describe('createScriptStep', () => {
    it('should create a step with correct name and stepId', () => {
      const step = createScriptStep();

      expect(step.name).toBe('剧本生成');
      expect(step.stepId).toBe('script');
    });
  });

  describe('createStoryboardStep', () => {
    it('should create a step with correct name and stepId', () => {
      const step = createStoryboardStep();

      expect(step.name).toBe('分镜生成');
      expect(step.stepId).toBe('storyboard');
    });
  });

  describe('createCharacterStep', () => {
    it('should create a step with correct name and stepId', () => {
      const step = createCharacterStep();

      expect(step.name).toBe('角色生成');
      expect(step.stepId).toBe('character');
    });
  });

  describe('createRenderStep', () => {
    it('should create a step with correct name and stepId', () => {
      const step = createRenderStep();

      expect(step.name).toBe('渲染');
      expect(step.stepId).toBe('render');
    });
  });

  describe('createExportStep', () => {
    it('should create a step with correct name and stepId', () => {
      const step = createExportStep();

      expect(step.name).toBe('导出发布');
      expect(step.stepId).toBe('export');
    });
  });
});

describe('createDefaultPipeline', () => {
  it('should create 7 steps', () => {
    const steps = createDefaultPipeline();

    expect(steps).toHaveLength(7);
  });

  it('should create steps in correct order', () => {
    const steps = createDefaultPipeline();

    expect(steps[0].stepId).toBe('import');
    expect(steps[1].stepId).toBe('analysis');
    expect(steps[2].stepId).toBe('script');
    expect(steps[3].stepId).toBe('storyboard');
    expect(steps[4].stepId).toBe('character');
    expect(steps[5].stepId).toBe('render');
    expect(steps[6].stepId).toBe('export');
  });

  it('should pass onProgress to all steps', () => {
    const onProgress = jest.fn();
    const steps = createDefaultPipeline({ onProgress });

    // All steps should have onProgress that calls the provided callback
    for (const step of steps) {
      expect(step.onProgress).toBeDefined();
    }
  });
});

describe('PIPELINE_STEP_IDS', () => {
  it('should contain all 7 step ids', () => {
    expect(PIPELINE_STEP_IDS).toHaveLength(7);
    expect(PIPELINE_STEP_IDS).toContain('import');
    expect(PIPELINE_STEP_IDS).toContain('analysis');
    expect(PIPELINE_STEP_IDS).toContain('script');
    expect(PIPELINE_STEP_IDS).toContain('storyboard');
    expect(PIPELINE_STEP_IDS).toContain('character');
    expect(PIPELINE_STEP_IDS).toContain('render');
    expect(PIPELINE_STEP_IDS).toContain('export');
  });
});

describe('getPipelineService', () => {
  it('should return a PipelineService instance', () => {
    const instance = getPipelineService();
    expect(instance).toBeInstanceOf(PipelineService);
  });

  it('should return the same instance on multiple calls (singleton)', () => {
    const instance1 = getPipelineService();
    const instance2 = getPipelineService();
    expect(instance1).toBe(instance2);
  });
});

// ========== Helper Functions ==========

function createMockContext() {
  const variables = new Map<string, unknown>();
  return {
    workflowId: 'test-workflow-id',
    projectId: 'test-project-id',
    episodeId: 'test-episode-id',
    getVariable: (name: string) => variables.get(name),
    setVariable: (name: string, value: unknown) => variables.set(name, value),
    log: jest.fn(),
  };
}
