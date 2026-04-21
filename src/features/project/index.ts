/**
 * features/project/index.ts
 * Project feature exports - no n8n dependency
 */

// Services
export { default as ProjectService, getProjectService } from './services/project.service';
export { default as ProjectImportExportService } from './services/project-import-export.service';
export { default as ProjectManagerService, getProjectManager } from './services/project-manager.service';

// Types
export type {
  Project,
  Episode,
  ProjectSettings,
  WorkflowExecutionStatus,
  ProjectData,
  EpisodeData,
  ExportFormat,
  ProjectExportData,
  ImportOptions,
  ExportOptions
} from './services/project.types';
