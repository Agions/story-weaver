/**
 * frame-fab Autonomous Mode — Core Types
 * 全自动 AI 漫剧制作系统的核心类型定义
 */

// ============================================================================
// 运行模式
// ============================================================================

/** 当前 Pipeline 状态 */
export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/** 质量等级 */
export type QualityLevel = 'fast' | 'balanced' | 'premium';

/** 漫剧风格 */
export type MangaStyle = '2d' | '3d' | 'anime' | 'realistic';

// ============================================================================
// 输入/输出
// ============================================================================

/** 全自动 Pipeline 输入 */
export interface AutoPipelineInput {
  /** 原材料内容 */
  content: string;
  /** 输入类型 */
  mode: 'novel' | 'script' | 'prompt';
  /** 项目标题（可选） */
  title?: string;
  /** 风格选择 */
  style?: MangaStyle;
  /** 质量等级 */
  qualityLevel?: QualityLevel;
  /** 目标时长（分钟，可选） */
  targetDuration?: number;
  /** 语言 */
  language?: 'zh' | 'en';
  /** 是否启用自审循环 */
  enableSelfReview?: boolean;
  /** 最大自审循环次数 */
  maxReviewRetries?: number;
}

/** 全自动 Pipeline 最终结果 */
export interface AutoPipelineResult {
  /** 是否成功 */
  success: boolean;
  /** 最终输出文件路径 */
  outputPath?: string;
  /** 生成的视频时长（秒） */
  duration?: number;
  /** 分辨率 */
  resolution?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 各步骤耗时 */
  stepDurations?: Record<string, number>;
  /** 错误信息 */
  error?: string;
  /** 生成的场景数 */
  sceneCount?: number;
  /** 生成的角色数 */
  characterCount?: number;
  /** 渲染帧数 */
  renderedFrames?: number;
}

// ============================================================================
// Step 状态
// ============================================================================

/** 单步状态 */
export interface StepState {
  stepId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'reviewing';
  progress: number; // 0-100
  message?: string;
  startedAt?: number;
  completedAt?: number;
  reviewCount: number;
  error?: string;
  output?: StepOutput;
}

/** Step 输出（通用） */
export interface StepOutput {
  [key: string]: unknown;
}

// ============================================================================
// Self-Review Loop
// ============================================================================

/** 自审结果 */
export interface ReviewResult {
  /** 是否通过 */
  passed: boolean;
  /** 评分（0-100） */
  score: number;
  /** 审核维度评分 */
  dimensions: ReviewDimensionScore[];
  /** 不合格原因列表 */
  reasons: string[];
  /** 修复建议 */
  suggestions: string[];
}

/** 审核维度评分 */
export interface ReviewDimensionScore {
  dimension: ReviewDimension;
  score: number;
  passed: boolean;
  detail: string;
}

/** 审核维度枚举 */
export type ReviewDimension =
  | 'completeness' // 完整性
  | 'consistency' // 一致性
  | 'visual_quality' // 画面感
  | 'duration_match' // 时长匹配
  | 'punch_point'; // 情绪爆点

/** 审核标准配置 */
export interface ReviewCriteria {
  dimensions: ReviewDimension[];
  /** 每维度最低分 */
  minScorePerDimension: number;
  /** 综合最低分 */
  minTotalScore: number;
  /** 最低通过维度数 */
  minPassedDimensions: number;
}

// ============================================================================
// Quality Gate
// ============================================================================

/** 质量门禁判定结果 */
export interface QualityGateResult {
  /** 是否通过 */
  passed: boolean;
  /** 判定详情 */
  details: string;
  /** 质量评分 */
  score: number;
  /** 是否触发降级 */
  degraded?: boolean;
  /** 降级原因 */
  degradationReason?: string;
}

/** 质量门禁配置 */
export interface QualityGateConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 评分阈值 */
  threshold: number;
  /** 失败处理策略 */
  onFail: 'retry' | 'skip' | 'stop';
  /** 自审配置 */
  reviewConfig?: {
    enabled: boolean;
    maxRetries: number;
  };
}

// ============================================================================
// Pipeline 事件
// ============================================================================

/** Pipeline 事件类型 */
export type PipelineEventType =
  | 'step_start'
  | 'step_progress'
  | 'step_complete'
  | 'step_fail'
  | 'step_review_start'
  | 'step_review_complete'
  | 'quality_gate_pass'
  | 'quality_gate_fail'
  | 'pipeline_start'
  | 'pipeline_complete'
  | 'pipeline_fail'
  | 'pipeline_pause'
  | 'pipeline_resume'
  | 'pipeline_cancel';

/** Pipeline 事件 */
export interface PipelineEvent {
  type: PipelineEventType;
  timestamp: number;
  stepId?: string;
  progress?: number;
  message?: string;
  data?: unknown;
  error?: string;
}

/** Pipeline 事件处理器 */
export interface PipelineEventHandler {
  onStepStart?: (stepId: string) => void;
  onStepProgress?: (stepId: string, progress: number, message?: string) => void;
  onStepComplete?: (stepId: string, output: StepOutput) => void;
  onStepFail?: (stepId: string, error: string) => void;
  onStepReviewStart?: (stepId: string, attempt: number) => void;
  onStepReviewComplete?: (stepId: string, result: ReviewResult) => void;
  onQualityGate?: (stepId: string, result: QualityGateResult) => void;
  onPipelineStart?: () => void;
  onPipelineComplete?: (result: AutoPipelineResult) => void;
  onPipelineFail?: (error: string) => void;
  onPipelinePause?: () => void;
  onPipelineResume?: () => void;
  onPipelineCancel?: () => void;
}

// ============================================================================
// 检查点
// ============================================================================

/** Step 检查点 */
export interface StepCheckpoint {
  stepId: string;
  completed: boolean;
  data: StepOutput;
  output?: StepOutput;
  reviewCount: number;
  retryIndex: number;
  timestamp: number;
}

/** Pipeline 检查点 */
export interface PipelineCheckpoint {
  pipelineId: string;
  status: PipelineStatus;
  currentStepId?: string;
  steps: Record<string, StepCheckpoint>;
  input: AutoPipelineInput;
  startedAt: number;
  updatedAt: number;
}

// ============================================================================
// 步骤定义
// ============================================================================

/** 步骤 ID 枚举（kebab-case 与 core/pipeline/pipeline.types.ts 对齐） */
export enum PipelineStepId {
  IMPORT = 'step-import',
  ANALYSIS = 'step-analysis',
  SCRIPT = 'step-script',
  CHARACTER = 'step-character',
  SCENE = 'step-scene',
  STORYBOARD = 'step-storyboard',
  RENDER = 'step-render',
  VIDEO_EDIT = 'step-video-edit',
  AUDIO = 'step-audio',
  SUBTITLE = 'step-subtitle',
  EXPORT = 'step-export',
}

/** 步骤配置 */
export interface StepConfig {
  id: string;
  name: string;
  stepId: PipelineStepId;
  enabled: boolean;
  maxRetries: number;
  timeout: number; // ms
  /** 自审配置 */
  reviewConfig?: {
    enabled: boolean;
    criteria: ReviewCriteria;
    maxRetries: number;
  };
  /** 质量门禁配置 */
  qualityGate?: QualityGateConfig;
  /** 依赖步骤 */
  dependencies?: PipelineStepId[];
}
