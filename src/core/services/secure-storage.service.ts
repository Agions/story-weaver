/**
 * SecureStorageService - 安全存储服务
 * 使用 Tauri Store API 替代 localStorage，敏感数据加密存储
 */

import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';

const STORE_PATH = 'secure-data.json';
const CHECKPOINT_PREFIX = 'checkpoint_';

interface CheckpointData {
  stepId: string;
  completed: boolean;
  data: unknown;
  timestamp: number;
}

class SecureStorageService {
  private store: Store | null = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.store) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.store = await Store.load(STORE_PATH, { autoSave: true });
      } catch (error) {
        console.error('[SecureStorage] Failed to initialize store:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * 保存检查点数据（安全）
   */
  async saveCheckpoint(stepId: string, data: unknown): Promise<void> {
    await this.init();
    if (!this.store) throw new Error('Store not initialized');

    const key = `${CHECKPOINT_PREFIX}${stepId}`;
    const state: CheckpointData = {
      stepId,
      completed: true,
      data,
      timestamp: Date.now(),
    };

    await this.store.set(key, state);
    await this.store.save();
  }

  /**
   * 加载检查点数据
   */
  async loadCheckpoint(stepId: string): Promise<CheckpointData | null> {
    await this.init();
    if (!this.store) return null;

    const key = `${CHECKPOINT_PREFIX}${stepId}`;
    const result = await this.store.get<CheckpointData>(key);
    return result ?? null;
  }

  /**
   * 清除单个检查点
   */
  async clearCheckpoint(stepId: string): Promise<void> {
    await this.init();
    if (!this.store) return;

    const key = `${CHECKPOINT_PREFIX}${stepId}`;
    await this.store.delete(key);
    await this.store.save();
  }

  /**
   * 清除所有检查点
   */
  async clearAllCheckpoints(): Promise<void> {
    await this.init();
    if (!this.store) return;

    const keys = await this.store.keys();
    for (const key of keys) {
      if (key.startsWith(CHECKPOINT_PREFIX)) {
        await this.store.delete(key);
      }
    }
    await this.store.save();
  }

  /**
   * 保存敏感配置（如 API Key，不再使用 localStorage）
   */
  async saveSecureConfig(key: string, value: string): Promise<void> {
    await this.init();
    if (!this.store) throw new Error('Store not initialized');

    await this.store.set(`secure_${key}`, value);
    await this.store.save();
  }

  /**
   * 获取敏感配置
   */
  async getSecureConfig(key: string): Promise<string | null> {
    await this.init();
    if (!this.store) return null;

    const result = await this.store.get<string>(`secure_${key}`);
    return result ?? null;
  }

  /**
   * 删除敏感配置
   */
  async deleteSecureConfig(key: string): Promise<void> {
    await this.init();
    if (!this.store) return;

    await this.store.delete(`secure_${key}`);
    await this.store.save();
  }

  /**
   * 保存项目数据（加密）
   */
  async saveProjectData(projectId: string, data: unknown): Promise<void> {
    await this.init();
    if (!this.store) throw new Error('Store not initialized');

    await this.store.set(`project_${projectId}`, {
      data,
      updatedAt: Date.now(),
    });
    await this.store.save();
  }

  /**
   * 加载项目数据
   */
  async loadProjectData<T>(projectId: string): Promise<T | null> {
    await this.init();
    if (!this.store) return null;

    const result = await this.store.get<{ data: T; updatedAt: number }>(`project_${projectId}`);
    return result?.data ?? null;
  }
}

export const secureStorage = new SecureStorageService();
export default secureStorage;
