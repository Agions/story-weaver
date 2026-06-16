/**
 * 视觉一致性评分服务共享类型与常量
 * @module core/services/video/visual-consistency-types
 */

import type { CharacterVideoRef } from '@/core/services/ai/image/image-generation/types';

/** 评估输入 */
export interface VisualConsistencyInput {
  /** 关键帧图像 URL 列表（按场景/时间顺序） */
  frameUrls: string[];
  /** 角色参考信息（含三视图 URL） */
  characterReferences: CharacterVideoRef[];
  /** 角色在三视图中的外观描述（用于 VLM 比对） */
  characterDescriptions?: Record<string, string>;
}

/** 单角色评分明细 */
export interface CharacterConsistencyScore {
  characterId: string;
  characterName: string;
  score: number; // 0-100
  frameScores: number[];
  notes: string[];
}

/** 评估结果 */
export interface VisualConsistencyResult {
  /** 总体一致性得分（0-100） */
  overallScore: number;
  /** 各角色得分明细 */
  characterScores: CharacterConsistencyScore[];
  /** 评估帧数 */
  framesEvaluated: number;
  /** 评估使用的模型 */
  model: string;
}

/** 默认 VLM 模型（与原 VisualConsistencyScorer 构造默认参数一致） */
export const DEFAULT_VLM_MODEL = 'vision';

/** 评分等级阈值（与原 evaluateWithVLM/Heuristic 内联三档一致） */
const SCORE_THRESHOLDS = {
  EXCELLENT: 80, // 角色外观一致性良好
  FAIR: 60, // 轻微差异
} as const;

/** 评分等级对应文案（消除 evaluateWithVLM / evaluateWithHeuristic 两处重复） */
const SCORE_NOTES = {
  EXCELLENT: '角色外观一致性良好',
  FAIR: '角色外观存在轻微差异',
  POOR: '角色外观差异明显',
} as const;

/** VLM 失败时的兜底分数（与原 compareFrameWithReference catch 分支一致） */
export const VLM_FALLBACK_SCORE = 50;

/** 启发式评分"无法提取特征"时的兜底分数（与原 evaluateByPromptMatch 一致） */
export const HEURISTIC_FALLBACK_SCORE = 75;

/** 启发式评分上限（与原 Math.min(90, ...) 一致） */
export const HEURISTIC_MAX_SCORE = 90;

/** 启发式评分基础分（与原 50 + keywordDensity * 20 一致） */
export const HEURISTIC_BASE_SCORE = 50;

/** 启发式评分关键词密度系数 */
export const HEURISTIC_DENSITY_COEFFICIENT = 20;

/** 启发式评分：平均 20 字符含多少关键词用于密度分母（与原 `promptLength / 20` 一致） */
export const HEURISTIC_PROMPT_CHUNK_SIZE = 20;

/** 构造"无参考图时基于描述"的 notes */
export const NO_REFERENCE_NOTE = '无参考图，基于角色描述关键词匹配评分';

/** 评价 model 标签 */
export const MODEL_HEURISTIC = 'heuristic';

/**
 * 构造一个空的评估结果
 */
export function createEmptyResult(model: string = 'none'): VisualConsistencyResult {
  return {
    overallScore: 0,
    characterScores: [],
    framesEvaluated: 0,
    model,
  };
}

/**
 * 根据分数返回评价文案（消除两处三档 if-else 重复）
 */
export function pickScoreNotes(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_NOTES.EXCELLENT;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_NOTES.FAIR;
  return SCORE_NOTES.POOR;
}
