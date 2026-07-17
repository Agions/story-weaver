/**
 * AI Provider Registry — Provider 策略注册表
 * 统一管理所有 AI Provider Strategy
 */

import type { AIProviderStrategy } from './base';
import { openAIStrategy } from './openai-strategy';
import { anthropicStrategy } from './anthropic-strategy';
import { googleStrategy } from './google-strategy';
import { baiduStrategy } from './baidu-strategy';
import { alibabaStrategy } from './alibaba-strategy';
import { zhipuStrategy } from './zhipu-strategy';
import { mockStrategy } from './mock-strategy';

/**
 * Provider Registry
 * 使用 Map 存储，支持运行时扩展
 */
class ProviderRegistry {
  private providers: Map<string, AIProviderStrategy> = new Map();

  constructor() {
    // 注册默认 Provider
    this.register(openAIStrategy);
    this.register(anthropicStrategy);
    this.register(googleStrategy);
    this.register(baiduStrategy);
    this.register(alibabaStrategy);
    this.register(zhipuStrategy);
    this.register(mockStrategy);
  }

  /**
   * 注册 Provider
   */
  register(strategy: AIProviderStrategy): void {
    this.providers.set(strategy.name, strategy);
  }

  /**
   * 获取 Provider
   */
  get(name: string): AIProviderStrategy | undefined {
    return this.providers.get(name);
  }

  /**
   * 获取所有 Provider 名称
   */
  getAllNames(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const providerRegistry = new ProviderRegistry();