/**
 * AI Provider 接口定义
 * 定义了与 AI 服务交互的统一接口
 */

// ============================================================================
// Types
// ============================================================================

export interface AICompletionOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  model?: string;
}

export interface AICompletionResult {
  content: string;
  finishReason: 'stop' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
  model?: string;
}

export interface AIImageGenerationResult {
  images: Array<{
    url: string;
    base64?: string;
  }>;
  usage?: {
    totalTokens: number;
  };
}

// ============================================================================
// Provider Interface
// ============================================================================

export interface AIProvider {
  name: string;
  type: 'text' | 'image' | 'multimodal';

  /**
   * 生成文本补全
   */
  complete(options: AICompletionOptions): Promise<AICompletionResult>;

  /**
   * 生成图像（仅图像提供商实现）
   */
  generateImage?(options: AIImageGenerationOptions): Promise<AIImageGenerationResult>;

  /**
   * 检查提供商是否可用
   */
  isAvailable(): Promise<boolean>;

  /**
   * 获取支持的模型列表
   */
  getSupportedModels?(): string[];
}

// ============================================================================
// Base Provider
// ============================================================================

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  abstract type: 'text' | 'image' | 'multimodal';

  protected apiKey: string;
  protected baseUrl: string;
  protected defaultModel: string;

  constructor(config: { apiKey: string; baseUrl: string; defaultModel: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.defaultModel = config.defaultModel;
  }

  abstract complete(options: AICompletionOptions): Promise<AICompletionResult>;

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }
      // 简单的健康检查
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getSupportedModels?(): string[];
}

export class AIProviderFactory {
  private static providers = new Map<string, AIProvider>();

  static register(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  static get(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  static getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  static async getAvailable(): Promise<AIProvider[]> {
    const providers = this.getAll();
    const available: AIProvider[] = [];

    for (const provider of providers) {
      if (await provider.isAvailable()) {
        available.push(provider);
      }
    }

    return available;
  }
}

export default AIProviderFactory;
