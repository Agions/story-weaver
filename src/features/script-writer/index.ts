/**
 * Script Writer Feature Slice
 *
 * 剧本生成垂直切片：聚合剧本模板 + 节奏参数 + AI 生成胶水。
 * 对应 pipeline 步骤: step-script
 *
 * @module features/script-writer
 */

import type { Script } from '@/shared/types/script';

// ========== 类型定义 ==========

/** 剧本节奏预设 */
export type ScriptPace = 'slow' | 'medium' | 'fast';

/** 剧本风格模板 */
export interface ScriptStyleTemplate {
  id: string;
  name: string;
  description: string;
  pace: ScriptPace;
  sceneDurationRange: [number, number]; // [min, max] seconds
  dialogueRatio: number; // 0-1, dialogue vs narration
  genre: string;
}

/** 剧本生成配置 */
export interface ScriptGenerationConfig {
  styleTemplateId?: string;
  pace?: ScriptPace;
  maxScenes?: number;
  targetDuration?: number;
  dialogueRatio?: number;
}

// ========== 默认模板 ==========

export const DEFAULT_SCRIPT_TEMPLATES: ScriptStyleTemplate[] = [
  {
    id: 'drama',
    name: '情感剧',
    description: '慢节奏，注重人物内心独白',
    pace: 'slow',
    sceneDurationRange: [15, 30],
    dialogueRatio: 0.7,
    genre: 'drama',
  },
  {
    id: 'action',
    name: '动作片',
    description: '快节奏，对话简短有力',
    pace: 'fast',
    sceneDurationRange: [5, 15],
    dialogueRatio: 0.3,
    genre: 'action',
  },
  {
    id: 'comedy',
    name: '喜剧',
    description: '中快节奏，幽默对话为主',
    pace: 'medium',
    sceneDurationRange: [8, 20],
    dialogueRatio: 0.6,
    genre: 'comedy',
  },
];

// ========== 服务胶水 ==========

/**
 * 根据节奏预设调整场景时长
 */
export function adjustScenePace(
  script: Script,
  pace: ScriptPace
): Script {
  const multipliers: Record<ScriptPace, number> = {
    slow: 1.5,
    medium: 1.0,
    fast: 0.6,
  };

  const multiplier = multipliers[pace] ?? 1.0;

  return {
    ...script,
    segments: script.segments.map((segment) => {
      const duration = segment.endTime - segment.startTime;
      const adjustedDuration = duration * multiplier;
      return {
        ...segment,
        startTime: segment.startTime,
        endTime: segment.startTime + adjustedDuration,
      };
    }),
  };
}

/**
 * 获取风格模板
 */
export function getStyleTemplate(templateId: string): ScriptStyleTemplate | undefined {
  return DEFAULT_SCRIPT_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * 列出所有风格模板
 */
export function listStyleTemplates(): ScriptStyleTemplate[] {
  return [...DEFAULT_SCRIPT_TEMPLATES];
}

// ========== 导出 ==========

export const scriptWriterService = {
  adjustScenePace,
  getStyleTemplate,
  listStyleTemplates,
};

export default scriptWriterService;
