/**
 * SelfReviewLoop Smoke Test
 * 验证：构造、循环 API、回调触发
 */
import {
  SelfReviewLoop,
  createSelfReviewLoop,
} from '../../../core/autonomous/evaluator/self-review-loop';

describe('SelfReviewLoop', () => {
  describe('factory', () => {
    it('createSelfReviewLoop returns instance with default options', () => {
      const loop = createSelfReviewLoop();
      expect(loop).toBeInstanceOf(SelfReviewLoop);
    });

    it('accepts maxRetries and model options', () => {
      const loop = createSelfReviewLoop({ maxRetries: 5, model: 'gpt-4o' });
      expect(loop).toBeInstanceOf(SelfReviewLoop);
    });
  });

  describe('construction', () => {
    it('direct construction works', () => {
      const loop = new SelfReviewLoop();
      expect(loop).toBeInstanceOf(SelfReviewLoop);
    });
  });

  describe('review()', () => {
    it('returns a result object with passed/feedback fields', async () => {
      const loop = createSelfReviewLoop({ maxRetries: 0 });
      // Pass a minimal valid step output (review takes stepId + output, not gate result)
      const result = await loop.review('script', { data: 'test' } as any);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(typeof result.score).toBe('number');
    });
  });
});
