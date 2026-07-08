/**
 * 项目导入导出服务 - Project Import/Export Service（facade）
 *
 * 历史背景：本文件原为 384 行单类，承担导出 / 导入 / 验证 / 备份 / 复制 / 比较
 * 六类职责。第 18 轮重构拆为 7 个子模块（types / validator / backup / exporter /
 * importer / compare / duplicator），本 facade 保留所有对外公开 API 签名以保证
 * 调用方零改动。
 *
 * 拆分思路：
 * 1. 类型与常量集中在 types（版本号、备份限制、文件名安全字符、版本解析等）
 * 2. 验证剥离到 validator（validateProjectData + validateVersion）
 * 3. 备份存储剥离到 backup（localStorage 索引 + 单条内容读写 + 截断策略）
 * 4. 导出剥离到 exporter（exportToJSON + exportProject + prepareProjectForExport + filename）
 * 5. 导入剥离到 importer（importProject + processImportedProject + parseImportText/File + resolveImportOptions）
 * 6. 比较剥离到 compare（diff 构造器模式）
 * 7. 复制剥离到 duplicator（videos 浅拷贝 + scripts 深拷贝 + id 重生）
 * 8. 类主流程只剩"编排"——子流程方法字段绑定 + 内部辅助收敛
 */

import { v4 as uuidv4 } from 'uuid';

import type { ProjectData } from '@/shared/types';

import {
  appendBackupRecord,
  buildBackupRecord,
  readBackupContent,
  readBackupIndex,
  removeBackupContent,
  removeBackupRecord,
  writeBackupContent,
} from './project-import-export-backup';
import { compareProjects } from './project-import-export-compare';
import { duplicateProject } from './project-import-export-duplicator';
import { exportProject, exportToJSON } from './project-import-export-exporter';
import { importProject } from './project-import-export-importer';
import {
  CURRENT_VERSION,
  generateBackupFilename,
  type BackupRecord,
  type ExportFormat,
  type ExportOptions,
  type ImportOptions,
  type ProjectComparison,
  type ProjectExportData,
} from './project-import-export-types';
import {
  validateProjectData,
  validateVersion,
  type ValidationResult,
} from './project-import-export-validator';

// 重导出公共类型，保持 `@/core/services/project/project-import-export.service` 一站式导入
export type {
  BackupRecord,
  ExportFormat,
  ExportOptions,
  ImportOptions,
  ProjectComparison,
  ProjectExportData,
  ValidationResult,
};
export { CURRENT_VERSION } from './project-import-export-types';

/**
 * 项目导入导出服务
 *
 * 内部不再维护任何状态：所有持久化都通过 backup 子模块的纯函数访问 localStorage。
 * 类仅作为"10 个公共 API 入口 + 默认值整合"的薄壳。
 */
class ProjectImportExportService {
  // ========== 子流程方法（类字段绑定，保持 API 兼容） ==========

  /** 导出项目为 JSON 字符串 */
  exportToJSON = exportToJSON;

  /** 导出项目（统一入口：JSON / ZIP） */
  exportProject = exportProject;

  /** 导入项目 */
  importProject = importProject;

  /** 验证项目数据 */
  validateProjectData = validateProjectData;

  /** 验证版本兼容性（私有但通过本服务导出供测试用） */
  validateVersion = validateVersion;

  /** 复制项目 */
  duplicateProject = duplicateProject;

  /** 比较两个项目 */
  compareProjects = compareProjects;

  // ========== 备份管理（localStorage 直读直写） ==========

  /**
   * 备份项目到 localStorage
   *
   * 行为与原 `ProjectImportExportService.backupProject` 字节级一致：
   *   - 构造 ProjectExportData + JSON 序列化
   *   - 追加到索引（超出 10 条则 shift 最早一条）
   *   - 写入单条备份内容到 `storyweaver_backup_${id}`
   */
  async backupProject(project: ProjectData): Promise<string> {
    const backupData: ProjectExportData = {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      project,
      metadata: {
        appVersion: CURRENT_VERSION,
        format: 'json',
        includesMedia: false,
      },
    };

    const content = JSON.stringify(backupData, null, 2);
    const backupId = uuidv4();
    const filename = generateBackupFilename(project.name);

    writeBackupContent(backupId, content);
    appendBackupRecord(buildBackupRecord(backupId, filename, project.id, project.name, content));

    return backupId;
  }

  /** 读取所有备份索引 */
  getBackupList(): BackupRecord[] {
    return readBackupIndex();
  }

  /**
   * 从 localStorage 恢复备份
   *
   * 行为与原 `restoreBackup` 字节级一致：找不到返回 null；JSON 解析失败返回 null。
   */
  async restoreBackup(backupId: string): Promise<ProjectData | null> {
    const content = readBackupContent(backupId);
    if (!content) return null;
    try {
      const exportData: ProjectExportData = JSON.parse(content);
      return exportData.project;
    } catch {
      return null;
    }
  }

  /** 删除指定备份（同时清理索引和单条内容） */
  deleteBackup(backupId: string): void {
    removeBackupContent(backupId);
    removeBackupRecord(backupId);
  }
}

export const projectImportExportService = new ProjectImportExportService();
export default projectImportExportService;
