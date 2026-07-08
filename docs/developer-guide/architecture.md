---
title: 架构设计
description: Story Weaver v2.2.3 整体架构：Tauri 桌面 + 前端分层 (app/pages/features/shared/core/domain) + 10 步 Pipeline + AI 服务编排
category: developer-guide
version: '>=3.0'
---

# 架构设计

> Story Weaver v2.2.3 的系统架构——**Tauri 2.1 桌面端** + **DDD 轻量分层前端** + **10 步 Pipeline** + **多 Provider AI 编排**。

## 一、设计目标

| 目标         | 落地机制                            |
| ------------ | ----------------------------------- |
| **零参与**   | Autonomous 模式 + AI 自审           |
| **高质量**   | Quality Gate + Self-Review Loop     |
| **可恢复**   | Checkpoint 断点续传（30s 自动保存） |
| **可降级**   | ProviderRegistry + Fallback Chain   |
| **桌面原生** | Tauri 2.1 + Rust + 系统托盘/快捷键  |
| **可扩展**   | ProviderRegistry 插件式 + 步骤工厂  |

## 二、整体架构

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Story Weaver 系统架构 (v2.2.3)                            │
└──────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │  Tauri 2.1 桌面壳 (Rust)                                          │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
  │  │ 系统托盘       │  │ 全局快捷键     │  │ 文件对话框    │            │
  │  └──────────────┘  └──────────────┘  └──────────────┘            │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
  │  │ SecureStorage │  │ Notification  │  │ FFmpeg 子进程 │            │
  │  └──────────────┘  └──────────────┘  └──────────────┘            │
  └────────────────────────────┬────────────────────────────────────┘
                               │ Tauri Bridge (invoke/listen)
                               ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  React 18 前端 (Vite 6 + TypeScript 5)                            │
  │                                                                   │
  │  app/ ──→ pages/ ──→ features/ ──→ shared/ ──→ core/ ──→ domain/ │
  │  (路由)    (页面)    (业务功能)    (通用)     (技术核心)  (领域)  │
  └─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  7 大服务领域 (src/core/services/)                                │
  │                                                                   │
  │  ai/  audio/  video/  pipeline/  project/  domain/  (root)      │
  └─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  ProviderRegistry + Fallback Chain                                │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
  │  │ Zhipu     │ │Anthropic │ │MiniMax   │ │ Seedream │            │
  │  │ GLM-5     │ │Claude 3.5│ │ M2.5     │ │ 5.0      │            │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
  │  │ Kling     │ │ Vidu      │ │ Edge TTS  │ │ CosyVoice│            │
  │  │ 1.6       │ │ 2.0       │ │ (免费)    │ │ 2.0      │            │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
  └─────────────────────────────────────────────────────────────────┘
```

## 三、前端分层（DDD 轻量化）

### 3.1 顶层结构

```
src/
├── app/                # 路由 + Providers + Layout
├── pages/              # 路由级页面
├── features/           # 业务功能（按用户故事切，15 个）
├── shared/             # 通用 UI / hooks / utils / api
├── core/               # 技术核心（framework-specific）
│   ├── services/       #   7 大服务领域
│   ├── pipeline/       #   流水线引擎 + 步骤定义
│   ├── autonomous/     #   AutoPipelineEngine + Self-Review
│   ├── hooks/          #   通用 hooks
│   ├── ai/             #   AI Provider 注册
│   └── platform/       #   Tauri 桥接
├── domain/             # 业务领域模型（零依赖）
└── __tests__/          # 镜像结构测试
```

### 3.2 依赖规则

```
app → pages → features → shared → core → domain
                                     ↓
                                  (叶子，无依赖)
```

- ✅ `app/pages` 可依赖 `features`
- ✅ `features` 可依赖 `shared` + `core` + `domain`
- ✅ `core` 可依赖 `domain`
- ❌ `domain` **绝不**依赖 `core` / `features` / `shared` / `app`
- ❌ 反向依赖禁止

详见 [模块系统](./module-system.md) 和 [项目结构](./project-structure.md)。

## 四、核心模块

### 4.1 `core/autonomous/` — 全自主编排引擎

> 实现 Pipeline 的"自主决策 + 循环返工"能力。

| 文件                           | 职责                   |
| ------------------------------ | ---------------------- |
| `auto-pipeline-engine.ts`      | Autonomous 模式主入口  |
| `pipeline-checkpoint.ts`       | Checkpoint 序列化/恢复 |
| `pipeline-executor.ts`         | 步骤执行器             |
| `pipeline-event-dispatcher.ts` | 事件总线               |
| `pipeline-step-state.ts`       | 步骤状态机             |
| `pipeline-types.ts`            | 类型定义               |
| `types/`                       | 领域类型               |

**核心创新**：

- **Self-Review Loop**：每步 AI 自审 + 修复 Prompt + 最多 3 次重试
- **Checkpoint**：30s 自动保存到 localStorage
- **Quality Gate**：多维度自动评分（完整性/一致性/视觉/时长）

### 4.2 `core/pipeline/` — 流水线引擎

> 10 步流水线 + 步骤链 + 异步执行。

| 文件                       | 职责                  |
| -------------------------- | --------------------- |
| `pipeline-engine.ts`       | 步骤链主引擎          |
| `pipeline-engine-types.ts` | 引擎类型              |
| `pipeline-middleware.ts`   | 中间件（可拦截步骤）  |
| `pipeline.types.ts`        | 公共类型              |
| `step.interface.ts`        | Step 接口             |
| `step-import.ts`           | 步骤 1：导入          |
| `step-analysis.ts`         | 步骤 2：分析          |
| `step-script.ts`           | 步骤 3：脚本          |
| `step-character.ts`        | 步骤 4：角色          |
| `step-storyboard.ts`       | 步骤 6：分镜          |
| `step-render.ts`           | 步骤 7：渲染          |
| `step-video-editing.ts`    | 步骤 8：视频剪辑      |
| `step-audio-synthesis.ts`  | 步骤 9：配音          |
| `step-composition.ts`      | 步骤 10/11：字幕+导出 |
| `steps/`                   | 步骤集合              |

### 4.3 `core/services/` — 7 大服务领域

详见 [服务清单](./services.md)。

### 4.4 `features/` — 用户交互

15 个 feature 模块（按用户故事切分）：

| Feature           | 用户故事            |
| ----------------- | ------------------- |
| `home/`           | 首页/项目管理       |
| `auto-pipeline/`  | Autonomous 模式向导 |
| `manga-pipeline/` | 漫剧 6 步编排       |
| `editor/`         | 视频编辑器          |
| `ai/`             | AI 交互界面         |
| `character/`      | 角色管理            |
| `storyboard/`     | 分镜编辑            |
| `script/`         | 脚本编辑            |
| `subtitle/`       | 字幕编辑            |
| `audio/`          | 音频/配音           |
| `video/`          | 视频预览            |
| `video-export/`   | 视频导出            |
| `export/`         | 通用导出            |
| `project/`        | 项目设置            |
| `cost/`           | 成本管理            |
| `notification/`   | 通知中心            |

### 4.5 `app/` — 应用入口

| 目录              | 职责                               |
| ----------------- | ---------------------------------- |
| `app/router/`     | 路由配置                           |
| `app/providers/`  | 全局 Providers（Theme/Auth/Query） |
| `app/components/` | 应用级组件                         |
| `app/styles/`     | 全局样式                           |

## 五、流水线执行流程

### 5.1 10 步全自主

```
1.import → 2.analysis → 3.script → 4.character → 5.scene
                                              ↓
                                  ┌───────────┴───────────┐
                                  │ Quality Gate（每步）   │
                                  │  - 完整性              │
                                  │  - 一致性              │
                                  │  - 视觉                │
                                  └───────────┬───────────┘
                                          FAIL
                                           ↓
                              Self-Review Loop
                              (优化 Prompt + 重试 ≤ 3)
                                           ↓
6.storyboard → 7.render → 8.video-edit → 9.audio
                                              ↓
                                        10.subtitle
                                              ↓
                                        11.export
                                              ↓
                                          📤 MP4
```

### 5.2 Autonomous vs Manual

| 维度         | Autonomous | Manual    |
| ------------ | ---------- | --------- |
| Self-Review  | ✅ 启用    | ❌ 关闭   |
| Quality Gate | 自动评分   | 仅供参考  |
| Checkpoint   | 30s 自动   | 不支持    |
| 用户参与     | 零         | 逐步审批  |
| 适用         | 批量/快速  | 精细/定制 |

## 六、数据流设计

### 6.1 Checkpoint 机制

```
[Step 3 完成]
  │
  ├─→ 内存状态
  │
  └─→ 30s 触发 → 序列化 → localStorage / Tauri SecureStorage
                                │
                                ▼
                       {
                         projectId: 'proj_abc',
                         mode: 'autonomous',
                         currentStep: 3,
                         progress: 0.35,
                         steps: { ... },
                         reviewLoops: { ... },
                         timestamp: 1717900000
                       }
```

**恢复流程**：

```
应用启动 → 检测到未完成 Checkpoint
              │
              ▼
       提示用户「继续上次任务」
              │
              ▼
       加载 Checkpoint → pipelineExecutor.resume(...)
              │
              ▼
       从 currentStep 继续
```

### 6.2 Provider 调用

```typescript
// 用户调用
const result = await aiService.generate(prompt, { provider: 'zhipu' });

// aiService 内部
ProviderRegistry.get('zhipu') // 不存在或失败？
  .fallbackTo('anthropic')
  .fallbackTo('minimax')
  .execute(prompt);
```

## 七、关键设计模式

### 7.1 ProviderRegistry（注册表 + 降级链）

```typescript
class ProviderRegistry {
  register(provider: AIProvider): void;
  get(name: string): AIProvider;
  setFallbackChain(names: string[]): void;
}

// 默认文本降级链
registry.setFallbackChain(['zhipu', 'anthropic', 'minimax', 'moonshot']);
```

### 7.2 Facade 拆分

每个大 service（如 `videoCompositor`）被拆分为多个小文件，**对外接口保持兼容**：

```
video-compositor.service.ts          # 主入口（facade）
├─ video-compositor-ffmpeg.ts        # FFmpeg 渲染实现
├─ video-compositor-tauri.ts         # Tauri 子进程实现
├─ video-compositor-dispatch.ts      # 平台分发
├─ video-compositor-helpers.ts       # 公共工具
└─ video-compositor-environment.ts   # 环境检测
```

详见 [服务清单 - 拆分原则](./services.md#二7-大领域详解)。

### 7.3 Strategy + Chain of Responsibility

`ProviderRegistry` 是 **Strategy**（运行时选择 Provider），降级链是 **Chain of Responsibility**（失败时沿链传递）。

### 7.4 Subscriber Pattern

所有 service 支持**事件订阅**：

```typescript
const unsub = pipelineService.onProgress((p) => {
  console.log(p.stage, p.overallProgress);
});
// 组件卸载时
unsub();
```

## 八、安全设计

| 层               | 机制                                    |
| ---------------- | --------------------------------------- |
| **API Key 存储** | Tauri SecureStorage（OS Keychain 加密） |
| **跨域安全**     | Tauri CSP + 白名单                      |
| **本地数据**     | 全部存储在用户目录，无云端上传          |
| **更新安全**     | Tauri Updater 签名验证                  |
| **网络代理**     | 失败自动重试 + Fallback Chain           |

## 九、性能预算

| 指标                  | 预算     | 实际    |
| --------------------- | -------- | ------- |
| JS bundle gzip        | ≤ 350 KB | ~280 KB |
| Tauri 二进制          | ≤ 30 MB  | ~26 MB  |
| 冷启动                | ≤ 1.5s   | ~0.9s   |
| 流水线 10 步（无 AI） | < 500ms  | 275ms   |

详见 [v2.2.3 性能基准](../performance/benchmark-2.2.3.md)。

## 十、相关文档

- [模块系统](./module-system.md) — 详细分层
- [项目结构](./project-structure.md) — 完整目录树
- [服务清单](./services.md) — 7 大领域
- [Pipeline 引擎](./pipeline-api.md) — 10 步细节
- [平台适配层](./platform-layer.md) — Tauri 桥接
- [Autonomous API](./autonomous-api.md) — Self-Review + Checkpoint
- [AI Providers](./ai-providers.md) — ProviderRegistry + Fallback
- [品牌设计指南](../BRAND_GUIDELINES.md) — Logo / 配色 / 字体
