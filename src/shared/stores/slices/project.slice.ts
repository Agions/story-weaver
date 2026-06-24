/**
 * project.slice.ts — 项目列表领域切片
 * 职责：项目列表 CRUD + 过滤/排序
 *
 * 【v3.3 代码审查 — 类型收窄】
 * 原 SetState/GetState 用 any 削弱类型安全。
 * 改用精确的 (set, get) 类型签名，与 project.store.ts 的 ProjectState 对齐。
 */

import { v4 as uuid } from 'uuid';

import type { ProjectData } from '@/shared/types/project';

/** slice 自身关注的 state 字段（与 ProjectState 保持同步） */
type ProjectSliceFields = {
  projects: ProjectData[];
  searchQuery: string;
  filterStatus: 'all' | 'draft' | 'completed' | 'archived';
  sortBy: 'updatedAt' | 'createdAt' | 'name';
  sortOrder: 'asc' | 'desc';
};

type ProjectSetState = (
  partial:
    | Partial<ProjectSliceFields>
    | ((state: ProjectSliceFields) => Partial<ProjectSliceFields>)
) => void;

type ProjectGetState = () => ProjectSliceFields;

/**
 * slice 工厂：set/get 类型由 ProjectStore 的 ProjectState 推断。
 * 公共 API（useProjectStore）保持不变，本 slice 内部不再用 any。
 */
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

    filteredProjects: (): ProjectData[] => {
      const { projects, searchQuery, filterStatus, sortBy, sortOrder } = get();
      let result = [...projects];

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
        );
      }

      if (filterStatus !== 'all') {
        result = result.filter((p) => p.status === filterStatus);
      }

      result.sort((a, b) => {
        const aVal = a[sortBy as keyof ProjectData] ?? '';
        const bVal = b[sortBy as keyof ProjectData] ?? '';
        return sortOrder === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });

      return result;
    },

    recentProjects: (): ProjectData[] => {
      return [...get().projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);
    },

    exportProject: (id: string): string => {
      const project = get().projects.find((p) => p.id === id);
      return project ? JSON.stringify(project) : '';
    },

    importProject: (json: string): ProjectData | null => {
      try {
        const project = JSON.parse(json) as ProjectData;
        project.id = uuid();
        project.updatedAt = new Date().toISOString();
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      } catch {
        return null;
      }
    },

    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setFilterStatus: (status: 'all' | 'draft' | 'completed' | 'archived') =>
      set({ filterStatus: status }),
    setSortBy: (sortBy: 'updatedAt' | 'createdAt' | 'name') => set({ sortBy }),
    setSortOrder: (order: 'asc' | 'desc') => set({ sortOrder: order }),
  };
}
