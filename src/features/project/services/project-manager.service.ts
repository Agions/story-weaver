/**
 * Project Manager Service
 * Wrapper around n8n-workflow project management with additional functionality
 */

import { v4 as uuidv4 } from 'uuid';
import type { Project, Episode, ProjectSettings } from './project.types';

// Re-export from n8n-workflow
export { 
  projectManager as n8nProjectManager,
  type Project,
  type Episode,
  type ProjectSettings 
} from '@/core/services/n8n-workflow';

import { 
  projectManager as n8nProjectManager,
  type Project as N8NProject,
  type Episode as N8NEpisode,
  type ProjectSettings as N8NProjectSettings
} from '@/core/services/n8n-workflow';

// Generate unique IDs
const generateId = () => uuidv4();

class ProjectManagerService {
  /**
   * Create a new project
   */
  createProject(name: string, description?: string, settings?: Partial<ProjectSettings>): N8NProject {
    return n8nProjectManager.createProject(name, description, settings);
  }

  /**
   * Get project by ID
   */
  getProject(id: string): N8NProject | undefined {
    return n8nProjectManager.getProject(id);
  }

  /**
   * Get all projects
   */
  getAllProjects(): N8NProject[] {
    return n8nProjectManager.getAllProjects();
  }

  /**
   * Update project
   */
  updateProject(id: string, updates: Partial<N8NProject>): N8NProject | undefined {
    return n8nProjectManager.updateProject(id, updates);
  }

  /**
   * Delete project
   */
  deleteProject(id: string): boolean {
    return n8nProjectManager.deleteProject(id);
  }

  /**
   * Add episode to project
   */
  addEpisode(projectId: string, title: string, chapterStart: number, chapterEnd: number): N8NEpisode | undefined {
    return n8nProjectManager.addEpisode(projectId, title, chapterStart, chapterEnd);
  }

  /**
   * Update episode
   */
  updateEpisode(projectId: string, episodeId: string, updates: Partial<N8NEpisode>): N8NEpisode | undefined {
    return n8nProjectManager.updateEpisode(projectId, episodeId, updates);
  }

  /**
   * Delete episode
   */
  deleteEpisode(projectId: string, episodeId: string): boolean {
    return n8nProjectManager.deleteEpisode(projectId, episodeId);
  }

  /**
   * Get episode
   */
  getEpisode(projectId: string, episodeId: string): N8NEpisode | undefined {
    return n8nProjectManager.getEpisode(projectId, episodeId);
  }

  /**
   * Update episode workflow status
   */
  updateEpisodeWorkflowStatus(
    projectId: string,
    episodeId: string,
    workflowId: string,
    status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
  ): N8NEpisode | undefined {
    return n8nProjectManager.updateEpisodeWorkflowStatus(projectId, episodeId, workflowId, status);
  }

  /**
   * Set episode output
   */
  setEpisodeOutput(projectId: string, episodeId: string, output: { video?: string; images?: string[] }): N8NEpisode | undefined {
    return n8nProjectManager.setEpisodeOutput(projectId, episodeId, output);
  }

  /**
   * Import project from data
   */
  importProject(projectData: N8NProject, options?: { overwrite?: boolean }): N8NProject {
    const existing = this.getProject(projectData.id);
    if (existing && options?.overwrite) {
      this.deleteProject(projectData.id);
    }
    return n8nProjectManager.createProject(projectData.name, projectData.description, projectData.settings);
  }

  /**
   * Export project to data
   */
  exportProject(projectId: string): N8NProject | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    return {
      ...project,
      episodes: [...project.episodes]
    };
  }
}

// Singleton instance
let managerInstance: ProjectManagerService | null = null;

export function getProjectManager(): ProjectManagerService {
  if (!managerInstance) {
    managerInstance = new ProjectManagerService();
  }
  return managerInstance;
}

export default ProjectManagerService;
