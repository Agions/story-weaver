/**
 * Project import/export validation & utilities — extracted
 */

import { ARRAY_PROJECT_FIELDS, MIN_SUPPORTED_VERSION } from './project-import-export-constants';
import { parseVersion } from './project-import-export-utils';
import type { ImportOptions, ValidationResult } from './project-import-export-types';

const FILENAME_SAFE_CHAR_REGEX = /[^a-zA-Z0-9一-龥]/g;

/** 把项目名规整为文件名安全字符串 */
export function sanitizeProjectName(name: string): string {
  return name.replace(FILENAME_SAFE_CHAR_REGEX, '_');
}

/** 验证项目数据合法性 */
export function validateProjectData(project: unknown): ValidationResult {
  const errors: string[] = [];
  const p = project as Record<string, unknown>;

  if (!p.id || typeof p.id !== 'string') {
    errors.push('缺少项目 ID');
  }
  if (!p.name || typeof p.name !== 'string') {
    errors.push('缺少项目名称');
  }
  if (!p.status) {
    errors.push('缺少项目状态');
  }

  for (const field of ARRAY_PROJECT_FIELDS) {
    if (!Array.isArray(p[field])) {
      errors.push(`字段 ${field} 应该是数组`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** 验证版本兼容性 */
export function validateVersion(version: string): void {
  const { major, minor } = parseVersion(version);
  const { major: minMajor, minor: minMinor } = parseVersion(MIN_SUPPORTED_VERSION);

  if (major < minMajor || (major === minMajor && minor < minMinor)) {
    throw new Error(`项目文件版本 ${version} 不被支持。最低支持版本为 ${MIN_SUPPORTED_VERSION}`);
  }
}

/** 解析导入选项默认值 */
export function resolveImportOptions(options: ImportOptions = {}): ImportOptions {
  return { merge: false, overwrite: false, validate: true, ...options };
}

export { sanitizeProjectName as _sanitizeForTests };