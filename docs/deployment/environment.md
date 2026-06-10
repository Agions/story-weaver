---
title: 环境变量
description: frame-fab 环境变量配置：VITE_ 前缀、AI Provider API Key、应用配置
category: deployment
version: '>=3.0'
---

# 环境变量

> frame-fab 的环境变量分为两类：**构建时**（`VITE_` 前缀，暴露给前端）和 **运行时**（Tauri 注入）。

## 一、命名规范

| 前缀 | 阶段 | 说明 |
|------|------|------|
| `VITE_` | 构建时 | 客户端可见，**API Key 慎用** |
| 无前缀 | 运行时 | Rust 端配置，不暴露给前端 |

## 二、AI Provider 配置

### 2.1 文本生成（推荐至少配置 1 个）

```bash
VITE_ZHIPU_API_KEY=xxxxxxxxxxxxxxxx     # 智谱 GLM-5（国内首选）
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx     # Claude 3.5（高质量）
VITE_MINIMAX_API_KEY=xxxxxxxx           # MiniMax M2.5
VITE_MOONSHOT_API_KEY=xxxxxxxx          # 月之暗面 Kimi K2.5
VITE_DOUBAO_API_KEY=xxxxxxxx            # 字节豆包
VITE_QWEN_API_KEY=xxxxxxxx              # 阿里 Qwen 2.5
VITE_ERNIE_API_KEY=xxxxxxxx             # 百度 ERNIE 4.0
VITE_OPENAI_API_KEY=sk-xxxxx            # OpenAI GPT-4o
```

### 2.2 图像生成

```bash
VITE_SEEDDREAM_API_KEY=xxxxxxxx         # 字节 Seedream 5.0（推荐）
VITE_KLING_API_KEY=xxxxxxxx             # 快手 Kling 1.6
VITE_VIDU_API_KEY=xxxxxxxx              # 生数 Vidu 2.0
VITE_STABILITY_API_KEY=xxxxxxxx         # Stable Diffusion（降级）
```

### 2.3 语音合成

```bash
# Edge TTS 默认免费，无需配置
VITE_COSYVOICE_API_KEY=xxxxxxxx         # 阿里 CosyVoice 2.0（可选付费）
VITE_BAIDU_TTS_API_KEY=xxxxxxxx         # 百度 TTS
VITE_BAIDU_TTS_SECRET_KEY=xxxxxxxx
```

## 三、应用配置

```bash
VITE_APP_NAME=frame-fab
VITE_APP_VERSION=3.0.0
VITE_APP_MODE=desktop                   # desktop | web
```

## 四、.env 文件规范

```bash
# .env.example（提交到 Git）
VITE_APP_NAME=frame-fab

# .env.local（**不提交**，本地开发）
VITE_ZHIPU_API_KEY=your_real_key

# .env.production（**不提交**，生产构建）
VITE_ZHIPU_API_KEY=production_key
```

`.gitignore` 已包含：

```gitignore
.env
.env.local
.env.*.local
.env.production
```

## 五、配置示例

### 5.1 最小配置（免费可用）

```bash
# .env.local

# 文本（必填，智谱性价比最高）
VITE_ZHIPU_API_KEY=your_key

# 图像（必填）
VITE_SEEDDREAM_API_KEY=your_key

# TTS：使用免费 Edge TTS，无需配置
```

### 5.2 高质量配置

```bash
# 文本
VITE_ZHIPU_API_KEY=your_key
VITE_ANTHROPIC_API_KEY=your_key

# 图像
VITE_SEEDDREAM_API_KEY=your_key
VITE_KLING_API_KEY=your_key

# TTS
VITE_COSYVOICE_API_KEY=your_key
```

### 5.3 完整降级链（生产推荐）

```bash
# 文本：智谱 → Claude → MiniMax → 豆包 → 通义
VITE_ZHIPU_API_KEY=k1
VITE_ANTHROPIC_API_KEY=k2
VITE_MINIMAX_API_KEY=k3
VITE_DOUBAO_API_KEY=k4
VITE_QWEN_API_KEY=k5

# 图像：Seedream → Kling → Vidu
VITE_SEEDDREAM_API_KEY=k1
VITE_KLING_API_KEY=k2
VITE_VIDU_API_KEY=k3
```

## 六、安全最佳实践

### 6.1 本地开发

- ✅ 使用 `.env.local`
- ❌ 不要把 API Key 写在 `src/` 里

### 6.2 桌面端发布

> ⚠️ **注意**：`VITE_*` 变量在打包后会**明文**出现在 JS bundle 中。
> 桌面端应用**可以被反编译提取 Key**。

**生产建议**：

1. **桌面端**：使用 [Tauri Secure Storage](https://tauri.app/v1/api/js/storage) 加密存储
2. **Web 端**：使用服务端代理（frame-fab 暂不提供）
3. **密钥轮换**：定期更换 API Key

## 七、配置验证

```bash
# 检查所有环境变量
pnpm check-config
```

输出示例：

```
✅ VITE_ZHIPU_API_KEY         已配置
✅ VITE_SEEDDREAM_API_KEY     已配置
⚠️  VITE_ANTHROPIC_API_KEY    未配置（降级链可用）
✅ Edge TTS                    默认启用
```

## 八、相关文档

- [部署文档](./index.md)
- [构建与发布](./build.md)
- [配置 AI API Key](../getting-started/configuration.md)
