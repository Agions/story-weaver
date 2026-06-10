/**
 * 项目本地存储模拟层 + 默认配置
 */
import type { ProjectData, ProjectSettings } from '@/shared/types';

/** 默认项目设置 */
export const DEFAULT_SETTINGS: ProjectSettings = {
  videoQuality: 'high',
  outputFormat: 'mp4',
  resolution: '1080p',
  frameRate: 30,
  audioCodec: 'aac',
  videoCodec: 'h264',
  subtitleEnabled: true,
  subtitleStyle: {
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#FFFFFF',
    backgroundColor: '#000000',
    outline: true,
    outlineColor: '#000000',
    position: 'bottom',
    alignment: 'center',
  },
};

/** 模拟本地存储 CRUD */
export const projectStorage = {
  getProjects: (): ProjectData[] => {
    const data = localStorage.getItem('reelforge_projects');
    return data ? JSON.parse(data) : [];
  },
  saveProjects: (projects: ProjectData[]) => {
    localStorage.setItem('reelforge_projects', JSON.stringify(projects));
  },
  getProject: (id: string): ProjectData | null => {
    const projects = projectStorage.getProjects();
    return projects.find((p) => p.id === id) || null;
  },
  saveProject: (project: ProjectData) => {
    const projects = projectStorage.getProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    projectStorage.saveProjects(projects);
  },
  deleteProject: (id: string) => {
    const projects = projectStorage.getProjects().filter((p) => p.id !== id);
    projectStorage.saveProjects(projects);
  },
};
