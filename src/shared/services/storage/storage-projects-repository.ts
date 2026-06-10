/**
 * 项目仓库 (storage.projects)
 * ===========================
 * 封装对 STORAGE_KEYS.PROJECTS 的 CRUD + 搜索 + 导入导出。
 * 7 个公共方法：getAll / getById / save / delete / search / getRecent / export / import
 */
import type { ProjectData } from '@/shared/types';

import { safeJsonGet, safeJsonSet } from './storage-helpers';
import { STORAGE_KEYS } from './storage-keys';

/** 全部项目 */
export function getAllProjects(): ProjectData[] {
  return safeJsonGet<ProjectData[]>(STORAGE_KEYS.PROJECTS, []);
}

/** 按 id 查找 */
export function getProjectById(id: string): ProjectData | null {
  return getAllProjects().find((p) => p.id === id) ?? null;
}

/** 保存（更新或追加） */
export function saveProject(project: ProjectData): void {
  const projects = getAllProjects();
  const index = projects.findIndex((p) => p.id === project.id);

  if (index >= 0) {
    projects[index] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.push(project);
  }

  safeJsonSet(STORAGE_KEYS.PROJECTS, projects);
}

/** 删除 */
export function deleteProject(id: string): void {
  const projects = getAllProjects().filter((p) => p.id !== id);
  safeJsonSet(STORAGE_KEYS.PROJECTS, projects);
}

/** 搜索 (name + description) */
export function searchProjects(query: string): ProjectData[] {
  const lowerQuery = query.toLowerCase();
  return getAllProjects().filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) || p.description?.toLowerCase().includes(lowerQuery)
  );
}

/** 最近 N 个项目 (按 updatedAt 倒序) */
export function getRecentProjects(count: number = 10): ProjectData[] {
  return getAllProjects()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, count);
}

/** 导出为 JSON 字符串 */
export function exportProjectJson(id: string): string {
  const project = getProjectById(id);
  return project ? JSON.stringify(project, null, 2) : '';
}

/** 从 JSON 字符串导入 (新 id = 原id_imported_timestamp) */
export function importProjectJson(json: string): ProjectData | null {
  try {
    const project = JSON.parse(json) as ProjectData;
    project.id = `${project.id}_imported_${Date.now()}`;
    project.createdAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();
    saveProject(project);
    return project;
  } catch {
    return null;
  }
}
