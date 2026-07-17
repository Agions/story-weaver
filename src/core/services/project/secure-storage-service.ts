/**
 * 安全存储服务 - Secure Storage Service
 *
 * 合并自原 5 个子模块（types / fallback / tauri / initializer / service），
 * 保持对外 API 完全兼容。
 *
 * @module core/services/project/secure-storage-service
 */


/** 检查点数据结构 */
export interface CheckpointData {
  stepId: string;
  completed: boolean;
  data: unknown;
  timestamp: number;
}

/** localStorage key 前缀字典 */
export const KEY_PREFIX = {
  checkpoint: 'checkpoint_',
  secure: 'secure_',
  project: 'project_',
  cost: 'cost_',
} as const;

/** Tauri Store 子集接口 */
export interface TauriStore {
  set: (key: string, value: unknown) => Promise<void>;
  get: <T>(key: string) => Promise<T | null>;
  delete: (key: string) => Promise<boolean | void>;
  keys: () => Promise<string[]>;
  save: () => Promise<void>;
}

/** Tauri Store 文件名 */
export const TAURI_STORE_FILENAME = 'secure-data.json';

/** 项目数据包装类型 */
export interface ProjectDataEnvelope<T = unknown> {
  data: T;
  updatedAt: number;
}

/** Tauri 环境检测 */
export function detectTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/** 构造 checkpoint 存储 key */
export function buildCheckpointKey(stepId: string): string {
  return `${KEY_PREFIX.checkpoint}${stepId}`;
}

/** 构造 secure config 存储 key */
export function buildSecureConfigKey(key: string): string {
  return `${KEY_PREFIX.secure}${key}`;
}

/** 构造 project data 存储 key */
export function buildProjectDataKey(projectId: string): string {
  return `${KEY_PREFIX.project}${projectId}`;
}

/** 构造 cost data 存储 key */
export function buildCostDataKey(key: string): string {
  return `${KEY_PREFIX.cost}${key}`;
}


/** 字符串安全读取 */
function safeGetString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 字符串安全写入 */
function safeSetString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 静默 */
  }
}

/** 字符串安全删除 */
function safeRemoveString(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* 静默 */
  }
}

/** 把"读 raw + JSON.parse + 异常返回 null"封装为单行 helper */
function readJsonOrNull<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** localStorage 字符串读写 */
function fallbackSetString(key: string, value: string): void {
  safeSetString(key, value);
}

function fallbackGetString(key: string): string | null {
  return safeGetString(key);
}

function fallbackRemoveString(key: string): void {
  safeRemoveString(key);
}

/** localStorage JSON 读写 */
function fallbackSetJson(key: string, value: unknown): void {
  safeSetString(key, JSON.stringify(value));
}

function fallbackGetJson<T>(key: string): T | null {
  return readJsonOrNull<T>(safeGetString(key));
}

/** 删除指定前缀的全部 key */
function fallbackClearByPrefix(prefix: string): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
  for (const k of keys) {
    safeRemoveString(k);
  }
}

/** checkpoint 命名空间清理 */
function fallbackClearAllCheckpoints(): void {
  fallbackClearByPrefix(KEY_PREFIX.checkpoint);
}


import { logger } from '@/core/utils/logger';

/** 通用 Tauri 写：失败时回退到 fallback */
async function tauriSetOrFallback(
  store: TauriStore,
  key: string,
  value: unknown,
  fallbackWrite: () => void
): Promise<void> {
  try {
    await store.set(key, value);
    await store.save();
  } catch {
    fallbackWrite();
  }
}

/** 通用 Tauri 读：失败时回退到 fallback */
async function tauriGetOrFallback<T>(
  store: TauriStore,
  key: string,
  fallbackRead: () => T | null
): Promise<T | null> {
  try {
    const result = await store.get<T>(key);
    return result ?? null;
  } catch {
    return fallbackRead();
  }
}

/** 通用 Tauri 删：失败时回退到 fallback */
async function tauriDeleteOrFallback(
  store: TauriStore,
  key: string,
  fallbackRemove: () => void
): Promise<void> {
  try {
    await store.delete(key);
    await store.save();
  } catch {
    fallbackRemove();
  }
}

/** 保存 checkpoint */
async function tauriSaveCheckpoint(store: TauriStore, key: string, data: CheckpointData): Promise<void> {
  return tauriSetOrFallback(store, key, data, () => fallbackSetJson(key, data));
}

/** 读取 checkpoint */
async function tauriLoadCheckpoint(store: TauriStore, key: string): Promise<CheckpointData | null> {
  return tauriGetOrFallback<CheckpointData>(store, key, () => fallbackGetJson<CheckpointData>(key));
}

/** 删除 checkpoint */
async function tauriDeleteCheckpoint(store: TauriStore, key: string): Promise<void> {
  return tauriDeleteOrFallback(store, key, () => fallbackRemoveString(key));
}

/** 删除全部 checkpoint */
async function tauriClearAllCheckpoints(store: TauriStore): Promise<void> {
  try {
    const keys = await store.keys();
    for (const k of keys) {
      if (k.startsWith('checkpoint_')) {
        await store.delete(k);
      }
    }
    await store.save();
  } catch {
    fallbackClearAllCheckpoints();
  }
}

/** 保存 secure config */
async function tauriSaveSecureConfig(store: TauriStore, key: string, value: string): Promise<void> {
  return tauriSetOrFallback(store, key, value, () => fallbackSetString(key, value));
}

/** 读取 secure config */
async function tauriGetSecureConfig(store: TauriStore, key: string): Promise<string | null> {
  return tauriGetOrFallback<string>(store, key, () => fallbackGetString(key));
}

/** 删除 secure config */
async function tauriDeleteSecureConfig(store: TauriStore, key: string): Promise<void> {
  return tauriDeleteOrFallback(store, key, () => fallbackRemoveString(key));
}

/** 保存 project data */
async function tauriSaveProjectData<T>(store: TauriStore, key: string, data: T): Promise<void> {
  const envelope: ProjectDataEnvelope<T> = { data, updatedAt: Date.now() };
  return tauriSetOrFallback(store, key, envelope, () => fallbackSetJson(key, envelope));
}

/** 读取 project data */
async function tauriLoadProjectData<T>(store: TauriStore, key: string): Promise<T | null> {
  try {
    const result = await store.get<ProjectDataEnvelope<T>>(key);
    return result?.data ?? null;
  } catch {
    const envelope = fallbackGetJson<ProjectDataEnvelope<T>>(key);
    return envelope?.data ?? null;
  }
}

/** 保存 cost data */
async function tauriSaveCostData(store: TauriStore, key: string, data: unknown): Promise<void> {
  return tauriSetOrFallback(store, key, data, () => fallbackSetJson(key, data));
}

/** 读取 cost data */
async function tauriLoadCostData<T>(store: TauriStore, key: string): Promise<T | null> {
  return tauriGetOrFallback<T>(store, key, () => fallbackGetJson<T>(key));
}


/** 存储初始化器 */
class SecureStorageInitializer {
  private store: TauriStore | null = null;
  private initPromise: Promise<void> | null = null;
  private useFallback = false;

  /** 是否已就绪 */
  get isReady(): boolean {
    return this.store !== null || this.useFallback;
  }

  /** 当前是否使用 fallback */
  get isFallback(): boolean {
    return this.useFallback;
  }

  /** 获取 Tauri store */
  get tauriStore(): TauriStore | null {
    return this.store;
  }

  /** 初始化：仅执行一次 */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!detectTauriEnvironment()) {
        this.useFallback = true;
        return;
      }

      try {
        const storeModule = await import('@tauri-apps/plugin-store');
        this.store = (await storeModule.Store.load(TAURI_STORE_FILENAME)) as unknown as TauriStore;
      } catch (error) {
        logger.warn(
          '[SecureStorage] Tauri store not available, using localStorage fallback:',
          error
        );
        this.useFallback = true;
      }
    })();

    return this.initPromise;
  }
}


/**
 * 安全存储服务
 */
class SecureStorageService {
  private initializer = new SecureStorageInitializer();

  // ========== Checkpoint 操作 ==========

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

  // ========== Secure Config 操作 ==========

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

  // ========== Project Data 操作 ==========

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

  // ========== Cost Data 操作 ==========

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
