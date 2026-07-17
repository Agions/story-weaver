/**
 * AI Provider 调用分发
 *
 * 把 AIService.callAPI 内"按 provider 路由 + 百度特殊处理 + Mock fallback"
 * 的逻辑独立出来，便于未来加新 provider 时只动一个文件。
 */

import { providerRegistry, mockStrategy } from '@/core/ai/providers';
import { logger } from '@/core/utils/logger';

import type { AIResponse, AIModel, AIModelSettings, AIRequestConfig } from './ai-service-types';

/** 默认 system prompt（与原实现逐字一致） */
const DEFAULT_SYSTEM_PROMPT = '你是一个专业的视频内容创作助手，擅长生成高质量的解说脚本。';

/** 默认 temperature */
const DEFAULT_TEMPERATURE = 0.7;
/** 默认 max_tokens */
const DEFAULT_MAX_TOKENS = 2000;

/**
 * 从 AIModel + AIModelSettings 构造标准的 AIRequestConfig。
 */
export function buildRequestConfig(
  model: AIModel,
  settings: AIModelSettings,
  prompt: string
): AIRequestConfig {
  return {
    model: settings.model ?? model.id,
    messages: [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: settings.temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: settings.maxTokens ?? DEFAULT_MAX_TOKENS,
  };
}

/**
 * 通过 Provider Registry 分发到对应 strategy。
 * - 命中 strategy → 调它
 *   - 百度特殊处理：把 apiSecret 注入 config
 * - 未命中 → fallback 到 mockStrategy
 */
export async function dispatchAIRequest(
  model: AIModel,
  settings: AIModelSettings,
  config: AIRequestConfig,
  requestId?: string
): Promise<AIResponse> {
  try {
    const strategy = providerRegistry.get(model.provider);
    if (strategy) {
      // 百度需要把 apiSecret 注入 config（历史约定）
      if (model.provider === 'baidu') {
        const baiduConfig = { ...config, apiSecret: settings.apiSecret };
        return await strategy.call(settings.apiKey!, baiduConfig as AIRequestConfig, requestId);
      }
      return await strategy.call(settings.apiKey!, config, requestId);
    }
    // 未找到 provider，回退到 mock（与原行为一致）
    return await mockStrategy.call('', config, requestId);
  } catch (error) {
    logger.error('AI provider call failed:', error);
    throw error;
  }
}
