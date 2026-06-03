# 配置 AI API Key

本文档介绍如何为 frame-fab 配置各类 AI 服务 API Key，包括文本生成、图像生成和语音合成服务。

---

## 创建 .env.local 文件

在项目根目录创建 `.env.local` 文件（注意：该文件不应提交到版本控制系统）：

```bash
touch .env.local
```

> **提示**：项目根目录已包含 `.gitignore`，默认会忽略 `.env.local` 文件。

---

## API Key 配置项

### 文本生成模型

| 环境变量            | 说明                             | 必填     | 推荐配置          |
| ------------------- | -------------------------------- | -------- | ----------------- |
| `OPENAI_API_KEY`    | OpenAI API Key（GPT 系列）       | 建议配置 | GPT-4o            |
| `ANTHROPIC_API_KEY` | Anthropic API Key（Claude 系列） | 可选     | Claude 3.5 Sonnet |
| `ZHIPU_API_KEY`     | 智谱 GLM API Key                 | 建议配置 | GLM-5（性价比高） |
| `DOUBAO_API_KEY`    | 字节豆包 API Key                 | 可选     | Doubao 2.0        |
| `ERNIE_API_KEY`     | 百度文心 API Key                 | 可选     | ERNIE 4.0         |

### 图像生成模型

| 环境变量            | 说明                     | 必填         | 推荐配置         |
| ------------------- | ------------------------ | ------------ | ---------------- |
| `SEEDDREAM_API_KEY` | Seedream 5.0 API Key     | **强烈推荐** | 首选（质量最高） |
| `KLING_API_KEY`     | 快影 Kling API Key       | 可选         | 备选方案         |
| `VIDU_API_KEY`      | Vidu 2.0 API Key         | 可选         | 次级备选         |
| `STABILITY_API_KEY` | Stable Diffusion API Key | 可选         | 降级方案         |

### 语音合成模型

| 环境变量               | 说明                       | 必填         | 推荐配置     |
| ---------------------- | -------------------------- | ------------ | ------------ |
| `EDGE_TTS_KEY`         | Edge TTS 配置              | **推荐配置** | 免费、低延迟 |
| `COSYVOICE_API_KEY`    | 阿里 CosyVoice 2.0 API Key | 可选         | 备选方案     |
| `BAIDU_TTS_API_KEY`    | 百度 TTS API Key           | 可选         | 降级方案     |
| `BAIDU_TTS_SECRET_KEY` | 百度 TTS Secret Key        | 配合上者使用 | -            |

---

## 环境变量示例

```env
# .env.local

# ===== 文本生成 =====
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZHIPU_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===== 图像生成 =====
SEEDDREAM_API_KEY=xxxxxxxxxxxxxxxx
KLING_API_KEY=xxxxxxxxxxxxxxxx

# ===== 语音合成 =====
COSYVOICE_API_KEY=xxxxxxxxxxxxxxxx
```

---

## API Key 获取链接

### 文本生成

| 服务      | 官方链接                                    | 特点              |
| --------- | ------------------------------------------- | ----------------- |
| OpenAI    | https://platform.openai.com/api-keys        | GPT-4o，功能强大  |
| Anthropic | https://console.anthropic.com/settings/keys | Claude 3.5 Sonnet |
| 智谱 AI   | https://open.bigmodel.cn/                   | GLM-5，性价比高   |
| 字节豆包  | https://console.volcengine.com/ark          | Doubao 2.0        |
| 百度文心  | https://console.bce.baidu.com/              | ERNIE 4.0         |

### 图像生成

| 服务             | 官方链接                       | 特点                 |
| ---------------- | ------------------------------ | -------------------- |
| Seedream         | https://www.seedream.com/      | 5.0 版本，强烈推荐   |
| 快影 Kling       | https://klingai.com/           | 1.6 版本，视频能力强 |
| Vidu             | https://www.vidu.cn/           | 2.0 版本，备选       |
| Stable Diffusion | https://platform.stability.ai/ | 开源生态             |

### 语音合成

| 服务      | 官方链接                       | 特点                   |
| --------- | ------------------------------ | ---------------------- |
| Edge TTS  | 内置免费服务                   | 无需 API Key，推荐使用 |
| CosyVoice | https://www.modelscope.cn/     | 阿里开源，音质好       |
| 百度 TTS  | https://console.bce.baidu.com/ | 老牌服务               |

---

## 降级策略说明

frame-fab 内置智能降级策略，当主选模型不可用时，会自动切换到备选模型：

### 图像生成降级链

```
Seedream 5.0 → Kling 1.6 → Vidu 2.0 → Stable Diffusion API
```

### 语音合成降级链

```
Edge TTS → CosyVoice 2.0 → 百度 TTS
```

### 文本生成降级链

```
GPT-4o → Claude 3.5 → GLM-5 → Doubao 2.0
```

> **说明**：降级过程完全自动化，用户无需任何操作。降级后会记录日志，如需手动指定模型，可在 `.env.local` 中配置。

---

## 推荐配置

### 基础配置（免费/低成本）

```env
# 文本生成
ZHIPU_API_KEY=your_key_here

# 图像生成（使用免费/低成本方案）
SEEDDREAM_API_KEY=your_key_here

# 语音合成
# 无需配置，使用内置 Edge TTS
```

### 生产环境配置

```env
# 文本生成
OPENAI_API_KEY=sk-xxxxx
ZHIPU_API_KEY=your_key_here

# 图像生成
SEEDDREAM_API_KEY=your_key_here
KLING_API_KEY=your_key_here

# 语音合成
COSYVOICE_API_KEY=your_key_here
```

### 高质量配置

```env
# 文本生成
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
ZHIPU_API_KEY=your_key_here

# 图像生成
SEEDDREAM_API_KEY=your_key_here
KLING_API_KEY=your_key_here

# 语音合成
COSYVOICE_API_KEY=your_key_here
```

---

## 验证配置

配置完成后，可通过以下命令验证 API Key 是否正确配置：

```bash
npm run check-config
```

或启动应用后访问设置页面，系统会自动检测各 API Key 的可用性。

---

## 常见问题

**Q: 是否所有 API Key 都必须配置？**

不需要。frame-fab 支持降级策略，只需配置核心服务即可运行。建议至少配置一个图像生成 API Key 以保证视频渲染功能正常。

**Q: 如何确保 API Key 安全？**

不要将 `.env.local` 提交到 Git，所有环境变量仅存储在本地。生产环境建议使用容器环境变量或密钥管理服务。

**Q: 遇到 API 限流怎么办？**

frame-fab 内置请求队列和重试机制。如频繁遇到限流，可在 `.env.local` 中配置多个备选 API Key，系统会自动负载均衡。
