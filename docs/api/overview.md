---
title: API 概述
description: frame-fab 7 大核心服务 API 总览：服务架构、调用约定、类型系统、版本兼容性
category: api
version: '>=3.0'
---

# API 概述

> frame-fab v2.2.3 的所有功能均通过 **本地服务接口** 暴露。
> **无远端服务端、无 REST API、无 token 鉴权**——所有调用在桌面应用进程内完成。

---

## 一、核心服务

frame-fab v2.2.3 patch 后将所有业务能力收敛为 7 个核心服务，**统一从 `@/core/services` 导入**：

| 服务 | 描述 | 状态 | 文档 |
|------|------|------|------|
| `aiService` | 统一 AI 文本生成 | ✅ 稳定 | [AI 服务](./ai-service.md) |
| `imageGenerationService` | 多提供商图像/视频生成 | ✅ 稳定 | [图像生成](./image-generation.md) |
| `ttsService` | 文本转语音合成 | ✅ 稳定 | [TTS 服务](./tts-service.md) |
| `pipelineService` | 端到端流水线编排 | ✅ 稳定 | [流水线](./pipeline-service.md) |
| `storyboardService` | 分镜生命周期管理 | ✅ 稳定 | 见 [开发者指南 - 架构](../developer-guide/architecture.md) |
| `characterService` | 角色设定与一致性 | ✅ 稳定 | 见 [角色设计](../user-guide/character-design.md) |
| `subtitleService` | 字幕生成与多格式导出 | ✅ 稳定 | [字幕服务](./subtitle-service.md) |

---

## 二、调用约定

### 2.1 命名空间

```typescript
// 推荐：从统一入口导入
import {
  aiService,
  imageGenerationService,
  ttsService,
  pipelineService,
  subtitleService,
  getStoryboardService,
  getCharacterService,
} from '@/core/services';
```

### 2.2 调用风格

所有服务**默认导出单例**，通过方法直接调用：

```typescript
// ✅ 单例直接调用
const result = await aiService.generate('写一段独白');

// ❌ 不要 new 出新实例（破坏 ProviderRegistry 单例）
const ai = new AIService();  // 不推荐
```

### 2.3 异步与进度

长时间操作（流水线、渲染、合成）返回 `Promise` 并支持**进度回调**：

```typescript
pipelineService.onProgress((progress) => {
  // progress.stage: 当前阶段
  // progress.overallProgress: 0-100
});
```

### 2.4 错误处理

服务抛出**结构化错误**（继承自 `BaseError`）：

| 错误类型 | 触发场景 |
|---------|---------|
| `AIProviderError` | AI 模型调用失败（429/500/超时） |
| `InvalidInputError` | 入参校验失败 |
| `QuotaExceededError` | 用户配额耗尽 |
| `CheckpointError` | 断点续传检查点损坏 |

```typescript
try {
  await aiService.generate(prompt);
} catch (err) {
  if (err instanceof AIProviderError) {
    // 自动 fallback 链已尝试；需要用户切换 Provider
  }
}
```

---

## 三、服务架构

```
┌──────────────────────────────────────────────────────┐
│                    核心服务层                         │
│  ┌──────────────────┐    ┌──────────────────┐        │
│  │  AI 文本生成       │    │  图像/视频生成     │        │
│  │  aiService        │    │  imageGenService  │        │
│  │  (ProviderRegistry│    │  (Seedream/Kling/ │        │
│  │   + Fallback)     │    │   Vidu)           │        │
│  └────────┬─────────┘    └────────┬─────────┘        │
│           │                       │                  │
│  ┌────────▼─────────┐    ┌────────▼─────────┐        │
│  │  TTS 语音合成     │    │  唇形同步          │        │
│  │  ttsService       │    │  lipSyncService   │        │
│  └────────┬─────────┘    └────────┬─────────┘        │
│           │                       │                  │
│  ┌────────▼─────────┐    ┌────────▼─────────┐        │
│  │  流水线引擎        │    │  视频合成 (FFmpeg) │        │
│  │  pipelineService  │    │  videoCompositor  │        │
│  └────────┬─────────┘    └────────┬─────────┘        │
│           │                       │                  │
│  ┌────────▼───────────────────────▼─────────┐        │
│  │     字幕服务 + 分镜服务 + 角色服务          │        │
│  │  subtitleService / storyboard / character  │        │
│  └────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────┘
```

---

## 四、类型系统

所有服务公开完整的 **TypeScript 类型**：

- **入参类型**：`*Options`（如 `GenerationOptions`、`ImageGenerationOptions`）
- **返回类型**：`*Result`（如 `GenerationResult`、`ImageGenerationResult`）
- **进度类型**：`*Progress`（如 `PipelineProgress`、`ExportProgress`）
- **领域类型**：`Scene`、`Character`、`Shot` 等

```typescript
import type {
  GenerationOptions,
  GenerationResult,
  PipelineOptions,
  PipelineResult,
} from '@/core/services';
```

---

## 五、ProviderRegistry（统一 AI 适配层）

所有外部 AI 模型通过 `ProviderRegistry` 注册：

```typescript
// 默认文本降级链
registry.setFallbackChain(['zhipu', 'anthropic', 'minimax', 'moonshot']);

// 默认图像降级链
registry.setFallbackChain(['seedream', 'kling', 'vidu', 'sd-xl']);

// 注册新 Provider（插件式）
registry.register({
  name: 'new-provider',
  type: 'text',
  generate: async (prompt, options) => {
    // 调用新 API
  },
});
```

详见 [AI Providers](../developer-guide/ai-providers.md)。

---

## 六、版本兼容性

| 版本范围 | 服务 API | 备注 |
|---------|---------|------|
| `>= 2.4` | 旧 `aiService.text()` 链式 | 仍可用，**v4.0 移除** |
| `>= 3.0` | 7 大服务单例 | **当前推荐** |
| `>= 3.0` | 进度回调 `onProgress` | 标准订阅模式 |
| `>= 3.0` | `ProviderRegistry` 插件化 | 可运行时注册新 Provider |

---

## 七、下一步

| 目的 | 阅读 |
|------|------|
| 文本生成 | [AI 服务](./ai-service.md) |
| 图像/视频 | [图像生成](./image-generation.md) |
| 配音 | [TTS 服务](./tts-service.md) |
| 端到端 | [流水线](./pipeline-service.md) |
| 字幕 | [字幕服务](./subtitle-service.md) |
| 了解实现 | [架构设计](../developer-guide/architecture.md) |
| 跑通项目 | [快速开始](../getting-started/quick-start.md) |
