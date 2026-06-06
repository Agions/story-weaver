/**
 * export.slice.ts — 导出历史切片
 */

import type { ExportRecord } from '@/shared/types';

type SetState = (...args: any[]) => void;

export function createExportSlice(set: SetState) {
  return {
    addExportRecord: (record: ExportRecord) =>
      set((s: any) => ({ exportHistory: [...s.exportHistory, record] })),

    clearExportHistory: () => set({ exportHistory: [] }),
  };
}
