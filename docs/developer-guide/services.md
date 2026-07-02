---
title: 服务清单
description: frame-fab 7 大服务领域架构：ai / audio / video / pipeline / project / domain / platform，依赖关系图与单例调用规范
category: developer-guide
version: '>=3.0'
---

# 服务清单

> frame-fab v2.2.3 把全部业务能力收敛到 **`src/core/services/`** 下的 **7 大领域**。
> 所有服务**默认导出单例**（不要 `new`），统一从 `@/core/services` 导入。

## 一、领域全景

```
src/core/services/
├── ai/                    # AI 编排：文本/图像/视频生成 + ProviderRegistry
│   ├── text/              #   - ai.service · novel.* · story-analysis · script-import
│   └── image/             #   - image-generation.service (Seedream/Kling/Vidu)
│
├── audio/                 # 音频：TTS + 唇形同步 + 音频流水线
│   └── - tts.service · lip-sync · audio-pipeline · tts-provider-registry
│
├── video/                 # 视频：FFmpeg.wasm + 场景分析 + 字幕 + 视觉一致性
│   └── - ffmpeg-wasm · scene-analyzer · subtitle · video-compositor · visual-consistency
│
├── pipeline/              # 流水线：编排引擎 + 步骤工厂 + 质量门 + 评审导出
│   └── - pipeline.service · pipeline-runner · step-factories · quality-gate · review-export
│
├── project/               # 项目：导入导出 + 渲染队列 + 成本 + 评估 + 安全存储
│   └── - project-import-export · render-queue · cost · evaluation · secure-storage
│
├── domain/                # 业务领域：角色 + 漫剧编排 + 组合 + 协作
│   └── - character · manga-pipeline · composition · collaboration
│
└── (root)                 # 平台桥接：desktop-app / storyboard / 根级便捷导出
    └── - desktop-app · storyboard · image-generation (re-export)
```

## 二、7 大领域详解

### 2.1 AI 编排（`ai/`）

> 所有 AI 模型调用的统一入口。通过 `ProviderRegistry` 注册所有 Provider，**自动 Fallback**。

**核心服务**：

| 服务 | 文件 | 能力 |
|------|------|------|
| `aiService` | `ai/text/ai.service.ts` | 统一文本生成/分析/对话/流式 |
| `novelService` | `ai/text/novel.service.ts` | 小说导入与结构化 |
| `novelAnalyzer` | `ai/text/novel-analyze.service.ts` | 章节/场景/人物识别 |
| `storyAnalysisService` | `ai/text/story-analysis.service.ts` | 故事结构深度分析 |
| `scriptImportService` | `ai/text/script-import.service.ts` | 剧本导入（行业格式） |
| `imageGenerationService` | `ai/image/image-generation.service.ts` | 图像/视频生成 |

**子模块**（拆分后 25+ 文件）：
- `ai-cache.ts` / `ai-batch.ts` / `ai-stream.ts` / `ai-call-dispatcher.ts`
- `novel-ai-parser.ts` / `novel-prompt-templates.ts` / `novel-helpers.ts`
- `novel-analyze-chapter-segments.ts` / `novel-analyze-scene-segments.ts` / `novel-analyze-metadata.ts` / `novel-analyze-config.ts` / `novel-analyze-statistics.ts`
- `novel-suitability.ts` / `novel-script-exporter.ts` / `novel-types.ts`
- `script-analyzer.service.ts`
- `image-generation/image-generation-*.ts`（按模型/降级链拆分）

**ProviderRegistry 与 Fallback**：

```typescript
// 默认降级链
aiService.setFallbackChain(['zhipu', 'anthropic', 'minimax', 'moonshot']);
```

详见 [AI 服务 API](../api/ai-service.md)。

### 2.2 音频（`audio/`）

> TTS 合成 + 唇形同步元数据 + 完整音频流水线。

**核心服务**：

| 服务 | 文件 | 能力 |
|------|------|------|
| `ttsService` | `audio/tts.service.ts` | 文本转语音（200+ 音色） |
| `lipSyncService` | `audio/lip-sync.service.ts` | 唇形同步元数据 |
| `audioPipelineService` | `audio/audio-pipeline.service.ts` | 音频编排（混音/对齐） |
| `ttsProviderRegistry` | `audio/tts-provider-registry.ts` | TTS Provider 管理 |

**TTS Provider 降级链**：

```
Edge TTS（免费）→ CosyVoice 2.0 → 百度 TTS → KAN-TTS
```

详见 [TTS 服务 API](../api/tts-service.md)。

### 2.3 视频（`video/`）

> 视频合成（FFmpeg.wasm）+ 场景分析 + 字幕生成 + 视觉一致性评分。

**核心服务**：

| 服务 | 文件 | 能力 |
|------|------|------|
| `videoCompositorService` | `video/video-compositor.service.ts` | FFmpeg 视频合成（多轨） |
| `ffmpegWasmService` | `video/ffmpeg-wasm.service.ts` | FFmpeg.wasm 加载/调用 |
| `sceneAnalyzerService` | `video/scene-analyzer.service.ts` | 视频场景识别 |
| `subtitleService` | `video/subtitle.service.ts` | 字幕生成与多格式导出 |
| `videoAnalysisService` | `video/video-analysis.service.ts` | 视频内容分析 |
| `visualConsistencyService` | `video/visual-consistency-scorer.service.ts` | 跨镜头视觉一致性评分 |

**子模块**（拆分后 25+ 文件）：
- `video-compositor-{dispatch,environment,ffmpeg,helpers,tauri}.ts`
- `video-analysis-{abort-registry,emotions,keyframes,objects,scenes,stats,suggestions,summary,types}.ts`
- `visual-consistency-{heuristic,keywords,scorer,types,vlm}.ts`
- `scene-analyzer-{character-extractor,description-generator,dialogue-extractor,prompt-builder,types}.ts`
- `subtitle/subtitle-*.ts`

详见 [字幕服务 API](../api/subtitle-service.md)。

### 2.4 流水线（`pipeline/`）

> 10 步端到端编排引擎，含 Checkpoint、Quality Gate、Self-Review Loop。

**核心服务**：

| 服务 | 文件 | 能力 |
|------|------|------|
| `pipelineService` | `pipeline/pipeline.service.ts` | 主入口（run/resume/checkpoint） |
| `pipelineRunner` | `pipeline/pipeline-runner.ts` | 步骤执行器 |
| `pipelineStepFactories` | `pipeline/pipeline-step-factories.ts` | 10 步工厂 |
| `qualityGateService` | `pipeline/quality-gate.service.ts` | 质量门禁评分 |
| `reviewExportService` | `pipeline/review-export.service.ts` | 自审循环导出 |

**10 个步骤**（按顺序）：

```
import → analysis → script → character → scene → storyboard
       → render → video-edit → audio → subtitle → export
```

详见 [流水线 API](../api/pipeline-service.md) 和 [Pipeline 引擎](./pipeline-api.md)。

### 2.5 项目（`project/`）

> 项目导入导出、渲染队列、成本统计、评估、安全存储。

**核心服务**：

| 服务 | 文件 | 能力 |
|------|------|------|
| `projectImportExportService` | `project/project-import-export.service.ts` | 项目导入导出（10+ 格式） |
| `renderQueueService` | `project/render-queue.service.ts` | 渲染任务队列 |
| `costService` | `project/cost.service.ts` | API 成本统计 |
| `evaluationService` | `project/evaluation.service.ts` | 项目质量评估 |
| `secureStorageService` | `project/secure-storage.service.ts` | API Key 加密存储 |
| `exportDispatcher` | `project/export-dispatcher.ts` | 多格式导出调度 |

**子模块**（拆分后 25+ 文件）：
- `project-import-export-{importer,exporter,validator,duplicator,compare,backup,types}.ts`
- `render-queue-{fallback,logger,runner,subscriber,types}.ts`
- `cost-{record-builders,report,stats,types,constants}.ts`
- `export-{dispatcher,service,types,utils,image-export,video-export,pdf-export}.ts`
- `secure-storage-{initializer,tauri,fallback,types}.ts`
- `subtitle-generators.ts`

### 2.6 业务领域（`domain/`）

> 角色、漫剧编排、组合、协作四大领域服务。

**核心服务**：

| 服务 | 文件 | 能力 |
|------|------|------|
| `characterService` | `domain/character.service.ts` | 角色设定卡管理 |
| `mangaPipelineService` | `domain/manga-pipeline.service.ts` | 漫剧 6 步编排 |
| `compositionService` | `domain/composition.service.ts` | 单镜头组合 |
| `collaborationService` | `domain/collaboration.service.ts` | 多人协作（v3.1+） |

**子模块**（拆分后 20+ 文件）：
- `character-{factory,persistence,subscriber,template,types}.ts`
- `composition-{factory,persistence,subscriber,types}.ts`
- `manga-pipeline-{orchestrator,extra,progress,types,stage-audio,stage-compose,stage-images,stage-lipsync}.ts`
- `frame-defaults.ts`

### 2.7 平台桥接（root）

> 桌面端能力 + 分镜独立服务 + 根级便捷导出。

| 服务 | 文件 | 能力 |
|------|------|------|
| `desktopAppService` | `desktop-app.service.ts` | 桌面应用元信息 |
| `desktopAppInfo` | `desktop-app-info.ts` | 系统信息 |
| `desktopFileDrop` | `desktop-file-drop.ts` | 文件拖拽桥 |
| `desktopNotificationController` | `desktop-notification-controller.ts` | 系统通知 |
| `desktopShortcutController` | `desktop-shortcut-controller.ts` | 全局快捷键 |
| `desktopWindowController` | `desktop-window-controller.ts` | 窗口控制 |
| `getStoryboardService` | `storyboard.service.ts` | 分镜生命周期 |
| `getStoryboardService` | `storyboard.service.ts` | 分镜管理 |

详见 [平台适配层](./platform-layer.md)。

## 三、依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    app/  (路由 + Providers)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              features/  (按用户故事切分)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │  ai/     │  │ pipeline/│  │  domain/ │
       │          │  │          │  │          │
       │ aiService│  │pipelineS.│  │characterS│
       │ imageGen │  │ qualityG │  │mangaPipe │
       └────┬─────┘  └────┬─────┘  └────┬─────┘
            │              │             │
            └──────────────┼─────────────┘
                           ▼
                  ┌──────────────────┐
                  │   project/       │
                  │  (导入导出+队列)  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  video/ audio/   │
                  │  (FFmpeg + TTS)  │
                  └──────────────────┘
```

**依赖规则**：
- `domain/` 依赖 `ai/`、`pipeline/`、`project/`
- `pipeline/` 依赖 `ai/`、`project/`
- `video/` 和 `audio/` 是**叶子**（不再依赖其他 service）
- `app/` 和 `features/` 是**唯一允许依赖多个领域**的层

## 四、单例调用规范

### 4.1 ✅ 正确：导入单例

```typescript
import { aiService, imageGenerationService } from '@/core/services';

const result = await aiService.generate('写一段独白');
```

### 4.2 ❌ 错误：手动 new

```typescript
// ❌ 破坏单例，绕过 ProviderRegistry
import { AIService } from '@/core/services/ai/text/ai.service';
const ai = new AIService();
```

> 提示：所有 service 在 `index.ts` 中已默认导出**单例**（如 `aiService`、`imageGenerationService`），且 export 同时提供 class 供测试时 mock。

### 4.3 自定义降级链

```typescript
aiService.setFallbackChain(['zhipu', 'anthropic']);
ttsService.setFallbackChain(['edge', 'cosyvoice']);
```

## 五、错误处理

| 错误类型 | 触发场景 | 推荐处理 |
|---------|---------|---------|
| `AIProviderError` | AI 模型调用失败 | 自动降级，UI 提示用户 |
| `InvalidInputError` | 入参校验失败 | 表单红字提示 |
| `QuotaExceededError` | 配额耗尽 | 引导用户升级/换 Provider |
| `CheckpointError` | 断点续传损坏 | 提示用户从最近有效 Checkpoint 恢复 |
| `RenderQueueError` | 渲染队列满 | 排队等待或清理旧任务 |

```typescript
try {
  await aiService.generate(prompt);
} catch (err) {
  if (err instanceof AIProviderError) {
    // 自动 fallback 已尝试；用户可手动切换 Provider
    showProviderSwitchDialog();
  }
}
```

## 六、性能与监控

### 6.1 实时成本

```typescript
const stats = aiService.getUsageStats();
console.log(`今日: $${stats.todayUsd}`);
```

### 6.2 进度回调

```typescript
pipelineService.onProgress((p) => {
  console.log(`${p.stage}: ${p.overallProgress}%`);
});
```

### 6.3 渲染队列

```typescript
const queue = renderQueueService.getStatus();
// { pending: 3, running: 1, completed: 12, failed: 0 }
```

## 七、最佳实践

### 7.1 调用规范

- ✅ **总是从 `@/core/services` 导入单例**
- ✅ **捕获并处理已知错误类型**（`AIProviderError` 等）
- ✅ **订阅进度回调**（`onProgress`）提升 UX
- ✅ **合理使用 `setFallbackChain`** 自定义降级
- ❌ **不要直接 new service**
- ❌ **不要在 feature 层直接调 Provider**（绕过了 Fallback）

### 7.2 性能优化

- ✅ **使用 `generateBatch`** 批量生成（默认并发 4）
- ✅ **启用 AI Cache** 减少重复调用
- ✅ **异步非阻塞**：长任务用 `Promise` + 进度回调
- ❌ **避免同步大文件 IO**（用 streaming API）

### 7.3 扩展新 Provider

1. 实现 `AIProvider` 接口
2. 在 `ProviderRegistry.register()` 注册
3. 添加到降级链
4. 提供单元测试

详见 [AI Providers](./ai-providers.md)。

## 八、相关文档

- [架构设计](./architecture.md) — 整体架构图
- [模块系统](./module-system.md) — 目录结构
- [AI Providers](./ai-providers.md) — 扩展 AI 提供商
- [Pipeline 引擎](./pipeline-api.md) — 10 步编排
- [平台适配层](./platform-layer.md) — Tauri 桥接
- [API 文档](../api/) — 7 大服务 API
