/**
 * features/project/index.ts
 * Project feature exports
 */

// Services
export { default as ProjectService, getProjectService } from './services/project.service';
export { default as ProjectImportExportService, getProjectImportExportService } from './services/project-import-export.service';
export { default as ProjectManagerService, getProjectManager } from './services/project-manager.service';

// Re-export workflow types for convenience
export type {
  Project,
  Episode,
  ProjectSettings,
  WorkflowExecutionStatus,
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
export type {
  ProjectData,
  EpisodeData,
  ExportFormat,
  ProjectExportData,
  ImportOptions,
  ExportOptions
} from './services/project.types';
