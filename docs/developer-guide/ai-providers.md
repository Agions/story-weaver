---
title: AI Provider Registry
description: 多模型 AI 编排的设计与扩展方法
---

# AI Provider Registry

frame-fab 的核心竞争力之一是**多模型 AI 编排**。本章深入讲解 ProviderRegistry + Fallback Chain 的设计。

## 为什么需要 Provider Registry

AI 漫剧创作涉及 4 类模型:

| 类型               | 用途                           | frame-fab 集成                     |
| ------------------ | ------------------------------ | ---------------------------------- |
| **文字模型 (LLM)** | 剧本分析、对话生成、提示词工程 | GLM-5 / Kimi K2.5 / M2.5           |
| **图像模型 (T2I)** | 角色设计、场景渲染、首帧图     | Seedream 5.0 / Imagen 3            |
| **视频模型 (I2V)** | 分镜视频生成、运镜控制         | Kling 1.6 / Vidu Q3 / Seedance 2.0 |
| **语音模型 (TTS)** | 角色配音、旁白生成             | Edge TTS / 字节语音                |

每类都有 3+ 备选,不同模型在不同任务上表现不一。例如:

- **Vidu Q3** 在音画同步上最强,适合对话戏
- **Kling 1.6** 在长镜头和物理模拟上最强,适合动作戏
- **Seedance 2.0** 在运镜控制上最强,适合推拉摇移

手动选模型既繁琐又低效。Provider Registry 解决了这个痛点。

## 核心架构

```typescript
// src/core/ai/providers/registry.ts

export interface ProviderRegistry {
  /**
   * 注册一个 Provider
   */
  register<T extends Provider>(type: ProviderType, provider: T): void;

  /**
   * 解析最佳 Provider
   * @param type 模型类型
   * @param strategy 选择策略 ('default' | 'cheapest' | 'fastest' | 'highest-quality')
   * @param context 调用上下文 (用于能力路由)
   */
  resolve<T extends Provider>(
    type: ProviderType,
    strategy?: SelectionStrategy,
    context?: ProviderContext
  ): T;

  /**
   * 带回退的执行: 失败时自动尝试下一个
   */
  executeWithFallback<T>(
    type: ProviderType,
    operation: (provider: T) => Promise<T>,
    options?: FallbackOptions
  ): Promise<T>;
}
```

## Provider 接口

```typescript
// src/core/ai/providers/base.ts

export interface Provider {
  readonly id: string; // 'zhipu-glm-5', 'kling-1.6' ...
  readonly type: ProviderType; // 'text' | 'image' | 'video' | 'tts'
  readonly displayName: string;

  /** 成本: 每 1k token / 每张图 / 每秒视频 */
  readonly cost: ProviderCost;

  /** 能力: 支持的特化任务 */
  readonly capabilities: ProviderCapability[];

  /** 健康检查 */
  healthCheck(): Promise<HealthStatus>;

  /** 调用接口 */
  invoke<TInput, TOutput>(input: TInput): Promise<TOutput>;
}
```

## Fallback Chain 示例

```typescript
// src/core/ai/providers/strategies/text-analysis.ts

export const SCRIPT_ANALYSIS_CHAIN: FallbackChain<TextProvider> = [
  { provider: 'zhipu-glm-5', weight: 0.5, reason: '中文最强,理解网文' },
  { provider: 'kimi-k2.5', weight: 0.3, reason: '长上下文,适合 100w+ 小说' },
  { provider: 'MiniMax-m2.5', weight: 0.2, reason: '平衡成本和质量' },
];

// 调用
const result = await registry.executeWithFallback(
  'text',
  (provider) => provider.invoke({ prompt: '分析这段剧本...' }),
  {
    maxRetries: 2,
    onFallback: (from, to, error) => {
      logger.warn(`Provider ${from.id} failed: ${error.message}, trying ${to.id}`);
    },
  }
);
```

## 能力路由

不同任务选择不同模型:

```typescript
// 注册时声明能力
registry.register('kling-1.6', klingProvider, {
  capabilities: [
    'long-video', // 长视频 (10s+)
    'physics-simulation', // 物理模拟
    'cinematic', // 电影感运镜
  ],
});

// 解析时按能力筛选
const videoProvider = registry.resolve('video', 'highest-quality', {
  requiredCapabilities: ['cinematic'],
});
```

## 成本感知

每个 Provider 声明成本,Registry 可按预算选择:

```typescript
// src/core/ai/providers/cost.ts

export interface ProviderCost {
  input: number; // USD per 1k tokens
  output: number;
  perImage?: number; // USD per image (T2I)
  perSecond?: number; // USD per second video (I2V)
  perKChar?: number; // USD per 1000 chars (TTS)
}

// 选择最便宜的
const cheap = registry.resolve('text', 'cheapest');
```

## 健康监控

```typescript
// src/core/ai/providers/health.ts

export class ProviderHealthMonitor {
  private failures: Map<string, number> = new Map();

  recordFailure(providerId: string, error: Error): void {
    const count = this.failures.get(providerId) ?? 0;
    this.failures.set(providerId, count + 1);

    if (count >= 5) {
      // 连续失败 5 次 → 临时禁用 5 分钟
      this.disable(providerId, 5 * 60 * 1000);
    }
  }

  isAvailable(providerId: string): boolean {
    return !this.disabled.has(providerId);
  }
}
```

## 添加新 Provider

只需要 3 步:

### 1. 实现 Provider 接口

```typescript
// src/core/ai/providers/implementations/openai-compatible.provider.ts

export class OpenAICompatibleProvider implements TextProvider {
  readonly id = 'custom-openai';
  readonly type: ProviderType = 'text';
  readonly displayName = 'Custom OpenAI-Compatible';

  readonly cost: ProviderCost = {
    input: 0.0001, // 自定义
    output: 0.0003,
  };

  readonly capabilities: ProviderCapability[] = ['general', 'chinese'];

  constructor(private config: OpenAIConfig) {}

  async healthCheck() {
    try {
      await this.invoke({ prompt: 'ping', maxTokens: 1 });
      return { healthy: true };
    } catch (e) {
      return { healthy: false, error: (e as Error).message };
    }
  }

  async invoke<TInput extends { prompt: string }, TOutput>(input: TInput): Promise<TOutput> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: input.prompt }],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    return (await response.json()) as TOutput;
  }
}
```

### 2. 注册

```typescript
// src/core/ai/providers/registry.config.ts

export const registerAllProviders = (registry: ProviderRegistry, config: AppConfig) => {
  if (config.zhipu.enabled) {
    registry.register('text', new ZhipuGLM5Provider(config.zhipu));
  }
  if (config.kling.enabled) {
    registry.register('video', new KlingProvider(config.kling));
  }
  // ... 更多 provider
};
```

### 3. 在应用启动时调用

```typescript
// src/app/providers/AppProvider.tsx

useEffect(() => {
  const registry = container.get<ProviderRegistry>('ProviderRegistry');
  registerAllProviders(registry, appConfig);
}, []);
```

## 配置文件

Provider 配置统一在 `app.config.ts`:

```typescript
// src/core/config/app.config.ts

export default {
  zhipu: {
    enabled: true,
    apiKey: process.env.ZHIPU_API_KEY,
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  kling: {
    enabled: true,
    apiKey: process.env.KLING_API_KEY,
  },
  // ...
} as const;
```

## 监控与日志

所有 Provider 调用都通过统一的中间件:

```typescript
// src/core/ai/providers/middleware.ts

export const withLogging = (provider: Provider): Provider => ({
  ...provider,
  async invoke(input) {
    const start = Date.now();
    try {
      const result = await provider.invoke(input);
      logger.info('Provider success', {
        provider: provider.id,
        duration: Date.now() - start,
      });
      return result;
    } catch (e) {
      logger.error('Provider failed', {
        provider: provider.id,
        error: (e as Error).message,
        duration: Date.now() - start,
      });
      throw e;
    }
  },
});
```

## 相关资源

- [架构概览](/developer-guide/architecture)
- [Pipeline 引擎 API](/developer-guide/pipeline-api)
- [ADR-0003: Platform Adapter 决策](/adr/0003-platform-adapter.md)
