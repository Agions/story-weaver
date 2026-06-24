/**
 * 应用设置相关的自定义钩子（重构版）
 * ==================================
 * 提供了一系列钩子用于管理应用设置和API密钥
 *
 * 重构思路：
 * - 6 个完全重复的 24 行 API key hook → `createApiKeyHook` 工厂（6×1 行）
 * - getSecureStoredApiKey / setSecureStoredApiKey → settings-api-key-storage.ts
 * - ApiKeyState 类型 → settings-api-key-storage.ts
 * - 主 hook useSettingsStore + 子 hooks 保持不变
 */
import { useState, useCallback, useEffect } from 'react';

import { logger } from '@/core/utils/logger';

import { createApiKeyHook } from './settings-api-key-factory';
import {
  getSecureStoredApiKey,
  setSecureStoredApiKey,
  type ApiKeyState,
} from './settings-api-key-storage';
import { getStoredValue, setStoredValue } from './settings-helpers';

// Re-export 类型（保持旧 import 路径）
export type { ApiKeyState } from './settings-api-key-storage';

// 启用调试模式
const DEBUG = false;

// 完整的应用设置类型
export interface AppSettings {
  autoSave: boolean;
  autoUpdate: boolean;
  highQualityExport: boolean;
  enableTranscode: boolean;
  showLineNumbers: boolean;
  defaultModelIndex: number;
  preferredAIProvider: string;
  preferredAICategory: string;
  language: 'zh' | 'en';
  theme: 'light' | 'dark' | 'auto';
  ffmpegPath?: string;
  lastExportFormat?: string;
  recentProjects?: string[];
}

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  autoSave: true,
  autoUpdate: true,
  highQualityExport: true,
  enableTranscode: false,
  showLineNumbers: true,
  defaultModelIndex: 0,
  preferredAIProvider: 'openai',
  preferredAICategory: 'all',
  language: 'zh',
  theme: 'auto',
  recentProjects: [],
};

// ========== 应用设置钩子 ==========

export const useSettingsStore = () => {
  const [settings, setSettings] = useState<AppSettings>(() =>
    getStoredValue('app_settings', DEFAULT_SETTINGS)
  );

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      setStoredValue('app_settings', updated);
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setStoredValue('app_settings', DEFAULT_SETTINGS);
    if (DEBUG) logger.info('[useSettings] 重置所有设置为默认值');
  }, []);

  const addRecentProject = useCallback((projectId: string) => {
    setSettings((prev) => {
      const recentProjects = prev.recentProjects || [];
      const filtered = recentProjects.filter((id) => id !== projectId);
      const updated = [projectId, ...filtered].slice(0, 10);
      const newSettings = { ...prev, recentProjects: updated };
      setStoredValue('app_settings', newSettings);
      return newSettings;
    });
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
    addRecentProject,
  };
};

// ========== API密钥相关钩子（工厂生成，消除 6×24 行重复） ==========

/** OpenAI API密钥 */
export const useOpenAIAPIKey = createApiKeyHook('openai');

/** Claude API密钥 */
export const useClaudeAPIKey = createApiKeyHook('anthropic');

// ========== 设置子钩子 ==========

export const useAutoSave = () => {
  const { settings, updateSettings } = useSettingsStore();

  const toggleAutoSave = useCallback(() => {
    updateSettings({ autoSave: !settings.autoSave });
  }, [settings.autoSave, updateSettings]);

  return [settings.autoSave, toggleAutoSave] as const;
};
