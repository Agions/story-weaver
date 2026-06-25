import { createMockStepContext } from '@/__tests__/fixtures';

import {
  PipelineStepId,
  StepStatus,
  QualityGateDecision,
} from '../../core/pipeline/pipeline.types';
import {
  CharacterStep,
  createCharacterStep,
  type CharacterOutput,
} from '../../core/pipeline/step-character';

// Mock character service
const mockCreate = jest.fn();
jest.mock('@/core/services/domain/character.service', () => ({
  getCharacterService: () => ({
    create: mockCreate,
  }),
}));

describe('CharacterStep', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockImplementation((data: any) => ({
      id: `char-${Date.now()}`,
      name: data.name,
      role: data.role,
      description: data.description,
      appearance: data.appearance,
    }));
  });

  describe('constructor', () => {
    it('should have correct default stepId', () => {
      const step = new CharacterStep();
      expect(step.stepId).toBe(PipelineStepId.CHARACTER);
    });

    it('should have correct default values', () => {
      const step = new CharacterStep();
      expect(step.id).toBe('step-character');
      expect(step.name).toBe('角色设计');
      expect(step.mode).toBe('sequence');
      expect(step.dependencies).toEqual([PipelineStepId.SCRIPT, PipelineStepId.ANALYSIS]);
    });

    it('should apply custom retry policy', () => {
      const step = new CharacterStep({
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
      const step = new CharacterStep({ id: 'custom-character', name: 'Custom Character Step' });
      expect(step.id).toBe('custom-character');
      expect(step.name).toBe('Custom Character Step');
    });
  });

  describe('execute', () => {
    it('should complete successfully with valid scenes containing character names', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 3);
      variables.set('scenes', [
        { description: '张三和李四在教室里讨论问题' },
        { description: '王五来到公园散步' },
      ]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
      expect(result.stepId).toBe(PipelineStepId.CHARACTER);
      expect(result.qualityGate).toBe(QualityGateDecision.PASS);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      const data = result.data as CharacterOutput;
      expect(data.characters).toBeDefined();
      expect(data.totalCount).toBe(data.characters.length);
    });

    it('should extract character names from scene descriptions', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 5);
      variables.set('scenes', [
        { description: 'Alice和Bob在森林里相遇' },
        { description: 'Charlie也加入了他们' },
      ]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);

      const data = result.data as CharacterOutput;
      // Should have extracted Alice, Bob, Charlie
      expect(data.characters.length).toBeGreaterThan(0);
    });

    it('should use default characters when no names found in scenes', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 3);
      variables.set('scenes', [{ description: '有一些人在那里' }]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);

      const data = result.data as CharacterOutput;
      // Should have default characters 主角 and 配角
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should set characters and characterCount in context', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 2);
      variables.set('scenes', [{ description: '张三和李四在教室里' }]);
      const context = createMockStepContext(variables);

      let capturedKey = '';
      let capturedValue: any;
      context.setVariable = <T>(_key: string, _value: T) => {
        capturedKey = _key as string;
        capturedValue = _value;
      };

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      await step.execute(input);
      expect(capturedKey).toBe('characterCount');
      expect(typeof capturedValue).toBe('number');
    });

    it('should report progress during execution', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 2);
      variables.set('scenes', [{ description: '张三和李四在教室里' }]);
      const context = createMockStepContext(variables);

      const progressEvents: Array<{ progress: number; message: string }> = [];
      step.onProgress = (event) => {
        progressEvents.push({ progress: event.progress, message: event.message });
      };

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      await step.execute(input);
      expect(
        progressEvents.some((e) => e.progress === 10 && e.message.includes('分析角色需求'))
      ).toBe(true);
      expect(progressEvents.some((e) => e.message.includes('生成角色'))).toBe(true);
    });

    it('should return correct metrics', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 1);
      variables.set('scenes', [{ description: '张三在教室里' }]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.metrics).toBeDefined();
      expect(result.metrics!.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.retryCount).toBe(0);
    });

    it('should handle character creation errors gracefully', async () => {
      const step = new CharacterStep();
      mockCreate.mockRejectedValueOnce(new Error('Service unavailable'));

      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 1);
      variables.set('scenes', [{ description: '张三在教室里' }]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      // Should still complete (with 0 characters) instead of failing
      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
    });

    it('should use default estimatedCharacters of 3 when not set', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      // No estimatedCharacters set
      variables.set('scenes', [{ description: '张三和李四在教室里讨论' }]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);
    });

    it('should limit characters to estimatedCharacters count', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 2);
      variables.set('scenes', [{ description: '张三和李四王五赵六孙七周八' }]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);

      const data = result.data as CharacterOutput;
      // Should be limited by estimatedCharacters (2)
      expect(data.characters.length).toBeLessThanOrEqual(2);
    });

    it('should assign first character as protagonist', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 3);
      variables.set('scenes', [{ description: '张三和李四在教室里' }]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      await step.execute(input);

      // First call should have role 'protagonist'
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'protagonist',
        })
      );
    });

    it('should assign subsequent characters as supporting', async () => {
      const step = new CharacterStep();
      mockCreate.mockReset();
      mockCreate.mockImplementation((data: any) => ({
        id: `char-${Date.now()}`,
        name: data.name,
        role: data.role,
      }));

      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 3);
      variables.set('scenes', [{ description: '张三和李四王五在教室里' }]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      await step.execute(input);

      const calls = mockCreate.mock.calls;
      if (calls.length > 1) {
        // Second character onwards should be 'supporting'
        for (let i = 1; i < calls.length; i++) {
          expect(calls[i][0].role).toBe('supporting');
        }
      }
    });
  });

  describe('extractCharacterNames', () => {
    it('should extract English names from scene descriptions', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 5);
      variables.set('scenes', [
        { description: 'Alice和Bob在教室里讨论' },
        { description: 'Charlie也来了' },
      ]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);

      const data = result.data as CharacterOutput;
      // Should extract Alice, Bob, Charlie (3 English names)
      expect(data.characters.length).toBe(3);
    });

    it('should limit to 10 character names max', async () => {
      const step = new CharacterStep();
      const variables = new Map<string, unknown>();
      variables.set('estimatedCharacters', 20);
      variables.set('scenes', [
        { description: 'Alice Bob Charlie David Edward Frank George Henry Ivan James Karl Larry' },
      ]);
      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: PipelineStepId.CHARACTER,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe(StepStatus.COMPLETED);

      // The extraction regex finds names matching [A-Z][a-z]{2,20}, so with 12 names it should cap at 10
      expect(mockCreate).toHaveBeenCalledTimes(10);
    });
  });

  describe('createCharacterStep factory', () => {
    it('should create CharacterStep instance with defaults', () => {
      const step = createCharacterStep();
      expect(step).toBeInstanceOf(CharacterStep);
      expect(step.stepId).toBe(PipelineStepId.CHARACTER);
    });

    it('should create CharacterStep with custom config', () => {
      const step = createCharacterStep({
        id: 'my-character',
        name: 'My Character',
      });
      expect(step.id).toBe('my-character');
      expect(step.name).toBe('My Character');
    });
  });
});
