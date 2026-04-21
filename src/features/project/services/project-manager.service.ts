/**
 * Project Manager Service
 * Standalone project management with local storage (no n8n dependency)
 */

import { v4 as uuidv4 } from 'uuid';
import type { Project, Episode, ProjectSettings, WorkflowExecutionStatus } from './project.types';
import { logger } from '@/core/utils/logger';

// Generate unique IDs
const generateId = () => uuidv4();

class ProjectManagerService {
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.projects.values());
      localStorage.setItem('plotcraft-project-manager', JSON.stringify(data));
    } catch (e) {
      logger.error('Failed to save project manager data:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('plotcraft-project-manager');
      if (data) {
        const projects = JSON.parse(data) as Project[];
        projects.forEach(p => this.projects.set(p.id, p));
      }
    } catch (e) {
      logger.error('Failed to load project manager data:', e);
    }
  }

  /**
   * Create a new project
   */
  createProject(name: string, description?: string, settings?: Partial<ProjectSettings>): Project {
    const project: Project = {
      id: generateId(),
      name,
      description,
      episodes: [],
      settings: {
        defaultProvider: 'openai',
        defaultModel: 'gpt-4',
        defaultQuality: 'high',
        defaultResolution: '1920x1080',
        defaultFps: 30,
        ...settings
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.set(project.id, project);
    this.saveToStorage();
    return project;
  }

  /**
   * Get project by ID
   */
  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  /**
   * Get all projects
   */
  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  /**
   * Update project
   */
  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updated = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.projects.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Delete project
   */
  deleteProject(id: string): boolean {
    const result = this.projects.delete(id);
    if (result) this.saveToStorage();
    return result;
  }

  /**
   * Add episode to project
   */
  addEpisode(projectId: string, title: string, chapterStart: number, chapterEnd: number): Episode | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const episode: Episode = {
      id: generateId(),
      projectId,
      episodeNumber: project.episodes.length + 1,
      title,
      chapterStart,
      chapterEnd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    project.episodes.push(episode);
    project.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return episode;
  }

  /**
   * Update episode
   */
  updateEpisode(projectId: string, episodeId: string, updates: Partial<Episode>): Episode | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const episodeIndex = project.episodes.findIndex(e => e.id === episodeId);
    if (episodeIndex === -1) return undefined;

    project.episodes[episodeIndex] = {
      ...project.episodes[episodeIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    project.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return project.episodes[episodeIndex];
  }

  /**
   * Delete episode
   */
  deleteEpisode(projectId: string, episodeId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const initialLength = project.episodes.length;
    project.episodes = project.episodes.filter(e => e.id !== episodeId);

    if (project.episodes.length < initialLength) {
      project.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Get episode
   */
  getEpisode(projectId: string, episodeId: string): Episode | undefined {
    const project = this.projects.get(projectId);
    return project?.episodes.find(e => e.id === episodeId);
  }

  /**
   * Get episodes for a project
   */
  getEpisodes(projectId: string): Episode[] {
    return this.projects.get(projectId)?.episodes || [];
  }

  /**
   * Update episode workflow status
   */
  updateEpisodeWorkflowStatus(
    projectId: string,
    episodeId: string,
    workflowId: string,
    status: WorkflowExecutionStatus
  ): Episode | undefined {
    return this.updateEpisode(projectId, episodeId, { workflowId, workflowStatus: status });
  }

  /**
   * Set episode output
   */
  setEpisodeOutput(projectId: string, episodeId: string, output: { video?: string; images?: string[] }): Episode | undefined {
    return this.updateEpisode(projectId, episodeId, {
      outputVideo: output.video,
      outputImages: output.images
    });
  }

  /**
   * Create episodes from chapters
   */
  createEpisodesFromChapters(
    projectId: string,
    chapters: Array<{ title: string; chapterStart: number; chapterEnd: number }>
  ): Episode[] {
    return chapters.map((ch, index) => {
      const episode = this.addEpisode(projectId, ch.title, ch.chapterStart, ch.chapterEnd);
      if (episode) {
        // Update episode number
        this.updateEpisode(projectId, episode.id, { episodeNumber: index + 1 });
        return this.getEpisode(projectId, episode.id)!;
      }
      throw new Error('Failed to create episode');
    });
  }

  /**
   * Import project from data
   */
  importProject(projectData: Project, options?: { overwrite?: boolean }): Project {
    const existing = this.getProject(projectData.id);
    if (existing && options?.overwrite) {
      this.deleteProject(projectData.id);
    }
    return this.createProject(
      projectData.name,
      projectData.description,
      projectData.settings
    );
  }

  /**
   * Export project to data
   */
  exportProject(projectId: string): Project | undefined {
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
