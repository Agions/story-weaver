/**
 * project.slice.ts — 项目列表领域切片
 * 职责：项目列表 CRUD + 最近项目派生
 */

import { v4 as uuid } from 'uuid';

import type { ProjectData } from '@/shared/types/project';

type ProjectSliceFields = {
  projects: ProjectData[];
};

type ProjectSetState = (
  partial:
    | Partial<ProjectSliceFields>
    | ((state: ProjectSliceFields) => Partial<ProjectSliceFields>)
) => void;

type ProjectGetState = () => ProjectSliceFields;

export function createProjectSlice(set: ProjectSetState, get: ProjectGetState) {
  return {
    createProject: (partial: Partial<ProjectData>): ProjectData => {
      const now = new Date().toISOString();
      const project: ProjectData = {
        id: uuid(),
        name: partial.name ?? '新项目',
        description: partial.description ?? '',
        content: partial.content ?? '',
        status: partial.status ?? 'draft',
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({ projects: [...s.projects, project] }));
      return project;
    },

    updateProject: (id: string, updates: Partial<ProjectData>) => {
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
      }));
    },

    deleteProject: (id: string) => {
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    },

    recentProjects: (): ProjectData[] => {
      return [...get().projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);
    },
  };
}
