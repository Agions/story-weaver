---
title: 自主引擎 API
description: AutoPipelineEngine / QualityGate / SelfReviewLoop 本地服务 API：创建、事件订阅、Checkpoint 恢复
category: developer-guide
version: '>=3.0'
---

# 自主引擎 API

> Story Weaver **Autonomous 模式**的核心 API——`AutoPipelineEngine` + `QualityGate` + `SelfReviewLoop`。
> **本地服务接口**，**无 REST API**，**无 token 鉴权**——所有调用在进程内完成。

## 一、模块结构

> 代码位置：`src/core/autonomous/`

```
core/autonomous/
├── auto-pipeline-engine.ts      # 引擎主入口
├── pipeline-checkpoint.ts       # Checkpoint 序列化/恢复
├── pipeline-executor.ts         # 步骤执行器
├── pipeline-event-dispatcher.ts # 事件总线
├── pipeline-step-state.ts       # 步骤状态机
├── pipeline-types.ts            # 类型定义
├── evaluator/
│   ├── quality-gate.ts          # 质量门禁
│   └── self-review-loop.ts      # 自审循环
├── prompts/                     # Self-Review 提示词模板
├── types/                       # 领域类型
└── index.ts                     # 统一导出
```

**统一导入**：

```typescript
import {
  createAutoPipelineEngine,
  QualityGate,
  SelfReviewLoop,
  type AutoPipelineInput,
  type AutoPipelineResult,
  type AutoPipelineEvent,
} from '@/core/autonomous';
```

## 二、AutoPipelineEngine

### 2.1 创建实例

```typescript
import { createAutoPipelineEngine } from '@/core/autonomous';

const engine = createAutoPipelineEngine({
  maxReviewRetries: 3, // Self-Review 最大循环（默认 3）
  checkpointIntervalMs: 30_000, // Checkpoint 保存间隔（默认 30s）
  enableCheckpoint: true, // 启用断点续传（默认 true）
});
```

### 2.2 启动流水线

```typescript
const result = await engine.run({
  content: '从前有座山，山里有座庙...',
  mode: 'novel', // 'novel' | 'script' | 'prompt'
  style: 'anime', // '2d' | '3d' | 'anime' | 'realistic'
  qualityLevel: 'balanced', // 'fast' | 'balanced' | 'premium'
  title: '山与庙', // 可选
  options: {
    maxReviewLoops: 3,
    maxConcurrentRenders: 4,
    language: 'zh-CN',
    subtitle: {
      enabled: true,
      position: 'bottom', // 'bottom' | 'top'
    },
  },
});
```

### 2.3 事件订阅

```typescript
engine.onEvents({
  onStepStart: (stepId: PipelineStepId) => {
    console.log(`▶ 开始：${stepId}`);
  },
  onStepProgress: (stepId, progress, message) => {
    console.log(`  [${stepId}] ${progress}% ${message ?? ''}`);
  },
  onStepComplete: (stepId, output) => {
    console.log(`✅ 完成：${stepId}`);
  },
  onStepRetry: (stepId, attempt, reason) => {
    console.log(`🔄 重试：${stepId} 第 ${attempt} 次（${reason}）`);
  },
  onReviewLoop: (stepId, score, passed) => {
    console.log(`📊 自审：${stepId} 评分 ${score.toFixed(2)} ${passed ? '通过' : '不通过'}`);
  },
  onCheckpointSaved: (projectId, timestamp) => {
    console.log(`💾 Checkpoint 已保存：${projectId} @ ${new Date(timestamp).toISOString()}`);
  },
  onPipelineComplete: (result) => {
    console.log('🎉 完成！成片：', result.outputPath);
  },
  onPipelineFailed: (error) => {
    console.error('❌ 失败：', error);
  },
});
```

### 2.4 暂停 / 恢复 / 取消

```typescript
// 暂停
engine.pause();

// 恢复
engine.resume();

// 取消
engine.cancel();
```

### 2.5 Checkpoint 恢复

```typescript
// 列出所有可恢复项目
const resumable = await engine.listCheckpoints();
// [{ projectId, lastStep, savedAt, progress }]

// 恢复指定项目
const result = await engine.resumeFromCheckpoint('proj_abc123');
```

## 三、类型定义

### 3.1 AutoPipelineInput

```typescript
type InputMode = 'novel' | 'script' | 'prompt';
type OutputStyle = '2d' | '3d' | 'anime' | 'realistic';
type QualityLevel = 'fast' | 'balanced' | 'premium';

interface AutoPipelineInput {
  /** 原材料内容（小说/剧本/需求描述） */
  content: string;

  /** 输入模式 */
  mode: InputMode;

  /** 项目标题（可选） */
  title?: string;

  /** 输出风格（默认 anime） */
  style?: OutputStyle;

  /** 质量级别（默认 balanced） */
  qualityLevel?: QualityLevel;

  /** 高级选项 */
  options?: {
    /** 自审循环次数（默认 3） */
    maxReviewLoops?: number;

    /** 最大并行渲染数（默认 4） */
    maxConcurrentRenders?: number;

    /** 配音语言（默认 zh-CN） */
    language?: string;

    /** 字幕选项 */
    subtitle?: {
      enabled: boolean;
      position: 'bottom' | 'top';
    };
  };
}
```

### 3.2 AutoPipelineResult

```typescript
type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

interface AutoPipelineResult {
  projectId: string;
  status: PipelineStatus;
  outputPath: string; // 成片 MP4 路径
  outputUrl: string; // 浏览器可访问的 URL
  duration: number; // 视频时长（秒）
  totalSteps: number; // 总步数
  completedSteps: PipelineStepId[];
  failedSteps: PipelineStepId[];
  retryCount: Record<PipelineStepId, number>;
  cost: CostBreakdown; // 成本明细
  startedAt: number;
  completedAt: number;
  checkpointId?: string; // 用于恢复
}
```

### 3.3 AutoPipelineEvent

```typescript
interface AutoPipelineEventMap {
  onStepStart: (stepId: PipelineStepId) => void;
  onStepProgress: (stepId: PipelineStepId, progress: number, message?: string) => void;
  onStepComplete: (stepId: PipelineStepId, output: StepOutput) => void;
  onStepRetry: (stepId: PipelineStepId, attempt: number, reason: string) => void;
  onReviewLoop: (stepId: PipelineStepId, score: number, passed: boolean) => void;
  onCheckpointSaved: (projectId: string, timestamp: number) => void;
  onPipelineComplete: (result: AutoPipelineResult) => void;
  onPipelineFailed: (error: Error) => void;
}
```

## 四、QualityGate（质量门禁）

### 4.1 创建

```typescript
import { QualityGate } from '@/core/autonomous';

const gate = new QualityGate({
  thresholds: {
    completeness: 1.0, // 完整性（必填字段不缺）
    consistency: 0.85, // 角色一致性
    visualDetail: 0.8, // 画面感
    durationMatch: 0.9, // 时长匹配
    highlightDetection: 0.7, // 爆点检测（可选）
  },
  maxRetries: 3,
});
```

### 4.2 评估

```typescript
const result = await gate.evaluate(stepId, output);
// {
//   passed: true,
//   score: 0.92,
//   details: { completeness: 1.0, consistency: 0.88, ... },
//   repairPrompt?: string  // 不通过时给出修复提示
// }
```

## 五、SelfReviewLoop（自审循环）

### 5.1 创建

```typescript
import { SelfReviewLoop } from '@/core/autonomous';

const reviewer = new SelfReviewLoop({
  maxRetries: 3,
  backoffMs: 1000, // 重试间隔基数
  backoffMultiplier: 2, // 指数退避
});
```

### 5.2 完整自审流程

```typescript
const finalOutput = await reviewer.review(
  stepId, // 当前步骤
  originalOutput, // 步骤原始输出
  gate, // QualityGate 实例
  async (repairPrompt) => {
    // 使用修复 Prompt 重新生成
    return await regenerateWithPrompt(repairPrompt);
  }
);

// 如果 3 次仍不通过，返回 best-of-three
```

## 六、Checkpoint 机制

### 6.1 数据结构

```typescript
interface PipelineCheckpoint {
  projectId: string;
  mode: 'autonomous' | 'manual';
  currentStep: PipelineStepId;
  progress: number;
  steps: Record<PipelineStepId, StepState>;
  reviewLoops: Record<PipelineStepId, number>;
  timestamp: number;
  version: string;
}
```

### 6.2 存储位置

- **桌面端**：Tauri SecureStorage（OS Keychain 加密）
- **Web 端**：localStorage（明文，建议定期清理）

### 6.3 30s 自动保存

```typescript
engine.onEvents({
  onCheckpointSaved: (projectId, timestamp) => {
    // 通知 UI：显示绿色"已保存"提示
  },
});
```

## 七、配置项

```typescript
interface AutoPipelineConfig {
  /** Self-Review 最大循环（默认 3） */
  maxReviewRetries?: number;

  /** Checkpoint 保存间隔（默认 30s） */
  checkpointIntervalMs?: number;

  /** 启用断点续传（默认 true） */
  enableCheckpoint?: boolean;

  /** 启用详细日志（默认 false） */
  verboseLogging?: boolean;

  /** 启动时清理旧 Checkpoint（默认 7 天前） */
  checkpointRetentionDays?: number;
}
```

## 八、错误处理

| 错误类型                   | 触发场景            | 推荐处理                          |
| -------------------------- | ------------------- | --------------------------------- |
| `AIProviderError`          | AI 模型调用失败     | 自动降级 / 通知用户               |
| `CheckpointCorruptedError` | Checkpoint 损坏     | 提示从最近有效 Checkpoint 恢复    |
| `StepTimeoutError`         | 步骤超时            | 重试或跳过                        |
| `QualityGateFailedError`   | 质量门禁 3 次不通过 | 记录日志 + 继续后续步骤（不阻塞） |

```typescript
try {
  const result = await engine.run(input);
} catch (err) {
  if (err instanceof CheckpointCorruptedError) {
    const recovered = await engine.repairCheckpoint(err.projectId);
  }
}
```

## 九、与服务层集成

`AutoPipelineEngine` 调用下层服务（`@/core/services`）完成实际工作：

| 步骤            | 主要调用                                       |
| --------------- | ---------------------------------------------- |
| IMPORT          | `scriptImportService` / `novelService`         |
| ANALYSIS        | `novelAnalyzer` / `storyAnalysisService`       |
| SCRIPT          | `aiService.generate()`                         |
| CHARACTER       | `characterService`                             |
| STORYBOARD      | `storyboardService` + `imageGenerationService` |
| RENDER          | `imageGenerationService`                       |
| VIDEO_EDITING   | `videoCompositorService`                       |
| COMPOSITION     | `videoCompositorService` + `subtitleService`   |
| AUDIO_SYNTHESIS | `ttsService` + `lipSyncService`                |
| EXPORT          | `videoCompositorService` + FFmpeg              |

详见 [服务清单](./services.md) 和 [API 文档](../api/)。

## 十、相关文档

- [API - 流水线](../api/pipeline-service.md) — 服务层 API
- [架构设计 - core/autonomous](./architecture.md#四核心模块) — 模块位置
- [Pipeline 引擎 API](./pipeline-api.md) — 步骤链细节
