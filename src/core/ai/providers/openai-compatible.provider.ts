/**
 * OpenAI 兼容 Provider 实现
 * 支持 OpenRouter, OpenAI, Azure OpenAI 等兼容 API
 */

import type {
  AIProvider,
  AIProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
  ImageGenOptions,
  ImageGenResponse,
} from './ai-provider.interface';

export class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai-compatible';
  
  constructor(public readonly config: AIProviderConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async streamChat(
    request: ChatCompletionRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`AI API Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              onChunk(JSON.parse(data));
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async generateImage(
    prompt: string,
    options: ImageGenOptions = {}
  ): Promise<ImageGenResponse> {
    const response = await fetch(`${this.config.baseURL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'dall-e-3',
        prompt,
        n: 1,
        size: `${options.width || 1024}x${options.height || 1024}`,
        quality: options.quality || 'standard',
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      image_url: data.data[0].url,
      revised_prompt: data.data[0].revised_prompt,
      model: options.model || 'dall-e-3',
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
