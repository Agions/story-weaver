/**
 * frame-fab AI - 工作流配置类型
 * 拆出 types 以减小 workflow-config.tsx 体积
 */

import type React from 'react';

export interface WorkflowStep {
  key: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  settings?: StepSetting[];
}

export interface StepSetting {
  key: string;
  label: string;
  type: 'select' | 'slider' | 'toggle' | 'input' | 'color';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  default: unknown;
}
