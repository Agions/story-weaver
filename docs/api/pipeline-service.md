---
title: 流水线
description: 10 步 Pipeline 引擎 API：import → analysis → script → character → scene → storyboard → render → video-editing → audio → export
category: api
version: >=2.4
---

# 流水线

端到端视频生成流水线。

## 导入

```typescript
import { pipelineService } from '@/core/services';
```

## run()

```typescript
async run(options: PipelineOptions): Promise<PipelineResult>
```

**参数：**

| 参数                 | 类型       | 说明       |
| -------------------- | ---------- | ---------- |
| `options.input`      | `string`   | 输入内容   |
| `options.steps`      | `string[]` | 执行的步骤 |
| `options.quality`    | `string`   | 质量预设   |
| `options.resolution` | `string`   | 输出分辨率 |

**示例：**

```typescript
const result = await pipelineService.run({
  input: novelText,
  steps: ['import', 'analyze', 'script', 'storyboard', 'render', 'export'],
  options: { quality: 'high', resolution: '1080p' },
});
```

## 支持的步骤

| 步骤         | 说明          |
| ------------ | ------------- |
| `import`     | 导入小说/脚本 |
| `analyze`    | AI 内容分析   |
| `script`     | 生成视频脚本  |
| `storyboard` | 生成分镜      |
| `render`     | 渲染场景      |
| `export`     | 导出视频      |

## 进度跟踪

```typescript
pipelineService.onProgress((progress) => {
  console.log(`阶段：${progress.stage}`);
  console.log(`进度：${progress.overallProgress}%`);
});
```
