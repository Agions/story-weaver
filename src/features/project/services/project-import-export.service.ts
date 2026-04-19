/**
 * Project Import/Export Service
 * Handles project serialization, import, and export
 */

import type { ProjectData, ExportFormat, ProjectExportData, ImportOptions, ExportOptions } from './project.types';

class ProjectImportExportService {
  private readonly CURRENT_VERSION = '2.0.0';
  private readonly MIN_SUPPORTED_VERSION = '1.0.0';

  /**
   * Export project to JSON
   */
  exportToJSON(project: ProjectData, options: Partial<ExportOptions> = {}): string {
    const exportData: ProjectExportData = {
      version: this.CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      project: this.prepareProjectForExport(project),
      metadata: {
        appVersion: '2.0.0',
        format: 'json',
        includesMedia: options.includeMedia ?? false
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import project from JSON
   */
  importFromJSON(jsonString: string, options: ImportOptions = {}): ProjectData {
    const data = JSON.parse(jsonString) as ProjectExportData;
    
    if (!this.validateImportData(data)) {
      throw new Error('Invalid project data format');
    }

    if (options.validate) {
      this.validateProjectData(data.project);
    }

    return data.project;
  }

  /**
   * Export project to ZIP (placeholder for actual zip logic)
   */
  exportToZIP(project: ProjectData, options: Partial<ExportOptions> = {}): Uint8Array {
    // In browser environment, would use JSZip or similar
    // For now, return a simple representation
    const jsonData = this.exportToJSON(project, options);
    const encoder = new TextEncoder();
    return encoder.encode(jsonData);
  }

  /**
   * Import project from ZIP data
   */
  importFromZIP(data: Uint8Array, options: ImportOptions = {}): ProjectData {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(data);
    return this.importFromJSON(jsonString, options);
  }

  /**
   * Prepare project data for export
   */
  private prepareProjectForExport(project: ProjectData): ProjectData {
    return {
      ...project,
      // Clean up any transient data
    };
  }

  /**
   * Validate import data structure
   */
  private validateImportData(data: unknown): data is ProjectExportData {
    if (!data || typeof data !== 'object') return false;
    
    const exportData = data as Record<string, unknown>;
    return (
      typeof exportData.version === 'string' &&
      typeof exportData.exportedAt === 'string' &&
      exportData.project !== undefined
    );
  }

  /**
   * Validate project data
   */
  private validateProjectData(project: unknown): void {
    if (!project || typeof project !== 'object') {
      throw new Error('Invalid project data');
    }

    const proj = project as Record<string, unknown>;
    
    if (typeof proj.id !== 'string') {
      throw new Error('Missing project ID');
    }
    if (typeof proj.name !== 'string') {
      throw new Error('Missing project name');
    }
  }

  /**
   * Get app version from export data
   */
  getAppVersion(exportData: ProjectExportData): string {
    return exportData.metadata.appVersion;
  }

  /**
   * Check if export version is compatible
   */
  isVersionCompatible(exportData: ProjectExportData): boolean {
    const version = exportData.version;
    const [maj] = version.split('.').map(Number);
    const [minMaj] = this.CURRENT_VERSION.split('.').map(Number);
    return maj === minMaj;
  }
}

// Singleton instance
let serviceInstance: ProjectImportExportService | null = null;

export function getProjectImportExportService(): ProjectImportExportService {
  if (!serviceInstance) {
    serviceInstance = new ProjectImportExportService();
  }
  return serviceInstance;
}

export default ProjectImportExportService;
