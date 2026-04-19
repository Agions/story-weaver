/**
 * Project Service
 * Main service for project management
 */

import { v4 as uuidv4 } from 'uuid';
import type { Project, Episode, ProjectSettings, WorkflowExecutionStatus } from './project.types';

// Generate unique IDs
const generateId = () => uuidv4();

// ========== Project Service ==========
class ProjectService {
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ========== Storage ==========
  private saveToStorage(): void {
    try {
      const data = Array.from(this.projects.values());
      localStorage.setItem('plotcraft-projects', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save projects:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('plotcraft-projects');
      if (data) {
        const projects = JSON.parse(data) as Project[];
        projects.forEach(p => this.projects.set(p.id, p));
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  }

  // ========== CRUD ==========
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

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

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

  deleteProject(id: string): boolean {
    const result = this.projects.delete(id);
    if (result) this.saveToStorage();
    return result;
  }

  // ========== Episode CRUD ==========
  addEpisode(projectId: string, episode: Omit<Episode, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Episode | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const newEpisode: Episode = {
      id: generateId(),
      projectId,
      ...episode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    project.episodes.push(newEpisode);
    project.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return newEpisode;
  }

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

  getEpisode(projectId: string, episodeId: string): Episode | undefined {
    const project = this.projects.get(projectId);
    return project?.episodes.find(e => e.id === episodeId);
  }

  // ========== Workflow Integration ==========
  updateEpisodeWorkflow(projectId: string, episodeId: string, workflowId: string, status?: WorkflowExecutionStatus): Episode | undefined {
    return this.updateEpisode(projectId, episodeId, { workflowId, workflowStatus: status });
  }

  setEpisodeOutput(projectId: string, episodeId: string, output: { video?: string; images?: string[] }): Episode | undefined {
    return this.updateEpisode(projectId, episodeId, {
      outputVideo: output.video,
      outputImages: output.images
    });
  }
}

// Singleton instance
let projectService: ProjectService | null = null;

export function getProjectService(): ProjectService {
  if (!projectService) {
    projectService = new ProjectService();
  }
  return projectService;
}

export default ProjectService;
