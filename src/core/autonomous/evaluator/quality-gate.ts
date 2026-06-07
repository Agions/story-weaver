/**
 * QualityGate — 质量门禁
 *
 * 每个 Pipeline Step 完成后，必须通过 QualityGate 判定质量。
 * 不合格的输出会触发 Self-Review Loop 进行自动修复。
 */

import type {
  QualityGateResult,
  QualityGateConfig,
  StepOutput,
  ReviewCriteria,
} from '../types/autonomous.types';

// ============================================================================
// 内置审核标准
// ============================================================================

/** 各步骤的默认审核标准 */
export const DEFAULT_REVIEW_CRITERIA: Record<string, ReviewCriteria> = {
  [/* IMPORT */ '']: {
    dimensions: ['completeness'],
    minScorePerDimension: 60,
    minTotalScore: 60,
    minPassedDimensions: 1,
  },
  script: {
    dimensions: ['completeness', 'consistency', 'visual_quality', 'duration_match', 'punch_point'],
    minScorePerDimension: 60,
    minTotalScore: 70,
    minPassedDimensions: 4,
  },
  character: {
    dimensions: ['completeness', 'consistency', 'visual_quality'],
    minScorePerDimension: 65,
    minTotalScore: 70,
    minPassedDimensions: 3,
  },
  storyboard: {
    dimensions: ['completeness', 'consistency', 'visual_quality', 'duration_match'],
    minScorePerDimension: 60,
    minTotalScore: 65,
    minPassedDimensions: 3,
  },
  render: {
    dimensions: ['completeness', 'visual_quality'],
    minScorePerDimension: 50, // 渲染允许更低，因为依赖 API 稳定性
    minTotalScore: 60,
    minPassedDimensions: 1,
  },
  audio: {
    dimensions: ['completeness', 'duration_match'],
    minScorePerDimension: 60,
    minTotalScore: 60,
    minPassedDimensions: 1,
  },
};

/** 各步骤的质量门禁默认配置 */
export const DEFAULT_QUALITY_GATE_CONFIG: Record<string, QualityGateConfig> = {
  import: {
    enabled: true,
    threshold: 60,
    onFail: 'stop',
    reviewConfig: { enabled: false, maxRetries: 0 },
  },
  analysis: {
    enabled: true,
    threshold: 60,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 2 },
  },
  script: {
    enabled: true,
    threshold: 70,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 3 },
  },
  character: {
    enabled: true,
    threshold: 70,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 3 },
  },
  scene: {
    enabled: true,
    threshold: 65,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 2 },
  },
  storyboard: {
    enabled: true,
    threshold: 65,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 3 },
  },
  render: {
    enabled: true,
    threshold: 60,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 2 },
  },
  video_edit: {
    enabled: true,
    threshold: 65,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 2 },
  },
  audio: {
    enabled: true,
    threshold: 60,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 2 },
  },
  subtitle: {
    enabled: true,
    threshold: 60,
    onFail: 'skip',
    reviewConfig: { enabled: false, maxRetries: 0 },
  },
  export: {
    enabled: true,
    threshold: 70,
    onFail: 'retry',
    reviewConfig: { enabled: true, maxRetries: 3 },
  },
};

// ============================================================================
// QualityGate 类
// ============================================================================

export class QualityGate {
  private config: QualityGateConfig;

  constructor(config: QualityGateConfig) {
    this.config = {
      ...config,
      enabled: config.enabled ?? true,
      threshold: config.threshold ?? 70,
      onFail: config.onFail ?? 'retry',
    };
  }

  /**
   * 评估 Step 输出质量
   */
  evaluate(stepId: string, output: StepOutput, criteria?: ReviewCriteria): QualityGateResult {
    if (!this.config.enabled) {
      return {
        passed: true,
        details: 'Quality gate disabled',
        score: 100,
      };
    }

    // 基础检查
    const basicCheck = this.performBasicChecks(stepId, output);
    if (!basicCheck.passed) {
      return {
        passed: false,
        details: basicCheck.reason ?? 'Basic check failed',
        score: basicCheck.score,
      };
    }

    // 如果有自定义 criteria，进行评分
    if (criteria) {
      return this.evaluateWithCriteria(stepId, output, criteria);
    }

    // 使用默认规则
    const score = this.calculateDefaultScore(stepId, output);
    const passed = score >= this.config.threshold;

    return {
      passed,
      details: passed
        ? `Quality score ${score} meets threshold ${this.config.threshold}`
        : `Quality score ${score} below threshold ${this.config.threshold}`,
      score,
    };
  }

  /**
   * 执行基础检查
   */
  private performBasicChecks(
    stepId: string,
    output: StepOutput
  ): {
    passed: boolean;
    reason?: string;
    score: number;
  } {
    // 空输出检查
    if (!output || Object.keys(output).length === 0) {
      return { passed: false, reason: 'Empty output', score: 0 };
    }

    // 步骤特定检查
    switch (stepId) {
      case 'step_import': {
        const chapters = output.chapters as Array<unknown> | undefined;
        if (!chapters || chapters.length === 0) {
          return { passed: false, reason: 'No chapters found in import', score: 0 };
        }
        const wordCount = (output.metadata as Record<string, unknown>)?.wordCount as
          | number
          | undefined;
        if (!wordCount || wordCount < 100) {
          return { passed: false, reason: 'Word count too low (<100)', score: 30 };
        }
        return { passed: true, score: 80 };
      }

      case 'step_script': {
        const scenes = output.scenes as Array<unknown> | undefined;
        if (!scenes || scenes.length < 3) {
          return { passed: false, reason: 'Insufficient scenes (<3)', score: 20 };
        }
        const totalDuration = output.totalDuration as number | undefined;
        if (!totalDuration || totalDuration < 60) {
          return { passed: false, reason: 'Total duration too short (<60s)', score: 40 };
        }
        return { passed: true, score: 75 };
      }

      case 'step_character': {
        const characters = output.characters as Array<unknown> | undefined;
        if (!characters || characters.length === 0) {
          return { passed: false, reason: 'No characters found', score: 0 };
        }
        return { passed: true, score: 80 };
      }

      case 'step_render': {
        const renderedFrames = output.renderedFrames as Array<unknown> | undefined;
        const totalFrames = output.totalFrames as number | undefined;
        if (!renderedFrames || !totalFrames) {
          return { passed: false, reason: 'Render output missing', score: 0 };
        }
        const successRate = renderedFrames.length / totalFrames;
        if (successRate < 0.5) {
          return {
            passed: false,
            reason: `Success rate too low (${(successRate * 100).toFixed(0)}%)`,
            score: 30,
          };
        }
        return { passed: true, score: Math.round(successRate * 100) };
      }

      case 'step_export': {
        const outputPath = output.outputPath as string | undefined;
        if (!outputPath) {
          return { passed: false, reason: 'No output file path', score: 0 };
        }
        return { passed: true, score: 100 };
      }

      default:
        return { passed: true, score: 70 };
    }
  }

  /**
   * 使用审核标准进行评分
   */
  private evaluateWithCriteria(
    _stepId: string,
    _output: StepOutput,
    _criteria: ReviewCriteria
  ): QualityGateResult {
    // 实际评分由 SelfReviewLoop 调用 LLM 完成
    // 此处仅作占位，返回需要 LLM 审核的标记
    return {
      passed: true, // 占位，实际由 SelfReviewLoop 决定
      details: 'Requires LLM-based review',
      score: 100,
    };
  }

  /**
   * 计算默认质量分数
   */
  private calculateDefaultScore(stepId: string, output: StepOutput): number {
    switch (stepId) {
      case 'step_analysis': {
        const characters = output.characters as Array<unknown> | undefined;
        const scenes = output.scenes as Array<unknown> | undefined;
        let score = 50;
        if (characters && characters.length > 0) score += 20;
        if (scenes && scenes.length > 0) score += 20;
        return score;
      }

      case 'step_script': {
        const scenes = output.scenes as Array<unknown> | undefined;
        let score = 50;
        if (scenes && scenes.length >= 5) score += 25;
        else if (scenes && scenes.length >= 3) score += 15;
        const totalDuration = output.totalDuration as number | undefined;
        if (totalDuration && totalDuration >= 300 && totalDuration <= 1800) score += 15;
        return score;
      }

      case 'step_storyboard': {
        const shots = output.shots as Array<unknown> | undefined;
        let score = 50;
        if (shots && shots.length >= 4) score += 30;
        else if (shots && shots.length >= 2) score += 15;
        return score;
      }

      case 'step_audio': {
        const duration = output.duration as number | undefined;
        const targetDuration = output.targetDuration as number | undefined;
        let score = 60;
        if (duration && targetDuration) {
          const deviation = Math.abs(duration - targetDuration) / targetDuration;
          if (deviation < 0.05) score += 30;
          else if (deviation < 0.1) score += 20;
          else if (deviation < 0.2) score += 10;
          else score -= 20;
        }
        return Math.max(0, Math.min(100, score));
      }

      default:
        return 70;
    }
  }

  /**
   * 获取 onFail 处理策略
   */
  getOnFailStrategy(): 'retry' | 'skip' | 'stop' {
    return this.config.onFail;
  }

  /**
   * 是否启用自审
   */
  isSelfReviewEnabled(): boolean {
    return this.config.reviewConfig?.enabled ?? false;
  }

  /**
   * 获取最大自审次数
   */
  getMaxReviewRetries(): number {
    return this.config.reviewConfig?.maxRetries ?? 2;
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

export function createQualityGate(stepId: string): QualityGate {
  const config = DEFAULT_QUALITY_GATE_CONFIG[stepId] ?? {
    enabled: true,
    threshold: 65,
    onFail: 'retry' as const,
    reviewConfig: { enabled: true, maxRetries: 2 },
  };
  return new QualityGate(config);
}
