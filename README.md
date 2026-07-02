<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-horizontal.svg" />
  <img src="public/logo-horizontal.svg" alt="frame-fab · AI 漫剧创作平台" width="480" />
</picture>

<br/>

# frame-fab · AI 漫剧创作平台

> **输入一本小说，AI 自动把它拍成一部漫剧——你只需要按"开始"。**

[![CI](https://img.shields.io/github/actions/workflow/status/Agions/frame-fab/test.yml?style=for-the-badge&label=CI&logo=github)](https://github.com/Agions/frame-fab/actions)
[![License](https://img.shields.io/github/license/Agions/frame-fab?style=for-the-badge&color=45B8AC)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2.1-FFC131?style=for-the-badge&logo=tauri)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Version](https://img.shields.io/badge/version-v2.2.3-6366F1?style=for-the-badge)](https://github.com/Agions/frame-fab/releases)

[**📖 在线文档**](https://agions.github.io/frame-fab/) · [**📥 下载桌面端**](https://github.com/Agions/frame-fab/releases) · [**🐛 报告问题**](https://github.com/Agions/frame-fab/issues/new) · [**💡 功能建议**](https://github.com/Agions/frame-fab/discussions)

</div>

---

## ✨ 它是什么？

**frame-fab v2.2.3** 是一款**桌面端 AI 漫剧创作平台**，基于 **Tauri 2.1 + Rust** 构建，集成多模型 AI（智谱 GLM-5 / MiniMax M2.5 / 月之暗面 Kimi / 字节 Seedream 5.0 / 快手 Kling 1.6 / Edge TTS）实现从**小说/剧本**到**漫剧成片**的端到端自动化。提供：

- 🎬 **Manual 模式**：七步半自动工作流（导入→分析→脚本→分镜→角色→渲染→导出），逐步审批
- 🤖 **Autonomous 模式**：10 步 Pipeline（script-generation → storyboard → material-matching → voice-synthesis → keyframe）+ Self-Review Loop + Quality Gate
- 🔄 **Checkpoint 断点续传**：30 秒自动保存，崩溃后可恢复
- 🧠 **ProviderRegistry**：Strategy 模式 + Fallback Chain，7+ 文字模型 / 4+ 图像模型 / 3+ TTS 自动切换
- 🎙️ **Edge TTS 默认免费**：无需 API Key 即可获得 200+ 语音

让创作者专注于故事本身，把繁琐的工程化交给 AI。

---

## 🎯 核心能力

|                    🎬 双模式工作流                    |                  🧠 多模型编排                  |               🎙️ 一站式音视频                |
| :---------------------------------------------------: | :---------------------------------------------: | :------------------------------------------: |
|     Manual 七步半自动 + Autonomous 五步 Pipeline      | Strategy ProviderRegistry + 完整 Fallback Chain | Edge TTS + 唇形同步 + 字幕嵌入 + FFmpeg 合成 |
|                  **🦀 Rust 高性能**                   |                 **🔄 断点续传**                 |               **🏗️ 桌面优先**                |
| Tauri 2.1 + FFmpeg 子进程 · 26MB 包体积 · 冷启动 < 1s |     30s 自动 Checkpoint · 自审循环自动修复      | 全局快捷键 / 系统托盘 / 原生菜单 / 三端一致  |

---

## 🚀 快速开始

### 方式 1：下载桌面端（推荐）

| 平台    | 架构                        | 下载                                                                                  |
| ------- | --------------------------- | ------------------------------------------------------------------------------------- |
| macOS   | Apple Silicon (M1/M2/M3/M4) | [frame-fab_x.x.x_aarch64.dmg](https://github.com/Agions/frame-fab/releases/latest)    |
| macOS   | Intel                       | [frame-fab_x.x.x_x64.dmg](https://github.com/Agions/frame-fab/releases/latest)        |
| Windows | x64                         | [frame-fab_x.x.x_x64-setup.exe](https://github.com/Agions/frame-fab/releases/latest)  |
| Linux   | AppImage                    | [frame-fab_x.x.x_amd64.AppImage](https://github.com/Agions/frame-fab/releases/latest) |

### 方式 2：从源码运行（开发模式）

```bash
git clone https://github.com/Agions/frame-fab.git
cd frame-fab
pnpm install
pnpm tauri dev   # 同时启动 Vite + Tauri
```

配置 `.env.local`（**至少一个文字模型**）：

```bash
VITE_ZHIPU_API_KEY=your_key_here   # 智谱 GLM-5（推荐）
VITE_ANTHROPIC_API_KEY=your_key     # Claude 3.5（备选）
VITE_MINIMAX_API_KEY=your_key       # MiniMax M2.5
VITE_SEEDDREAM_API_KEY=your_key     # 字节 Seedream 5.0（图像，可选）
VITE_KLING_API_KEY=your_key         # 快手 Kling 1.6（图像/视频，可选）
```

访问 `http://localhost:1420` 即可看到开发版 UI。

完整指引 → [快速开始 (5 分钟)](./docs/getting-started/quick-start.md)

---

## 🏗️ 架构

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend (Web UI — React 18 + TypeScript 5 + Vite 6)         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │ 15 features │  │  5 global    │  │ shadcn/ui (Radix  │    │
│  │ (DDD 风格)  │  │  Zustand     │  │  + Tailwind v4)   │    │
│  └─────────────┘  └──────────────┘  └───────────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │  tauri::invoke()  IPC
┌──────────────────────┴───────────────────────────────────────┐
│  Desktop Container (Tauri 2.1 — Rust)                        │
│  ┌────── src-tauri/commands/ (22) ──┐  ┌─── src-tauri/ ───┐ │
│  │ video · app · file · shortcuts   │  │  services/        │ │
│  │   22 Tauri Commands 按域路由      │  │  models/ · utils/ │ │
│  └──────────────────────────────────┘  └────────────────────┘ │
│  ┌────── 10 步 Pipeline (Autonomous) ──────────────────────┐  │
│  │ step1-script → step2-storyboard → step3-material →    │  │
│  │ step4-voice → step5-keyframe → ...→ step10-export     │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────── Autonomous Layer ───────────────────────────────┐   │
│  │ AutoPipelineEngine · QualityGate · SelfReviewLoop ·   │   │
│  │   Checkpoint (30s auto-save)                          │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  External AI Providers (via HTTPS · ProviderRegistry)       │
│  智谱 GLM-5 · MiniMax M2.5 · 月之暗面 Kimi · 字节 Seedream 5.0│
│  快手 Kling · 生数 Vidu · 阿里 CosyVoice · 微软 Edge TTS    │
└──────────────────────────────────────────────────────────────┘
```

详见 [架构设计 v2.2.3](./docs/developer-guide/architecture.md)。

---

## 📂 项目结构

```
frame-fab/
├── src/                          # 前端 UI 层（React + Tauri API 包装）
│   ├── features/                 # 15 个 Feature 模块（DDD 风格）
│   ├── shared/                   # 跨域共享（components/hooks/stores/utils/constants）
│   ├── core/                     # 核心服务（7 大领域 + pipeline + autonomous）
│   └── pages/                    # 路由级页面
├── packages/                     # Monorepo 子包
│   ├── core/                     # 领域核心（pipeline/autonomous/types）
│   └── common/                   # 基础类型/工具（无副作用）
├── src-tauri/                    # Tauri 桌面端（Rust 第一公民）
│   ├── src/commands/             # 22 个 Tauri Commands（按域路由）
│   ├── src/services/             # FFmpeg/视频/配置业务逻辑
│   ├── src/utils/                # 路径验证/ID 生成/FFPS 解析
│   └── src/models/               # 领域模型（app_settings/video_metadata/shortcut）
├── docs/                         # VitePress 文档站
│   ├── BRAND_GUIDELINES.md       # 品牌设计规范（Logo/色彩/字体/资产清单）
│   ├── getting-started/          # 5 分钟启动/配置
│   ├── user-guide/               # 9 个用户手册（双模式/全流程）
│   ├── api/                      # 7 大服务 API 参考
│   ├── developer-guide/          # 9 个架构/项目结构/服务
│   ├── deployment/               # 构建/环境/Docker
│   └── performance/              # 性能基准（v2.2.3 当前 + v2.2.0 历史）
├── public/                       # Vite 静态资源（favicon/og-image）
├── assets/                       # Logo 全家桶（SVG + PNG + ICO）
└── scripts/                      # 构建/资产渲染脚本
```

---

## 🛠️ 技术栈

| 类别     | 技术                                                                  |
| -------- | --------------------------------------------------------------------- |
| 前端框架 | React 18 · TypeScript 5 · Vite 6                                     |
| UI 组件  | shadcn/ui (Radix UI + Tailwind v4)                                    |
| 状态管理 | Zustand（5 个全局 Store + feature 级 Store）                          |
| 桌面端   | Tauri 2.1 + Rust 1.80                                                 |
| 动画     | Framer Motion                                                         |
| 国际化   | i18next                                                               |
| 测试     | Jest 30 · React Testing Library · 80+ suites                          |
| CI/CD    | GitHub Actions（lint + typecheck + test + e2e + build + docs deploy） |

---

## 🤖 支持的 AI 模型

| 模态         | 模型                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| **文字生成** | GLM-5（智谱）· M2.5（MiniMax）· Kimi K2.5（月之暗面）· Claude 3.5 · Doubao 2.0（字节）· Qwen 2.5（阿里）· ERNIE 4.0 |
| **图像生成** | Seedream 5.0（字节，推荐）· Kling 1.6（快手）· Vidu Q3（生数）                                                |
| **视频生成** | Seedance 2.0（字节）· 配合 Image-to-Video 工作流                                                               |
| **语音合成** | Edge TTS（免费默认）· CosyVoice 2.0（阿里）· 百度 TTS                                                          |

详见 [配置 AI API Key](./docs/getting-started/configuration.md)。

---

## 📖 文档导航

### 🆕 上手

| 文档 | 说明 |
|------|------|
| [快速开始 (5 分钟)](./docs/getting-started/quick-start.md) | 立即体验 |
| [安装指南](./docs/getting-started/installation.md) | 桌面端/源码安装 |
| [配置说明](./docs/getting-started/configuration.md) | AI API Key 配置 + 降级链 |

### 🎬 创作者

| 文档 | 说明 |
|------|------|
| [工作流概览](./docs/user-guide/workflow-overview.md) | 10 步流水线 + 双模式 |
| [Autonomous 模式](./docs/user-guide/autonomous-mode.md) | 零参与一键成片 |
| [Manual 模式](./docs/user-guide/manual-mode.md) | 逐步审批精细控制 |
| [脚本生成](./docs/user-guide/script-generation.md) / [角色设计](./docs/user-guide/character-design.md) / [分镜设计](./docs/user-guide/storyboard-design.md) / [渲染导出](./docs/user-guide/rendering-export.md) | 全流程指南 |

### ⚙️ 开发者

| 文档 | 说明 |
|------|------|
| [架构设计](./docs/developer-guide/architecture.md) | 系统整体架构 |
| [项目结构](./docs/developer-guide/project-structure.md) | 目录说明 |
| [模块系统](./docs/developer-guide/module-system.md) | DDD 分层 |
| [服务清单](./docs/developer-guide/services.md) | 7 大核心服务 |
| [Pipeline 引擎](./docs/developer-guide/pipeline-api.md) | 10 步细节 |
| [AI Providers](./docs/developer-guide/ai-providers.md) | ProviderRegistry + Fallback |
| [平台适配层](./docs/developer-guide/platform-layer.md) | Web/Desktop 抽象 |
| [Autonomous API](./docs/developer-guide/autonomous-api.md) | 自主引擎 API |

### 🔌 API 参考

| 文档 | 说明 |
|------|------|
| [API 概述](./docs/api/overview.md) | 7 大服务全景 |
| [AI 服务](./docs/api/ai-service.md) / [图像生成](./docs/api/image-generation.md) / [TTS 服务](./docs/api/tts-service.md) / [流水线](./docs/api/pipeline-service.md) / [字幕服务](./docs/api/subtitle-service.md) | 详细 API |

### 📦 运维 / 品牌 / 性能

| 文档 | 说明 |
|------|------|
| [构建与发布](./docs/deployment/build.md) | Tauri 三端构建 + 自动更新 |
| [环境变量](./docs/deployment/environment.md) | `.env.local` 配置 |
| [品牌设计指南](./docs/BRAND_GUIDELINES.md) | Logo / 色彩 / 字体 / 资产清单 |
| [v2.2.3 性能基准](./docs/performance/benchmark-v2.2.3.md) | 当前版本实测数据 |

---

## 🗺️ 路线图

- [x] **v2.0**：基础七步工作流（Manual 模式）
- [x] **v2.1**：8-Phase 架构重构 + Rust 模块化 + 服务重组 + 5 个 Store 收敛
- [x] **v2.2**：仓库改名 frame-fab · 描述中文化 · 自主流水线正式化 · ADR 决策记录 · 性能基准
- [x] **v2.3**：manga-pipeline 测试提速（11s → 4s）· 44 个大文件拆分重构（195+ 子模块）
- [x] **v2.4**：性能优化（terser → esbuild，30.1s → 14.6s）· 沙箱化与安全强化（Tauri Capability 11 个 permission 移除 + CSP 收紧 + 3 套安全测试）
- [x] **v2.2.3**：代码审查（ESLint 0 + Zustand 5 slice 类型收窄 + 清 12 处误导性 TODO）+ 死代码清理（-282 行跨 14 文件）+ 品牌视觉 v2.2.3 patch
- [ ] **v3.4**：多模态融合（音乐 AI / 音效 AI / 视频背景音乐智能匹配）+ 移动端预览 App
- [ ] **v4.0**：全自动漫剧工坊（Agent 化 / 风格迁移 / 国际化 2.0 / 数据看板）

完整路线图 → [ROADMAP.md](./ROADMAP.md)

---

## 🤝 贡献

欢迎 PR 和 Issue！开发流程：

1. Fork 仓库
2. 创建特性分支：`git checkout -b feat/your-feature`
3. 提交代码：`git commit -m "feat(scope): description"`
4. 推送分支：`git push origin feat/your-feature`
5. 创建 PR，CI 全绿后合并

### Conventional Commits

```bash
feat: 新功能
fix:  Bug 修复
docs: 文档变更
style: 代码格式化（无逻辑变更）
refactor: 重构
perf: 性能改进
test: 测试
chore: 构建/工具链变更
```

完整开发规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

---

## 🙏 致谢

- [Tauri](https://tauri.app) — Rust 桌面容器
- [shadcn/ui](https://ui.shadcn.com) — 组件设计系统
- [Zustand](https://github.com/pmndrs/zustand) — 状态管理
- [FFmpeg](https://ffmpeg.org) — 视频处理
- [VitePress](https://vitepress.dev) — 文档站
- 智谱 / MiniMax / 月之暗面 / 字节 / 阿里 / 百度 — AI 模型支持

---

## 📜 许可证

MIT License · © 2024-2026 [Agions](https://github.com/Agions)

如果你觉得 frame-fab 有帮助，请给我们一个 ⭐
