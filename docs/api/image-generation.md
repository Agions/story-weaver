---
title: 图像生成
description: AI 图像/视频生成接口，支持 Seedream 5.0、Kling 1.6、Vidu 2.0，含角色一致性系统和 Reference Image 缓存
category: api
version: '>=3.0'
---

# 图像生成（imageGenerationService）

> 多提供商图像/视频生成入口，统一封装 Seedream / Kling / Vidu 接口。

---

## 导入

```typescript
import { imageGenerationService } from '@/core/services';
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  VideoGenerationOptions,
} from '@/core/services';
```

---

## 核心方法

### generateImage()

```typescript
async generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult>
```

**参数（`ImageGenerationOptions`）**

| 字段               | 类型                                          | 必填 | 说明                                        |
| ------------------ | --------------------------------------------- | ---- | ------------------------------------------- |
| `prompt`           | `string`                                      | ✅   | 图像描述词                                  |
| `negativePrompt`   | `string`                                      | 否   | 反向提示词                                  |
| `model`            | `ImageModel`                                  | ✅   | 模型 ID                                     |
| `resolution`       | `'1:1' \| '16:9' \| '9:16' \| '4:3' \| '3:4'` | 否   | 宽高比                                      |
| `width`            | `number`                                      | 否   | 自定义宽（像素）                            |
| `height`           | `number`                                      | 否   | 自定义高（像素）                            |
| `style`            | `string`                                      | 否   | 风格描述（'cinematic'/'anime'/'realistic'） |
| `seed`             | `number`                                      | 否   | 随机种子（保证可复现）                      |
| `referenceImages`  | `string[]`                                    | 否   | 参考图 URL 数组（用于一致性）               |
| `characterProfile` | `CharacterProfile`                            | 否   | 角色设定卡（自动注入 prompt）               |

**返回（`ImageGenerationResult`）**

| 字段               | 类型         | 说明                              |
| ------------------ | ------------ | --------------------------------- |
| `imageUrl`         | `string`     | 生成图像 URL（本地缓存或 base64） |
| `width` / `height` | `number`     | 实际尺寸                          |
| `model`            | `string`     | 命中的模型                        |
| `seed`             | `number`     | 实际种子                          |
| `latencyMs`        | `number`     | 耗时                              |
| `usage`            | `TokenUsage` | 计费信息                          |

**示例：基础生成**

```typescript
const result = await imageGenerationService.generateImage({
  prompt: '现代城市夜景，电影级灯光，温暖色调',
  model: 'seedream-5.0',
  resolution: '16:9',
  style: 'cinematic',
});
console.log(result.imageUrl);
```

**示例：角色一致性（自动注入 CharacterProfile）**

```typescript
const result = await imageGenerationService.generateImage({
  prompt: '李明在办公室工作',
  model: 'seedream-5.0',
  characterProfile: {
    id: 'char_001',
    name: '李明',
    appearance: { hair: '短黑发', face: '方形脸' },
    clothing: { style: '商务休闲', colors: ['深蓝', '白色'] },
  },
});
// 内部自动追加角色外观描述到 prompt
```

### generateVideo()

视频生成（仅 Kling 1.6 / Vidu Q3 / Seedance 2.0 支持）。

```typescript
async generateVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult>
```

参数与 `generateImage` 类似，额外字段：

| 字段              | 类型      | 说明           |
| ----------------- | --------- | -------------- |
| `duration`        | `5 \| 10` | 视频时长（秒） |
| `motionIntensity` | `0-1`     | 运镜强度       |
| `imageUrl`        | `string`  | 首帧参考图     |

### generateBatch()

批量并发生成（**默认并发 4**，可在 `config` 调整）。

```typescript
async generateBatch(
  optionsList: ImageGenerationOptions[]
): Promise<ImageGenerationResult[]>
```

---

## 支持的 Provider

| Provider              | 模型               | 类型      | 适用场景            |
| --------------------- | ------------------ | --------- | ------------------- |
| 字节跳动 `seedream`   | Seedream 5.0       | 图像      | 动画/插画，**首选** |
| 快手 `kling`          | Kling 1.6          | 图像+视频 | 视频生成首选        |
| 生数科技 `vidu`       | Vidu Q3 / Vidu 2.0 | 图像+视频 | 高一致性            |
| 字节跳动 `seedance`   | Seedance 2.0       | 视频      | 短运镜              |
| Stability `stability` | SDXL               | 图像      | 降级方案            |

**降级链**（按价格/质量平衡）：

```
Seedream 5.0 → Kling 1.6 → Vidu 2.0 → Stability SDXL
```

---

## 角色一致性机制

Story Weaver 在三层保障角色一致性：

```
┌────────────────────────────────────┐
│ 1. CharacterProfile 注入           │  ← prompt 自动追加外貌描述
├────────────────────────────────────┤
│ 2. Reference Image 缓存            │  ← 已生成的同一角色图作为参考
├────────────────────────────────────┤
│ 3. Self-Review Loop                │  ← VLM 比对，>0.85 阈值才通过
└────────────────────────────────────┘
```

详见 [用户指南 - 角色设计](../user-guide/character-design.md)。

---

## 相关文档

- [API 概述](./overview.md)
- [角色设计](../user-guide/character-design.md)
- [分镜设计](../user-guide/storyboard-design.md)
- [AI Providers](../developer-guide/ai-providers.md)
