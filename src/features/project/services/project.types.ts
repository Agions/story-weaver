/**
 * Project Feature Types
 * Local type definitions (no n8n dependency)
 */

// Project data for import/export
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  novelId?: string;
  novelTitle?: string;
  totalChapters?: number;
  episodes: EpisodeData[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeData {
  id: string;
  projectId: string;
  episodeNumber: number;
  title: string;
  chapterStart: number;
  chapterEnd: number;
  workflowId?: string;
  outputVideo?: string;
  outputImages?: string[];
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
}

// Project Settings
export interface ProjectSettings {
  defaultProvider?: string;
  defaultModel?: string;
  defaultQuality?: 'low' | 'medium' | 'high';
  defaultResolution?: string;
  defaultFps?: number;
}

// Episode
export interface Episode {
  id: string;
  projectId: string;
  episodeNumber: number;
  title: string;
  chapterStart: number;
  chapterEnd: number;
  workflowId?: string;
  workflowStatus?: WorkflowExecutionStatus;
  outputVideo?: string;
  outputImages?: string[];
  createdAt?: string;
  updatedAt?: string;
  executedAt?: string;
}

// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  novelId?: string;
  novelTitle?: string;
  totalChapters?: number;
  episodes: Episode[];
  settings: ProjectSettings;
  createdAt?: string;
  updatedAt?: string;
}

// Workflow execution status (simplified)
export type WorkflowExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

// Export format types
export type ExportFormat = 'json' | 'zip';

// ProjectData in this file is the local 'import/export' variant
// (differs from shared/types/project.ts ProjectData which is the 'studio project' entity)
// 注: 与 core/services/project/project-import-export-types.ProjectExportData 字段一致
// 但 project 字段引用的 ProjectData 是 features 层的 import/export 业务变体
// 故保留独立定义, 字段相同但语义分层.
export interface ProjectExportData {
  version: string;
  exportedAt: string;
  project: ProjectData;
  metadata: {
    appVersion: string;
    format: ExportFormat;
    includesMedia: boolean;
  };
}

export type { ImportOptions } from '@/core/services/project/project-import-export-types';

export type { ExportOptions } from '@/core/services/project/project-import-export-types';
