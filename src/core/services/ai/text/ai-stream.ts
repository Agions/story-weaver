/**
 * AI 流式生成适配器
 *
 * 把 streamGenerate 的三种 fallback 路径抽成清晰分支：
 * 1. provider 不支持流式 → 一次性 generate 后 chunk 返回
 * 2. provider === openai 且 strategy.stream 存在 → 真流式
 * 3. 其他支持流式的 provider → callAPI + chunk 返回
 */

import { providerRegistry } from '@/core/ai/providers';
import { logger } from '@/core/utils/logger';

import { dispatchAIRequest, buildRequestConfig } from './ai-call-dispatcher';
import type { AIModel, AIModelSettings } from './ai-service-types';

/** 不支持流式时分块返回的字符数 */
const STREAM_CHUNK_SIZE = 10;

/**
 * 把字符串按字符数切成定长片段（保留尾部所有字符）。
 */
export function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 把 AIResponse.content 切成多段 yield 出去（模拟流式）。
 */
export async function* yieldChunked(
  content: string,
  chunkSize: number = STREAM_CHUNK_SIZE
): AsyncGenerator<string> {
  for (const chunk of chunkText(content, chunkSize)) {
    yield chunk;
  }
}

/**
 * 流式生成：按模型/strategy 能力选择最优路径。
 * 行为与原 streamGenerate 完全一致。
 */
export async function* streamGenerateWithFallback(
  model: AIModel,
  settings: AIModelSettings,
  prompt: string,
  fallbackGenerate: () => Promise<string>
): AsyncGenerator<string> {
  const strategy = providerRegistry.get(model.provider);

  // 路径 1：provider 不支持流式 → 一次性生成后分块
  if (!strategy?.supportsStreaming) {
    const fullText = await fallbackGenerate();
    yield* yieldChunked(fullText);
    return;
  }

  // 路径 2：openai 有专用 stream 接口
  if (model.provider === 'openai' && strategy.stream) {
    const streamConfig = {
      model: settings.model ?? model.id,
      messages: [
        { role: 'system' as const, content: '你是一个专业的视频内容创作助手。' },
        { role: 'user' as const, content: prompt },
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    };
    yield* strategy.stream(settings.apiKey!, streamConfig);
    return;
  }

  // 路径 3：其他支持流式的 provider → callAPI + 分块返回
  try {
    const config = buildRequestConfig(model, settings, prompt);
    const response = await dispatchAIRequest(model, settings, config);
    yield* yieldChunked(response.content);
  } catch (error) {
    logger.error('流式生成失败:', error);
    throw error;
  }
}
