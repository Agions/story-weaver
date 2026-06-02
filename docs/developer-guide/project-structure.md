# 项目结构

> 本文档详细介绍 FrameForge 项目的目录结构、模块划分与文件说明。

---

## 一、整体目录结构

```
frame-forge/
├── docs/                          # 项目文档
│   ├── index.md                   # 文档首页
│   ├── getting-started/           # 入门指南
│   │   ├── index.md
│   │   ├── installation.md
│   │   ├── configuration.md
│   │   └── quick-start.md
│   ├── user-guide/                # 用户指南
│   │   ├── index.md
│   │   ├── workflow-overview.md
│   │   ├── auto-mode.md
│   │   ├── import-analysis.md
│   │   ├── script-generation.md
│   │   ├── character-design.md
│   │   ├── storyboard-design.md
│   │   └── rendering-export.md
│   ├── developer-guide/            # 开发者指南
│   │   ├── index.md               # ← 本文档
│   │   ├── architecture.md        # 架构设计
│   │   ├── project-structure.md  # ← 本文档
│   │   ├── services.md            # 服务清单（待完成）
│   │   └── autonomous-api.md      # 自主引擎 API（待完成）
│   └── deployment/                # 部署文档
│       └── index.md
├── src/                           # 源代码
│   ├── App.tsx                    # 应用入口
│   ├── main.tsx                   # 主渲染入口
│   ├── core/                      # 核心逻辑层
│   │   ├── autonomous/            # 全自主编排引擎（新增）
│   │   │   ├── auto-pipeline-engine.ts
│   │   │   ├── self-review-loop.ts
│   │   │   ├── quality-gate.ts
│   │   │   ├── autonomous.types.ts
│   │   │   └── index.ts
│   │   └── pipeline/               # 流水线步骤
│   │       ├── step-import.ts
│   │       ├── step-analysis.ts
│   │       ├── step-script.ts
│   │       ├── step-character.ts
│   │       ├── step-scene.ts       # 新增
│   │       ├── step-storyboard.ts
│   │       ├── step-render.ts
│   │       ├── step-video-edit.ts  # 新增
│   │       ├── step-audio.ts
│   │       ├── step-subtitle.ts
│   │       ├── step-export.ts
│   │       ├── step-review.ts       # 新增
│   │       └── pipeline-engine.ts
│   ├── features/                   # 功能模块
│   │   ├── auto-pipeline/          # 全自动流水线 UI（新增）
│   │   │   ├── components/
│   │   │   │   ├── AutoPipelineWizard.tsx
│   │   │   │   ├── AutonomousProgress.tsx
│   │   │   │   ├── AIBriefingPanel.tsx
│   │   │   │   └── FinalPreview.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAutoPipeline.ts
│   │   │   │   └── useSelfReviewLoop.ts
│   │   │   ├── stores/
│   │   │   │   └── autoPipelineStore.ts
│   │   │   ├── services/
│   │   │   │   └── autoPipelineService.ts
│   │   │   └── index.ts
│   │   └── manga-pipeline/          # 现有漫画流水线
│   │       ├── components/
│   │       ├── hooks/
│   │       └── stores/
│   ├── shared/                      # 共享模块
│   │   ├── stores/                  # 状态管理
│   │   │   └── ...
│   │   ├── utils/                  # 工具函数
│   │   │   └── ...
│   │   └── types/                   # 共享类型
│   │       └── ...
│   └── styles/                      # 样式文件
├── public/                          # 静态资源
├── package.json
├── tsconfig.json
├── vite.config.ts
├── SPEC.md                          # 重构方案规格文档
└── README.md
```

---

## 二、核心模块详解

### 2.1 `src/core/autonomous/` — 全自主编排引擎

**新增模块**，是重构的核心，使 Pipeline 具备"自主决策 + 循环返工"能力：

| 文件                      | 功能                        |
| ------------------------- | --------------------------- |
| `auto-pipeline-engine.ts` | 全自动流水线引擎，核心入口  |
| `self-review-loop.ts`     | AI 自审循环，不合格自动修复 |
| `quality-gate.ts`         | 质量门禁，自动判定输出质量  |
| `autonomous.types.ts`     | 自主模式类型定义            |
| `index.ts`                | 模块导出                    |

### 2.2 `src/core/pipeline/` — 流水线步骤

**流水线引擎**负责协调各步骤的执行：

| 现有步骤             | 功能                         |
| -------------------- | ---------------------------- |
| `step-import.ts`     | 解析原材料（小说/剧本/需求） |
| `step-analysis.ts`   | AI 分析故事结构、人物、场景  |
| `step-script.ts`     | 生成结构化视频剧本           |
| `step-character.ts`  | 创建角色设定卡，保证一致性   |
| `step-storyboard.ts` | 生成分镜脚本 + 参考图        |
| `step-render.ts`     | 批量渲染关键帧               |
| `step-audio.ts`      | 配音 + 音效 + 唇形同步       |
| `step-subtitle.ts`   | 字幕生成 + 嵌入              |
| `step-export.ts`     | 最终合成输出                 |

| 新增步骤             | 功能                             |
| -------------------- | -------------------------------- |
| `step-scene.ts`      | 场景规划，整合场景描述与视觉风格 |
| `step-video-edit.ts` | 视频剪辑，处理转场、特效合成     |
| `step-review.ts`     | 自审步骤，封装通用自审逻辑       |

### 2.3 `src/features/auto-pipeline/` — 全自动流水线 UI

**新增模块**，提供用户交互界面：

```
features/auto-pipeline/
├── components/
│   ├── AutoPipelineWizard.tsx      # 一步式启动向导
│   ├── AutonomousProgress.tsx      # 全局进度 + 状态展示
│   ├── AIBriefingPanel.tsx          # AI 任务简报面板
│   └── FinalPreview.tsx             # 成片预览 + 下载
├── hooks/
│   ├── useAutoPipeline.ts           # 自主流水线 hook
│   └── useSelfReviewLoop.ts         # 自审循环状态 hook
├── stores/
│   └── autoPipelineStore.ts         # Zustand store
├── services/
│   └── autoPipelineService.ts       # 流水线服务封装
└── index.ts
```

### 2.4 `src/features/manga-pipeline/` — 现有漫画流水线

保持向后兼容的 Manual Mode 功能：

```
features/manga-pipeline/
├── components/
├── hooks/
├── stores/
└── ...
```

---

## 三、文档结构

### 3.1 现有文档

```
docs/
├── index.md                   # 平台总览
├── getting-started/           # 入门指南
│   ├── index.md              # 快速开始
│   ├── installation.md        # 安装指南
│   ├── configuration.md       # 配置文档
│   └── quick-start.md         # 快速启动
├── user-guide/                # 用户指南
│   ├── index.md
│   ├── workflow-overview.md
│   ├── auto-mode.md
│   ├── import-analysis.md
│   ├── script-generation.md
│   ├── character-design.md
│   ├── storyboard-design.md
│   └── rendering-export.md
├── developer-guide/           # 开发者指南
│   ├── index.md              # ← 开发者指南首页
│   ├── architecture.md       # ← 架构设计
│   ├── project-structure.md  # ← 本文档
│   ├── services.md           # 服务清单
│   └── autonomous-api.md     # 自主引擎 API
└── deployment/                # 部署文档
```

### 3.2 待完成文档

| 文档                  | 状态   | 说明                              |
| --------------------- | ------ | --------------------------------- |
| `services.md`         | 待完成 | 各服务模块 API 说明               |
| `autonomous-api.md`   | 待完成 | Autonomous Pipeline 引擎 API 文档 |
| `deployment/index.md` | 待完成 | 生产环境部署指南                  |

---

## 四、文件命名规范

### 4.1 组件命名

- **React 组件**：PascalCase（如 `AutoPipelineWizard.tsx`）
- **子组件**：与父组件同名目录内（如 `components/AutoPipelineWizard/`）

### 4.2 Hooks 命名

- **自定义 Hooks**：camelCase，以 `use` 开头（如 `useAutoPipeline.ts`）

### 4.3 Store 命名

- **Zustand Store**：camelCase，以 `Store` 结尾（如 `autoPipelineStore.ts`）

### 4.4 流水线步骤命名

- **Step 文件**：kebab-case，以 `step-` 开头（如 `step-import.ts`）

---

## 五、模块导入约定

```typescript
// 核心模块
import { AutoPipelineEngine } from '@/core/autonomous';
import { SelfReviewLoop } from '@/core/autonomous';
import { QualityGate } from '@/core/autonomous';

// 流水线步骤
import { ImportStep } from '@/core/pipeline/step-import';
import { AnalysisStep } from '@/core/pipeline/step-analysis';

// 功能模块
import { useAutoPipeline } from '@/features/auto-pipeline/hooks';
import { autoPipelineStore } from '@/features/auto-pipeline/stores';

// 共享模块
import { someUtility } from '@/shared/utils';
import { SomeType } from '@/shared/types';
```

---

## 六、状态管理

### 6.1 Zustand Stores

| Store                | 路径                              | 用途           |
| -------------------- | --------------------------------- | -------------- |
| `autoPipelineStore`  | `features/auto-pipeline/stores/`  | 自主流水线状态 |
| `mangaPipelineStore` | `features/manga-pipeline/stores/` | 漫画流水线状态 |
| `projectStore`       | `shared/stores/`                  | 项目全局状态   |

### 6.2 状态结构（AutoPipelineStore）

```typescript
interface AutoPipelineState {
  mode: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep: string;
  progress: number; // 0-100
  steps: Record<string, StepState>;
  reviewLoops: Record<string, number>; // 每步自审次数
  results: PipelineResults;
  error?: string;
}
```

---

## 七、相关文档

- [架构设计](./architecture.md) — 系统架构详解
- [服务清单](./services.md) — 各服务 API
- [自主引擎 API](./autonomous-api.md) — Autonomous Pipeline API
- [用户指南](../user-guide/) — 功能使用说明
