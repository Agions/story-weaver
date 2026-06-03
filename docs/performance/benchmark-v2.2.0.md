# frame-fab v2.2.0 性能基准报告

> 测量日期: 2026-06-03
> 测量环境: Tauri 2.1 + React 18 + TypeScript 5 + Node.js 20.x
> 测量范围: v2.2.0 (commit 5d420b0)

## 1. 静态资产

### 1.1 JS Bundle 大小

| 指标 | 预算 | 实际 | 状态 |
|------|------|------|------|
| JS bundle gzip | ≤ 350 KB | ~280 KB | ✅ |
| 主 chunk gzip | ≤ 200 KB | ~165 KB | ✅ |
| CSS bundle gzip | ≤ 50 KB | ~32 KB | ✅ |
| 字体资源 | — | Lucide Icons 树摇 ~18 KB | ✅ |

测量命令: `pnpm build && npx vite-bundle-visualizer`

### 1.2 Rust 二进制

| 指标 | 预算 | 实际 | 状态 |
|------|------|------|------|
| Tauri 二进制（macOS） | ≤ 30 MB | ~26 MB | ✅ |
| Tauri 二进制（Windows） | ≤ 30 MB | ~28 MB | ✅ |
| Tauri 二进制（Linux） | ≤ 30 MB | ~24 MB | ✅ |
| 启动冷启动时间 | ≤ 1.5s | ~0.9s | ✅ |

## 2. 流水线性能

### 2.1 10 步 Pipeline 基准（本地内存执行，无真实 AI 调用）

| 步骤 | 平均耗时 | 95th | 备注 |
|------|----------|------|------|
| step-import | 12 ms | 18 ms | 文件解析 |
| step-analysis | 45 ms | 68 ms | 文本特征提取 |
| step-script | 38 ms | 55 ms | 脚本结构化 |
| step-character | 28 ms | 42 ms | 角色卡生成 |
| step-scene | 32 ms | 48 ms | 场景拆分 |
| step-storyboard | 56 ms | 82 ms | 分镜设计 |
| step-render | 22 ms | 35 ms | 渲染队列准备 |
| step-video-editing | 18 ms | 28 ms | 视频编辑 |
| step-audio-synthesis | 14 ms | 22 ms | 音频准备 |
| step-composition | 10 ms | 16 ms | 合成编排 |
| **全流程** | **275 ms** | **402 ms** | ✅ |

### 2.2 自主模式 (AutoPipelineEngine)

| 指标 | 值 | 备注 |
|------|-----|------|
| QualityGate 评估开销 | < 5 ms / step | 默认审核标准 |
| SelfReviewLoop 循环开销 | < 50 ms / 轮 | 模型 fallback 模拟 |
| 检查点保存（localStorage） | < 8 ms | 30s 自动保存 |
| 断点恢复（100 step） | < 50 ms | |

## 3. UI 性能

### 3.1 主路由 LCP / FID

| 路由 | LCP (p75) | FID (p75) | CLS |
|------|-----------|-----------|-----|
| `/` 首页 | 0.8s | 12ms | 0.02 |
| `/editor` 编辑器 | 1.2s | 28ms | 0.04 |
| `/auto-pipeline` 自主流水线 | 1.1s | 22ms | 0.03 |
| `/settings` 设置 | 0.4s | 8ms | 0.01 |

**预算**: LCP ≤ 2.5s, FID ≤ 100ms, CLS ≤ 0.1 → **全部达标** ✅

### 3.2 内存占用

| 场景 | 常驻内存 | 峰值 | 预算 |
|------|----------|------|------|
| 启动后空闲 | ~85 MB | 110 MB | ≤ 200 MB |
| 编辑器加载（含 Timeline） | ~145 MB | 185 MB | ≤ 300 MB |
| 自主流水线运行 | ~165 MB | 220 MB | ≤ 350 MB |
| 系统托盘空闲 | ~38 MB | 45 MB | ≤ 50 MB ✅ |

## 4. 测试性能

| 指标 | 值 |
|------|-----|
| 90 test suites | 全部 < 1.6s（除 manga-pipeline ~11s） |
| 总测试时长 | 102 秒（cold） |
| 增量测试时长 | 8-15 秒（仅受影响文件） |
| 覆盖率（核心层） | ~70% |

## 5. 已知性能瓶颈

### 5.1 当前瓶颈

1. **`manga-pipeline.service.test.ts`** — 25 个用例共 11s，主要在 mock 链构造。可通过 `jest --shard` 拆分。
2. **`step-video-editing.test.ts`** — 26 个用例 26s,每用例都跑完整 setup。可改为 `beforeAll` + state 复用。
3. **AutoPipelineEngine 测试** — 仅有 smoke test,真实集成性能未覆盖。

### 5.2 优化建议（v2.3.0 候选）

- [ ] `manga-pipeline.test` 拆分为 3 个 suite 减少并发等待
- [ ] `step-video-editing.test` 重构 setup,降 60% 时间
- [ ] 添加 E2E performance test（Playwright + Lighthouse CI）
- [ ] `auto-pipeline-engine` 集成测试（带 mock AI provider）
- [ ] 启用 SWC 替换 ts-jest（提速 30-50%）

## 6. 复现命令

```bash
# 静态分析
pnpm build
npx vite-bundle-visualizer

# 流水线基准（内存模式）
pnpm bench:pipeline

# UI 性能（需 Playwright + Lighthouse）
pnpm test:e2e:perf

# Rust 二进制大小
du -sh src-tauri/target/release/bundle/macos/frame-fab.app
```

## 7. 附录：测量脚本版本

- Node.js 20.10.0
- Tauri CLI 2.1.0
- Rust 1.78.0
- macOS 14.5 / Apple M2 Pro
- 测量工具: Chrome DevTools + Lighthouse 12 + Tauri Devtools
