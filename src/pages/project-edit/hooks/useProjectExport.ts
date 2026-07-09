import { useState } from 'react';

import type { ExportSettings } from '@/features/video/components/VideoExporter';

export type ExportPreset = '9:16' | '16:9' | '1:1';

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'MP4',
  quality: 'high',
  resolution: '1080p',
  frameRate: 30,
  filename: '',
};

export interface UseProjectExportResult {
  exportPreset: ExportPreset;
  exportSettings: ExportSettings;
  setExportPreset: (preset: ExportPreset) => void;
  setExportSettings: (settings: ExportSettings) => void;
  mergeExportSettings: (partial: Partial<ExportSettings>) => void;
}

/**
 * 管理项目导出预设和设置。
 * 将导出相关 state 从 ProjectEditPage 中提取，
 * 使主体聚焦路由/数据加载/协调逻辑。
 */
export function useProjectExport(): UseProjectExportResult {
  const [exportPreset, setExportPreset] = useState<ExportPreset>('9:16');
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);

  /** 合并更新（保留未变更字段） */
  const mergeExportSettings = (partial: Partial<ExportSettings>) =>
    setExportSettings((prev) => ({ ...prev, ...partial }));

  return {
    exportPreset,
    exportSettings,
    setExportPreset,
    setExportSettings,
    mergeExportSettings,
  };
}
