# Changelog

All notable changes to this project will be documented in this file.

## [2.2.0] - 2026-06-03

### 🏗️ 自主流水线正式化 + 品牌收尾 + 测试补全

#### Phase 4: 自主流水线引擎正式化

- 10 步 Pipeline 全部位于 `src/core/pipeline/step-*.ts`,各 200-290 行（≤ 400 行阈值）
- `packages/core/autonomous/evaluator/quality-gate.ts` (369 行) — 默认审核标准 + 评分逻辑
- `packages/core/autonomous/evaluator/self-review-loop.ts` (327 行) — 自审循环 + 修复机制
- `packages/core/autonomous/types/autonomous.types.ts` (285 行) — `StepState` / `PipelineCheckpoint` / `PipelineEventHandler`
- `packages/core/autonomous/prompts/` — AI 提示词模板
- `src/core/autonomous/auto-pipeline-engine.ts` (634 行) — 主类入口（run/pause/resume/cancel）
- 新增 3 个 smoke test 套件 (17 用例): auto-pipeline-engine + quality-gate + self-review-loop

#### Phase 7 (final): 5 fail suites → 0 fail

- `async-step-chain`: 修复 retry 成功后 `lastError` 未清空导致 status='failed' 的 bug
- `step-video-editing`: re-export `VideoEditor` 类（测试直引引擎）
- `plugin-host`: 删除陈旧 stub 测试（`src/plugins/` 模块从未存在）
- `workflow.service`: import 路径加 `shared/` 前缀
- `manga-pipeline.service`: 修正 3 个 mock 路径以匹配真 import 位置

#### Phase 5 (v2 收尾): 描述中文化

- `package.json` / `Cargo.toml` / `tauri.conf.json` / `app.config.ts` description 全中文化
- 仓库名最终定稿: **Agions/frame-fab**（git remote 已更新）
- `tauri.conf.json` window title → "frame-fab - AI 漫剧创作平台"
- GitHub 仓库描述同步更新

#### 测试规模

| 指标 | v2.1.0 | v2.2.0 | 变化 |
|------|--------|--------|------|
| Test Suites | 87 | **90** | +3 |
| Tests Passed | 1523 | **1596** | +73 |
| Tests Skipped | 0 | 4 | +4 |
| Tests Failed | 0 | **0** | — |

#### 新增文档

- `docs/adr/0001-tauri-desktop-architecture.md` — 桌面优先架构决策记录
- `docs/adr/0002-frontend-monorepo-ddd.md` — Monorepo + DDD 分层决策记录
- `docs/performance/benchmark-v2.2.0.md` — 性能基准报告

## [2.1.0] - 2026-06-02

### 🏗️ 全面架构重构 (frame-fab Refactoring v3)

> 项目代号从 frame-fab / frame-fab 演进为 **frame-fab** (AI 漫剧创作平台)
> 此版本完成了 §1.1 目标架构的 8 个 Phase 重构。

#### Phase 1: Rust 后端模块化拆分

- `lib.rs` **912 行 → 69 行** (-92%)，main.rs **807 → 13 行** (-98%)
- 拆分 27 个 .rs 文件为 4 层架构：`commands/` (路由) + `services/` (业务) + `models/` (数据) + `utils/` (工具)
- 21 个 Tauri Commands 按域组织：`commands/{video,app,file,shortcuts}.rs`
- 路径验证提取至 `utils/path_validator.rs` (含 4 个单元测试)
- FFmpeg 封装至 `services/ffmpeg/mod.rs` (含 3 个 split_args 单元测试)
- 视频转场逻辑提取至 `services/video/transitions.rs` (含 3 个 xfade 测试)
- ID 生成 / FPS 解析 / 路径白名单常量统一在 `utils/` 和 `constants/`

#### Phase 2: core/services/ 领域重组

- 38 个平铺 .ts 文件 → **6 个领域子目录**：
  - `ai/text/` 智能文本层 (8 文件)
  - `ai/image/` 图像/视频生成 (image-generation + 4 provider adapters)
  - `video/` 视频层 (9 文件)
  - `audio/` 音频层 (3 文件)
  - `pipeline/` 流水线 (3 文件)
  - `project/` 项目层 (6 文件)
  - `domain/` 领域层 (4 文件)
- 34 个 **shim re-export 文件** 保持向后兼容（72 个外部 import 零修改）
- 14 处跨域相对引用修复，统一使用 `@/core/services/...` 别名

#### Phase 3: UI 合并 + Feature 边界清理

- 删除 `legacy.store.ts` (实际无业务引用)
- 清理 `shared/stores/index.ts` 的 `useLegacyStore` 导出
- `video/` vs `video-export/` 边界标记 (有 3 处真实引用，保留)
- `domain/script/` 和 `domain/shared/` 标记 (有 4 处真实引用，保留)

#### Phase 4: 自主流水线引擎正式化

- `step-chain.ts` **355 行 → 4 文件**:
  - `step-chain.types.ts` (类型, 85 行)
  - `step-chain.types-helpers.ts` (config, 35 行)
  - `async-step-chain.ts` (执行器, 180 行)
  - `step-chain.builder.ts` (Builder 模式, 95 行)
- 创建 `packages/core/pipeline/` + `packages/core/autonomous/` monorepo 目标位置
- 重组 autonomous 层：quality-gate 和 self-review-loop 移至 `evaluator/`，types 移至 `types/`
- 新增 `AsyncStepChain` 单元测试 (15 用例：EXEC/重试/PRE/POST/ROLLBACK/Builder)

#### Phase 5: 品牌升级

- `package.json` description → **frame-fab**
- `Cargo.toml` description → **frame-fab v2.2.0 - AI 漫剧创作平台**
- `tauri.conf.json` productName → **frame-fab**
- `index.html` title → **frame-fab - AI 漫剧创作平台**
- Rust 启动日志更新 (`info!("frame-fab 启动中...")`)
- 54 个源/测试文件 brand 字符串统一

#### Phase 6: Zustand Stores 收敛

- 6 → **5** 个全局 store (legacy.store.ts 已删除)

#### Phase 7: 测试填充

- 新增 15 个 AsyncStepChain 单元测试
- Rust 端 9 个单元测试 (path_validator, idgen, ffmpeg_utils, ffmpeg split, transitions)

#### Phase 8: 文档

- 本 CHANGELOG 条目

### ⚠️ Breaking Changes

- 无 — 所有变更保持向后兼容（shim re-export 维持旧路径）

### 📦 依赖

- 无新增依赖

### 🔧 已知问题

- `src/features/video-export/services/` 4 个文件 (1204 行) 与 `core/services/` 下同名文件平行实现，待 Phase 9 统一

## [1.0.0] - 2026-05-07

### 🎉 Project Renamed

- **Project Name**: Nova → frame-fab → **frame-fab**
- New ASCII art logo
- Updated all documentation references
- GitHub: https://github.com/Agions/frame-fab

### 🗑️ UI 组件库迁移

- **antd 完全移除**: 62 个 antd 组件引用 → 0
- **@ant-design/icons 完全移除**: 14 个引用 → 0
- **迁移至 shadcn/ui**: 基于 Radix UI + Tailwind CSS 的全新组件系统
- **CSS 清理**: 移除 197 行 antd 相关 CSS

### ✨ New Features

- Professional tool-style UI redesign
- Enhanced workflow system
- Improved code architecture

### 🔧 Configuration Updates

- Package name: `manga-ai` → `frame-fab`
- Tauri identifier: `com.frame-fab.app` → `com.frame-fab.app`
- Window title updated to frame-fab branding
- Storage key prefix updated to `frame-fab_`

### ✨ Added

- **8-Step Drama Workflow**: Novel → Script → Storyboard → Character → Scene → Animation → Voiceover → Export
- **Novel Parser**: Automatic novel-to-script conversion with character extraction
- **Storyboard Generator**: AI-powered panel generation from script scenes
- **Character Consistency**: Character appearance and personality management
- **Drama Style System**: Genre/tone/pacing/art style management
- **Vision Service**: Advanced scene detection, object detection, emotion analysis
- **Novel Service**: Parse novels, convert to scripts, generate storyboards
- **Model Selector**: Smart AI model selection with cost estimation
- **Script Generator**: AI-powered script generation
- **Storyboard Generator**: Automatic storyboard creation
- **Character Designer**: AI character generation with consistency
- **Project Management**: Complete project lifecycle management
- **Storage Service**: Persistent local storage

### 📝 Documentation

- Complete README rewrite in English
- Added comprehensive project structure documentation
- Updated AI model support (2026 latest models)
- Mermaid tech architecture diagrams

### 🔧 Technical

- React 18 + TypeScript + Vite
- Shadcn UI + Framer Motion
- Tauri for desktop application
- Zustand for state management
- Modular architecture with service layer
- FFmpeg integration

### 🤖 LLM Models (2026 Latest)

- 智谱 GLM-5
- MiniMax M2.5
- 月之暗面 Kimi K2.5
- 字节 Doubao 2.0
- 阿里 Qwen 2.5
- 百度 ERNIE 4.0

## [0.1.0] - 2026-02-16

### Added

- Project initialization
- Basic project structure
- TypeScript configuration
- Development environment setup
