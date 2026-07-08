<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-horizontal.svg" />
  <img src="public/logo-horizontal.svg" alt="Story Weaver · AI 漫剧创作平台" width="480" />
</picture>

<br/>

# Story Weaver

> **输入一本小说，AI 自动把它拍成一部漫剧——你只需要按"开始"。**

[![CI](https://img.shields.io/github/actions/workflow/status/Agions/story-weaver/test.yml?style=for-the-badge&label=CI&logo=github)](https://github.com/Agions/story-weaver/actions)
[![License](https://img.shields.io/github/license/Agions/story-weaver?style=for-the-badge&color=45B8AC)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2.1-FFC131?style=for-the-badge&logo=tauri)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Version](https://img.shields.io/badge/version-v2.2.3-6366F1?style=for-the-badge)](https://github.com/Agions/story-weaver/releases)

[**📖 在线文档**](https://agions.github.io/story-weaver/) · [**📥 下载桌面端**](https://github.com/Agions/story-weaver/releases) · [**🐛 报告问题**](https://github.com/Agions/story-weaver/issues/new)

</div>

---

## 它是什么？

**Story Weaver** 是一款开源桌面端 AI 漫剧创作平台。基于 **Tauri 2.1 + Rust** 构建，集成多模型 AI，将小说/剧本自动转化为漫剧视频。

**核心能力：**

- 🎬 **双模式工作流**：Manual 七步半自动（逐步审批）+ Autonomous 全自动 Pipeline
- 🧠 **多模型编排**：ProviderRegistry + Fallback Chain，7+ 文字模型 / 4+ 图像 / 3+ TTS 自动降级
- 🔄 **断点续传**：30s 自动 Checkpoint，崩溃后可恢复
- 🎙️ **Edge TTS 免费**：无需 API Key 即可获得 200+ 语音

---

## 快速开始

### 方式 1：下载桌面端

| 平台    | 架构                  | 下载                                                                                 |
| ------- | --------------------- | ------------------------------------------------------------------------------------ |
| macOS   | Apple Silicon (M1–M4) | [story-weaver_aarch64.dmg](https://github.com/Agions/story-weaver/releases/latest)   |
| macOS   | Intel                 | [story-weaver_x64.dmg](https://github.com/Agions/story-weaver/releases/latest)       |
| Windows | x64                   | [story-weaver_x64-setup.exe](https://github.com/Agions/story-weaver/releases/latest) |
| Linux   | x64                   | [story-weaver_amd64.deb](https://github.com/Agions/story-weaver/releases/latest)     |

### 方式 2：源码运行

```bash
git clone https://github.com/Agions/story-weaver.git
cd story-weaver
pnpm install
pnpm tauri dev
```

配置 `.env.local`（至少一个文字模型）：

```bash
VITE_ZHIPU_API_KEY=your_key     # 智谱 GLM-5（推荐）
VITE_ANTHROPIC_API_KEY=your_key # Claude 3.5（备选）
VITE_MINIMAX_API_KEY=your_key   # MiniMax M2.5
VITE_SEEDDREAM_API_KEY=your_key # Seedream 5.0（图像）
```

---

## 技术栈

| 类别     | 技术                                           |
| -------- | ---------------------------------------------- |
| 前端     | React 18 · TypeScript 5 · Vite 6 · Tailwind v4 |
| UI       | shadcn/ui (Radix UI)                           |
| 桌面端   | Tauri 2.1 · Rust 1.80 · FFmpeg                 |
| 状态管理 | Zustand                                        |
| AI       | ProviderRegistry（Strategy + Fallback）        |
| 测试     | Jest 30 · React Testing Library                |

---

## 架构概览

```
┌────────────────────────────────────────────┐
│  Frontend (React 18 + TypeScript)          │
│  features/ · shared/ · core/ · pages/      │
└──────────────────┬─────────────────────────┘
                   │  IPC (tauri::invoke)
┌──────────────────┴─────────────────────────┐
│  Tauri 2.1 (Rust)                          │
│  commands/ · services/ · models/ · utils/  │
│  Pipeline Engine · QualityGate · Checkpoint│
└──────────────────┬─────────────────────────┘
                   │  HTTPS
┌──────────────────┴─────────────────────────┐
│  AI Providers                              │
│  GLM-5 · Kimi · Seedream · Kling · TTS    │
└────────────────────────────────────────────┘
```

详见 [架构设计](https://agions.github.io/story-weaver/developer-guide/architecture)。

---

## 文档

| 入口                                                                           | 适合谁             |
| ------------------------------------------------------------------------------ | ------------------ |
| [快速开始](https://agions.github.io/story-weaver/getting-started/quick-start)  | 第一次使用         |
| [用户手册](https://agions.github.io/story-weaver/user-guide/)                  | 创作者（双模式）   |
| [API 参考](https://agions.github.io/story-weaver/api/overview)                 | 开发者（7 大服务） |
| [架构设计](https://agions.github.io/story-weaver/developer-guide/architecture) | 架构师             |

---

## 贡献

欢迎 PR！Fork → 分支 → 提交 → PR。完整规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

## 许可证

MIT License · © 2024-2026 [Agions](https://github.com/Agions)
