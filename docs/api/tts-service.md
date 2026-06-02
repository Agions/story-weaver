# TTS 服务

文本转语音合成。

## 导入

```typescript
import { ttsService } from '@/core/services';
```

## synthesize()

```typescript
async synthesize(config: TTSConfig): Promise<TTSResult>
```

**参数：**

| 参数              | 类型     | 说明           |
| ----------------- | -------- | -------------- |
| `config.text`     | `string` | 要转换的文本   |
| `config.provider` | `string` | 提供商         |
| `config.voice`    | `string` | 语音名称       |
| `config.speed`    | `number` | 语速 (0.5-2.0) |
| `config.emotion`  | `string` | 情感类型       |

**示例：**

```typescript
const result = await ttsService.synthesize({
  text: '欢迎使用 frame-forge',
  provider: 'edge',
  voice: 'zh-CN-XiaoxiaoNeural',
  speed: 1.0,
});
```

## synthesizeBatch()

批量合成。

```typescript
async synthesizeBatch(texts: string[], config: TTSConfig): Promise<TTSResult[]>
```

## 支持的提供商

| 提供商        | 质量 | 费用 |
| ------------- | ---- | ---- |
| Edge TTS      | 良好 | 免费 |
| CosyVoice 2.0 | 优秀 | 付费 |
| KAN-TTS       | 良好 | 付费 |
