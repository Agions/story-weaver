/**
 * QualityGate Smoke Test
 * 验证：默认审核标准、构造器、eval API 行为
 */
import {
  QualityGate,
  createQualityGate,
  DEFAULT_REVIEW_CRITERIA,
  DEFAULT_QUALITY_GATE_CONFIG,
} from '../../../core/autonomous/evaluator/quality-gate';

describe('QualityGate', () => {
  describe('default review criteria', () => {
    it('exposes DEFAULT_REVIEW_CRITERIA for known stepIds', () => {
      expect(DEFAULT_REVIEW_CRITERIA.script).toBeDefined();
      expect(DEFAULT_REVIEW_CRITERIA.character).toBeDefined();
      expect(DEFAULT_REVIEW_CRITERIA.storyboard).toBeDefined();
      expect(DEFAULT_REVIEW_CRITERIA.render).toBeDefined();
    });

    it('exposes DEFAULT_QUALITY_GATE_CONFIG map', () => {
      expect(DEFAULT_QUALITY_GATE_CONFIG).toBeDefined();
      expect(typeof DEFAULT_QUALITY_GATE_CONFIG).toBe('object');
    });
  });

  describe('factory', () => {
    it('createQualityGate returns QualityGate instance', () => {
      const gate = createQualityGate('script');
      expect(gate).toBeInstanceOf(QualityGate);
    });
  });

  describe('construction', () => {
    it('accepts a QualityGateConfig', () => {
      const gate = new QualityGate({
        enabled: true,
        threshold: 70,
        onFail: 'retry',
      });
      expect(gate).toBeInstanceOf(QualityGate);
    });

    it('defaults enabled/threshold/onFail when omitted', () => {
      const gate = new QualityGate({} as any);
      expect(gate).toBeInstanceOf(QualityGate);
    });
  });

  describe('evaluate()', () => {
    it('returns passed=true when gate is disabled (regardless of output)', () => {
      const gate = new QualityGate({ enabled: false } as any);
      const result = gate.evaluate('script', {} as any);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it('returns a result object with passed + score fields', () => {
      const gate = new QualityGate({ enabled: true, threshold: 70 } as any);
      const result = gate.evaluate('script', { data: 'hello' } as any);
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(typeof result.score).toBe('number');
    });
  });
});
