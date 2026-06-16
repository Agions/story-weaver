/**
 * Legacy Types - Backward Compatibility
 * Extracted from src/shared/types/index.ts (lines 841-893)
 */

import type { AIModelSettings } from './ai.core';
import type { AIModelType } from './ai.models';

export interface AppSettings {
  autoSave: boolean;
  defaultAIModel?: AIModelType;
  aiModelsSettings: Partial<Record<AIModelType, AIModelSettings>>;
  theme?: 'light' | 'dark' | 'system';
}

// 注: 与 core/services/video/ffmpeg/types.VideoMetadata 字段相似但 optional/required 标记不同
// 保留独立定义以支持宽松语义 (codec/bitrate 可选)
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec?: string;
  bitrate?: number;
}

export interface SceneInfo {
  startTime: number;
  endTime: number;
  description: string;
  keyFrame?: string;
}

export interface AudioInfo {
  hasAudio: boolean;
  language?: string;
  transcript?: string;
}

export interface Timeline {
  segments: TimelineSegment[];
  duration: number;
}

export interface TimelineSegment {
  id: string;
  startTime: number;
  endTime: number;
  type: 'video' | 'audio' | 'text';
  data: unknown;
}

export interface ScriptGenerationOptions {
  style?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  purpose?: string;
}
