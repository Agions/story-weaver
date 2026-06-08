/**
 * AI 服务
 * 统一的 AI 模型调用服务
 *
 * 使用 Strategy 模式：按 provider (OpenAI/Anthropic/Baidu 等) 拆分到独立文件
 */

import { providerRegistry, mockStrategy } from '@/core/ai/providers';
import { getModelById } from '@/core/config/models.config';
import { LLM_MODELS, DEFAULT_LLM_MODEL, MODEL_RECOMMENDATIONS } from '@/core/constants';
import { promptBuilderService } from '@/core/domains/ai/services/prompt-builder.service';
import { logger } from '@/core/utils/logger';
import { requestCache } from '@/shared/utils/request';

// Re-export shared types from centralized types file
export type {
  AIResponse,
  RequestConfig,
  StreamCallbacks,
  MockConfig,
  AIModel,
  AIModelSettings,
  VideoAnalysis,
  ScriptSegment,
  Scene,
  Keyframe,
} from '@/core/services/ai/text/ai.service.types';
// Note: do NOT re-import Script here to avoid `export *` duplicate-export
// ambiguity in src/core/services/ai/text/index.ts. Script is already
// re-exported via ai.service.types.
import type {
  AIResponse,
  AIModel,
  AIModelSettings,
  VideoAnalysis,
  ScriptSegment,
  Scene,
  Keyframe,
  RequestConfig,
  MockConfig,
} from '@/core/services/ai/text/ai.service.types';
import type { Script } from '@/shared/types';

class AIService {
  // Mock 配置（由 mockStrategy 管理）
  setMockConfig(requestId: string, config: MockConfig): void {
    mockStrategy.setMockConfig(requestId, config);
  }

  clearMockConfig(requestId: string): void {
    mockStrategy.clearMockConfig(requestId);
  }

  // 启用/禁用 Mock 模式
  private useMock = false;
  setMockMode(enabled: boolean): void {
    this.useMock = enabled;
  }
  isMockMode(): boolean {
    return this.useMock;
  }

  /**
   * 通用生成方法
   */
  async generate(
    prompt: string,
    options: {
      model: string;
      provider: string;
      signal?: AbortSignal;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    const model = this.getModelById(options.model);
    if (!model) {
      if (this.useMock) {
        const mockResponse = await mockStrategy.call('', {
          model: options.model,
          messages: [
            { role: 'system', content: '你是一个专业的视频内容创作助手。' },
            { role: 'user', content: prompt },
          ],
          temperature: options.temperature,
          max_tokens: options.max_tokens,
        });
        return mockResponse.content;
      }
      throw new Error(`Model ${options.model} not found`);
    }

    const settings: AIModelSettings = {
      enabled: true,
      apiKey: '',
      baseURL: '',
      model: model.id,
      temperature: options.temperature,
      maxTokens: options.max_tokens,
    } as AIModelSettings;

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('AI generate failed:', error);
      throw new Error(`AI生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private getModelById(modelId: string): AIModel | undefined {
    return getModelById(modelId);
  }

  /**
   * 生成脚本
   */
  async generateScript(
    model: AIModel,
    settings: AIModelSettings,
    params: {
      topic: string;
      style: string;
      tone: string;
      length: string;
      audience: string;
      language: string;
      keywords?: string[];
      requirements?: string;
      videoDuration?: number;
    }
  ): Promise<Script> {
    const prompt = promptBuilderService.buildScriptPrompt(params);

    try {
      const response = await this.callAPI(model, settings, prompt);

      return {
        id: `script_${Date.now()}`,
        title: params.topic,
        content: response.content,
        segments: this.parseScriptSegments(response.content),
        metadata: {
          style: params.style,
          tone: params.tone,
          length: params.length as 'short' | 'medium' | 'long',
          targetAudience: params.audience,
          language: params.language,
          wordCount: response.content.length,
          estimatedDuration: this.estimateDuration(response.content.length),
          generatedBy: model.id,
          generatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('脚本生成失败:', error);
      throw error;
    }
  }

  /**
   * 分析视频
   */
  async analyzeVideo(
    model: AIModel,
    settings: AIModelSettings,
    videoInfo: {
      duration: number;
      width: number;
      height: number;
      format: string;
    }
  ): Promise<Partial<VideoAnalysis>> {
    const prompt = promptBuilderService.buildAnalysisPrompt(videoInfo);

    try {
      const response = await this.callAPI(model, settings, prompt);

      return {
        summary: response.content,
        scenes: this.generateMockScenes(videoInfo.duration),
        keyframes: this.generateMockKeyframes(videoInfo.duration),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('视频分析失败:', error);
      throw error;
    }
  }

  /**
   * 优化脚本
   */
  async optimizeScript(
    model: AIModel,
    settings: AIModelSettings,
    script: string,
    optimization: 'shorten' | 'lengthen' | 'simplify' | 'professional'
  ): Promise<string> {
    const prompt = promptBuilderService.buildOptimizationPrompt(script, optimization);

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('脚本优化失败:', error);
      throw error;
    }
  }

  /**
   * 翻译脚本
   */
  async translateScript(
    model: AIModel,
    settings: AIModelSettings,
    script: string,
    targetLanguage: string
  ): Promise<string> {
    const prompt = `请将以下脚本翻译成${targetLanguage}，保持原有的语气和风格：

${script}

请直接返回翻译后的内容，不要添加解释。`;

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('翻译失败:', error);
      throw error;
    }
  }

  /**
   * 调用 AI API（通过 Provider Registry 分发到对应 Strategy）
   */
  private async callAPI(
    model: AIModel,
    settings: AIModelSettings,
    prompt: string,
    requestId?: string
  ): Promise<AIResponse> {
    if (this.useMock) {
      return mockStrategy.call(
        '',
        {
          model: settings.model ?? model.id,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的视频内容创作助手，擅长生成高质量的解说脚本。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: settings.temperature ?? 0.7,
          max_tokens: settings.maxTokens ?? 2000,
        },
        requestId
      );
    }

    // 构建请求配置
    const config: RequestConfig = {
      model: settings.model ?? model.id,
      messages: [
        { role: 'system', content: '你是一个专业的视频内容创作助手，擅长生成高质量的解说脚本。' },
        { role: 'user', content: prompt },
      ],
      temperature: settings.temperature ?? 0.7,
      max_tokens: settings.maxTokens ?? 2000,
    };

    // 缓存键：只有 temperature=0 时才使用缓存（确定性输出）
    const cacheKey =
      settings.temperature === 0
        ? `ai:${model.provider}:${model.id}:${prompt.slice(0, 100)}`
        : null;

    // 通过 Provider Registry 获取 Strategy 并调用
    const callAPI = async (): Promise<AIResponse> => {
      const strategy = providerRegistry.get(model.provider);
      if (strategy) {
        // 百度需要特殊处理（需要 apiSecret，通过 config 扩展传递）
        if (model.provider === 'baidu') {
          const baiduConfig = { ...config, apiSecret: settings.apiSecret };
          return strategy.call(settings.apiKey!, baiduConfig as RequestConfig, requestId);
        }
        return strategy.call(settings.apiKey!, config, requestId);
      }
      // 未找到 provider，回退到 mock
      return mockStrategy.call('', config, requestId);
    };

    // 启用缓存以减少重复 API 调用
    if (cacheKey) {
      return (
        requestCache.get<AIResponse>(cacheKey) ??
        (async () => {
          const result = await callAPI();
          requestCache.set(cacheKey, result, 10 * 60 * 1000); // 10分钟 TTL
          return result;
        })()
      );
    }

    return callAPI();
  }

  /**
   * 获取推荐的模型
   */
  getRecommendedModels(
    task: keyof typeof MODEL_RECOMMENDATIONS
  ): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return [...(MODEL_RECOMMENDATIONS[task] || [DEFAULT_LLM_MODEL])];
  }

  /**
   * 获取模型信息
   */
  getModelInfo(modelId: string): (typeof LLM_MODELS)[keyof typeof LLM_MODELS] | null {
    return Object.values(LLM_MODELS).find((m) => m.modelId === modelId) ?? null;
  }

  /**
   * 获取所有可用模型
   */
  getAllModels(): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return Object.values(LLM_MODELS);
  }

  /**
   * 获取国内推荐模型
   */
  getDomesticModels(): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return Object.values(LLM_MODELS).filter((m) =>
      ['baidu', 'alibaba', 'moonshot', 'zhipu', 'minimax'].includes(m.provider)
    );
  }

  /**
   * 解析脚本片段
   */
  private parseScriptSegments(content: string): ScriptSegment[] {
    const paragraphs = content.split('\n\n').filter((p) => p.trim());

    return paragraphs.map((p, index) => ({
      id: `seg_${index + 1}`,
      startTime: index * 30,
      endTime: (index + 1) * 30,
      content: p.trim(),
      type: index === 0 ? 'narration' : index === paragraphs.length - 1 ? 'narration' : 'dialogue',
    }));
  }

  /**
   * 估算时长
   */
  private estimateDuration(wordCount: number): number {
    return Math.ceil(wordCount / 150);
  }

  /**
   * 生成模拟场景
   */
  private generateMockScenes(duration: number): Scene[] {
    const scenes = [];
    const sceneCount = Math.min(Math.floor(duration / 30), 10);

    for (let i = 0; i < sceneCount; i++) {
      scenes.push({
        id: `scene_${i + 1}`,
        startTime: i * 30,
        endTime: Math.min((i + 1) * 30, duration),
        thumbnail: '',
        description: `场景 ${i + 1}`,
        tags: [`场景${i + 1}`],
      });
    }

    return scenes;
  }

  /**
   * 生成模拟关键帧
   */
  private generateMockKeyframes(duration: number): Keyframe[] {
    const keyframes = [];
    const count = Math.min(Math.floor(duration / 5), 20);

    for (let i = 0; i < count; i++) {
      keyframes.push({
        id: `kf_${i + 1}`,
        timestamp: i * 5,
        thumbnail: '',
        description: `关键帧 ${i + 1}`,
      });
    }

    return keyframes;
  }

  /**
   * 流式生成（适用于支持的 API）
   */
  async *streamGenerate(
    prompt: string,
    options: {
      model: string;
      provider: string;
      signal?: AbortSignal;
      temperature?: number;
      max_tokens?: number;
    }
  ): AsyncGenerator<string> {
    const model = this.getModelById(options.model);
    if (!model) {
      throw new Error(`Model ${options.model} not found`);
    }

    const strategy = providerRegistry.get(model.provider);
    if (!strategy?.supportsStreaming) {
      // 不支持流式，分块返回
      const response = await this.generate(prompt, options);
      const chunks = this.chunkText(response, 10);
      for (const chunk of chunks) {
        yield chunk;
      }
      return;
    }

    const settings: AIModelSettings = {
      enabled: true,
      apiKey: '',
      baseURL: '',
      model: model.id,
      temperature: options.temperature,
      maxTokens: options.max_tokens,
    } as AIModelSettings;

    if (model.provider === 'openai' && strategy.stream) {
      yield* strategy.stream(settings.apiKey!, {
        model: settings.model ?? model.id,
        messages: [
          { role: 'system', content: '你是一个专业的视频内容创作助手。' },
          { role: 'user', content: prompt },
        ],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      });
    } else {
      // 默认分块返回
      const response = await this.callAPI(model, settings, prompt);
      const chunks = this.chunkText(response.content, 10);
      for (const chunk of chunks) {
        yield chunk;
      }
    }
  }

  /**
   * 将文本分块
   */
  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 批量生成（并行处理多个请求）
   */
  async batchGenerate(
    prompts: string[],
    options: {
      model: string;
      provider: string;
      temperature?: number;
      max_tokens?: number;
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<string[]> {
    const concurrency = options.concurrency ?? 3;
    const results: string[] = new Array(prompts.length);
    let completed = 0;

    for (let i = 0; i < prompts.length; i += concurrency) {
      const batch = prompts.slice(i, i + concurrency);
      const batchPromises = batch.map((prompt, batchIndex) =>
        this.generate(prompt, options).then((result) => {
          results[i + batchIndex] = result;
          completed++;
          options.onProgress?.(completed, prompts.length);
        })
      );
      await Promise.all(batchPromises);
    }

    return results;
  }
}

export const aiService = new AIService();
