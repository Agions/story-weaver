---
title: Pipeline 引擎 API
description: Story Weaver 10 步 Pipeline 引擎 API：PipelineStepId 枚举、StepChain 接口、AsyncStepChain、StepChainBuilder、检查点恢复
category: developer-guide
version: '>=3.0'
---

# Pipeline 引擎 API

> Story Weaver v2.2.3 的 Pipeline 引擎**对外 API**——10 步编排、StepChain 接口、Checkpoint 恢复。

## 一、核心类型

### 1.1 PipelineStepId（10 步枚举）

```typescript
// src/core/pipeline/pipeline.types.ts
export enum PipelineStepId {
  IMPORT = 'import', // 1. 导入
  ANALYSIS = 'analysis', // 2. 分析（含场景识别）
  SCRIPT = 'script', // 3. 脚本
  CHARACTER = 'character', // 4. 角色
  STORYBOARD = 'storyboard', // 5. 分镜
  RENDER = 'render', // 6. 渲染
  VIDEO_EDITING = 'video-editing', // 7. 视频剪辑
  COMPOSITION = 'composition', // 8. 合成（含字幕）
  AUDIO_SYNTHESIS = 'audio-synthesis', // 9. 配音
  EXPORT = 'export', // 10. 导出
}
```

**步骤说明**：

| #   | ID              | 中文            | 主要调用                                            |
| --- | --------------- | --------------- | --------------------------------------------------- |
| 1   | IMPORT          | 导入            | `scriptImportService` / `novelService`              |
| 2   | ANALYSIS        | 分析 + 场景识别 | `novelAnalyzer` / `storyAnalysisService`            |
| 3   | SCRIPT          | 脚本生成        | `aiService`                                         |
| 4   | CHARACTER       | 角色设定        | `characterService`                                  |
| 5   | STORYBOARD      | 分镜设计        | `storyboardService` + `imageGenerationService`      |
| 6   | RENDER          | 关键帧渲染      | `imageGenerationService` / `videoGenerationService` |
| 7   | VIDEO_EDITING   | 视频剪辑        | `videoCompositorService`                            |
| 8   | COMPOSITION     | 合成 + 字幕     | `videoCompositorService` + `subtitleService`        |
| 9   | AUDIO_SYNTHESIS | 配音            | `ttsService` + `lipSyncService`                     |
| 10  | EXPORT          | 导出 MP4        | `videoCompositorService` + FFmpeg                   |

> 💡 v2.2.3 把 **scene 识别合并到 analysis**，把 **subtitle 嵌入合并到 composition**，因此核心代码只枚举 10 步（不重复）。

### 1.2 StepChain（步骤链接口）

```typescript
interface StepChain {
  id: string;
  stepId: PipelineStepId;
  name: string;
  phase: StepPhase; // PRE | EXEC | POST
  direction: ChainDirection; // FORWARD | BRANCH | ROLLBACK

  /** 前置校验（可选）：true 继续，false 跳过，throw 中断 */
  preCondition?: PreCondition;

  /** 主执行器（必需） */
  executor: StepExecutor;

  /** 后置处理器（可选）：无论成功/失败都调用 */
  postHandler?: PostHandler;

  /** 条件分支选择器（DAG 模式） */
  branchSelector?: BranchSelector;

  /** 并行分组键（用于 PARALLEL 模式） */
  parallelKeys?: string[];

  /** 最大重试次数（默认 0） */
  maxRetries: number;

  /** 重试间隔（ms，默认 1000） */
  retryDelayMs: number;
}
```

### 1.3 AsyncStepChain（异步实现）

```typescript
class AsyncStepChain implements StepChain {
  // 链式组合
  setNext(step: StepChain): this;
  addBranch(branchId: string, step: StepChain): this;
  setRollback(step: StepChain): this;

  // 执行完整三阶段链路
  execute(input: StepInput, context: StepChainContext): Promise<StepResult>;

  // 从现有 PipelineStep 适配为 StepChain（向后兼容）
  static fromPipelineStep(step: PipelineStep, phase?: StepPhase): AsyncStepChain;
}
```

### 1.4 StepChainBuilder（Fluent API）

```typescript
const chain = new StepChainBuilder()
  .id('import')
  .stepId(PipelineStepId.IMPORT)
  .name('导入阶段')
  .phase(StepPhase.EXEC)
  .preCondition(async (input) => !!input.url)
  .executor(async (input, ctx) => {
    const result = await doImport(input);
    return { imported: result };
  })
  .postHandler(async (result) => {
    metrics.record('import', result.durationMs);
  })
  .maxRetries(2)
  .retryDelayMs(1000)
  .build();
```

### 1.5 辅助类型

```typescript
enum StepPhase {
  PRE = 'pre', // 前置校验
  EXEC = 'exec', // 主执行
  POST = 'post', // 后置处理
}

enum PipelineExecutionMode {
  SEQUENCE = 'sequence', // 严格顺序
  PARALLEL = 'parallel', // 全部并行
  DAG = 'dag', // 有向无环图（条件分支）
  LOOP = 'loop', // 循环（批量场景）
}

interface StepChainContext {
  workflowId: string;
  stepId: string;
  engine?: {
    pause: () => boolean;
    cancel: () => void;
    getStatus: () => unknown;
  };
  metrics: {
    startTime: number;
    preDurationMs: number;
    execDurationMs: number;
    postDurationMs: number;
    retryCount: number;
  };
  shared: Map<string, unknown>;
}

interface StepResult {
  stepId: string;
  phase: StepPhase;
  status: StepStatus; // PENDING | RUNNING | COMPLETED | FAILED | SKIPPED | RETRYING
  output: StepOutput;
  durationMs: number;
  error?: string;
}
```

## 二、执行流程

```
输入 StepInput
    ↓
[PRE PHASE]
  preCondition(input) → true   继续
                      → false  返回 { status: 'skipped' }
                      → throw  返回 { status: 'failed', error: ... }
    ↓
[EXEC PHASE]  (带重试)
  for attempt in 0..maxRetries:
    executor(input, context) → 成功 break
                            → 失败 wait(retryDelay * 2^attempt) 重试
    ↓
  状态 = 'completed' | 'failed'
    ↓
[POST PHASE]  (无论成功/失败都执行)
  postHandler(result, input)
    ↓
[ROLLBACK PHASE]  (仅在 EXEC 失败时执行)
  rollbackStep.execute(input, context)
    ↓
返回 StepResult
```

## 三、Checkpoint 机制

### 3.1 数据结构

```typescript
interface PipelineCheckpoint {
  projectId: string;
  mode: 'autonomous' | 'manual';
  currentStep: PipelineStepId;
  progress: number; // 0-1
  steps: Record<string, StepState>; // 每步的中间结果
  reviewLoops: Record<string, number>;
  timestamp: number;
  version: string;
}
```

### 3.2 序列化与恢复

```typescript
// 写入
const checkpoint = await pipelineCheckpointService.save(state);

// 恢复
const restored = await pipelineCheckpointService.load(projectId);
await pipelineExecutor.resume(restored);
```

### 3.3 30s 自动保存

```typescript
pipelineEngine.on('step.completed', async (step) => {
  if (elapsedSince(checkpoint) > 30_000) {
    await saveCheckpoint();
  }
});
```

## 四、与 PipelineEngine 的关系

| 组件                 | 职责                                           |
| -------------------- | ---------------------------------------------- |
| **PipelineEngine**   | 整个流水线的生命周期（启动、暂停、恢复、取消） |
| **StepChain**        | 每个步骤的执行单元（三阶段）                   |
| **PipelineContext**  | 跨步骤数据传递                                 |
| **QualityGate**      | 每步质量评分（独立服务）                       |
| **Self-Review Loop** | 失败时自动修复 Prompt 重试                     |

**PipelineEngine** 可以直接运行 `StepChain`，也可以继续运行原有的 `PipelineStep`（两者通过 `execute()` 兼容）。

## 五、Pipeline 服务层 API

详见 [API - 流水线](../api/pipeline-service.md)：

- `pipelineService.run(options)` — 启动流水线
- `pipelineService.resume(projectId)` — 从 Checkpoint 恢复
- `pipelineService.onProgress(callback)` — 进度订阅
- `pipelineService.listCheckpoints()` — 列出可恢复项目

## 六、向后兼容

`AsyncStepChain.fromPipelineStep()` 允许将现有 `PipelineStep` 实现包装为 `StepChain`：

```typescript
const existingStep = createImportStep();
const chain = AsyncStepChain.fromPipelineStep(existingStep, StepPhase.EXEC);
chain.setNext(createAnalysisStepChain());
```

## 七、自定义步骤

添加新步骤的最小代价：

1. 在 `PipelineStepId` 枚举添加新值
2. 创建 `step-*.ts` 实现 `PipelineStep` 接口
3. 在 `pipeline-step-factories.ts` 添加工厂
4. 在 `pipelineService.run` 的默认步骤链中注册

详见 [架构设计 - 步骤扩展](./architecture.md#四核心模块)。

## 八、相关文档

- [API - 流水线](../api/pipeline-service.md) — 服务层 API
- [架构设计](./architecture.md#四核心模块) — Pipeline 引擎位置
- [Pipeline 服务源码](https://github.com/Agions/story-weaver/tree/main/src/core/pipeline)
