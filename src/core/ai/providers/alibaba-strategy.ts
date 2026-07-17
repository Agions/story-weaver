/**
 * Alibaba (Tongyi Qianwen) Provider Strategy
 * OpenAI 兼容协议，仅 endpoint 不同
 */

import type { OpenAICompatibleConfig } from './openai-compatible-strategy';
import { OpenAICompatibleStrategy } from './openai-compatible-strategy';

const alibabaConfig: OpenAICompatibleConfig = {
  name: 'alibaba',
  endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  providerLabel: 'Alibaba',
};

export class AlibabaStrategy extends OpenAICompatibleStrategy {
  readonly name = alibabaConfig.name;
  protected readonly apiConfig = alibabaConfig;
}

export const alibabaStrategy = new AlibabaStrategy();
