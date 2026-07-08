/**
 * 项目导入导出共享类型与常量
 * @module core/services/project/project-import-export-types
 *
 * 提取自原 project-import-export.service.ts 中散落的 interface / const。
 * 其它子模块（validator / backup / exporter / importer / compare / duplicator）
 * 共用这套类型 + 常量。
 */

import type { ProjectData } from '@/shared/types';

/** 导出格式 */
export type ExportFormat = 'json' | 'zip';

/** 项目导出数据包 */
export interface ProjectExportData {
  version: string;
  exportedAt: string;
  project: ProjectData;
  metadata: {
    appVersion: string;
    format: ExportFormat;
    includesMedia: boolean;
  };
}

/** 导入选项 */
export interface ImportOptions {
  merge?: boolean; // 是否合并到现有项目
  overwrite?: boolean; // 是否覆盖同名项目
  validate?: boolean; // 是否验证数据
}

/** 导出选项 */
export interface ExportOptions {
  format: ExportFormat;
  includeMedia?: boolean; // 是否包含媒体文件
  compress?: boolean; // 是否压缩
  includeHistory?: boolean; // 是否包含历史记录
}

/** 备份元信息（localStorage 索引） */
export interface BackupRecord {
  id: string;
  filename: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  size: number;
}

/** 项目比较结果 */
export interface ProjectComparison {
  identical: boolean;
  differences: string[];
}

/** 当前导出格式版本（与原 private CURRENT_VERSION 字节级一致） */
export const CURRENT_VERSION = '1.0.0';

/** 最低支持版本（与原 private MIN_SUPPORTED_VERSION 字节级一致） */
export const MIN_SUPPORTED_VERSION = '1.0.0';

/** 备份索引存储键 */
export const BACKUP_INDEX_KEY = 'storyweaver_backups';

/** 单条备份内容存储键前缀（格式：`storyweaver_backup_${id}`） */
export const BACKUP_ITEM_PREFIX = 'storyweaver_backup_';

/** 备份最大保留数量（与原 `if (backups.length > 10) backups.shift()` 一致） */
export const MAX_BACKUPS = 10;

/** 验证项目数据时的必需字段（与原 validateProjectData 内联一致） */
export const REQUIRED_PROJECT_FIELDS = ['id', 'name', 'status'] as const;

/** 验证项目数据时的数组字段（与原 validateProjectData 内联 arrayFields 一致） */
export const ARRAY_PROJECT_FIELDS = ['videos', 'scripts'] as const;

/** 文件名中允许保留的字符（中英文 + 数字 + 下划线） */
const FILENAME_SAFE_CHAR_REGEX = /[^a-zA-Z0-9一-龥]/g;

/** 把项目名规整为文件名安全字符串（与原 generateFilename 内联一致） */
export function sanitizeProjectName(name: string): string {
  return name.replace(FILENAME_SAFE_CHAR_REGEX, '_');
}

/** 生成导出文件名（与原 generateFilename 字节级一致） */
export function generateExportFilename(projectName: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `storyweaver_${sanitizeProjectName(projectName)}_${timestamp}.${format}`;
}

/** 生成备份文件名（与原 backupProject 内联一致） */
export function generateBackupFilename(projectName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `backup_${projectName}_${timestamp}.json`;
}

/** 解析版本号（与原 validateVersion 内联一致） */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major: major ?? 0, minor: minor ?? 0, patch: patch ?? 0 };
}

/** 当前 ISO 时间戳 */
export function nowIso(): string {
  return new Date().toISOString();
}
