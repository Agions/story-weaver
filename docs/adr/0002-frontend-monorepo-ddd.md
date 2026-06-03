# ADR 0002: 前端 Monorepo + DDD 分层（src + packages/core + packages/common）

- **状态**: Accepted
- **日期**: 2026-06-03
- **决策者**: frame-fab 架构组

## 背景

frame-fab 前端（React 18 + TS 5）规模达到 5 万行+,出现以下问题:

- `src/core/services/` 48+ 文件平铺,职责混杂（AI/图像/视频/音频/Pipeline/项目）
- `src/components/ui/` 48 个 antd 风格 + `src/shared/components/ui/` 8 个 Radix 风格两套并存
- 6 个 Zustand Store 职责重叠（legacy.store / user.store 等未清理）
- 核心业务逻辑（Pipeline 10 步 + Autonomous Engine）与 UI 混在 `src/`

## 决策

采用 **Monorepo + DDD 分层** 重组:

```
src/                       ← UI 层（React + Tauri API 包装）
packages/
├── common/                ← 基础类型/工具,无副作用
│   ├── src/utils/         ← 纯函数（format-duration 等）
│   ├── src/hooks/         ← 可复用 React Hooks
│   └── src/motion/        ← 动画工具
├── core/                  ← 领域核心层（无 UI 依赖）
│   ├── pipeline/          ← 10 步 Pipeline 引擎
│   ├── autonomous/        ← 自主编排层
│   │   ├── evaluator/     ← QualityGate / SelfReviewLoop
│   │   ├── types/         ← PipelineCheckpoint / StepState 等
│   │   └── prompts/       ← AI 提示词模板
│   └── types/             ← 跨域共享类型
└── shared/                ← 跨域共享层（UI 组件、Stores、Services）
```

依赖方向**唯一**:

```
packages/common ──▶  无依赖（基础）
packages/core   ──▶  common
src/            ──▶  core + common + @tauri-apps/*
src-tauri/      ──▶  独立 Rust 编译,不依赖任何 JS
```

## 关键约束

| 维度 | 阈值 | 检测方式 |
|------|------|----------|
| TS/TSX 文件 | ≤ 400 行 | `find src packages -name "*.ts*" -exec wc -l {} +` |
| Rust 文件 | ≤ 500 行 | `find src-tauri -name "*.rs" -exec wc -l {} +` |
| 函数体 | ≤ 40 行 | ESLint `max-lines-per-function` |
| 组件 Props | ≤ 10 个 | ESLint `@typescript-eslint/max-params` |
| Zustand Store | ≤ 5 个全局 | `src/shared/stores/index.ts` 强约束 |

## 实施路径

### Phase 2: core/services/ 重组（已完成）

48+ 平铺文件 → 6 个子目录:

- `ai/text/` 8 个
- `ai/image/` 7 个（含 4 个 provider adapters）
- `video/` 9 个
- `audio/` 3 个
- `pipeline/` 3 个
- `project/` 6 个
- `domain/` 4 个

每个迁移文件**保留原路径 shim**（`re-export from './domain/xxx'`），无破坏性变更。

### Phase 6: Store 收敛（已完成）

- 删除 `legacy.store.ts`（字段迁移至 `project.store.ts`）
- `video-editor.store.ts` 降级为 `features/editor/stores/`
- `user.store.ts` 降级为 `features/project/stores/`
- `cost.store.ts` 归入 `pipeline.store.ts` slice

最终 5 个全局 Store：`app / project / pipeline / notification / settings`。

### Phase 5: 品牌升级（已完成）

- 包名 `panel-flow` → `frame-fab` → `frame-fab`
- `package.json` / `Cargo.toml` / `tauri.conf.json` 名称统一
- 描述中文化（v2.2.0 commit `537bacf`）

## 后果

### 正面

- **依赖方向清晰**——编译期阻止循环依赖（`dpdm` 0 cycles）
- **单元测试提速**——`packages/core` 可脱离 React 测试运行
- **核心逻辑可移植**——Pipeline 引擎未来可用于 CLI 工具 / 服务端
- **新人上手时间 -40%**——明确目录即明确职责

### 负面

- **跨包 import 路径长**（`@frame-fab/common/hooks`）
- **包版本同步成本**——pnpm workspace 升级需要批量 bump
- **IDE 跳转偶尔跨包慢**——大 monorepo 的通病

### 中和

- `tsconfig.json` 配置 `paths` 别名（`@frame-fab/common/*`）
- 关键导出提供 `PUBLIC_API.md`（每个 `packages/` 下维护）
- Barrel export 限制 `index.ts` 仅 export 语句,禁止逻辑混入

## 备选方案

### 备选 1: 继续平铺（不重组）

- **优点**: 改动小
- **缺点**: `core/services/` 已 48+ 文件,新文件无法定位归属,新人 onboarding 成本高
- **结论**: 否决

### 备选 2: 完整 Nx / Turborepo

- **优点**: 缓存/并行构建,大型项目友好
- **缺点**: 团队对 Nx 不熟,引入成本高
- **结论**: 暂缓,等 10 万行级别再考虑

## 参考

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Domain-Driven Design 思想](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- 项目内部: `src/core/pipeline/index.ts`, `packages/core/autonomous/index.ts`
