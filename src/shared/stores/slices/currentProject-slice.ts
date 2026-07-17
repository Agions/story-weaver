/**
 * currentProject-slice.ts — 当前项目切片
 *
 * 【v3.3 代码审查 — 类型收窄】
 * 原 SetState = (...args: any[]) => void + (project: any) 削弱类型安全。
 * 改为精确的 CurrentProjectSliceFields + ProjectData | null 联合。
 */

import type { ProjectData } from '@/shared/types';

type CurrentProjectSliceFields = {
  currentProject: ProjectData | null;
};

type CurrentProjectSetState = (
  partial:
    | Partial<CurrentProjectSliceFields>
    | ((state: CurrentProjectSliceFields) => Partial<CurrentProjectSliceFields>)
) => void;

export function createCurrentProjectSlice(set: CurrentProjectSetState) {
  return {
    setCurrentProject: (project: ProjectData | null) => set({ currentProject: project }),
  };
}
