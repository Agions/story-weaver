/**
 * Zhipu GLM Provider Strategy
 * OpenAI 兼容协议，仅 endpoint 不同
 */

import type { OpenAICompatibleConfig } from './openai-compatible-strategy';
import { OpenAICompatibleStrategy } from './openai-compatible-strategy';

const zhipuConfig: OpenAICompatibleConfig = {
  name: 'zhipu',
  endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  providerLabel: 'Zhipu',
};

export class ZhipuStrategy extends OpenAICompatibleStrategy {
  readonly name = zhipuConfig.name;
  protected readonly apiConfig = zhipuConfig;
}

export const zhipuStrategy = new ZhipuStrategy();
