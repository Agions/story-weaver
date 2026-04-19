/**
 * Project Feature Types
 */

// Re-export workflow types for convenience
export type {
  Project,
  Episode,
  ProjectSettings,
  WorkflowExecutionStatus
} from '@/core/services/n8n-workflow/types';

export type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowConnection,
  NodeExecutionResult,
  NodeExecutionStatus,
  NodeConfig,
  NodeTemplate,
  NodeCategory,
  MangaNodeType,
  WorkflowSettings,
  WorkflowTemplate
} from '@/core/services/n8n-workflow/types';

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
