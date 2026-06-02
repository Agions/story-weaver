# 架构设计

> 本文档详细介绍 FrameForge 的系统架构、核心模块设计与数据流。

---

## 一、系统概述

FrameForge 是一款基于大语言模型的**全自主 Agent 型**漫剧制作系统。用户只需提供原始文本（小说/剧本/需求描述），AI 将自主完成从剧本解析到成片输出的全部环节。

### 1.1 核心设计目标

1. **零参与**：用户仅需提供原材料，全程无需人工干预
2. **自审机制**：每步 AI 自审，不合格自动修复
3. **质量保障**：Quality Gate 全自动质量门禁
4. **断点续传**：支持中途暂停、刷新继续

### 1.2 架构演进

**现有架构（半自动工具型）**：

```
用户 → 导入 → AI分析(需确认) → 脚本生成(需编辑) → 分镜(需调整)
     → 角色设计(需审核) → 批量渲染(需等待) → 合成导出(需操作)
```

**目标架构（全自主 Agent 型）**：

```
用户（提供纯文本） → AutoPipeline（无人值守）
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   剧本解析 Agent      角色生成 Agent      分镜生成 Agent
        │                   │                   │
        └──────────┬─────────┴─────────┴──────────┘
                   ▼
           自主审核循环（Self-Review Loop）
                   │ 不合格
                   ▼ 重做该步骤
           视频合成 Agent
                   │
                   ▼
           Quality Gate（全检）
                   │ 不合格
                   ▼ 自动返工
           📤 成片输出
```

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         FrameForge 系统架构                        │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐      ┌──────────────────────────────────────┐
  │   User UI    │      │           core/                        │
  │              │      │  ┌─────────────────────────────────┐  │
  │ ┌──────────┐ │      │  │     autonomous/                 │  │
  │ │AutoPipeline│ │◀────│  │  ┌─────────────────────────┐   │  │
  │ │ Wizard   │ │      │  │  │ AutoPipelineEngine      │   │  │
  │ └──────────┘ │      │  │  ├─────────────────────────┤   │  │
  │ ┌──────────┐ │      │  │  │ SelfReviewLoop           │   │  │
  │ │Progress  │ │      │  │  ├─────────────────────────┤   │  │
  │ │Panel     │ │      │  │  │ QualityGate              │   │  │
  │ └──────────┘ │      │  │  ├─────────────────────────┤   │  │
  │ ┌──────────┐ │      │  │  │ autonomous.types.ts     │   │  │
  │ │AIBriefing│ │      │  │  └─────────────────────────┘   │  │
  │ │Panel     │ │      │  └─────────────────────────────────┘  │
  │ └──────────┘ │      │                                      │
  └──────────────┘      │  ┌─────────────────────────────────┐  │
                        │  │         pipeline/                │  │
                        │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│  │
                        │  │  │Import│ │Script│ │Char │ │Story││  │
                        │  │  └─────┘ └─────┘ └─────┘ └─────┘│  │
                        │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│  │
                        │  │  │Scene│ │Render│ │Audio│ │Export││  │
                        │  │  └─────┘ └─────┘ └─────┘ └─────┘│  │
                        │  └─────────────────────────────────┘  │
                        └──────────────────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────┐
                        │    features/            │
                        │  ┌─────────────────┐   │
                        │  │ auto-pipeline/   │   │
                        │  │  components/     │   │
                        │  │  hooks/          │   │
                        │  │  stores/         │   │
                        │  │  services/       │   │
                        │  └─────────────────┘   │
                        │  ┌─────────────────┐   │
                        │  │ manga-pipeline/ │   │
                        │  └─────────────────┘   │
                        └─────────────────────────┘
```

---

## 三、核心模块详解

### 3.1 `core/autonomous/` — 全自主编排引擎

#### 3.1.1 AutoPipelineEngine

全自动流水线引擎，是整个自主模式的核心入口。

```typescript
// 输入：原材料（小说/剧本/需求描述）
// 输出：成片文件路径
class AutoPipelineEngine {
  async run(input: {
    content: string;
    mode: 'novel' | 'script' | 'prompt';
    title?: string;
    style?: '2d' | '3d' | 'anime' | 'realistic';
    qualityLevel?: 'fast' | 'balanced' | 'premium';
  }): Promise<AutoPipelineResult>;
}
```

**执行流程（11 步）**：

| 步骤 | 名称           | 说明                                  |
| ---- | -------------- | ------------------------------------- |
| 1    | ImportStep     | 解析原材料，章节切分                  |
| 2    | AnalysisStep   | AI 分析故事结构、人物、场景（带自审） |
| 3    | ScriptStep     | 生成结构化视频剧本（带自审）          |
| 4    | CharacterStep  | 创建角色设定卡，保证一致性（带自审）  |
| 5    | SceneStep      | 场景规划（新增）                      |
| 6    | StoryboardStep | 生成分镜脚本 + 参考图（带自审）       |
| 7    | RenderStep     | 批量渲染关键帧                        |
| 8    | VideoEditStep  | 视频剪辑 + 转场（新增）               |
| 9    | AudioStep      | 配音 + 音效 + 唇形同步                |
| 10   | SubtitleStep   | 字幕生成 + 嵌入                       |
| 11   | ExportStep     | 输出 MP4/WebM                         |

#### 3.1.2 SelfReviewLoop（核心创新）

自审循环是本次重构的核心创新：

```
[Step N 输出] → QualityGate 判定
                     │
            ┌────────┴────────┐
            │                 │
         PASS              FAIL
            │                 │
            ▼           [返回 Step N]
       下一 步         自动修复 Prompt
                           │
                           ▼
                      重新执行 Step N
```

**审核维度**：

| 维度         | 判定标准                               |
| ------------ | -------------------------------------- |
| **完整性**   | 输出是否包含所有必要字段/元素？        |
| **一致性**   | 人物描写、场景描述前后是否矛盾？       |
| **画面感**   | 描述是否具备足够的视觉细节供 AI 生图？ |
| **时长匹配** | 对话/场景时长是否与内容体量匹配？      |
| **爆点检测** | 是否包含情绪爆点、转折、高潮？         |

**修复 Prompt 模板**：

```typescript
const REPAIR_PROMPT_TEMPLATE = `请审查以下 AI 生成的 {stepName} 输出：

【原输出】
{originalOutput}

【审核结果】
{reviewResult}

【不合格原因】
{fallbackReasons}

请根据以上反馈，重新生成符合以下要求的 {stepName} 输出：
1. 修复所有不合格项
2. 保持与上下文的连贯性
3. 输出格式保持不变

直接输出修复后的 JSON，不要解释。`;
```

**循环上限**：每个 Step 最多自审 3 次，3 次仍不通过则：

- 记录详细日志
- 降级到"人工审核"模式（发送通知）
- 继续执行后续步骤（不阻塞）

#### 3.1.3 QualityGate

质量门禁，负责自动判定每步输出是否合格。

```typescript
interface QualityGateConfig {
  stepId: string;
  reviewCriteria: ReviewCriteria;
  repairPrompt: string;
  maxRetries: number; // 默认 3
}

interface ReviewCriteria {
  completeness?: boolean; // 完整性
  consistency?: boolean; // 一致性
  visualDetail?: boolean; // 画面感
  durationMatch?: boolean; // 时长匹配
  highlightDetection?: boolean; // 爆点检测
}
```

### 3.2 `core/pipeline/` — 流水线步骤

每个 Step 都是独立的工作单元，具备以下特性：

- **输入**：上一步的输出
- **处理**：调用 AI 模型或执行特定逻辑
- **输出**：结构化数据供下一步使用
- **自审支持**：可配置 QualityGate 审核

#### 新增步骤

| 文件                 | 功能                             |
| -------------------- | -------------------------------- |
| `step-scene.ts`      | 场景规划，整合场景描述与视觉风格 |
| `step-video-edit.ts` | 视频剪辑，处理转场、特效合成     |
| `step-review.ts`     | 自审步骤，封装通用自审逻辑       |

### 3.3 `features/auto-pipeline/` — 用户交互界面

#### 核心组件

| 组件                     | 功能                                    |
| ------------------------ | --------------------------------------- |
| `AutoPipelineWizard.tsx` | 一步式启动向导，用户只需提交原材料      |
| `AutonomousProgress.tsx` | 全局进度展示，实时显示当前步骤          |
| `AIBriefingPanel.tsx`    | AI 任务简报，展示 AI 正在做什么、为什么 |
| `FinalPreview.tsx`       | 成片预览与下载                          |

#### Hooks

| Hook                   | 功能                   |
| ---------------------- | ---------------------- |
| `useAutoPipeline.ts`   | 自主流水线核心状态管理 |
| `useSelfReviewLoop.ts` | 自审循环状态管理       |

#### Store (Zustand)

```typescript
interface AutoPipelineState {
  mode: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep: string;
  progress: number; // 0-100
  steps: Record<string, StepState>;
  reviewLoops: Record<string, number>; // 每步自审次数
  results: PipelineResults;
  error?: string;
}
```

---

## 四、数据流设计

### 4.1 检查点（Checkpoint）

每个 Step 完成时自动保存检查点：

```typescript
interface StepCheckpoint {
  stepId: string;
  completed: boolean;
  data: StepOutput;
  reviewCount: number;
  timestamp: number;
  retryIndex: number;
}
```

**存储策略**：

- localStorage：前端状态
- IndexedDB：大文件/二进制数据
- 支持刷新页面后继续执行

### 4.2 状态流转

```
idle → running → (paused)? → completed
                ↓
              failed
                ↓
         (可恢复至 running)
```

---

## 五、AI 模型集成

### 5.1 各步骤模型推荐

| 步骤     | 推荐模型（按优先级）                       |
| -------- | ------------------------------------------ |
| 剧本解析 | GLM-5 / M2.5 / Kimi K2.5                   |
| 故事分析 | Doubao 2.0 / ERNIE 4.0                     |
| 脚本生成 | GLM-5 / M2.5                               |
| 角色设定 | Seedream 5.0（参考图）                     |
| 分镜生成 | Seedream 5.0 / Kling 1.6                   |
| 图像渲染 | Seedream 5.0（推荐）/ Kling 1.6 / Vidu 2.0 |
| 视频合成 | FFmpeg WASM + 关键帧                       |
| 配音     | Edge TTS（免费）/ CosyVoice 2.0            |
| 唇形同步 | Wav2Lip API / 第三方                       |
| 字幕     | 内置 OCR + 时间轴对齐                      |

### 5.2 降级链路

```
Seedream 5.0 → Kling 1.6 → Vidu 2.0 → Stable Diffusion API
Edge TTS → CosyVoice 2.0 → 百度 TTS
```

---

## 六、Quality Gate 标准

| Step       | 通过条件                        | 不通过处理       |
| ---------- | ------------------------------- | ---------------- |
| Import     | 章节数 ≥ 1，字数 > 100          | 提示用户检查输入 |
| Analysis   | 人物 ≥ 1，场景 ≥ 1              | 自动补充默认值   |
| Script     | 场景数 ≥ 3，时长 5-30min        | 自审循环重做     |
| Character  | 角色图 ≥ 1张/角色，一致性 > 70% | 自审循环重做     |
| Storyboard | 分镜数 ≥ 脚本场景数             | 自审循环重做     |
| Render     | 成功率 > 80%                    | 自动重抽失败的帧 |
| VideoEdit  | 片段数 = 分镜数                 | 自动补间         |
| Audio      | 时长偏差 < 5%                   | 自动重新生成     |
| Export     | 文件存在且可播放                | 重新导出         |

---

## 七、扩展指南

### 7.1 新增 AI 模型

1. 在 `src/core/models/` 目录下创建新的模型封装
2. 实现统一的模型接口
3. 在 `modelRegistry` 中注册
4. 配置降级链路

### 7.2 新增流水线步骤

1. 在 `src/core/pipeline/` 下创建 `step-{name}.ts`
2. 实现 `PipelineStep` 接口
3. 可选配置 `QualityGate`
4. 在 `AutoPipelineEngine` 中注册

### 7.3 新增 UI 组件

1. 在 `src/features/auto-pipeline/components/` 下创建组件
2. 使用 `useAutoPipeline` Hook 接入状态
3. 在相应页面中引入

---

## 八、相关文档

- [项目结构](./project-structure.md) — 完整目录结构
- [服务清单](./services.md) — 各服务 API 说明
- [自主引擎 API](./autonomous-api.md) — Autonomous Pipeline API
- [配置文档](../getting-started/configuration.md) — API Key 配置
