---
title: API 文档
description: Story Weaver 核心服务 API 索引：7 大本地服务接口、AI Provider 适配层、类型系统
category: api
version: '>=3.0'
---

# API 文档

> Story Weaver v2.2.3 通过**本地服务接口**暴露能力。本章节列出了 7 大核心服务的 API 参考。

---

## 一、服务清单

| 文档                              | 服务                     | 适用场景                   |
| --------------------------------- | ------------------------ | -------------------------- |
| [API 概述](./overview.md)         | 7 大服务全景             | **首次必读**               |
| [AI 服务](./ai-service.md)        | `aiService`              | 文本生成、对话、分析、流式 |
| [图像生成](./image-generation.md) | `imageGenerationService` | 图像/视频生成、角色一致性  |
| [TTS 服务](./tts-service.md)      | `ttsService`             | 语音合成、唇形同步元数据   |
| [流水线](./pipeline-service.md)   | `pipelineService`        | 10 步端到端编排            |
| [字幕服务](./subtitle-service.md) | `subtitleService`        | 字幕生成与多格式导出       |

---

## 二、调用方式

所有服务**统一从 `@/core/services` 导入**：

```typescript
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

---

## 三、设计原则

1. **无远端服务端** — Story Weaver 是 Tauri 桌面应用，所有调用在进程内完成
2. **单例模式** — 每个服务是单例，**不要 new** 出新实例
3. **Fallback 链** — 默认自动降级到可用 Provider，可自定义
4. **类型完备** — 全部 TypeScript 类型，IDE 全程提示
5. **可观测** — 进度回调、成本统计、错误结构化
6. **Provider 抽象** — 所有外部 API 通过 `ProviderRegistry` 注册，添加新 Provider 不需要改业务代码

---

## 四、版本兼容

| 框架版本  | API 风格                | 状态                 |
| --------- | ----------------------- | -------------------- |
| v2.2.3+   | 7 大服务单例            | ✅ **当前推荐**      |
| v2.4-v2.x | `aiService.text()` 链式 | ⚠️ 仍兼容，v4.0 移除 |
| v2.3-     | 旧模块导入              | ❌ 不再维护          |

---

## 五、下一步

| 你的需求    | 推荐阅读                                       |
| ----------- | ---------------------------------------------- |
| 看调用约定  | [API 概述](./overview.md)                      |
| 文本生成    | [AI 服务](./ai-service.md)                     |
| 出图/出视频 | [图像生成](./image-generation.md)              |
| 配音        | [TTS 服务](./tts-service.md)                   |
| 端到端跑    | [流水线](./pipeline-service.md)                |
| 字幕        | [字幕服务](./subtitle-service.md)              |
| 了解实现    | [架构设计](../developer-guide/architecture.md) |
| 上手        | [快速开始](../getting-started/quick-start.md)  |
