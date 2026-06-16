/**
 * useProject Reducer — 状态机化
 *
 * 架构决策 (2026-06-11):
 *   v3.4 P0 phase 5 A2.6 — 7 useState 集中为 1 个 reducer:
 *   - 项目数据: project / projects
 *   - 加载: isLoading / isSaving
 *   - 错误: error
 *   - 状态: hasUnsavedChanges
 *   - 任务: _taskStatus (接口契约, 死代码 const null, 保留以满足 UseProjectReturn)
 *
 * 对外 API 不变: 7 setXxx 名字 + signature 保持兼容, 调用方 0 改动.
 */

import type { ProjectData } from '@/shared/types';

// ─── 状态类型 ──────────────────────────────────────────────────────────────

export interface ProjectState {
  project: ProjectData | null;
  projects: ProjectData[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

// ─── Action 类型 ───────────────────────────────────────────────────────────

export type ProjectAction =
  | { type: 'set'; key: keyof ProjectState; value: unknown }
  | { type: 'update'; key: keyof ProjectState; updater: (prev: unknown) => unknown };

// ─── 初始 State ────────────────────────────────────────────────────────────

export const initialProjectState: ProjectState = {
  project: null,
  projects: [],
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,
};

// ─── Reducer ───────────────────────────────────────────────────────────────

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value } as ProjectState;
    case 'update':
      return {
        ...state,
        [action.key]: action.updater(state[action.key]),
      } as ProjectState;
    default:
      return state;
  }
}

// ─── Setter 工厂 ───────────────────────────────────────────────────────────

type Updater<T> = T | ((prev: T) => T);

function makeSetter<K extends keyof ProjectState>(
  dispatch: (action: ProjectAction) => void,
  key: K
) {
  return (payload: Updater<ProjectState[K]>) => {
    if (typeof payload === 'function') {
      const updater = payload as unknown as (prev: unknown) => unknown;
      dispatch({ type: 'update', key, updater });
    } else {
      dispatch({ type: 'set', key, value: payload });
    }
  };
}

// ─── 7 setter wrap ─────────────────────────────────────────────────────────

export interface ProjectSetter {
  setProject: (v: Updater<ProjectData | null>) => void;
  setProjects: (v: Updater<ProjectData[]>) => void;
  setIsLoading: (v: Updater<boolean>) => void;
  setIsSaving: (v: Updater<boolean>) => void;
  setError: (v: Updater<string | null>) => void;
  setHasUnsavedChanges: (v: Updater<boolean>) => void;
}

export function createProjectSetters(dispatch: (action: ProjectAction) => void): ProjectSetter {
  return {
    setProject: makeSetter(dispatch, 'project'),
    setProjects: makeSetter(dispatch, 'projects'),
    setIsLoading: makeSetter(dispatch, 'isLoading'),
    setIsSaving: makeSetter(dispatch, 'isSaving'),
    setError: makeSetter(dispatch, 'error'),
    setHasUnsavedChanges: makeSetter(dispatch, 'hasUnsavedChanges'),
  };
}
