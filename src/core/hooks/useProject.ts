/**
 * 项目管理 Hook（facade）
 *
 * 拆分为 project-storage（存储层）+ useProjectList（列表 hook），本文件保留主 hook。
 */

import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { ProjectData, VideoInfo, Script, ProjectSettings, TaskStatus } from '@/shared/types';

import { DEFAULT_SETTINGS, projectStorage } from './project-storage';

// Re-export useProjectList 保持测试兼容
export { useProjectList } from './useProjectList';
export type { UseProjectListReturn } from './useProjectList';

export interface UseProjectReturn {
  project: ProjectData | null;
  projects: ProjectData[];
  recentProjects: ProjectData[];
  createProject: (name: string, description?: string) => ProjectData;
  loadProject: (projectId: string) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
  updateProject: (updates: Partial<ProjectData>) => void;
  deleteProject: (projectId: string) => Promise<boolean>;
  duplicateProject: (projectId: string) => Promise<ProjectData | null>;
  setVideo: (videoInfo: VideoInfo) => void;
  removeVideo: () => void;
  setScript: (script: Script) => void;
  updateScript: (updates: Partial<Script>) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  taskStatus: TaskStatus | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

export function useProject(_projectId?: string): UseProjectReturn {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [_taskStatus, _setTaskStatus] = useState<TaskStatus | null>(null);
  const taskStatus = _taskStatus;

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  }, [projects]);

  const createProject = useCallback((name: string, description?: string): ProjectData => {
    const now = new Date().toISOString();
    const newProject: ProjectData = {
      id: uuidv4(),
      name: name || '未命名项目',
      description,
      status: 'draft',
      settings: { ...DEFAULT_SETTINGS },
      videos: [],
      scripts: [],
      createdAt: now,
      updatedAt: now,
    };
    projectStorage.saveProject(newProject);
    setProjects((prev) => [newProject, ...prev]);
    setProject(newProject);
    setHasUnsavedChanges(false);
    return newProject;
  }, []);

  const loadProject = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = projectStorage.getProject(id);
      if (loaded) {
        setProject(loaded);
        setHasUnsavedChanges(false);
        return true;
      } else {
        setError('项目不存在');
        return false;
      }
    } catch {
      setError('加载项目失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!project) return false;
    setIsSaving(true);
    try {
      const updated = { ...project, updatedAt: new Date().toISOString() };
      projectStorage.saveProject(updated);
      setProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setHasUnsavedChanges(false);
      return true;
    } catch {
      setError('保存项目失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [project]);

  const updateProject = useCallback(
    (updates: Partial<ProjectData>) => {
      if (!project) return;
      setProject((prev) => (prev ? { ...prev, ...updates } : null));
      setHasUnsavedChanges(true);
    },
    [project]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        projectStorage.deleteProject(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (project?.id === id) setProject(null);
        return true;
      } catch {
        setError('删除项目失败');
        return false;
      }
    },
    [project]
  );

  const duplicateProject = useCallback(async (id: string): Promise<ProjectData | null> => {
    const source = projectStorage.getProject(id);
    if (!source) return null;
    const now = new Date().toISOString();
    const duplicated: ProjectData = {
      ...source,
      id: uuidv4(),
      name: `${source.name} (副本)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    projectStorage.saveProject(duplicated);
    setProjects((prev) => [duplicated, ...prev]);
    return duplicated;
  }, []);

  const setVideo = useCallback(
    (videoInfo: VideoInfo) => {
      updateProject({ videos: [videoInfo] });
    },
    [updateProject]
  );

  const removeVideo = useCallback(() => {
    updateProject({ videos: [] });
  }, [updateProject]);

  const setScript = useCallback(
    (script: Script) => {
      updateProject({ scripts: [script] });
    },
    [updateProject]
  );

  const updateScript = useCallback(
    (updates: Partial<Script>) => {
      if (!project?.scripts?.[0]) return;
      updateProject({
        scripts: [{ ...project.scripts[0], ...updates, updatedAt: new Date().toISOString() }],
      });
    },
    [project, updateProject]
  );

  const updateSettings = useCallback(
    (settings: Partial<ProjectSettings>) => {
      if (!project) return;
      updateProject({
        settings: { ...project.settings, ...settings } as ProjectSettings,
      });
    },
    [project, updateProject]
  );

  return {
    project,
    projects,
    recentProjects,
    createProject,
    loadProject,
    saveProject,
    updateProject,
    deleteProject,
    duplicateProject,
    setVideo,
    removeVideo,
    setScript,
    updateScript,
    updateSettings,
    taskStatus,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
  };
}
