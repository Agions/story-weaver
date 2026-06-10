/**
 * Storage Service Facade
 * ======================
 * 统一对外的本地存储门面，把 6 个仓库 + 通用存储聚合成一个类。
 *
 * 内部按职责拆分到 8 个 sibling 文件：
 * - storage-keys.ts                          全部 key / 前缀 / 上限常量
 * - storage-helpers.ts                       4 个 JSON 读写 helper
 * - storage-defaults.ts                      DEFAULT_USER_PREFERENCES
 * - storage-projects-repository.ts           projects (7 ops)
 * - storage-app-state-repository.ts          appState (3 ops)
 * - storage-preferences-repository.ts        preferences (3 ops)
 * - storage-recent-files-repository.ts       recentFiles (4 ops)
 * - storage-model-settings-repository.ts     modelSettings (4 ops)
 * - storage-export-history-repository.ts     exportHistory (3 ops)
 * - storage-generic.ts                       set/get/remove + clearAll/exportAll/importAll/getSize
 *
 * 设计原则：
 * 1. 公共 API 完全兼容：每个子仓库方法都暴露为 facade 对象属性
 * 2. 通用方法直接转发到 storage-generic
 * 3. 单例 `storageService`
 */

import { getAppState, setAppState, clearAppState } from './storage-app-state-repository';
import {
  getExportHistory,
  addExportRecord,
  clearExportHistory,
} from './storage-export-history-repository';
import {
  setGeneric,
  getGeneric,
  removeGeneric,
  clearAllStorage,
  exportAllStorage,
  importAllStorage,
  getStorageSize,
} from './storage-generic';
import {
  getModelSettings,
  setModelSettings,
  deleteModelSettings,
  getAllModelSettings,
} from './storage-model-settings-repository';
import {
  getUserPreferences,
  setUserPreferences,
  resetUserPreferences,
} from './storage-preferences-repository';
import {
  getAllProjects,
  getProjectById,
  saveProject,
  deleteProject,
  searchProjects,
  getRecentProjects,
  exportProjectJson,
  importProjectJson,
} from './storage-projects-repository';
import {
  getRecentFiles,
  addRecentFile,
  removeRecentFile,
  clearRecentFiles,
} from './storage-recent-files-repository';

class StorageService {
  /**
   * 项目存储 (7 ops)
   */
  projects = {
    getAll: getAllProjects,
    getById: getProjectById,
    save: saveProject,
    delete: deleteProject,
    search: searchProjects,
    getRecent: getRecentProjects,
    export: exportProjectJson,
    import: importProjectJson,
  };

  /**
   * 应用状态 (3 ops)
   */
  appState = {
    get: getAppState,
    set: setAppState,
    clear: clearAppState,
  };

  /**
   * 用户偏好 (3 ops)
   */
  preferences = {
    get: getUserPreferences,
    set: setUserPreferences,
    reset: resetUserPreferences,
  };

  /**
   * 最近文件 (4 ops)
   */
  recentFiles = {
    get: getRecentFiles,
    add: addRecentFile,
    remove: removeRecentFile,
    clear: clearRecentFiles,
  };

  /**
   * 模型设置 (4 ops)
   */
  modelSettings = {
    get: getModelSettings,
    set: setModelSettings,
    delete: deleteModelSettings,
    getAll: getAllModelSettings,
  };

  /**
   * 导出历史 (3 ops)
   */
  exportHistory = {
    get: getExportHistory,
    add: addExportRecord,
    clear: clearExportHistory,
  };

  /**
   * 通用存储
   */
  set<T>(key: string, value: T): void {
    setGeneric(key, value);
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return getGeneric<T>(key, defaultValue);
  }

  remove(key: string): void {
    removeGeneric(key);
  }

  /**
   * 清空所有数据
   */
  clearAll(): void {
    clearAllStorage();
  }

  /**
   * 导出所有数据
   */
  exportAll(): string {
    return exportAllStorage();
  }

  /**
   * 导入数据
   */
  importAll(json: string): boolean {
    return importAllStorage(json);
  }

  /**
   * 获取存储大小
   */
  getSize(): { used: number; total: number } {
    return getStorageSize();
  }
}

export const storageService = new StorageService();
export default storageService;
