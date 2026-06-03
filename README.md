<div align="center">

<img src="assets/logo-horizontal.svg" alt="FrameForge" width="480"/>

<br/>

# FrameForge · AI 驱动的视频创作工作室

> **输入一个故事，AI 把剧本/分镜/角色/TTS/渲染一站式做完——你只管"开始"。**

[![CI](https://img.shields.io/github/actions/workflow/status/Agions/frame-fab/ci.yml?style=for-the-badge&label=CI)](https://github.com/Agions/frame-fab/actions)
[![License](https://img.shields.io/github/license/Agions/frame-fab?style=for-the-badge&color=45B8AC)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2.1-FFC131?style=for-the-badge&logo=tauri)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Version](https://img.shields.io/badge/version-v2.2.0-FF8A5B?style=for-the-badge)](https://github.com/Agions/frame-fab/releases)

[**在线文档**](https://agions.github.io/frame-fab/) · [**下载桌面端**](https://github.com/Agions/frame-fab/releases) · [**报告问题**](https://github.com/Agions/frame-fab/issues/new) · [**功能建议**](https://github.com/Agions/frame-fab/discussions)

</div>

---

## 它是什么？

FrameForge 是一款**桌面端 AI 视频创作工作台**，基于 Tauri 2.1 + Rust 构建，集成多模型 AI（GLM-5 / M2.5 / Kimi / Seedream / Kling / Vidu / Edge TTS）实现从小说/剧本到成片的**端到端自动化**。提供 Manual 模式（逐步审批）和 Autonomous 模式（一键启动）两种工作流，配备 10 步 Pipeline 引擎、Self-Review Loop 自动修复、Quality Gate 质量门禁、Checkpoint 断点续传，让创作者专注于故事本身。

---

## 核心能力

<table>
  <tr>
    <td align="center" width="33%">
      <h3>🎬 双模式工作流</h3>
      <p><b>Manual Mode</b>：七步半自动（导入→分析→脚本→分镜→角色→渲染→导出），逐步审批<br/><b>Autonomous Mode</b>：10 步全自主 + Self-Review Loop + Quality Gate</p>
    </td>
    <td align="center" width="33%">
      <h3>🧠 多模型 AI 编排</h3>
      <p>Strategy 模式 ProviderRegistry 支持 6+ 文字模型、4+ 图像模型、3+ TTS，含完整 Fallback Chain 和 Retry 机制</p>
    </td>
    <td align="center" width="33%">
      <h3>🎙️ 一站式音视频</h3>
      <p>Edge TTS 配音、唇形同步、字幕嵌入、FFmpeg 合成导出；支持 MP4/WebM/MOV 多格式输出</p>
    </td>
  </tr>
  <tr>
    <td align="center"><h3>🦀 Rust 高性能后端</h3>
      <p>Tauri 2.1 + FFmpeg 子进程，零桥接开销；包体积 30MB，冷启动 &lt;1s</p></td>
    <td align="center"><h3>🔄 断点续传 + 修复</h3>
      <p>PipelineEngine 30s 自动 Checkpoint，自审循环自动修复不合格输出，质量门禁不通过可降级</p></td>
    <td align="center"><h3>🏗️ 桌面优先架构</h3>
      <p>全局快捷键、系统托盘、原生菜单、文件 I/O；macOS/Windows/Linux 三端一致体验</p></td>
  </tr>
</table>

---

## 快速开始

### 下载桌面端

| 平台 | 架构 | 下载 |
|------|------|------|
| macOS | Apple Silicon (M1/M2/M3/M4) | [FrameForge_x.x.x_aarch64.dmg](https://github.com/Agions/frame-fab/releases/latest) |
| macOS | Intel | [FrameForge_x.x.x_x64.dmg](https://github.com/Agions/frame-fab/releases/latest) |
| Windows | x64 | [FrameForge_x.x.x_x64-setup.exe](https://github.com/Agions/frame-fab/releases/latest) |
| Linux | AppImage | [FrameForge_x.x.x_amd64.AppImage](https://github.com/Agions/frame-fab/releases/latest) |

> 没有找到合适的桌面端？试试从源码运行（开发模式） ↓

### 从源码运行（开发模式）

```bash
git clone https://github.com/Agions/frame-fab.git
cd frame-fab
pnpm install
pnpm tauri dev
```

配置 `.env.local`：

```bash
# 文字生成（至少配置一个）
VITE_ALIBABA_API_KEY=your_key_here       # 阿里 Qwen
VITE_ZHIPU_API_KEY=your_key_here         # 智谱 GLM
VITE_MINIMAX_API_KEY=your_key_here       # MiniMax M2.5

# 图像生成（可选）
VITE_SEEDDREAM_API_KEY=your_key_here     # 字节 Seedream 5.0
VITE_KLING_API_KEY=your_key_here         # 快手 Kling
```

访问 `http://localhost:1420` 即可看到开发版 UI。

---

## 架构

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend (Web UI — React 18 + TypeScript 5 + Vite)          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │ 14 features │  │  5 global    │  │ shadcn/ui (Radix  │    │
│  │ (DDD 风格)  │  │  Zustand     │  │  + Tailwind CSS)  │    │
│  └─────────────┘  └──────────────┘  └───────────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │  tauri::invoke()  IPC
┌──────────────────────┴───────────────────────────────────────┐
│  Desktop Container (Tauri 2.1 — Rust)                        │
│  ┌─────────── commands/ ──────────┐  ┌────── services/ ───┐  │
│  │ video · app · file · shortcuts  │  │ ffmpeg · video ·   │  │
│  │   21 Tauri Commands 按域路由    │  │   config           │  │
│  └────────────────────────────────┘  └────────────────────┘  │
│  ┌────────────── 10 步 Pipeline ──────────────────────────┐  │
│  │ import → analysis → script → character → scene →      │  │
│  │ storyboard → render → video-editing → audio → export  │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────── Autonomous Layer ───────────────────────────────┐   │
│  │ AutoPipelineEngine · QualityGate · SelfReviewLoop ·   │   │
│  │   Checkpoint (30s auto-save)                          │   │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  External AI Providers (via HTTPS)                           │
│  智谱 GLM-5 · MiniMax M2.5 · 月之暗面 Kimi · 字节 Seedream 5.0│
│  快手 Kling · 生数 Vidu · 阿里 CosyVoice · 微软 Edge TTS    │
└──────────────────────────────────────────────────────────────┘
```

详细架构决策见 [`docs/adr/`](./docs/adr/) (Tauri 桌面优先 + Monorepo DDD 分层)。

---

## 项目结构

```
frame-fab/
├── src/                          # 前端 UI 层（React + Tauri API 包装）
│   ├── features/                 # 14 个 Feature 模块（DDD 风格）
│   ├── shared/                   # 跨域共享（components/hooks/stores/utils）
│   ├── core/                     # 核心服务（pipeline + services）
│   └── pages/                    # 路由级页面
├── packages/                     # Monorepo 子包
│   ├── core/                     # 领域核心（pipeline/autonomous/types）
│   └── common/                   # 基础类型/工具（无副作用）
├── src-tauri/                    # Tauri 桌面端（Rust 第一公民）
│   ├── src/commands/             # 21 个 Tauri Commands（按域路由）
│   ├── src/services/             # FFmpeg/视频/配置业务逻辑
│   ├── src/utils/                # 路径验证/ID 生成/FFPS 解析
│   └── src/constants/            # 允许目录白名单
├── docs/                         # VitePress 文档站
│   ├── adr/                      # 架构决策记录
│   ├── api/                      # API 参考
│   ├── performance/              # 性能基准报告
│   ├── developer-guide/          # 架构/项目结构/服务
│   ├── getting-started/          # 5 分钟启动/配置
│   └── user-guide/               # 工作流说明
├── assets/                       # 品牌资源（logo 系统）
├── public/                       # Vite 静态资源
└── scripts/                      # 构建脚本
```

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 · TypeScript 5 · Vite 5 |
| UI 组件 | shadcn/ui (Radix UI + Tailwind CSS) |
| 状态管理 | Zustand（5 个全局 Store + feature 级 Store）|
| 桌面端 | Tauri 2.1 (Rust) |
| 动画 | Framer Motion |
| 国际化 | i18next |
| 测试 | Jest · React Testing Library · 90 suites / 1596 pass |
| CI/CD | GitHub Actions（lint + typecheck + test + e2e + build + docs deploy）|

---

## 支持的 AI 模型

| 模态 | 模型 |
|------|------|
| **文字生成** | GLM-5（智谱）· M2.5（MiniMax）· Kimi K2.5（月之暗面）· Doubao 2.0（字节）· Qwen 2.5（阿里）· ERNIE 4.0（百度）|
| **图像生成** | Seedream 5.0（字节，推荐）· Kling 1.6（快手）· Vidu 2.0（生数）|
| **视频生成** | Seedance 2.0（字节）· 配合 Image-to-Video 工作流 |
| **语音合成** | Edge TTS（免费）· CosyVoice 2.0（阿里）· KAN-TTS（阿里）|

---

## 开发命令

```bash
# 前端
pnpm dev                # Vite dev server (port 1420)
pnpm build              # 生产构建
pnpm build:check        # tsc --noEmit (类型检查)
pnpm test               # Jest 全部测试
pnpm test:watch         # 监听模式
pnpm lint               # ESLint
pnpm lint:fix           # ESLint 自动修复

# Tauri 桌面端
pnpm tauri dev          # 桌面端热重载开发
pnpm tauri build        # 生产桌面端构建（生成 .dmg/.exe/.AppImage）

# 文档
pnpm docs:vp:dev        # VitePress 文档站开发
pnpm docs:vp:build      # 构建文档站静态资源
```

---

## 文档导航

| 分类 | 文档 | 说明 |
|------|------|------|
| 上手 | [快速开始](./docs/getting-started/quick-start.md) | 5 分钟启动 |
| 上手 | [安装](./docs/getting-started/installation.md) | 桌面端/源码安装 |
| 上手 | [配置](./docs/getting-started/configuration.md) | AI API Key 配置 |
| 开发 | [架构](./docs/developer-guide/architecture.md) | 系统架构设计 |
| 开发 | [项目结构](./docs/developer-guide/project-structure.md) | 目录说明 |
| 开发 | [Pipeline API](./docs/developer-guide/pipeline-api.md) | 10 步 Pipeline 引擎 |
| 开发 | [Autonomous API](./docs/developer-guide/autonomous-api.md) | AutoPipelineEngine / QualityGate / SelfReviewLoop |
| API | [服务参考](./docs/api/) | AI/图像/视频/TTS/字幕/流水线服务 |
| 决策 | [ADR 0001: Tauri 桌面优先](./docs/adr/0001-tauri-desktop-architecture.md) | 架构决策记录 |
| 决策 | [ADR 0002: Monorepo DDD 分层](./docs/adr/0002-frontend-monorepo-ddd.md) | 架构决策记录 |
| 性能 | [v2.2.0 性能基准](./docs/performance/benchmark-v2.2.0.md) | bundle/流水线/UI LCP |

---

## 路线图

- [x] **v2.0**：基础七步工作流（Manual 模式）
- [x] **v2.1**：8-Phase 架构重构 + Rust 模块化 + 服务重组 + 5 个 Store 收敛
- [x] **v2.2**：仓库改名 frame-fab · 描述中文化 · 自主流水线正式化 · ADR 决策记录 · 性能基准
- [ ] **v2.3**：manga-pipeline 测试提速（11s → 4s）· E2E 性能测试 · SWC 替换 ts-jest · 集成测试覆盖 AutoPipelineEngine
- [ ] **v2.4**：协同编辑（CRDT/Y.js）· 角色一致性 v2（基于 IP-Adapter）· 模板市场
- [ ] **v3.0**：多模态融合（视频+音乐+音效 AI 生成）· 跨设备同步 · 移动端预览

---

## 贡献

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
docs:  文档变更
style: 代码格式化（无逻辑变更）
refactor: 重构
perf: 性能改进
test: 测试
chore: 构建/工具链变更
```

完整开发规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

---

## 致谢

- [Tauri](https://tauri.app) — Rust 桌面容器
- [shadcn/ui](https://ui.shadcn.com) — 组件设计系统
- [Zustand](https://github.com/pmndrs/zustand) — 状态管理
- [FFmpeg](https://ffmpeg.org) — 视频处理
- 智谱 / MiniMax / 月之暗面 / 字节 / 阿里 / 百度 — AI 模型支持

---

## 许可证

MIT License · © 2024-2026 [Agions](https://github.com/Agions)

如果你觉得 FrameForge 有帮助，请给我们一个 ⭐
