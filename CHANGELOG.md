# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🧹 死代码清理 (Round 17-19)

- **drop redundant `logger.d.ts` global declaration** (`src/logger.d.ts`, commit `ca4cc7b`)：0 真用 ambient declare + 防未来漏 import, 删 -12 行
- **drop 15 unused exports across 13 files** (commit `f458610`)：Dim 7 stage 1.5 deep-dive 命中, 删 -16 行
- **drop 3 orphan adapter files** (filesystem/notification/storage, commit `0dc39fc`)：Dim 14 whole-file orphan scan, 删 -246 行
- **drop unused `run_ffmpeg_vec` Rust helper** (`src-tauri/src/services/ffmpeg/mod.rs`, commit `c088ef3`)：Dim 38 `#[allow(dead_code)]` 隐藏死代码, 删 -15 行
- **drop dead link to deleted `docs/dev/v3.2-perf-baseline.md`** (`ROADMAP.md`, commit `699210a`)：Dim 101 docs dead link
- 验证: eslint 0 / tsc 0 / jest 0 (80 suites / 1381 tests)
- **累计**: -289 净行, 6 commits, 18 files modified

### 📝 Docs 同步 (Round 19)

- **README.md rewrite to v3.0 reality** (commit `2c99aed`)：修 5 ❌ 严重 + 5 ⚠️ 警告
  - Pipeline 描述从 "10 步" 改为 "5 步" (script-generation → storyboard → material-matching → voice-synthesis → keyframe)
  - 服务数量 13 → 21 (新增 ai / audio / domain / pipeline / project / storyboard-\* / video)
  - 测试数 79/1375 → 80/1381
  - 移除 AI 伪造 KAN-TTS (0 源码引用)
  - 路线图添加 v2.4 / v3.0+ 完成项
- 验证: 本地 4 件套全绿 (eslint / tsc / jest / build)

### 🚀 Release v3.0.0

- **chore(release): bump v2.2.0 → v3.0.0** (commit `55172f7`)：3-place 原子 bump
  - `package.json`: 2.2.0 → 3.0.0
  - `src-tauri/Cargo.toml`: 2.2.0 → 3.0.0
  - `src-tauri/tauri.conf.json`: 2.2.0 → 3.0.0
- **docs(roadmap): update to v3.0+ reality + drop duplicate v3.4 entries** (commit `f6aa1c0`)：删除 ROADMAP 过时架构设计 (v3.3/v3.4 重复项 + 内嵌已完成项)
- 净改动: -289 净行 (dead code) + version bump 3-place

## [3.0.0] - 2026-06-10

### 🧹 死代码清理 (P7 Dim 38)

- **drop unused `run_ffmpeg_vec` Rust helper** (`src-tauri/src/services/ffmpeg/mod.rs`, commit `c088ef3`)：0 外部引用 + `#[allow(dead_code)]` 标记隐藏，删 -15 行
- 验证: eslint 0 / tsc 0 / jest 0 (80 suites / 1381 tests)

### 🎨 品牌资产全面升级 v2.0

品牌资产全面升级 v2.0

- **Logo 升级**：保留原设计基因（深空蓝 + 紫粉渐变），增强三帧胶片条带、中心三圈光圈、顶角装饰点
- **新增 `docs/BRAND_GUIDELINES.md`** (5.4KB)：Logo 元素/变体/规范、色彩系统（含 CSS 变量）、字体/间距、品牌声音
- **OG Image 重设计**：同步品牌 v2.0 + 新增 4 个特性徽章（TAURI+RUST / 6+ AI MODELS / QUALITY GATE / CHECKPOINT）
- **README v2.0**：聚焦快速开始 + emoji 锚点 + 路线图更新

## [2.4.0] - 2026-06-10

### 🧱 大文件拆分重构（44 文件 / 195+ 子模块）

累计拆分 9 类大文件，每轮都通过 tsc 干净 + 全套 1375 测试零 regression：

| 类型        | 代表文件                                        | 子模块                          |
| ----------- | ----------------------------------------------- | ------------------------------- |
| Service     | `video.service.ts` 401→222                      | 6 个                            |
| Service     | `tauri.service.ts` 336→199                      | 7 个                            |
| Service     | `storage.service.ts` 303→119                    | 9 个                            |
| Service     | `scene-analyzer.service.ts` 256→89              | 5 个                            |
| Pipeline    | `step5-keyframe/pipeline-controller.ts` 539→246 | 4 个                            |
| Controller  | `MangaPipelineController.ts` 419→243            | 6 个                            |
| Evaluator   | `quality-gate.ts` 369→119                       | 2 个                            |
| Self-Review | `self-review-loop.ts` 327→163                   | 2 个                            |
| Hook        | `useSettings.ts` 429→233                        | 3 个（消除 144 行重复）         |
| Hook        | `useProjectDetail.ts` 410→173                   | 2 个                            |
| Hook        | `useVideoEditor.ts` 356→215                     | 3 个                            |
| Util        | `general.ts` 426→68                             | 6 个（6 个功能域）              |
| Util        | `core/utils/hooks.ts` 363→40                    | 3 个（DOM/状态/计时）           |
| Constants   | `constants/index.ts` 491→30                     | 4 个（脚本/视频/应用/LLM）      |
| Config      | `models.config.ts` 442→20                       | 3 个（提供商/目录/工具）        |
| Util        | `platform.ts` 335→35                            | 4 个（检测/存储/文件系统/通知） |
| Template    | `prompt-template.ts` 329→30                     | 4 个（风格/角色/构建/校验）     |
| Engine      | `pipeline-engine.ts` 311→200                    | 2 个（类型/中间件）             |
| Step        | `char-illustrator.ts` 389→30                    | 4 个（风格/立绘/约束/场景）     |
| Hook        | `useEditor.ts` 302→200                          | 1 个（类型）                    |

**死代码清理**：删除 4 个无引用文件（301 行）

- `visual-consistency-aggregator.ts`
- `seedream.adapter.ts`
- `storage.interface.ts`
- `video-editor-history.ts`

## [2.3.0] - 2026-06-08

### 🧹 v3.3 mega cleanup — dead code, duplicates, naming (-7,677 lines, 59 files)

Comprehensive post-v3.2 audit. Single mega PR (#22) supersedes 5 planned sequential PRs for atomic review.

#### §1 死代码清理 (-6,400 LOC, 35 模块)

- **DI 容器层** (4 文件): `core/di/{base-service, container, index, service-registry}` — 纯装饰架构，生产代码 0 引用
- **Platform 层** (4 文件 + mocks): `core/platform/{index, adapters/*, __mocks__}` — Vite ESM 下 dynamic require 失效
- **AI chains** (3 文件): `core/ai/chains/{script-analysis, storyboard, index}` — 0 生产引用
- **基础设施 helpers** (2 文件): `infrastructure/ai/providers/network-guard` (124 行)、`infrastructure/storage/temp-file-manager` (228 行)
- **Config 死模块** (4 文件): `core/config/{app.config, workflow-config.tsx, workflow-config.types, workflow-settings}` — 整套 workflow-config 三件套自引用且 0 引用
- **AI providers**: `openai-compatible.provider.ts` (orphan)
- **Pipeline**: `step-scene.ts` (218 行, 从未接入)
- **Autonomous**: `types/autonomous.entities.ts` (118 行, 与 autonomous.types 重复)
- **UI orphans**: `color-picker.tsx`, `option.tsx`
- **CompositionStudio hooks**: `useCompositionStudio.ts` (338 行), `useCompositionPlayback.ts` (96 行) — 父组件从不 import
- **Storyboard 死面板** (3 文件, ~700 行): `SceneListPanel/SceneEditorPanel/ScenePreviewPanel` — 已被 `SceneRenderer/SceneList|Editor|Preview` 替代
- **9 测试文件**: 6 个孤岛测试

#### §2 重复代码合并 (-1,200 LOC, 5 类别)

- **§2.1 Request/Retry 4→1**: 删 `core/utils/retryRequest` (181 行) + `requestCache` (190 行) + `infrastructure/ai/providers/network-guard` (124 行) → 统一在 `shared/utils/request.ts` 单一来源
- **§2.2 runWhenIdle**: 删 `shared/utils/idle-callback.ts` (27 行, 与 `core/utils/idle.ts` 字节相同)
- **§2.3 formatDate**: 删 `format.ts` 中被 `format-ui.ts` 掩盖的 `formatDate`/`formatDateTime` (~30 行)
- **§1.1 video-composition.types**: core 完整版 (含 SubtitleItem id, SubtitleFormat 枚举) 提升到 `shared/types/`, 删 core 版
- **§7.1 useAsync**: 删 `core/utils/hooks.ts` 的 `useAsync` (~50 行), 改用 `useInteraction` 的 superset
- **§5.4 logger+toast 模式**: 3 文件 8 处 `handleAsyncError(err, 'msg')` 替换 3 行 `logger.error + toast.error` 模板

#### §3 core/utils 精简

`core/utils/index.ts`: 51 → 14 行 (-41 行 re-export 残留)
模块数: 9 → 5 文件 (requestCache, retryRequest, platform 移除)

#### §4 命名规范化

- **Pages 目录 kebab-case**: `Home` → `home`, `Settings` → `settings`, `Workflow` → `workflow` (与已有 `project-edit`/`project-detail`/`video-editor`/`auto-pipeline` 一致)
- **更新**: `src/app/router/page-preload.ts` 3 处 import
- **保留 React 社区约定**: 组件 PascalCase, hook `useXxx.ts`, utils/types kebab-case (全部已合规)

#### §5 架构优化

- **DI 容器彻底移除**: 装饰性架构，0 生产价值
- **Platform 统一**: `@/core/utils/platform.ts` 成为单一来源
- **`@/core/ai` 精简**: 移除 chains 子目录, 纯 providers
- **错误处理统一**: `handleAsyncError` 在 3 文件采用，模式建立

#### 验证

- `tsc --noEmit`: 0 错误
- `eslint --quiet`: 0 错误
- `jest`: 79 套件 / 1375 测试全过 (4 个 pre-existing skip 未变)
- **0 行为变更**: logger context / toast 文案 / 流程一致

#### 留作后续 PR (deferred)

- 6 个用 sonner 的文件迁移 handleAsyncError (需先决策 sonner ↔ Toast 统一)
- ~30 个文件还用手写 `logger.error + toast.error` 模板
- 第三方 AI provider 的额外 retry/timeout 模式
- React 组件 PascalCase → kebab-case (违反 React 社区约定, **不做**)

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

| 指标          | v2.1.0 | v2.2.0   | 变化 |
| ------------- | ------ | -------- | ---- |
| Test Suites   | 87     | **90**   | +3   |
| Tests Passed  | 1523   | **1596** | +73  |
| Tests Skipped | 0      | 4        | +4   |
| Tests Failed  | 0      | **0**    | —    |

#### 新增文档

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
