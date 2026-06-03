/**
 * frame-fab AI - 工作流配置
 * 包含工作流步骤定义和注册表
 *
 * 类型定义在 workflow-config.types.ts
 * 各步骤配置在 workflow-settings.ts
 */

import { Upload, FileText, PlayCircle, Settings, Zap, Download, Image } from 'lucide-react';

import type { StepSetting, WorkflowStep } from './workflow-config.types';
import {
  IMPORT_SETTINGS,
  GENERATE_SETTINGS,
  STORYBOARD_SETTINGS,
  CHARACTER_SETTINGS,
  RENDER_SETTINGS,
  ANIMATE_SETTINGS,
  EXPORT_SETTINGS,
} from './workflow-settings';

// Re-export types 保持向后兼容
export type { WorkflowStep, StepSetting } from './workflow-config.types';

// 工作流步骤定义
export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    key: 'import',
    title: '📥 导入',
    icon: <Upload />,
    color: '#6366f1',
    description: '上传小说/漫画素材',
  },
  {
    key: 'generate',
    title: '🤖 生成',
    icon: <Zap />,
    color: '#8b5cf6',
    description: 'AI 智能生成内容',
  },
  {
    key: 'storyboard',
    title: '🎬 分镜',
    icon: <Image />,
    color: '#ec4899',
    description: 'AI 智能分镜设计',
  },
  {
    key: 'character',
    title: '👤 角色',
    icon: <FileText />,
    color: '#f59e0b',
    description: '角色形象设计',
  },
  {
    key: 'render',
    title: '🎨 渲染',
    icon: <PlayCircle />,
    color: '#10b981',
    description: '场景与角色渲染',
  },
];

// 导出所有配置
export const WORKFLOW_CONFIGS: Record<string, StepSetting[]> = {
  import: IMPORT_SETTINGS,
  generate: GENERATE_SETTINGS,
  storyboard: STORYBOARD_SETTINGS,
  character: CHARACTER_SETTINGS,
  render: RENDER_SETTINGS,
  animate: ANIMATE_SETTINGS,
  export: EXPORT_SETTINGS,
};
