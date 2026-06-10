/**
 * 项目列表 Hook
 */
import { useState, useCallback, useMemo } from 'react';

import type { ProjectData } from '@/shared/types';

import { projectStorage } from './project-storage';

export interface UseProjectListReturn {
  projects: ProjectData[];
  allProjects: ProjectData[];
  isLoading: boolean;
  filter: {
    search: string;
    status: string[];
    sortBy: keyof ProjectData;
    sortOrder: 'asc' | 'desc';
  };
  setFilter: (filter: {
    search: string;
    status: string[];
    sortBy: keyof ProjectData;
    sortOrder: 'asc' | 'desc';
  }) => void;
  loadProjects: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProjectList(): UseProjectListReturn {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<{
    search: string;
    status: string[];
    sortBy: keyof ProjectData;
    sortOrder: 'asc' | 'desc';
  }>({
    search: '',
    status: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setProjects(projectStorage.getProjects());
    setIsLoading(false);
  }, []);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (filter.search) {
      const search = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search)
      );
    }
    if (filter.status.length > 0) {
      result = result.filter((p) => filter.status.includes(p.status!));
    }
    result.sort((a, b) => {
      const aVal = a[filter.sortBy] as string | number;
      const bVal = b[filter.sortBy] as string | number;
      const comparison = aVal > bVal ? 1 : -1;
      return filter.sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [projects, filter]);

  return {
    projects: filteredProjects,
    allProjects: projects,
    isLoading,
    filter,
    setFilter,
    loadProjects,
    refresh: loadProjects,
  };
}
