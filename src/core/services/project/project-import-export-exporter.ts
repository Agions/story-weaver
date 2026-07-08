/**
 * 项目导出
 * @module core/services/project/project-import-export-exporter
 *
 * 提取自原 ProjectImportExportService.exportToJSON / exportProject / 私有
 * prepareProjectForExport + generateFilename。
 */

import type { ProjectData } from '@/shared/types';

import {
  CURRENT_VERSION,
  generateExportFilename,
  nowIso,
  type ExportOptions,
  type ProjectExportData,
} from './project-import-export-types';

/**
 * 把项目数据中的视频 path 标记为已移除（与原 prepareProjectForExport 字节级一致）
 */
export function prepareProjectForExport(project: ProjectData): ProjectData {
  return {
    ...project,
    videos: (project.videos ?? []).map((v) => ({
      ...v,
      path: v.path ? '[导出时移除]' : v.path,
    })),
  };
}

/**
 * 构造完整的导出数据包
 */
export function buildProjectExportData(
  project: ProjectData,
  options: Partial<ExportOptions> = {}
): ProjectExportData {
  return {
    version: CURRENT_VERSION,
    exportedAt: nowIso(),
    project: prepareProjectForExport(project),
    metadata: {
      appVersion: CURRENT_VERSION,
      format: 'json',
      includesMedia: options.includeMedia || false,
    },
  };
}

/** 解析导出选项（与原 exportProject 内联 defaultOptions 字节级一致） */
export function resolveExportOptions(options: Partial<ExportOptions> = {}): ExportOptions {
  return {
    format: 'json',
    includeMedia: false,
    compress: false,
    includeHistory: false,
    ...options,
  };
}

/**
 * 导出项目为 JSON 字符串
 */
export function exportToJSON(project: ProjectData, options: Partial<ExportOptions> = {}): string {
  return JSON.stringify(buildProjectExportData(project, options), null, 2);
}

/**
 * 导出项目（统一入口：JSON / ZIP 都先走 exportToJSON，ZIP 实现预留）
 *
 * 行为与原 exportProject 字节级一致（ZIP 分支未实现，注释说明）。
 */
export async function exportProject(
  project: ProjectData,
  options: Partial<ExportOptions> = {}
): Promise<{ filename: string; content: string | Blob }> {
  const resolved = resolveExportOptions(options);
  const filename = generateExportFilename(project.name, resolved.format);

  if (resolved.format === 'json') {
    return {
      filename,
      content: exportToJSON(project, resolved),
    };
  }

  // ZIP 格式需要额外处理
  return {
    filename,
    content: exportToJSON(project, resolved),
  };
}
