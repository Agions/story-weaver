/**
 * Quality Gate 配置集中
 * =====================
 * 两个大字典：DEFAULT_REVIEW_CRITERIA + DEFAULT_QUALITY_GATE_CONFIG
 * 从 quality-gate.ts 中抽出，便于维护和更新阈值。
 * 单一职责：配置字典，无逻辑。
 */
import type { QualityGateConfig, ReviewCriteria } from '../types/autonomous.types';

// ============================================================================
// 各步骤的默认审核标准
// ============================================================================

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
    minScorePerDimension: 50,
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

// ============================================================================
// 各步骤的质量门禁默认配置
// ============================================================================

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
  'video-edit': {
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

/** 工厂 fallback 配置（未知 stepId 时） */
export const FALLBACK_GATE_CONFIG: QualityGateConfig = {
  enabled: true,
  threshold: 65,
  onFail: 'retry',
  reviewConfig: { enabled: true, maxRetries: 2 },
};
