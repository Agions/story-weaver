# 开发者指南

> 本指南面向希望深入了解 FrameForge 架构、扩展功能或参与贡献的开发者。

---

## 📑 目录

| 文档                                   | 说明                                        |
| -------------------------------------- | ------------------------------------------- |
| **[架构设计](./architecture.md)**      | 系统整体架构、核心模块、数据流设计          |
| **[项目结构](./project-structure.md)** | 目录结构、模块划分、文件说明                |
| [服务清单](./services.md)              | 各服务模块功能与 API 说明（待完成）         |
| [自主引擎 API](./autonomous-api.md)    | Autonomous Pipeline 引擎 API 文档（待完成） |

---

## 🏗️ 系统架构总览

FrameForge 是一款**全自主 Agent 型**漫剧制作系统，核心特性包括：

- **Self-Review Loop**：每步 AI 自审，不合格自动修复（最多 3 次循环）
- **Quality Gate**：全自动质量门禁，确保输出品质
- **断点续传**：支持中途暂停、刷新继续
- **降级策略**：主模型不可用时自动切换备选模型

### 两种运行模式

|                | Manual Mode（手动模式） | Autonomous Mode（全自动模式） |
| -------------- | ----------------------- | ----------------------------- |
| **用户参与度** | 高（逐环节审批、编辑）  | **零（仅提供原材料）**        |
| **核心机制**   | 工具型，需逐步骤操作    | Agent 型，一键启动            |
| **AI 自审**    | 无                      | **每步自审 + 自动修复**       |
| **断点续传**   | 不支持                  | 支持                          |

---

## 📦 核心模块

### `core/autonomous/` — 全自主编排引擎

这是重构的核心，使 Pipeline 具备"自主决策 + 循环返工"能力：

```
src/core/autonomous/
├── auto-pipeline-engine.ts    # 全自动流水线引擎
├── self-review-loop.ts        # AI 自审循环（核心创新）
├── quality-gate.ts             # 质量门禁（自动判定）
├── autonomous.types.ts        # 自主模式类型定义
└── index.ts
```

### `features/auto-pipeline/` — 用户交互界面

```
src/features/auto-pipeline/
├── components/
│   ├── AutoPipelineWizard.tsx      # 一步式启动向导
│   ├── AutonomousProgress.tsx      # 全局进度 + 状态展示
│   ├── AIBriefingPanel.tsx          # AI 任务简报面板
│   └── FinalPreview.tsx             # 成片预览 + 下载
├── hooks/
│   ├── useAutoPipeline.ts           # 自主流水线 hook
│   └── useSelfReviewLoop.ts         # 自审循环状态
├── stores/
│   └── autoPipelineStore.ts         # Zustand store
├── services/
│   └── autoPipelineService.ts       # 流水线服务封装
└── index.ts
```

### `core/pipeline/` — 流水线步骤

```
src/core/pipeline/
├── step-import.ts           # 解析原材料
├── step-analysis.ts         # 分析故事结构
├── step-script.ts           # 生成视频剧本
├── step-character.ts        # 角色设定与一致化
├── step-scene.ts            # 场景规划（新增）
├── step-storyboard.ts       # 分镜脚本 + 参考图
├── step-render.ts           # 批量渲染帧
├── step-video-edit.ts       # 视频剪辑 + 转场（新增）
├── step-audio.ts            # 配音 + 音效 + 唇形同步
├── step-subtitle.ts         # 字幕生成与嵌入
├── step-export.ts           # 最终合成输出
└── step-review.ts           # 自审步骤
```

---

## 🔄 流水线执行流程

```
用户（提供纯文本） → AutoPipeline（无人值守）
                          │
      ┌───────────────────┼───────────────────┐
      ▼                   ▼                   ▼
 剧本解析 Agent      角色生成 Agent      分镜生成 Agent
      │                   │                   │
      └──────────┬─────────┴─────────┴──────────┘
                 ▼
         自主审核循环（Self-Review Loop）
                 │ 不合格
                 ▼ 重做该步骤
         视频合成 Agent
                 │
                 ▼
         Quality Gate（全检）
                 │ 不合格
                 ▼ 自动返工
         📤 成片输出
```

---

## 🛠️ 开发环境

### 技术栈

- **前端框架**：React + TypeScript
- **状态管理**：Zustand
- **构建工具**：Vite
- **样式**：Tailwind CSS / CSS Modules
- **AI 模型**：GLM-5 / M2.5 / Seedream 5.0 / Edge TTS 等

### 本地开发

1. 克隆项目
2. 安装依赖：`npm install`
3. 配置 API Key（参考 [配置文档](../getting-started/configuration.md)）
4. 启动开发服务器：`npm run dev`

---

## 📖 更多文档

- [架构设计](./architecture.md) — 详细架构说明
- [项目结构](./project-structure.md) — 完整目录结构
- [服务清单](./services.md) — 各服务 API
- [自主引擎 API](./autonomous-api.md) — Autonomous Pipeline API
- [部署文档](../deployment/) — 生产环境部署指南

---

> **💡 参与贡献**：欢迎提交 Issue 和 Pull Request！
