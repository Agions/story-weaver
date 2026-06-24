/**
 * 基础检查 + 默认评分逻辑
 * =======================
 * 5 个 step_import/script/character/render/export 的基础检查 switch
 * + 4 个 step_analysis/script/storyboard/audio 的默认评分 switch。
 *
 * 抽成纯函数，QualityGate 类内部再调用。
 * 单一职责：评估逻辑，不含配置。
 */
import type { StepOutput, QualityGateResult } from '../types/autonomous.types';

// ============================================================================
// 基础检查
// ============================================================================

/**
 * 执行基础检查：空输出 / 步骤特定字段。
 * 返回 { passed, reason?, score }。
 */
export function performBasicChecks(
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

// ============================================================================
// 默认质量评分
// ============================================================================

/**
 * 计算默认质量分数（无需 LLM，纯规则）。
 * 4 个步骤：analysis / script / storyboard / audio。
 * 默认步骤返回 70。
 */
export function calculateDefaultScore(stepId: string, output: StepOutput): number {
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
 * 使用审核标准进行评分（占位：实际由 LLM 完成）。
 * 返回标记需要 LLM-based review。
 */
export function evaluateWithCriteriaPlaceholder(): QualityGateResult {
  return {
    passed: true, // 占位，实际由 SelfReviewLoop 决定
    details: 'Requires LLM-based review',
    score: 100,
  };
}
