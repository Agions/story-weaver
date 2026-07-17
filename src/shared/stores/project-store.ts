/**
 * 项目状态管理
 * 内部使用 slice 模式，外部保持原有 API 完全兼容
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ProjectData } from '@/shared/types/project';

import { createDebouncedStorage } from './middlewares/persistWithDebounce';
import { createCurrentProjectSlice } from './slices/currentProject-slice';
import { createProjectSlice } from './slices/project-slice';

export interface ProjectState {
  // 项目列表
  projects: ProjectData[];

  // 当前项目
  currentProject: ProjectData | null;

  // Computed
  recentProjects: () => ProjectData[];

  // Actions
  createProject: (project: Partial<ProjectData>) => ProjectData;
  updateProject: (id: string, updates: Partial<ProjectData>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: ProjectData | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      const projectSlice = createProjectSlice(set, get);
      const currentProjectSlice = createCurrentProjectSlice(set);

      return {
        // Initial state
        projects: [],
        currentProject: null,

        // Computed
        recentProjects: projectSlice.recentProjects,

        // Project actions
        createProject: projectSlice.createProject,
        updateProject: projectSlice.updateProject,
        deleteProject: projectSlice.deleteProject,

        // Current project
        setCurrentProject: currentProjectSlice.setCurrentProject,
      };
    },
    {
      name: 'storyweaver-project-storage',
      storage: createJSONStorage(() => createDebouncedStorage(localStorage, 1500)),
      partialize: (state) => ({
        projects: state.projects,
      }),
    }
  )
);
