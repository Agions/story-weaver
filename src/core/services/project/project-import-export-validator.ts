/**
 * 项目数据验证
 * @module core/services/project/project-import-export-validator
 *
 * 提取自原 `ProjectImportExportService.validateProjectData` + 私有 `validateVersion`。
 */

import {
  ARRAY_PROJECT_FIELDS,
  MIN_SUPPORTED_VERSION,
  parseVersion,
} from './project-import-export-types';

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 验证项目数据合法性
 *
 * 行为与原 `validateProjectData` 字节级一致：
 *   - 必需字段（id / name / status）必须存在且为字符串
 *   - 数组字段（videos / scripts）必须是数组
 *
 * @param project 待验证数据
 */
export function validateProjectData(project: unknown): ValidationResult {
  const errors: string[] = [];
  const p = project as Record<string, unknown>;

  // 必填字符串字段
  if (!p.id || typeof p.id !== 'string') {
    errors.push('缺少项目 ID');
  }
  if (!p.name || typeof p.name !== 'string') {
    errors.push('缺少项目名称');
  }
  // status 字段：仅要求存在
  if (!p.status) {
    errors.push('缺少项目状态');
  }

  for (const field of ARRAY_PROJECT_FIELDS) {
    if (!Array.isArray(p[field])) {
      errors.push(`字段 ${field} 应该是数组`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证版本兼容性
 *
 * 行为与原 `validateVersion` 字节级一致：
 *   - 仅比较 major + minor，patch 差异不影响兼容性
 *   - version < MIN_SUPPORTED_VERSION 抛错
 *
 * @throws 不支持时抛 Error
 */
export function validateVersion(version: string): void {
  const { major, minor } = parseVersion(version);
  const { major: minMajor, minor: minMinor } = parseVersion(MIN_SUPPORTED_VERSION);

  if (major < minMajor || (major === minMajor && minor < minMinor)) {
    throw new Error(`项目文件版本 ${version} 不被支持。最低支持版本为 ${MIN_SUPPORTED_VERSION}`);
  }
}
