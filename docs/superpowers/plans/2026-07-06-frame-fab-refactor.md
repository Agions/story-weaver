# Story Weaver 全面重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 Windows 11 24H2 兼容性问题，清理死代码，重构 Pipeline Step 样板，统一架构接口，精简冗余代码

**Architecture:** 基于现有 Clean Architecture 分层（app → core → infrastructure），仅做微调：统一两套 PipelineStep 接口定义来源、提取 CheckpointManager 封装检查点策略、创建 BasePipelineStep 基类消除 6 个 step 的样板重复。不引入新抽象层，不拆 PipelineEngine。

**Tech Stack:** React 18 + TypeScript 5 + Tauri 2 + Zustand + Jest

## Global Constraints

- 保持所有现有测试通过，每步修改后运行 `pnpm test --runInBand` 验证
- 不改变任何公开 API 的签名（删除的 dead code 除外）
- 保持 `tauriService` 作为统一入口，不改变其导出路径
- 所有改动必须能在 macOS 上正常 `pnpm dev` 运行
- 命名规范：.ts 文件 kebab-case，.tsx 组件文件 PascalCase（React 标准约定）

---

## File Structure

```
src/
├── app/
│   ├── index.tsx                                  [修改] 添加运行时依赖检测调用
│   └── router/
│       └── page-preload.ts                        [修改] 删除 scriptDetail 死代码
├── core/
│   ├── pipeline/
│   │   ├── base-pipeline-step.ts                  [新建] BasePipelineStep 抽象基类
│   │   ├── step-helpers.ts                        [修改] 保持不变（createSuccessStepResult 供 step-render 使用）
│   │   ├── step.interface.ts                      [修改] PipelineStep/StepInput/StepOutput 改为从 pipeline.types.ts re-export
│   │   ├── checkpoint-manager.ts                  [新建] 提取检查点策略类
│   │   ├── pipeline-engine.ts                     [修改] 使用 CheckpointManager，简化 getStatus
│   │   ├── step-import.ts                         [重写] 继承 BasePipelineStep
│   │   ├── step-analysis.ts                       [重写] 继承 BasePipelineStep
│   │   ├── step-script.ts                         [重写] 继承 BasePipelineStep
│   │   ├── step-storyboard.ts                     [重写] 继承 BasePipelineStep
│   │   ├── step-character.ts                      [重写] 继承 BasePipelineStep
│   │   ├── step-audio-synthesis.ts                [重写] 继承 BasePipelineStep
│   │   └── step-render.ts                         [修改] 继承 BasePipelineStep，override execute() 自定义 qualityGate
│   └── services/
│       └── project/
│           ├── export.service.ts                  [修改] 删除 PDF re-export
│           └── pdf-export.ts                      [删除] 死代码
├── infrastructure/
│   └── tauri-bridge/
│       ├── commands.ts                            [修改] 删除死方法，添加 analyzeVideo/extractKeyFrames
│       └── commands.types.ts                      [修改] 添加 AnalyzeVideoOptions 类型
├── features/
│   ├── video-export/
│   │   └── services/
│   │       ├── tauri.service.ts                   [删除] 死代码（0 引用方）
│   │       ├── tauri-video-commands.ts            [删除] 死代码（0 引用方）
│   │       └── tauri-export-events.ts             [删除] 死代码（0 引用方）
│   └── video/
│       └── components/
│           └── VideoSelector.tsx                  [修改] 替换 getVideoInfo → analyzeVideo
├── pages/
│   └── video-editor/
│       └── hooks/
│           └── useVideoEditor.ts                  [修改] 替换 getVideoInfo/generateThumbnails
└── __tests__/
    └── fixtures/
        └── index.ts                               [修改] 删除 createMockStepContext

src-tauri/src/
├── lib.rs                                          [修改] 添加 WebView2 检测
├── commands/
│   └── app.rs                                      [修改] 添加 check_runtime_dependencies 命令
```

> **命名说明:** 经核实，项目中 .ts 文件已统一使用 kebab-case，.tsx 组件文件使用 PascalCase（符合 React 标准约定）。无需文件重命名。

---

## Task 1: 修复 Issue #38 — Windows 11 24H2 兼容性

**目标:** 解决 Windows 11 24H2 上应用无反应的问题。根因：①缺少 WebView2 运行时检测导致静默失败；②前端调用 `getVideoInfo`/`generateThumbnails` 映射到不存在的 Rust 命令，导致 invoke 异常。

### Task 1.1: 后端添加 WebView2 检测 + 依赖检查命令

**Files:**

- Modify: `src-tauri/src/lib.rs:31-42`
- Modify: `src-tauri/src/commands/app.rs` (文件末尾追加)
- Modify: `src-tauri/src/commands/mod.rs` (确认已导出 `pub mod app;`)

**Step 1:** 修改 `lib.rs` 的 `.setup()` 添加 WebView2 检测

```rust
// src-tauri/src/lib.rs
// 将 .setup(|_app| { info!("应用程序初始化完成"); Ok(()) })
// 替换为：
.setup(|app| {
    info!("应用程序初始化完成");

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        match Command::new("reg").args(&[
            "query",
            "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
        ]).output() {
            Ok(output) if output.status.success() => {
                info!("WebView2 运行时已安装");
            }
            _ => {
                warn!("未检测到 WebView2 运行时，部分功能可能无法使用。请访问 https://developer.microsoft.com/en-us/microsoft-edge/webview2/ 安装");
            }
        }
    }

    Ok(())
})
```

**Step 2:** 在 `app.rs` 文件末尾添加 `check_runtime_dependencies` 命令

```rust
// src-tauri/src/commands/app.rs
// 在文件末尾追加（mod.rs 已有 pub mod app，自动导出）：

#[tauri::command]
pub fn check_runtime_dependencies() -> Result<std::collections::HashMap<String, serde_json::Value>, String> {
    use std::process::Command;
    let mut result = std::collections::HashMap::new();

    #[cfg(target_os = "windows")]
    {
        match Command::new("reg").args(&[
            "query",
            "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
        ]).output() {
            Ok(output) if output.status.success() => {
                result.insert("webview2_installed".to_string(), serde_json::Value::Bool(true));
            }
            _ => {
                result.insert("webview2_installed".to_string(), serde_json::Value::Bool(false));
                result.insert("webview2_install_url".to_string(), serde_json::Value::String(
                    "https://developer.microsoft.com/en-us/microsoft-edge/webview2/".to_string()
                ));
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        result.insert("webview2_installed".to_string(), serde_json::Value::Bool(true));
    }

    match Command::new("ffmpeg").arg("-version").output() {
        Ok(output) if output.status.success() => {
            let version_str = String::from_utf8_lossy(&output.stdout);
            result.insert("ffmpeg_installed".to_string(), serde_json::Value::Bool(true));
            result.insert("ffmpeg_version".to_string(), serde_json::Value::String(
                version_str.lines().next().unwrap_or("").to_string()
            ));
        }
        _ => {
            result.insert("ffmpeg_installed".to_string(), serde_json::Value::Bool(false));
        }
    }

    Ok(result)
}
```

**Step 3:** 在 `lib.rs` 的 `generate_handler!` 中注册新命令

```rust
// src-tauri/src/lib.rs
// 在 invoke_handler 列表末尾添加:
commands::app::check_runtime_dependencies,
```

**Step 4:** 前端添加 `checkRuntimeDependencies()` 方法

```typescript
// src/infrastructure/tauri-bridge/commands.ts
// 在 TauriService 类中，cleanTempFile 方法之后添加:

/**
 * 检查运行时依赖（WebView2 / FFmpeg）
 */
async checkRuntimeDependencies(): Promise<Record<string, unknown>> {
  return invoke('check_runtime_dependencies');
}
```

**Step 5:** 前端启动时调用依赖检测

```typescript
// src/app/index.tsx
// 在 initializeApp 函数中，logger.info('应用初始化...') 之后添加:

const deps = await tauriService.checkRuntimeDependencies();
if (deps.webview2_installed === false) {
  notify.warning({
    message: '运行时依赖缺失',
    description: 'WebView2 运行时未安装，请访问以下链接安装后重启应用',
    duration: 15000,
  });
}
```

- [ ] Run: `pnpm test --runInBand` — expect PASS
- [ ] Run: `pnpm tauri dev` on macOS — expect app launches normally

---

## Task 2: 死代码清理

### Task 2.1: 删除 pdf-export.ts 及其引用

**Files:**

- Delete: `src/core/services/project/pdf-export.ts`
- Modify: `src/core/services/project/export.service.ts:38`

```typescript
// export.service.ts — 删除第 38 行:
// export { exportAsPDF } from './pdf-export';
```

验证：`grep -rn "exportAsPDF\|pdf-export" src/ --include="*.ts" --include="*.tsx"` 应无结果（除删除的文件本身）。

### Task 2.2: 删除 feature 层 3 个死 Tauri 文件

**Files:**

- Delete: `src/features/video-export/services/tauri.service.ts`
- Delete: `src/features/video-export/services/tauri-video-commands.ts`
- Delete: `src/features/video-export/services/tauri-export-events.ts`

验证：`grep -rn "tauri.service\|tauri-video-commands\|tauri-export-events" src/ --include="*.ts" --include="*.tsx"` 应无结果（仅 commands.types.ts 中的 type re-export 保留，见 Task 3.1）。

### Task 2.3: 删除 commands.ts 中调用不存在 Rust 命令的死方法

**Files:**

- Modify: `src/infrastructure/tauri-bridge/commands.ts:357-372`

删除以下两个方法（Rust 侧未注册 `get_video_info` 和 `generate_thumbnails` 命令）：

```typescript
// 删除 357-372 行:
async getVideoInfo(path: string): Promise<{...}> { ... }
async generateThumbnails(path: string, count: number): Promise<string[]> { ... }
```

同时删除 `toExportProgress` 辅助函数（第 49-57 行），其逻辑将内联到 `onExportProgress`（见 Task 6）。

### Task 2.4: 删除 page-preload.ts 中的 scriptDetail 死代码

**Files:**

- Modify: `src/app/router/page-preload.ts`

删除第 8 行和第 19 行（`/script` 路由不存在于 `app/index.tsx`，此 importer 永远不被触发）：

```typescript
// 删除:
scriptDetail: () => import('@/pages/project-edit/ScriptDetailPage'),
// 和 routeImporterMap 中的:
{ prefix: '/script', importer: pageImporters.scriptDetail },
```

### Task 2.5: 删除测试 fixtures 中的死代码

**Files:**

- Modify: `src/__tests__/fixtures/index.ts`

删除 `createMockStepContext` 函数及其导出（文件注释已标注 0 消费者）。

- [ ] Run: `pnpm test --runInBand` — expect PASS

---

## Task 3: 修复断掉的 Rust 命令调用链

**目标:** `getVideoInfo` 和 `generateThumbnails` 调用了不存在的 Rust 命令，替换为已存在的 `analyze_video` 和 `extract_key_frames`。

### Task 3.1: 在 TauriService 中添加 analyzeVideo 和 extractKeyFrames

**Files:**

- Modify: `src/infrastructure/tauri-bridge/commands.ts` (在 `cleanTempFile` 方法之后添加)
- Modify: `src/infrastructure/tauri-bridge/commands.types.ts` (添加类型定义)

```typescript
// commands.ts — 在 cleanTempFile 方法之后添加:

/**
 * 分析视频文件获取元数据
 * 调用 Rust 端 analyze_video 命令
 */
async analyzeVideo(path: string): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}> {
  return invoke('analyze_video', { path });
}

/**
 * 提取关键帧
 * 调用 Rust 端 extract_key_frames 命令
 */
async extractKeyFrames(path: string, count: number): Promise<string[]> {
  return invoke<string[]>('extract_key_frames', { path, count });
}
```

```typescript
// commands.types.ts — 在文件末尾添加:

/** analyzeVideo 的参数类型 */
export type AnalyzeVideoOptions = {
  path: string;
};
```

### Task 3.2: 更新 VideoSelector.tsx

**Files:**

- Modify: `src/features/video/components/VideoSelector.tsx:72`

```typescript
// 将:
const videoMetadata = await tauriService.getVideoInfo(filePath);
// 改为:
const videoMetadata = await tauriService.analyzeVideo(filePath);
```

### Task 3.3: 更新 useVideoEditor.ts

**Files:**

- Modify: `src/pages/video-editor/hooks/useVideoEditor.ts:142,156`

```typescript
// 第 142 行:
const metadata = await tauriService.analyzeVideo(selected);

// 第 156 行:
const frames = await tauriService.extractKeyFrames(selected, frameCount);
```

- [ ] Run: `pnpm test --runInBand` — expect PASS

---

## Task 4: 架构微调 — PipelineStep 类型统一 + CheckpointManager 提取

### Task 4.1: 统一 PipelineStep 类型定义

**Files:**

- Modify: `src/core/pipeline/step.interface.ts`

当前 `step.interface.ts` 定义了与 `pipeline.types.ts` 同名的 `PipelineStep`/`StepInput`/`StepOutput`，但签名不同，造成混淆。

修改 `step.interface.ts`：将 `PipelineStep`/`StepInput`/`StepOutput` 改为从 `pipeline.types.ts` re-export，仅保留 `CheckpointState` 和 `PipelineOptions`（仅在此文件定义）：

```typescript
// src/core/pipeline/step.interface.ts

import type {
  PipelineStep as RichPipelineStep,
  StepInput as RichStepInput,
  StepOutput as RichStepOutput,
  PipelineStepId,
  PipelineExecutionMode,
  QualityGateDecision,
} from './pipeline.types';

// ========== 从 pipeline.types.ts re-export（统一接口定义来源） ==========

/** @deprecated 直接从 pipeline.types.ts 导入，避免双重定义 */
export type PipelineStep<S = unknown> = RichPipelineStep;
/** @deprecated 直接从 pipeline.types.ts 导入 */
export type StepInput = RichStepInput;
/** @deprecated 直接从 pipeline.types.ts 导入 */
export type StepOutput = RichStepOutput;

// ========== 仅在本文件定义 CheckpointState 和 PipelineOptions ==========

export interface CheckpointState<S = unknown> {
  stepId: string;
  completed: boolean;
  data: S;
  timestamp: number;
}

export interface PipelineOptions {
  onProgress?: (stepId: string, progress: number) => void;
  onComplete?: (output: StepOutput) => void;
  onError?: (stepId: string, error: Error) => void;
}
```

同时更新 `pipeline-engine.ts` 的导入，直接从 `pipeline.types.ts` 导入：

```typescript
// src/core/pipeline/pipeline-engine.ts
// 将:
import type { PipelineStep, StepInput, StepOutput } from './step.interface';
// 改为:
import type { PipelineStep, StepInput, StepOutput } from './pipeline.types';
```

并删除 re-export（不再需要）：

```typescript
// 删除:
export type { PipelineStep } from './step.interface';
```

在 `core/services/pipeline/pipeline.types.ts` 的 `PipelineContext` 定义处添加注释：

```typescript
// 注：此 PipelineContext 是 service 层简化版（无 variables/getCheckpoint/saveCheckpoint/emit）。
// core/pipeline/pipeline.types.ts 中的 PipelineContext 是完整版，含 Map 变量存储和检查点方法。
// 两层各司其职，不强行合并。
```

### Task 4.2: 提取 CheckpointManager

**Files:**

- Create: `src/core/pipeline/checkpoint-manager.ts`
- Modify: `src/core/pipeline/pipeline-engine.ts`

```typescript
// src/core/pipeline/checkpoint-manager.ts
import { saveCheckpoint, loadCheckpoint, hasCheckpoint } from './checkpoint';
import type { StepInput, StepOutput, PipelineStepId } from './pipeline.types';

/**
 * 检查点管理器 — 封装检查点策略（何时跳过/恢复/保存）
 *
 * 从 PipelineEngine.runInternal() 中提取，使引擎逻辑更清晰，
 * 同时让检查点策略可独立测试和替换。
 */
export class CheckpointManager {
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /** 检查步骤是否已完成（可直接跳过） */
  async shouldSkip(stepId: PipelineStepId): Promise<boolean> {
    if (!this.enabled) return false;
    return hasCheckpoint(stepId);
  }

  /** 恢复检查点数据（仅 resume 模式） */
  async restore(
    stepId: PipelineStepId,
    context: StepInput,
    isResume: boolean
  ): Promise<StepInput | null> {
    if (!this.enabled || !isResume) return null;
    const checkpoint = await loadCheckpoint(stepId);
    if (checkpoint?.completed) {
      return { ...context, ...(checkpoint.data as StepInput) };
    }
    return null;
  }

  /** 保存步骤结果到检查点 */
  async save(stepId: PipelineStepId, data: StepOutput): Promise<void> {
    if (!this.enabled) return;
    await saveCheckpoint(stepId, data);
  }
}
```

修改 `pipeline-engine.ts`：

```typescript
// src/core/pipeline/pipeline-engine.ts

import { CheckpointManager } from './checkpoint-manager';

export class PipelineEngine {
  private steps: PipelineStep[] = [];
  private options: PipelineEngineOptions;
  private status: PipelineStatus = PipelineStatus.IDLE;
  private eventHandler?: PipelineEngineEventHandler;
  private abortController: AbortController | null = null;
  private checkpointManager: CheckpointManager;

  constructor(options: PipelineEngineOptions = {}) {
    this.options = { enableCheckpoint: true, enableQualityGate: true, ...options };
    this.checkpointManager = new CheckpointManager(
      this.options.enableCheckpoint && !!this.options.workflowId
    );
  }

  // ... 其他方法不变 ...

  private async runInternal(input: StepInput, isResume: boolean): Promise<StepOutput> {
    let context: StepInput = { ...input };

    this.options.middlewares?.forEach((m) => m.onPipelineStart?.());

    try {
      for (const step of this.steps) {
        if (this.status === PipelineStatus.CANCELLED) throw new Error('Pipeline cancelled');
        while (this.status === PipelineStatus.PAUSED) {
          await delay(100);
        }

        this.options.middlewares?.forEach((m) => m.onStepStart?.(step.id, context));

        // 恢复检查点（仅 resume 模式）
        const restored = await this.checkpointManager.restore(step.id, context, isResume);
        if (restored) {
          context = restored;
          this.eventHandler?.onStepComplete?.(step.id, context);
          continue;
        }

        // 跳过已完成步骤
        if (await this.checkpointManager.shouldSkip(step.id)) {
          continue;
        }

        // 执行步骤
        try {
          this.eventHandler?.onStepStart?.(step.id);
          this.options.onProgress?.(step.id, 0);

          const result = await step.execute(context);
          context = { ...context, ...result };

          await this.checkpointManager.save(step.id, result);

          this.options.onProgress?.(step.id, 1);
          this.eventHandler?.onStepComplete?.(step.id, result);
          this.options.middlewares?.forEach((m) => m.onStepComplete?.(step.id, result));
        } catch (error) {
          this.options.onError?.(step.id, error as Error);
          this.eventHandler?.onStepFail?.(step.id, (error as Error).message);
          this.options.middlewares?.forEach((m) => m.onStepError?.(step.id, error as Error));
          throw error;
        }
      }

      this.status = PipelineStatus.COMPLETED;
      this.options.onComplete?.(context as StepOutput);
      this.options.middlewares?.forEach((m) => m.onPipelineComplete?.(context as StepOutput));
      logger.info('[PipelineEngine] Pipeline completed successfully');
      return context as StepOutput;
    } catch (error) {
      this.status = PipelineStatus.FAILED;
      this.eventHandler?.onStepFail?.('pipeline', (error as Error).message);
      this.options.middlewares?.forEach((m) => m.onPipelineError?.(error as Error));
      logger.error('[PipelineEngine] Pipeline failed:', error);
      throw error;
    }
  }
}
```

- [ ] Run: `pnpm test --runInBand` — expect PASS

---

## Task 5: 创建 BasePipelineStep 基类，重构 Step 文件

**目标:** 消除 6 个 step 文件中 ~200 行重复样板代码（构造器、try/catch、reportProgress 方法声明）。

### Task 5.1: 创建 BasePipelineStep 基类

**Files:**

- Create: `src/core/pipeline/base-pipeline-step.ts`

```typescript
import type {
  PipelineStep,
  StepInput,
  StepOutput,
  StepProgressEvent,
  RetryPolicy,
  PipelineStepId,
} from './pipeline.types';
import { PipelineExecutionMode } from './pipeline.types';
import {
  createFailedStepResult,
  createSuccessStepResult,
  reportStepProgress,
  DEFAULT_RETRY_POLICY,
} from './step-helpers';
import { logger } from '@/core/utils/logger';

/**
 * Pipeline Step 基类
 *
 * 子类只需实现 executeImpl() 和配置属性，无需重复：
 * - 统一构造器样板（id/name/stepId/mode/retryPolicy/onProgress/dependencies）
 * - 统一 execute()（耗时统计 + try/catch + 标准化 StepOutput）
 * - 统一 reportProgress()
 */
export abstract class BasePipelineStep implements PipelineStep {
  readonly id: string;
  readonly name: string;
  readonly stepId: PipelineStepId;
  readonly mode = PipelineExecutionMode.SEQUENCE;
  readonly retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY;
  readonly dependencies?: PipelineStepId[];
  readonly parallelKeys?: string[];
  onProgress?: (event: StepProgressEvent) => void;

  constructor(config?: Partial<PipelineStep>) {
    this.id = config?.id ?? '';
    this.name = config?.name ?? '';
    this.stepId = config?.stepId ?? ('' as PipelineStepId);
    this.mode = config?.mode ?? PipelineExecutionMode.SEQUENCE;
    this.retryPolicy = config?.retryPolicy ?? DEFAULT_RETRY_POLICY;
    this.dependencies = config?.dependencies;
    this.parallelKeys = config?.parallelKeys;
    this.onProgress = config?.onProgress;
  }

  async execute(input: StepInput): Promise<StepOutput> {
    const startTime = Date.now();
    try {
      const result = await this.executeImpl(input);
      return createSuccessStepResult(this.stepId, startTime, result, {
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[${this.name}] failed: ${msg}`);
      return createFailedStepResult(this.stepId, startTime, msg);
    }
  }

  protected reportProgress(progress: number, message: string): void {
    reportStepProgress(this.stepId, this.onProgress, progress, message);
  }

  /** 子类实现具体业务逻辑，返回步骤数据（自动包装为 StepOutput） */
  protected abstract executeImpl(input: StepInput): Promise<unknown>;
}
```

### Task 5.2-5.7: 重构 6 个 Step 文件

对每个文件应用相同模式。以 `step-import.ts` 为例：

**step-import.ts 改造前：** 211 行（含构造器、execute、try/catch、reportProgress、工厂函数）

**step-import.ts 改造后：**

```typescript
import { novelService } from '@/core/services/ai/text/novel.service';
import { logger } from '@/core/utils/logger';
import type { PipelineStepId, StepInput } from './pipeline.types';
import { PipelineExecutionMode } from './pipeline.types';
import { BasePipelineStep } from './base-pipeline-step';

export const IMPORT_STEP_CONFIG = {
  id: 'step-import',
  name: '导入与解析',
  stepId: PipelineStepId.IMPORT,
  mode: PipelineExecutionMode.SEQUENCE,
};

export interface ImportInput {
  rawContent: string;
  sourceType: 'novel' | 'script' | 'prompt';
  filename?: string;
  language?: 'zh' | 'en';
  [key: string]: unknown;
}

export interface ImportOutput {
  chapters: Array<{ id: string; title: string; content: string; wordCount: number }>;
  metadata: {
    title: string;
    author?: string;
    wordCount: number;
    chapterCount: number;
    language: string;
  };
  rawContent: string;
  [key: string]: unknown;
}

export class ImportStep extends BasePipelineStep {
  constructor(config?: Partial<PipelineStep>) {
    super(config);
    this.id = config?.id ?? IMPORT_STEP_CONFIG.id;
    this.name = config?.name ?? IMPORT_STEP_CONFIG.name;
    this.stepId = config?.stepId ?? PipelineStepId.IMPORT;
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = input.context;
    logger.info(`[ImportStep] Starting import for workflow ${input.workflowId}`);

    const importInput =
      (input.prevStepOutputs?.get(this.stepId)?.data as ImportInput) ??
      context.getVariable<ImportInput>('importInput');

    if (!importInput?.rawContent) throw new Error('No content to import');

    this.reportProgress(10, '正在识别内容格式...');

    const detectedType = this.detectContentType(importInput.rawContent);
    this.reportProgress(30, '正在解析内容结构...');

    let result: ImportOutput;
    if (importInput.sourceType === 'novel' || detectedType === 'novel') {
      const parseResult = await novelService.parseNovel(importInput.rawContent, {});
      result = {
        chapters: parseResult.chapters.map((ch, idx) => ({
          id: ch.id ?? `ch-${idx}`,
          title: ch.title || `第${idx + 1}章`,
          content: ch.content,
          wordCount: ch.wordCount,
        })),
        metadata: {
          title: parseResult.title || importInput.filename || '未命名',
          author: parseResult.author,
          wordCount: parseResult.totalWords,
          chapterCount: parseResult.chapters.length,
          language: importInput.language || 'zh',
        },
        rawContent: importInput.rawContent,
      };
    } else {
      result = {
        chapters: [
          {
            id: 'ch-1',
            title: importInput.filename || '内容',
            content: importInput.rawContent,
            wordCount: importInput.rawContent.length,
          },
        ],
        metadata: {
          title: importInput.filename || '未命名',
          wordCount: importInput.rawContent.length,
          chapterCount: 1,
          language: importInput.language || 'zh',
        },
        rawContent: importInput.rawContent,
      };
    }

    this.reportProgress(90, '解析完成');
    context.setVariable('chapters', result.chapters);
    context.setVariable('projectMetadata', result.metadata);
    context.setVariable('rawContent', result.rawContent);

    logger.success(`[ImportStep] Import completed: ${result.chapters.length} chapters`);
    return result;
  }

  private detectContentType(content: string): 'novel' | 'script' | 'prompt' {
    const trimmed = content.trim();
    if (/第[一二三四五六七八九十\d]+场|第\s*\d+\s*场/.test(trimmed)) return 'script';
    if (/^(\/|#)/.test(trimmed)) return 'prompt';
    return 'novel';
  }
}

export function createImportStep(config?: Partial<PipelineStep>): ImportStep {
  return new ImportStep(config);
}
export default ImportStep;
```

**各文件改造要点：**

| 文件                      | 特殊处理                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `step-import.ts`          | 标准改造（如上例）                                                                                                     |
| `step-analysis.ts`        | 标准改造；`dependencies = [PipelineStepId.IMPORT]` 移至构造函数                                                        |
| `step-script.ts`          | 保留 `ScriptStepConfig` 和 `ScriptOutput` 接口；构造器使用 `ScriptStepConfig` 类型                                     |
| `step-storyboard.ts`      | 标准改造                                                                                                               |
| `step-character.ts`       | 标准改造                                                                                                               |
| `step-audio-synthesis.ts` | 标准改造                                                                                                               |
| `step-render.ts`          | 继承 BasePipelineStep，**override `execute()`** 添加自定义 `qualityGate` 逻辑；`executeImpl()` 返回 `unknown` 数据对象 |

**step-render.ts 特殊处理：**

```typescript
export class RenderStep extends BasePipelineStep {
  readonly stepId = PipelineStepId.RENDER;
  readonly dependencies = [PipelineStepId.STORYBOARD];
  private batchSize = 4;

  constructor(config?: Partial<PipelineStep>) {
    super(config);
    this.batchSize = config?.parallelKeys?.length ? Math.min(config.parallelKeys.length, 4) : 4;
  }

  // Override execute 以添加自定义 qualityGate 逻辑
  async execute(input: StepInput): Promise<StepOutput> {
    const startTime = Date.now();
    try {
      const data = (await this.executeImpl(input)) as {
        renderedFrames: Array<{ frameId: string; imageUrl: string }>;
        failedFrames: string[];
        totalFrames: number;
        successRate: number;
      };

      return {
        stepId: this.stepId,
        status: StepStatus.COMPLETED,
        data,
        metrics: {
          durationMs: Date.now() - startTime,
          framesProcessed: data.totalFrames,
          qualityScore: data.successRate,
        },
        qualityGate: data.successRate >= 0.8 ? QualityGateDecision.PASS : QualityGateDecision.WARN,
        startTime,
        endTime: Date.now(),
        retryCount: 0,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[RenderStep] Render failed: ${msg}`);
      return createFailedStepResult(this.stepId, startTime, msg);
    }
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    // ... 现有的 execute 逻辑，但：
    // 1. 移除外层 try/catch（由 execute() 处理）
    // 2. 移除 createSuccessStepResult 调用，直接 return 数据对象
    // 3. 遇到错误时 throw 而非返回 failed 结果
    // ... （具体逻辑与原 step-render.ts 一致，仅移除样板）
  }
}
```

- [ ] After each file refactor: run `pnpm test --runInBand` — expect PASS
- [ ] Final: run `pnpm test --runInBand` — expect ALL PASS

---

## Task 6: 代码精简

### Task 6.1: 内联 toExportProgress

**Files:**

- Modify: `src/infrastructure/tauri-bridge/commands.ts:49-57,342-344`

删除 `toExportProgress` 函数，内联到 `onExportProgress` 回调中：

```typescript
// 删除 toExportProgress 函数（49-57 行）

// onExportProgress 方法改为:
async onExportProgress(callback: ExportProgressCallback): Promise<UnlistenFn> {
  return listen<ExportProgress>('export-progress', (event) => {
    const p = event.payload;
    callback({
      exportId: p.exportId,
      stage: p.stage as ExportProgress['stage'],
      progress: p.progress,
      message: p.message,
      error: p.error,
    });
  });
}
```

### Task 6.2: 简化 PipelineEngine.getStatus()

**Files:**

- Modify: `src/core/pipeline/pipeline-engine.ts:51-58`

当前 `getStatus()` 使用 `as unknown as PipelineContext` 类型断言。简化：

```typescript
// 将:
getStatus(): PipelineExecutionState {
  return {
    workflowId: this.options.workflowId ?? '',
    status: this.status,
    stepStates: new Map(),
    context: new Map() as unknown as PipelineContext,
  } as PipelineExecutionState;
}

// 改为:
getStatus(): PipelineExecutionState {
  return {
    workflowId: this.options.workflowId ?? '',
    status: this.status,
    stepStates: new Map(),
    context: { variables: new Map() } as PipelineContext,
  } as PipelineExecutionState;
}
```

> 注：此处仍需要 `as PipelineExecutionState` 断言，因为 `stepStates: Map<PipelineStepId, StepStatus>` 与接口定义的 `Map<PipelineStepId, StepStatus>` 一致，但 `context` 需要至少满足 `PipelineContext` 的最小结构。去掉双重 `as unknown as` 已是精简。

- [ ] Run: `pnpm test --runInBand` — expect PASS

---

## Task 7: 全量验证

```bash
# 1. 单元测试
pnpm test --runInBand

# 2. Lint 检查
pnpm run lint

# 3. TypeScript 类型检查
pnpm run build:check

# 4. Tauri 开发模式启动验证（macOS）
pnpm tauri dev
```

全部通过后，提交变更：

```bash
git add -A
git commit -m "refactor: 全面重构 — 修复 Win11 兼容性、清理死代码、统一 PipelineStep 接口、提取 BasePipelineStep、精简冗余代码

- fix: 添加 WebView2 运行时检测 + check_runtime_dependencies 命令
- fix: 替换不存在的 Rust 命令 getVideoInfo/generateThumbnails 为 analyzeVideo/extractKeyFrames
- refactor: 删除 pdf-export.ts 等 7 处死代码
- refactor: 统一 PipelineStep 类型定义来源（step.interface.ts re-export pipeline.types.ts）
- refactor: 提取 CheckpointManager 封装检查点策略
- refactor: 创建 BasePipelineStep 基类，6 个 step 文件减少 ~200 行样板
- refactor: 内联 toExportProgress，简化 PipelineEngine.getStatus()
- cleanup: 删除 scriptDetail 死路由、createMockStepContext 死函数"
```

---

## 验收标准

| 检查项                  | 标准                                                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 单元测试                | `pnpm test --runInBand` 全部 PASS                                                                                                                                                         |
| Lint                    | `pnpm run lint` 无 error                                                                                                                                                                  |
| 类型检查                | `pnpm run build:check` 无 error                                                                                                                                                           |
| 死代码                  | `grep -rn "pdf-export\|exportAsPDF\|tauri.service\|tauri-video-commands\|tauri-export-events\|scriptDetail\|createMockStepContext\|getVideoInfo\|generateThumbnails" src/` 无生产代码引用 |
| PipelineStep 定义       | 仅 `pipeline.types.ts` 一处定义，`step.interface.ts` 为 re-export                                                                                                                         |
| BasePipelineStep 覆盖率 | 6/7 step 文件继承 BasePipelineStep                                                                                                                                                        |
| 样板代码减少            | step-\*.ts 平均行数减少 ~30 行/文件                                                                                                                                                       |
