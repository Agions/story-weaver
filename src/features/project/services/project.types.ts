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
export type WorkflowExecutionStatus = 
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'error';

// Export format types
export type ExportFormat = 'json' | 'zip';

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

export interface ImportOptions {
  merge?: boolean;
  overwrite?: boolean;
  validate?: boolean;
}

export interface ExportOptions {
  format: ExportFormat;
  includeMedia?: boolean;
  compress?: boolean;
  includeHistory?: boolean;
}
