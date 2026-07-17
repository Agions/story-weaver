import { PipelineEngine } from '../../core/pipeline/pipeline-engine';
import { PipelineStep } from '../../core/pipeline/step-interface';

describe('PipelineEngine', () => {
  it('should create engine instance', () => {
    const engine = new PipelineEngine();
    expect(engine).toBeDefined();
  });

  it('should add steps', () => {
    const engine = new PipelineEngine();
    const mockStep: PipelineStep = {
      id: 'step1',
      name: 'Step 1',
      execute: async (input) => ({ ...input, step1Done: true }),
      getCheckpoint: () => null,
      restore: () => {},
    };
    const result = engine.addStep(mockStep);
    expect(result).toBe(engine);
    expect(engine.getSteps()).toHaveLength(1);
  });

  it('should run steps in order', async () => {
    const engine = new PipelineEngine();
    const calls: string[] = [];
    
    const step1: PipelineStep = {
      id: 's1', name: 'Step 1',
      execute: async (input) => { calls.push('s1'); return { ...input, s1: true }; },
      getCheckpoint: () => null, restore: () => {},
    };
    const step2: PipelineStep = {
      id: 's2', name: 'Step 2',
      execute: async (input) => { calls.push('s2'); return { ...input, s2: true }; },
      getCheckpoint: () => null, restore: () => {},
    };

    engine.addStep(step1).addStep(step2);
    const result = await engine.run({ start: true });
    
    expect(calls).toEqual(['s1', 's2']);
    expect(result.s1).toBe(true);
    expect(result.s2).toBe(true);
  });

  it('should call onProgress', async () => {
    const progressCalls: [string, number][] = [];
    const engine = new PipelineEngine({
      onProgress: (id, p) => progressCalls.push([id, p]),
    });
    
    const step: PipelineStep = {
      id: 'test', name: 'Test',
      execute: async (i) => ({ ...i, done: true }),
      getCheckpoint: () => null, restore: () => {},
    };
    engine.addStep(step);
    await engine.run({});
    expect(progressCalls).toEqual([['test', 0], ['test', 1]]);
  });
});
