/**
 * Project Types
 * Extracted from src/shared/types/index.ts
 */

import type { EvaluationScores } from '@/core/services';

import type { AudioTrackConfig } from './audio';
import type { CompositionProject, ExportSettings } from './composition';
import type { Character } from './novel';
import type { Script } from './script';
import type { StoryboardFrame } from './storyboard';

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status?: 'draft' | 'processing' | 'completed' | 'failed';
  content?: string;
  videos?: {
    id: string;
    path?: string;
    name: string;
    duration?: number;
    width?: number;
    height?: number;
    fps?: number;
    format?: string;
    size?: number;
    thumbnail?: string;
    createdAt?: string;
  }[];
  scripts?: Script[];
  settings?: ProjectSettings;
  createdAt: string;
  updatedAt: string;
  metadata?: unknown;
  keyFrames?: string[];
  coverImage?: string;
  videoPath?: string;
  thumbnail?: string;
  novelMetadata?: unknown;
  storyboardComments?: unknown[];
  storyboardVersions?: unknown[];
  // Extended properties used by ProjectDetailPage / ProjectEditPage
  storyboardFrames?: StoryboardFrame[];
  characters?: Character[];
  composition?: CompositionProject;
  audioConfig?: AudioTrackConfig;
  evaluationSummary?: EvaluationScores;
  evaluationReport?: { summary?: EvaluationScores };
  // Export preferences
  exportPreset?: '9:16' | '16:9' | '1:1';
  exportSettings?: Partial<ExportSettings>;
  // Pipeline progress tracking
  currentStep?: PipelineStep;
}

export interface ProjectSettings {
  videoQuality?: 'low' | 'medium' | 'high';
  outputFormat?: 'mp4' | 'webm' | 'gif';
  resolution?: '480p' | '720p' | '1080p' | '4k';
  frameRate?: number;
  audioCodec?: string;
  videoCodec?: string;
  subtitleEnabled?: boolean;
  subtitleStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    outline?: boolean;
    outlineColor?: string;
    position?: 'top' | 'bottom' | 'center';
    alignment?: 'left' | 'center' | 'right';
  };
}

// Pipeline step tracking
export type PipelineStep =
  | 'import'
  | 'analysis'
  | 'script'
  | 'character'
  | 'storyboard'
  | 'render'
  | 'video_editing'
  | 'export';

/**
 * Task status (used by hooks/stores; previously lived in @/core/types).
 */
export type TaskStatus = {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * User preferences bag (used by user.store; previously @/core/types).
 */
export interface UserPreferences {
  [key: string]: unknown;
}

/**
 * Script generation template (used by useWorkflow; previously @/core/types).
 */
export interface ScriptTemplate {
  id: string;
  name: string;
  description?: string;
  content?: string;
}
