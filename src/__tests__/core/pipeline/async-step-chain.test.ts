/**
 * AsyncStepChain 单元测试
 * 覆盖：PRE 跳过、EXEC 重试、POST 调用、ROLLBACK 触发、Builder 模式
 */

import {
  AsyncStepChain,
  StepChainBuilder,
  StepPhase,
  ChainDirection,
  type StepInput,
  type StepOutput,
  type StepChainContext,
} from '@/core/pipeline/async-step-chain';

const makeContext = (): StepChainContext => ({
  workflowId: 'wf-1',
  stepId: 'test',
  metrics: {
    startTime: 0,
    preDurationMs: 0,
    execDurationMs: 0,
    postDurationMs: 0,
    retryCount: 0,
  },
  shared: new Map(),
});

const makeInput = (): StepInput => ({ data: 'test-input' }) as unknown as StepInput;

describe('AsyncStepChain', () => {
  describe('EXEC phase', () => {
    it('executes the executor and returns completed status', async () => {
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'test',
        executor: async (input) => ({ value: 'ok', input }),
      });

      const result = await chain.execute(makeInput(), makeContext());
      expect(result.status).toBe('completed');
      expect(result.phase).toBe(StepPhase.EXEC);
      expect((result.output as any).value).toBe('ok');
      expect(result.error).toBeUndefined();
    });

    it('returns failed status when executor throws', async () => {
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'test',
        executor: async () => {
          throw new Error('boom');
        },
      });

      const result = await chain.execute(makeInput(), makeContext());
      expect(result.status).toBe('failed');
      expect(result.error).toContain('boom');
    });
  });

  describe('retry logic', () => {
    it('retries up to maxRetries times on failure', async () => {
      let attempts = 0;
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'flaky',
        maxRetries: 2,
        retryDelayMs: 1,
        executor: async () => {
          attempts += 1;
          if (attempts < 3) throw new Error('transient');
          return { ok: true } as StepOutput;
        },
      });

      const result = await chain.execute(makeInput(), makeContext());
      expect(attempts).toBe(3);
      expect(result.status).toBe('completed');
    });

    it('records retryCount in metrics', async () => {
      const ctx = makeContext();
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'flaky',
        maxRetries: 1,
        retryDelayMs: 1,
        executor: async () => {
          throw new Error('always fail');
        },
      });

      await chain.execute(makeInput(), ctx);
      expect(ctx.metrics.retryCount).toBe(2);
    });
  });

  describe('PRE phase (preCondition)', () => {
    it('skips step when preCondition returns false', async () => {
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'guarded',
        preCondition: () => false,
        executor: async () => ({ ran: true }) as StepOutput,
      });

      const result = await chain.execute(makeInput(), makeContext());
      expect(result.status).toBe('skipped');
      expect(result.phase).toBe(StepPhase.PRE);
    });

    it('proceeds when preCondition returns true', async () => {
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'guarded',
        preCondition: () => true,
        executor: async () => ({ ran: true }) as StepOutput,
      });

      const result = await chain.execute(makeInput(), makeContext());
      expect(result.status).toBe('completed');
    });

    it('fails when preCondition throws', async () => {
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'guarded',
        preCondition: () => {
          throw new Error('guard failed');
        },
        executor: async () => ({ ran: true }) as StepOutput,
      });

      const result = await chain.execute(makeInput(), makeContext());
      expect(result.status).toBe('failed');
      expect(result.error).toContain('guard failed');
    });
  });

  describe('POST phase (postHandler)', () => {
    it('invokes postHandler after EXEC completes', async () => {
      const postSpy = jest.fn();
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'with-post',
        executor: async () => ({ ok: true }) as StepOutput,
        postHandler: postSpy,
      });

      await chain.execute(makeInput(), makeContext());
      expect(postSpy).toHaveBeenCalledTimes(1);
    });

    it('swallows postHandler errors silently', async () => {
      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'with-bad-post',
        executor: async () => ({ ok: true }) as StepOutput,
        postHandler: () => {
          throw new Error('post boom');
        },
      });

      // Should NOT throw
      const result = await chain.execute(makeInput(), makeContext());
      expect(result.status).toBe('completed');
    });
  });

  describe('ROLLBACK on failure', () => {
    it('invokes rollback step when EXEC fails and rollback is set', async () => {
      const rollbackSpy = jest.fn(async () => ({ ok: true }) as StepOutput);
      const rollback = new AsyncStepChain({
        id: 'rollback',
        stepId: 'import' as any,
        name: 'rollback',
        executor: rollbackSpy,
      });

      const chain = new AsyncStepChain({
        id: 's1',
        stepId: 'import' as any,
        name: 'with-rollback',
        executor: async () => {
          throw new Error('main failed');
        },
      });
      chain.setRollback(rollback);

      await chain.execute(makeInput(), makeContext());
      expect(rollbackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('chain linking', () => {
    it('setNext returns this for chaining', () => {
      const a = new AsyncStepChain({
        id: 'a',
        stepId: 'import' as any,
        name: 'a',
        executor: async () => ({}),
      });
      const b = new AsyncStepChain({
        id: 'b',
        stepId: 'import' as any,
        name: 'b',
        executor: async () => ({}),
      });
      expect(a.setNext(b)).toBe(a);
      expect(a.getNext()).toBe(b);
    });

    it('addBranch stores branch by id', () => {
      const a = new AsyncStepChain({
        id: 'a',
        stepId: 'import' as any,
        name: 'a',
        executor: async () => ({}),
      });
      const b = new AsyncStepChain({
        id: 'b',
        stepId: 'import' as any,
        name: 'b',
        executor: async () => ({}),
      });
      a.addBranch('left', b);
      expect(a.getBranch('left')).toBe(b);
      expect(a.getBranch('right')).toBeUndefined();
    });
  });
});

describe('StepChainBuilder', () => {
  it('builds a fully configured AsyncStepChain', () => {
    const chain = new StepChainBuilder()
      .id('import-1')
      .stepId('import' as any)
      .name('视频导入')
      .phase(StepPhase.PRE)
      .direction(ChainDirection.FORWARD)
      .maxRetries(3)
      .retryDelayMs(500)
      .parallelKeys(['a', 'b'])
      .executor(async () => ({ ok: true }) as StepOutput)
      .build();

    expect(chain.id).toBe('import-1');
    expect(chain.name).toBe('视频导入');
    expect(chain.phase).toBe(StepPhase.PRE);
    expect(chain.maxRetries).toBe(3);
    expect(chain.retryDelayMs).toBe(500);
    expect(chain.parallelKeys).toEqual(['a', 'b']);
  });

  it('applies default values when not specified', () => {
    const chain = new StepChainBuilder()
      .id('minimal')
      .stepId('import' as any)
      .name('minimal')
      .executor(async () => ({ ok: true }) as StepOutput)
      .build();

    expect(chain.phase).toBe(StepPhase.EXEC);
    expect(chain.direction).toBe(ChainDirection.FORWARD);
    expect(chain.maxRetries).toBe(0);
    expect(chain.retryDelayMs).toBe(1000);
  });
});
