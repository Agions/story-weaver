/**
 * AI 模型自动选择器
 * 根据已配置的 API Key 自动选择可用模型
 */

import { useSettingsStore } from '@/hooks/useSettings';

// 模型提供商配置
export const MODEL_PROVIDERS = {
  // 文本生成
  script: {
    primary: 'glm-5',
    fallback: ['minimax-m2.5', 'kimi-k2.5', 'doubao-2.0', 'qwen-2.5'],
    keys: ['zhipu_api_key', 'minimax_api_key', 'kimi_api_key', 'doubao_api_key', 'qwen_api_key']
  },
  // 图像生成
  image: {
    primary: 'seedream-5.0',
    fallback: ['kling-1.6', 'vidu-2.0', 'flux-pro', 'ideogram-3', 'recraft-v3'],
    keys: ['seedream_api_key', 'kling_api_key', 'vidu_api_key', 'flux_api_key', 'ideogram_api_key', 'recraft_api_key']
  },
  // 视频生成
  video: {
    primary: 'seedance-2.0',
    fallback: ['kling-1.6', 'vidu-2.0', 'runway-gen3', 'pika-1.0'],
    keys: ['seedance_api_key', 'kling_api_key', 'vidu_api_key', 'runway_api_key', 'pika_api_key']
  },
  // 语音合成
  tts: {
    primary: 'edge-tts',
    fallback: ['azure-tts', 'alibaba-tts', 'baidu-tts', 'tencent-tts', 'iflytek-tts'],
    keys: ['azure_api_key', 'alibaba_api_key', 'baidu_api_key', 'tencent_api_key', 'iflytek_api_key']
  }
};

// API Key 配置映射
export const API_KEY_CONFIG: Record<string, { provider: string; name: string }> = {
  // 文本生成
  zhipu_api_key: { provider: 'zhipu', name: '智谱AI' },
  minimax_api_key: { provider: 'minimax', name: 'MiniMax' },
  kimi_api_key: { provider: 'kimi', name: '月之暗面' },
  doubao_api_key: { provider: 'doubao', name: '豆包' },
  qwen_api_key: { provider: 'qwen', name: '通义千问' },
  openai_api_key: { provider: 'openai', name: 'OpenAI' },
  anthropic_api_key: { provider: 'anthropic', name: 'Anthropic' },
  // 图像生成
  seedream_api_key: { provider: 'seedream', name: 'Seedream' },
  kling_api_key: { provider: 'kling', name: '可灵' },
  vidu_api_key: { provider: 'vidu', name: 'Vidu' },
  midjourney_api_key: { provider: 'midjourney', name: 'Midjourney' },
  // 视频生成
  seedance_api_key: { provider: 'seedance', name: 'Seedance' },
  runway_api_key: { provider: 'runway', name: 'Runway' },
  pika_api_key: { provider: 'pika', name: 'Pika' },
  // 语音合成
  azure_api_key: { provider: 'azure', name: 'Azure' },
  alibaba_api_key: { provider: 'alibaba', name: '阿里云' },
  baidu_api_key: { provider: 'baidu', name: '百度' },
  tencent_api_key: { provider: 'tencent', name: '腾讯云' },
  iflytek_api_key: { provider: 'iflytek', name: '讯飞' },
};

/**
 * 检查 API Key 是否已配置
 */
export function isApiKeyConfigured(keyName: string, settings: Record<string, any>): boolean {
  const value = settings[keyName];
  return value && value.length > 0;
}

/**
 * 自动选择最佳模型
 * @param type - 模型类型: script/image/video/tts
 * @param settings - 用户设置
 * @returns 选中的模型 ID
 */
export function autoSelectModel(type: keyof typeof MODEL_PROVIDERS, settings: Record<string, any>): string {
  const config = MODEL_PROVIDERS[type];
  
  // 首先检查主要模型对应的 API Key
  const primaryKey = config.keys[0];
  if (isApiKeyConfigured(primaryKey, settings)) {
    return config.primary;
  }
  
  // 遍历备用模型列表
  for (const fallbackModel of config.fallback) {
    // 尝试找到对应的 API Key
    const keyIndex = config.fallback.indexOf(fallbackModel) + 1;
    if (keyIndex < config.keys.length) {
      const keyName = config.keys[keyIndex];
      if (isApiKeyConfigured(keyName, settings)) {
        return fallbackModel;
      }
    }
  }
  
  // 如果没有配置任何 API Key，返回默认模型
  return config.primary;
}

/**
 * 获取模型对应的提供商信息
 */
export function getModelProvider(modelId: string): { provider: string; name: string } | null {
  for (const [key, value] of Object.entries(API_KEY_CONFIG)) {
    if (modelId.includes(key.replace('_api_key', ''))) {
      return value;
    }
  }
  return null;
}

/**
 * 获取已配置的所有模型列表
 */
export function getConfiguredModels(type: keyof typeof MODEL_PROVIDERS, settings: Record<string, any>): string[] {
  const config = MODEL_PROVIDERS[type];
  const configured: string[] = [];
  
  // 检查主模型
  if (isApiKeyConfigured(config.keys[0], settings)) {
    configured.push(config.primary);
  }
  
  // 检查备用模型
  for (let i = 0; i < config.fallback.length; i++) {
    const keyIndex = i + 1;
    if (keyIndex < config.keys.length) {
      if (isApiKeyConfigured(config.keys[keyIndex], settings)) {
        configured.push(config.fallback[i]);
      }
    }
  }
  
  return configured;
}
