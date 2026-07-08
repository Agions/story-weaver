/**
 * SecureStorageService - 安全存储服务（facade）
 *
 * 历史背景：本文件原为 306 行单类，8 个公共方法（save/load/clear checkpoint +
 * secure config + project data + cost data）均套用同一个 "Tauri / localStorage 二选一
 * + try/catch 兜底" 模板，导致模板代码大量重复。第 21 轮重构拆为 4 个子模块
 * （types / fallback / tauri / initializer），本 facade 保留所有对外公开 API 签名
 * （secureStorage 单例 + 11 个公共方法）以保证 5 个外部调用方零改动。
 *
 * 拆分思路：
 * 1. 类型 / 常量集中在 types（CheckpointData + KEY_PREFIX 字典 + TauriStore 接口 + 4 个 key 构造函数）
 * 2. localStorage 包装剥离到 fallback（消除 4 处 "read raw + JSON.parse + catch" 重复）
 * 3. Tauri Store 包装剥离到 tauri（3 个通用 try/catch helper 消除 8 处模板代码）
 * 4. 初始化器剥离到 initializer（initPromise + useFallback + store 状态收敛）
 * 5. 类主流程只剩"路由"——根据 initializer 状态选 tauri 或 fallback 调用
 */

import {
  fallbackClearAllCheckpoints,
  fallbackGetJson,
  fallbackGetString,
  fallbackRemoveString,
  fallbackSetJson,
  fallbackSetString,
} from './secure-storage-fallback';
import { SecureStorageInitializer } from './secure-storage-initializer';
import {
  tauriClearAllCheckpoints,
  tauriDeleteCheckpoint,
  tauriDeleteSecureConfig,
  tauriGetSecureConfig,
  tauriLoadCheckpoint,
  tauriLoadCostData,
  tauriLoadProjectData,
  tauriSaveCheckpoint,
  tauriSaveCostData,
  tauriSaveProjectData,
  tauriSaveSecureConfig,
} from './secure-storage-tauri';
import {
  buildCheckpointKey,
  buildCostDataKey,
  buildProjectDataKey,
  buildSecureConfigKey,
  type CheckpointData,
} from './secure-storage-types';

// 重导出公共类型
export type { CheckpointData } from './secure-storage-types';
export type { TauriStore } from './secure-storage-types';

/**
 * 安全存储服务
 *
 * 内部维护：
 *   - initializer: 存储初始化器（initPromise + useFallback + store）
 */
class SecureStorageService {
  private initializer = new SecureStorageInitializer();

  // ========== Checkpoint 操作 ==========

  /**
   * 保存 checkpoint
   *
   * 行为与原 `saveCheckpoint` 字节级一致：fallback → JSON 字符串；Tauri → store.set。
   */
  async saveCheckpoint(stepId: string, data: unknown): Promise<void> {
    await this.initializer.init();
    const key = buildCheckpointKey(stepId);
    const state: CheckpointData = {
      stepId,
      completed: true,
      data,
      timestamp: Date.now(),
    };

    if (this.initializer.isFallback) {
      fallbackSetJson(key, state);
      return;
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      fallbackSetJson(key, state);
      return;
    }
    await tauriSaveCheckpoint(store, key, state);
  }

  /** 读取 checkpoint */
  async loadCheckpoint(stepId: string): Promise<CheckpointData | null> {
    await this.initializer.init();
    const key = buildCheckpointKey(stepId);
    if (this.initializer.isFallback) {
      return fallbackGetJson<CheckpointData>(key);
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      return fallbackGetJson<CheckpointData>(key);
    }
    return tauriLoadCheckpoint(store, key);
  }

  /** 删除单个 checkpoint */
  async clearCheckpoint(stepId: string): Promise<void> {
    await this.initializer.init();
    const key = buildCheckpointKey(stepId);
    if (this.initializer.isFallback) {
      fallbackRemoveString(key);
      return;
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      fallbackRemoveString(key);
      return;
    }
    await tauriDeleteCheckpoint(store, key);
  }

  /** 删除全部 checkpoint（按 prefix 扫描） */
  async clearAllCheckpoints(): Promise<void> {
    await this.initializer.init();
    if (this.initializer.isFallback) {
      fallbackClearAllCheckpoints();
      return;
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      fallbackClearAllCheckpoints();
      return;
    }
    await tauriClearAllCheckpoints(store);
  }

  // ========== Secure Config 操作（字符串读写，无 JSON） ==========

  /** 保存 secure config（字符串值） */
  async saveSecureConfig(key: string, value: string): Promise<void> {
    await this.initializer.init();
    const fullKey = buildSecureConfigKey(key);
    if (this.initializer.isFallback) {
      fallbackSetString(fullKey, value);
      return;
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      fallbackSetString(fullKey, value);
      return;
    }
    await tauriSaveSecureConfig(store, fullKey, value);
  }

  /** 读取 secure config */
  async getSecureConfig(key: string): Promise<string | null> {
    await this.initializer.init();
    const fullKey = buildSecureConfigKey(key);
    if (this.initializer.isFallback) {
      return fallbackGetString(fullKey);
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      return fallbackGetString(fullKey);
    }
    return tauriGetSecureConfig(store, fullKey);
  }

  /** 删除 secure config */
  async deleteSecureConfig(key: string): Promise<void> {
    await this.initializer.init();
    const fullKey = buildSecureConfigKey(key);
    if (this.initializer.isFallback) {
      fallbackRemoveString(fullKey);
      return;
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      fallbackRemoveString(fullKey);
      return;
    }
    await tauriDeleteSecureConfig(store, fullKey);
  }

  // ========== Project Data 操作（带 updatedAt 包装） ==========

  /** 保存 project data（带 updatedAt 时间戳） */
  async saveProjectData(projectId: string, data: unknown): Promise<void> {
    await this.initializer.init();
    const key = buildProjectDataKey(projectId);
    if (this.initializer.isFallback) {
      fallbackSetJson(key, { data, updatedAt: Date.now() });
      return;
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      fallbackSetJson(key, { data, updatedAt: Date.now() });
      return;
    }
    await tauriSaveProjectData(store, key, data);
  }

  /** 读取 project data */
  async loadProjectData<T>(projectId: string): Promise<T | null> {
    await this.initializer.init();
    const key = buildProjectDataKey(projectId);
    if (this.initializer.isFallback) {
      return fallbackGetJson<{ data: T }>(key)?.data ?? null;
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      return fallbackGetJson<{ data: T }>(key)?.data ?? null;
    }
    return tauriLoadProjectData<T>(store, key);
  }

  // ========== Cost Data 操作（无包装） ==========

  /** 保存 cost data */
  async saveCostData(key: string, data: unknown): Promise<void> {
    await this.initializer.init();
    const fullKey = buildCostDataKey(key);
    if (this.initializer.isFallback) {
      fallbackSetJson(fullKey, data);
      return;
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      fallbackSetJson(fullKey, data);
      return;
    }
    await tauriSaveCostData(store, fullKey, data);
  }

  /** 读取 cost data */
  async loadCostData<T>(key: string): Promise<T | null> {
    await this.initializer.init();
    const fullKey = buildCostDataKey(key);
    if (this.initializer.isFallback) {
      return fallbackGetJson<T>(fullKey);
    }
    const store = this.initializer.tauriStore;
    if (!store) {
      return fallbackGetJson<T>(fullKey);
    }
    return tauriLoadCostData<T>(store, fullKey);
  }
}

export const secureStorage = new SecureStorageService();
export default secureStorage;
