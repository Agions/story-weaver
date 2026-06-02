# 服务文档

本文档介绍 FrameForge 核心服务的架构与使用方法。

---

## 一、服务架构概览

FrameForge 采用微服务化的模块设计，核心服务分为以下几类：

```
┌─────────────────────────────────────────────────────────────┐
│                      FrameForge Services                       │
├─────────────────────────────────────────────────────────────┤
│  AI 服务层                                                     │
│  ├── LLM Service (大语言模型服务)                              │
│  ├── Image Generation Service (图像生成服务)                   │
│  ├── TTS Service (语音合成服务)                                │
│  └── Video Composition Service (视频合成服务)                  │
├─────────────────────────────────────────────────────────────┤
│  Pipeline 服务层                                               │
│  ├── Pipeline Engine (流水线引擎)                             │
│  ├── Auto Pipeline Engine (全自动流水线引擎)                  │
│  ├── Self Review Loop (自审循环服务)                           │
│  └── Quality Gate (质量门禁服务)                               │
├─────────────────────────────────────────────────────────────┤
│  Feature 服务层                                                │
│  ├── Auto Pipeline Service (自动流水线服务)                   │
│  ├── Import Service (导入服务)                                │
│  ├── Analysis Service (分析服务)                              │
│  └── Export Service (导出服务)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、AI 服务层

### 2.1 LLM Service（大语言模型服务）

**文件位置**: `src/core/ai/llm-service.ts`

**功能**: 调用大语言模型进行文本生成与分析

**支持的模型**:

| 模型       | 用途               | 优先级 |
| ---------- | ------------------ | ------ |
| GLM-5      | 剧本解析、脚本生成 | ⭐⭐⭐ |
| Doubao 2.0 | 故事分析           | ⭐⭐⭐ |
| ERNIE 4.0  | 故事分析           | ⭐⭐   |
| M2.5       | 剧本解析           | ⭐⭐   |
| Kimi K2.5  | 剧本解析           | ⭐⭐   |

**降级策略**:

```typescript
LLM 降级链路: GLM-5 → Doubao 2.0 → ERNIE 4.0 → M2.5
```

**核心接口**:

```typescript
interface LLMService {
  // 文本补全
  complete(prompt: string, options?: LLMOptions): Promise<string>;

  // 结构化输出（JSON）
  structuredOutput<T>(prompt: string, schema: Schema, options?: LLMOptions): Promise<T>;

  // 批量处理
  batchComplete(prompts: string[], options?: LLMOptions): Promise<string[]>;
}
```

**使用示例**:

```typescript
import { llmService } from '@/core/ai/llm-service';

// 简单文本补全
const storyAnalysis = await llmService.complete(`请分析以下故事的人物和场景：\n${storyText}`);

// 结构化输出
const script = await llmService.structuredOutput<ScriptOutput>('请生成视频剧本', ScriptSchema);
```

### 2.2 Image Generation Service（图像生成服务）

**文件位置**: `src/core/ai/image-generation-service.ts`

**功能**: 调用 AI 图像生成模型生成角色图、分镜图

**支持的模型**:

| 模型             | 用途               | 优先级 |
| ---------------- | ------------------ | ------ |
| Seedream 5.0     | 角色设计、分镜生成 | ⭐⭐⭐ |
| Kling 1.6        | 分镜生成、图像渲染 | ⭐⭐   |
| Vidu 2.0         | 备选渲染           | ⭐     |
| Stable Diffusion | 降级渲染           | ⭐     |

**降级链路**:

```typescript
Seedream 5.0 → Kling 1.6 → Vidu 2.0 → Stable Diffusion API
```

**核心接口**:

```typescript
interface ImageGenerationService {
  // 生成单张图片
  generate(prompt: string, options?: ImageOptions): Promise<ImageResult>;

  // 批量生成
  batchGenerate(prompts: string[], options?: ImageOptions): Promise<ImageResult[]>;

  // 角色一致性生成
  generateWithCharacter(
    characterId: string,
    prompt: string,
    options?: ImageOptions
  ): Promise<ImageResult>;
}
```

**使用示例**:

```typescript
import { imageService } from '@/core/ai/image-generation-service';

// 生成角色图
const characterImage = await imageService.generateWithCharacter(
  characterId,
  '正面站姿，开心表情，学院风校服',
  { size: '1024x1024', quality: 'high' }
);

// 批量生成分镜图
const storyboardImages = await imageService.batchGenerate(storyboardPrompts, {
  size: '1280x720',
  style: 'anime',
});
```

### 2.3 TTS Service（语音合成服务）

**文件位置**: `src/core/ai/tts-service.ts`

**功能**: 将文本转换为语音，支持配音和唇形同步

**支持的引擎**:

| 引擎          | 特点         | 优先级 |
| ------------- | ------------ | ------ |
| Edge TTS      | 免费、低延迟 | ⭐⭐⭐ |
| CosyVoice 2.0 | 高质量音色   | ⭐⭐   |
| 百度 TTS      | 降级方案     | ⭐     |

**降级链路**:

```typescript
Edge TTS → CosyVoice 2.0 → 百度 TTS
```

**核心接口**:

```typescript
interface TTSService {
  // 文本转语音
  synthesize(text: string, options?: TTSOptions): Promise<AudioResult>;

  // 唇形同步数据生成
  lipSync(audioPath: string): Promise<LipSyncData>;

  // 多角色配音
  multiCharacterDub(dialogues: Dialogue[]): Promise<DubbingResult>;
}
```

### 2.4 Video Composition Service（视频合成服务）

**文件位置**: `src/core/ai/video-composition-service.ts`

**功能**: 将图像、音频、字幕合成为最终视频

**核心接口**:

```typescript
interface VideoCompositionService {
  // 合成视频
  compose(scenes: Scene[], options?: VideoOptions): Promise<VideoResult>;

  // 添加转场效果
  addTransitions(videoPath: string, transitions: Transition[]): Promise<string>;

  // 嵌入字幕
  burnSubtitles(videoPath: string, subtitles: Subtitle[]): Promise<string>;

  // 导出最终格式
  export(
    videoPath: string,
    format: 'mp4' | 'webm',
    quality: 'low' | 'medium' | 'high'
  ): Promise<string>;
}
```

---

## 三、Pipeline 服务层

### 3.1 Pipeline Engine（流水线引擎）

**文件位置**: `src/core/pipeline/pipeline-engine.ts`

**功能**: 管理手动模式下的流水线执行

**步骤定义**:

```typescript
interface PipelineStep {
  id: string;
  name: string;
  execute(context: PipelineContext): Promise<StepResult>;
  validate?(result: StepResult): boolean;
  rollback?(context: PipelineContext): Promise<void>;
}
```

**执行流程**:

```
ImportStep → AnalysisStep → ScriptStep → CharacterStep
          → StoryboardStep → RenderStep → CompositionStep → ExportStep
```

**使用示例**:

```typescript
import { pipelineEngine } from '@/core/pipeline/pipeline-engine';

const result = await pipelineEngine.run({
  input: storyText,
  mode: 'manual',
  onStepComplete: (step) => console.log(`完成: ${step.name}`),
  onStepError: (step, error) => console.error(`失败: ${step.name}`, error),
});
```

### 3.2 Auto Pipeline Engine（全自动流水线引擎）

**文件位置**: `src/core/autonomous/auto-pipeline-engine.ts`

**功能**: 管理全自动模式的流水线执行，包含自审循环

**11 步执行流程**:

```typescript
const AUTONOMOUS_STEPS = [
  'ImportStep', // 解析原材料
  'AnalysisStep', // 分析故事结构
  'ScriptStep', // 生成视频剧本
  'CharacterStep', // 角色设定与一致化
  'SceneStep', // 场景规划
  'StoryboardStep', // 分镜脚本 + 参考图
  'RenderStep', // 批量渲染帧
  'VideoEditStep', // 视频剪辑 + 转场
  'AudioStep', // 配音 + 音效 + 唇形同步
  'SubtitleStep', // 字幕生成与嵌入
  'ExportStep', // 最终合成输出
];
```

**核心接口**:

```typescript
interface AutoPipelineEngine {
  // 启动全自动流水线
  run(input: AutoPipelineInput): Promise<AutoPipelineResult>;

  // 暂停流水线
  pause(): void;

  // 恢复流水线
  resume(): void;

  // 取消流水线
  cancel(): void;

  // 获取当前状态
  getStatus(): AutoPipelineStatus;
}
```

**使用示例**:

```typescript
import { autoPipelineEngine } from '@/core/autonomous/auto-pipeline-engine';

const result = await autoPipelineEngine.run({
  content: novelText,
  mode: 'novel',
  title: '我的漫剧',
  style: 'anime',
  qualityLevel: 'balanced',
});
```

### 3.3 Self Review Loop（自审循环服务）

**文件位置**: `src/core/autonomous/self-review-loop.ts`

**功能**: 对每步输出进行 AI 自审，不合格时自动修复

**审核维度**:

| 维度     | 判定标准                             |
| -------- | ------------------------------------ |
| 完整性   | 输出是否包含所有必要字段/元素        |
| 一致性   | 人物描写、场景描述前后是否矛盾       |
| 画面感   | 描述是否具备足够的视觉细节供 AI 生图 |
| 时长匹配 | 对话/场景时长是否与内容体量匹配      |
| 爆点检测 | 是否包含情绪爆点、转折、高潮         |

**核心接口**:

```typescript
interface SelfReviewLoop {
  // 执行自审
  review(stepOutput: StepOutput, criteria: ReviewCriteria): Promise<ReviewResult>;

  // 执行修复
  repair(
    originalOutput: StepOutput,
    reviewResult: ReviewResult,
    repairPrompt: string
  ): Promise<StepOutput>;
}
```

**循环上限**: 每次步骤最多自审 3 次，3 次仍不通过则降级到人工审核模式。

### 3.4 Quality Gate（质量门禁服务）

**文件位置**: `src/core/autonomous/quality-gate.ts`

**功能**: 自动判定每步输出是否符合质量标准

**各步骤门禁标准**:

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

## 四、Feature 服务层

### 4.1 Auto Pipeline Service

**文件位置**: `src/features/auto-pipeline/services/autoPipelineService.ts`

**功能**: 自动流水线的服务封装，供 UI 层调用

**核心接口**:

```typescript
interface AutoPipelineService {
  // 创建新任务
  createTask(input: CreateTaskInput): Promise<Task>;

  // 获取任务状态
  getTaskStatus(taskId: string): Promise<TaskStatus>;

  // 获取任务进度
  getTaskProgress(taskId: string): Promise<TaskProgress>;

  // 取消任务
  cancelTask(taskId: string): Promise<void>;

  // 下载结果
  downloadResult(taskId: string): Promise<string>;
}
```

### 4.2 Import Service

**文件位置**: `src/features/import/services/importService.ts`

**功能**: 解析各类输入格式（小说、剧本、需求描述）

**支持格式**:

| 格式     | 解析方式            |
| -------- | ------------------- |
| TXT      | 纯文本按章节分割    |
| Markdown | 按 # 标题分割章节   |
| PDF      | 文本提取 + 章节分析 |
| Word     | 文档解析            |
| URL      | 网页内容抓取        |

### 4.3 Analysis Service

**文件位置**: `src/features/analysis/services/analysisService.ts`

**功能**: AI 分析故事结构、人物关系、场景列表

**输出结构**:

```typescript
interface StoryAnalysis {
  title: string;
  synopsis: string;
  characters: Character[];
  scenes: Scene[];
  timeline: TimelineEvent[];
  moodCurve: MoodPoint[];
}
```

### 4.4 Export Service

**文件位置**: `src/features/export/services/exportService.ts`

**功能**: 导出最终成片，支持多种格式

**支持格式**:

| 格式        | 用途       |
| ----------- | ---------- |
| MP4 (H.264) | 通用兼容性 |
| WebM (VP9)  | web 嵌入   |
| MOV         | 苹果生态   |

**质量选项**:

| 质量   | 分辨率 | 码率    |
| ------ | ------ | ------- |
| low    | 720p   | 2 Mbps  |
| medium | 1080p  | 5 Mbps  |
| high   | 1080p+ | 10 Mbps |

---

## 五、服务配置

### 5.1 环境变量配置

```bash
# AI 服务配置
LLM_PROVIDER=glm
LLM_API_KEY=your_api_key
IMAGE_PROVIDER=seedream
IMAGE_API_KEY=your_api_key
TTS_PROVIDER=edge
TTS_API_KEY=your_api_key

# 视频处理配置
FFMPEG_PATH=/usr/local/bin/ffmpeg
MAX_CONCURRENT_RENDERS=4
RENDER_BATCH_SIZE=4

# 存储配置
STORAGE_TYPE=local
STORAGE_PATH=./output
CHECKPOINT_STORAGE=localStorage
```

### 5.2 配置文件

**文件位置**: `src/config/services.ts`

```typescript
export const serviceConfig = {
  llm: {
    provider: process.env.LLM_PROVIDER || 'glm',
    apiKey: process.env.LLM_API_KEY,
    model: 'glm-5',
    temperature: 0.7,
    maxTokens: 4096,
    fallbackChain: ['doubao', 'ernie', 'm2.5'],
  },
  image: {
    provider: process.env.IMAGE_PROVIDER || 'seedream',
    apiKey: process.env.IMAGE_API_KEY,
    model: 'seedream-5.0',
    defaultSize: '1024x1024',
    fallbackChain: ['kling', 'vidu', 'stable-diffusion'],
  },
  tts: {
    provider: process.env.TTS_PROVIDER || 'edge',
    apiKey: process.env.TTS_API_KEY,
    voice: 'zh-CN-Female-1',
    fallbackChain: ['cosyvoice', 'baidu-tts'],
  },
  video: {
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_RENDERS) || 4,
    batchSize: parseInt(process.env.RENDER_BATCH_SIZE) || 4,
  },
};
```

---

## 六、错误处理

### 6.1 错误类型

```typescript
enum ServiceErrorType {
  // AI 服务错误
  LLM_ERROR = 'LLM_ERROR',
  IMAGE_GENERATION_ERROR = 'IMAGE_GENERATION_ERROR',
  TTS_ERROR = 'TTS_ERROR',
  VIDEO_COMPOSITION_ERROR = 'VIDEO_COMPOSITION_ERROR',

  // Pipeline 错误
  STEP_EXECUTION_ERROR = 'STEP_EXECUTION_ERROR',
  QUALITY_GATE_FAILED = 'QUALITY_GATE_FAILED',
  REVIEW_LOOP_EXCEEDED = 'REVIEW_LOOP_EXCEEDED',

  // 存储错误
  STORAGE_ERROR = 'STORAGE_ERROR',
  CHECKPOINT_ERROR = 'CHECKPOINT_ERROR',

  // 配置错误
  CONFIG_ERROR = 'CONFIG_ERROR',
}
```

### 6.2 错误处理策略

```typescript
interface ErrorHandler {
  // 重试策略
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };

  // 降级策略
  fallback?: {
    service: string;
    action: 'skip' | 'use-default' | 'notify-user';
  };

  // 日志策略
  logging?: {
    level: 'error' | 'warn' | 'info';
    includeContext: boolean;
  };
}
```

---

## 七、最佳实践

### 7.1 服务调用规范

1. **Always use dependency injection** for services in tests
2. **Implement circuit breaker** for external API calls
3. **Use checkpointing** for long-running operations
4. **Log all service calls** with request/response context

### 7.2 性能优化

1. **Batch API calls** when possible
2. **Cache model outputs** for identical prompts
3. **Use streaming** for large text generation
4. **Parallelize independent steps** in pipeline

### 7.3 监控与告警

建议监控以下指标：

- API 响应时间 (P50, P95, P99)
- 错误率 (按服务、按错误类型)
- 降级触发次数
- 自审循环平均次数
- 最终输出质量评分
