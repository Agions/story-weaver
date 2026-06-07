/**
 * script.slice.ts — 脚本操作切片
 */

import type { Script } from '@/shared/types';

type SetState = (...args: any[]) => void;
type GetState = () => any;

export function createScriptSlice(set: SetState, _get: GetState) {
  return {
    addScript: (projectId: string, script: Script) => {
      set((s: any) => ({
        projects: s.projects.map((p: any) =>
          p.id === projectId ? { ...p, scripts: [...(p.scripts ?? []), script] } : p
        ),
      }));
    },

    updateScript: (projectId: string, scriptId: string, updates: Partial<Script>) => {
      set((s: any) => ({
        projects: s.projects.map((p: any) =>
          p.id === projectId
            ? {
                ...p,
                scripts: (p.scripts ?? []).map((sc: Script) =>
                  sc.id === scriptId ? { ...sc, ...updates } : sc
                ),
              }
            : p
        ),
      }));
    },

    deleteScript: (projectId: string, scriptId: string) => {
      set((s: any) => ({
        projects: s.projects.map((p: any) =>
          p.id === projectId
            ? { ...p, scripts: (p.scripts ?? []).filter((sc: Script) => sc.id !== scriptId) }
            : p
        ),
      }));
    },
  };
}
