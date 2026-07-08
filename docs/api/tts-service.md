---
title: TTS 服务
description: 语音合成接口，支持 Edge TTS（免费）、CosyVoice 2.0、KAN-TTS，含 200+ 音色、唇形同步元数据
category: api
version: '>=3.0'
---

# TTS 服务（ttsService）

> 文本转语音合成。**默认使用 Edge TTS（免费）**，可切换 CosyVoice / 百度 TTS。

---

## 导入

```typescript
import { ttsService } from '@/core/services';
import type { TTSConfig, TTSResult, TTSVoice } from '@/core/services';
```

---

## 核心方法

### synthesize()

```typescript
async synthesize(config: TTSConfig): Promise<TTSResult>
```

**参数（`TTSConfig`）**

| 字段         | 类型                                           | 必填 | 说明                                    |
| ------------ | ---------------------------------------------- | ---- | --------------------------------------- |
| `text`       | `string`                                       | ✅   | 要转换的文本                            |
| `provider`   | `'edge' \| 'cosyvoice' \| 'kantts' \| 'baidu'` | 否   | Provider（默认 `edge`）                 |
| `voice`      | `string`                                       | ✅   | 语音 ID（如 `zh-CN-XiaoxiaoNeural`）    |
| `speed`      | `number`                                       | 否   | 语速 0.5-2.0（默认 1.0）                |
| `pitch`      | `number`                                       | 否   | 音调 -1.0 到 1.0                        |
| `volume`     | `number`                                       | 否   | 音量 0-1                                |
| `emotion`    | `string`                                       | 否   | 情感（`neutral`/`happy`/`sad`/`angry`） |
| `format`     | `'mp3' \| 'wav' \| 'pcm'`                      | 否   | 输出格式（默认 `mp3`）                  |
| `sampleRate` | `24000 \| 48000`                               | 否   | 采样率                                  |

**返回（`TTSResult`）**

| 字段        | 类型       | 说明                       |
| ----------- | ---------- | -------------------------- |
| `audioUrl`  | `string`   | 音频 URL（本地缓存）       |
| `duration`  | `number`   | 实际时长（秒）             |
| `provider`  | `string`   | 命中的 Provider            |
| `voice`     | `string`   | 命中的语音                 |
| `latencyMs` | `number`   | 耗时                       |
| `visemes`   | `Viseme[]` | 唇形时间轴（用于唇形同步） |

**示例**

```typescript
const result = await ttsService.synthesize({
  text: '欢迎使用 Story Weaver',
  provider: 'edge',
  voice: 'zh-CN-XiaoxiaoNeural',
  speed: 1.0,
  format: 'mp3',
});
console.log(result.audioUrl, result.visemes);
```

### synthesizeBatch()

批量合成。

```typescript
async synthesizeBatch(
  texts: string[],
  config: TTSConfig
): Promise<TTSResult[]>
```

内部并发 4 路请求，单 Provider 限流时自动切换。

### getVoices()

列出某 Provider 的所有可用语音。

```typescript
getVoices(provider?: TTSProvider): TTSVoice[]
```

```typescript
// 列出 Edge TTS 所有中文女声
const voices = ttsService
  .getVoices('edge')
  .filter((v) => v.language.startsWith('zh') && v.gender === 'female');
```

---

## 支持的 Provider

| Provider      | 价格    | 质量       | 音色数 | 特色                 |
| ------------- | ------- | ---------- | ------ | -------------------- |
| **Edge TTS**  | 🆓 免费 | ⭐⭐⭐⭐   | 200+   | 默认推荐，无 API Key |
| CosyVoice 2.0 | 💰 付费 | ⭐⭐⭐⭐⭐ | 50+    | 阿里开源，音质最佳   |
| 百度 TTS      | 💰 付费 | ⭐⭐⭐     | 20+    | 老牌服务，国内稳     |
| KAN-TTS       | 💰 付费 | ⭐⭐⭐     | 30+    | 字节系，情感丰富     |

**默认降级链**：

```
Edge TTS → CosyVoice 2.0 → 百度 TTS
```

---

## 唇形同步元数据（Viseme）

TTS 返回的 `visemes` 字段包含**口型时间轴**，用于驱动后续唇形同步：

```typescript
[
  { time: 0.0, viseme: 'sil' }, // 静音
  { time: 0.1, viseme: 'PP' }, // 双唇音
  { time: 0.3, viseme: 'aa' }, // 开口音
  // ...
];
```

详见 [架构设计 - 唇形同步](../developer-guide/architecture.md)。

---

## 常用语音速查

| 场景          | Provider | Voice ID               |
| ------------- | -------- | ---------------------- |
| 中文女声·温柔 | Edge     | `zh-CN-XiaoxiaoNeural` |
| 中文女声·活泼 | Edge     | `zh-CN-YunxiNeural`    |
| 中文男声·成熟 | Edge     | `zh-CN-YunjianNeural`  |
| 英文女声      | Edge     | `en-US-JennyNeural`    |
| 日文女声      | Edge     | `ja-JP-NanamiNeural`   |

---

## 相关文档

- [API 概述](./overview.md)
- [AI 服务](./ai-service.md)
- [用户指南 - 渲染导出](../user-guide/rendering-export.md)
