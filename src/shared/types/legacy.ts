/**
 * Legacy Types - Backward Compatibility
 * Extracted from src/shared/types/index.ts (lines 841-893)
 */

import type { AIModelSettings } from './ai-core';

type AIModelType = string;

export interface AppSettings {
  autoSave: boolean;
  defaultAIModel?: AIModelType;
  aiModelsSettings: Partial<Record<AIModelType, AIModelSettings>>;
  theme?: 'light' | 'dark' | 'system';
}

/** 视频元信息 — 宽松版本（codec/bitrate 可选），供遗留消费者使用。 */
export type VideoMetadata = import('@/shared/types/video-composition-types').VideoMetadata & {
  codec?: string;
  bitrate?: number;
};

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
