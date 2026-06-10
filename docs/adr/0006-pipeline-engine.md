---
title: ADR-0006 Pipeline Engine + Checkpoint
description: 10 步 Pipeline 引擎设计：异步步骤链 + Quality Gate + Self-Review Loop + 30s Checkpoint
category: adr
version: '>=2.4'
---

# ADR 0006: Pipeline Engine + Checkpoint 机制

## 状态

Accepted · 2025-08-15

## 背景

AI 漫剧生成是一个**长时、不可中断**的过程:

- 单部漫剧需要 10 步流水线 (脚本→分镜→角色→渲染→合成)
- 每步涉及多次 AI 调用,总耗时 30 分钟 - 数小时
- 应用可能崩溃、断网、用户切换设备

没有断点续传机制意味着:

- ❌ 任何中断都导致从头开始
- ❌ 单次 AI 调用失败 = 整个项目报废
- ❌ 算力成本浪费

## 评估的方案

### 方案 A: 无 Checkpoint,失败重跑

- ❌ 用户体验灾难
- ❌ 算力成本失控

### 方案 B: 完整状态序列化 (每步完成后落盘)

- ✅ 可靠
- ❌ 序列化所有中间结果,磁盘占用大
- ❌ 落盘频率难定 (太少则不准确,太多则性能开销)

### 方案 C: 增量 Checkpoint (只记录已完成步骤 + 中间状态引用)

- ✅ 可靠
- ✅ 磁盘占用可控
- ✅ 30s 间隔的自动保存,损失最多 30s 工作

## 决策

**采用方案 C**: PipelineEngine 内置 30s 增量 Checkpoint 机制。

### 核心设计

```typescript
// src/core/pipeline/engine.ts

export class PipelineEngine {
  private checkpointInterval = 30_000; // 30s
  private checkpointTimer?: number;

  async run(steps: Step[]): Promise<PipelineResult> {
    this.startCheckpointTimer();
    for (const step of steps) {
      await this.executeStep(step);
    }
    this.stopCheckpointTimer();
  }

  private startCheckpointTimer() {
    this.checkpointTimer = window.setInterval(() => {
      this.saveCheckpoint();
    }, this.checkpointInterval);
  }

  private async saveCheckpoint() {
    const state: PipelineCheckpoint = {
      currentStep: this.currentStep,
      stepStates: this.stepStates,
      projectSnapshot: await this.serializeProject(),
      timestamp: Date.now(),
    };
    await platform.fs.write(this.getCheckpointPath(), JSON.stringify(state));
  }
}
```

### Checkpoint 内容

```typescript
interface PipelineCheckpoint {
  pipelineId: string; // 唯一标识
  projectId: string;
  currentStep: number; // 当前执行到第几步
  totalSteps: number;
  stepStates: Record<number, StepState>; // 每步的状态
  projectSnapshot: {
    script?: Script;
    storyboards?: Storyboard[];
    characters?: Character[];
    renderedFrames?: Frame[];
  }; // 中间产物引用 (文件路径,非内联)
  timestamp: number;
}
```

## 理由

1. **可靠性** — 30s 间隔意味着最多丢失 30s 工作
2. **性能** — 序列化只引用文件路径,不内联大文件
3. **可恢复** — 应用启动时检查 Checkpoint,自动恢复
4. **可观测** — Checkpoint 时间戳帮助用户了解上次进度

## 后果

### ✅ 正面

- 应用崩溃/断网后可无缝恢复
- 单步 AI 调用失败可重试该步,无需重跑整个流水线
- 切换设备后可继续 (Checkpoint 是文件,可同步)

### ❌ 负面

- 30s 间隔丢失工作的风险
- Checkpoint 文件本身需要管理 (旧版清理)

### ⚠️ 风险

- Checkpoint 文件损坏导致无法恢复
- 多个流水线并发时 Checkpoint 路径冲突 (已通过 pipelineId 解决)

## 替代方案

**A**: 无 Checkpoint

- 拒绝: 体验灾难

**B**: 完整序列化

- 拒绝: 性能与磁盘占用不可接受

## 相关

- [Pipeline 引擎 API](/developer-guide/pipeline-api)
- [自审循环 (Self-Review Loop)](/developer-guide/autonomous-api)
