---
title: 配置 AI API Key
description: Story Weaver 多模型 AI API Key 配置：智谱 / Anthropic / MiniMax / Seedream / Kling / TTS，含降级链
category: getting-started
version: '>=3.0'
---

# 配置 AI API Key

> 配置 AI 模型是跑通 Story Weaver 的**关键一步**。本文介绍所有支持的 Provider、降级链策略、安全最佳实践。

---

## 一、配置入口

启动 Story Weaver → **设置** → **API Key** → 添加 Provider

> 🛡️ **桌面端优先使用「设置面板」配置**——API Key 通过 [Tauri Secure Storage](https://tauri.app/v1/api/js/storage) 加密存储（OS Keychain）。
> 🔧 **开发模式**（`pnpm tauri dev`）可在 `.env.local` 配置。

---

## 二、必须配置

| 类型     | 推荐                | 原因                                    |
| -------- | ------------------- | --------------------------------------- |
| 文本模型 | `ZHIPU_API_KEY`     | 必需，**国内首选**（中文剧本效果最佳）  |
| 图像模型 | `SEEDDREAM_API_KEY` | 必需，**质量最高**（动画/插画风格首选） |
| TTS      | （默认 Edge TTS）   | 可选，**免费**，无需配置                |

---

## 三、文本生成 Provider

| Provider              | 模型              | 价格   | 适用                 |
| --------------------- | ----------------- | ------ | -------------------- |
| 智谱 `zhipu`          | GLM-5             | 💰     | 中文剧本首选         |
| Anthropic `anthropic` | Claude 3.5 Sonnet | 💰💰   | 长文本/高质量        |
| MiniMax `minimax`     | M2.5              | 💰     | 备选                 |
| 月之暗面 `moonshot`   | Kimi K2.5         | 💰     | 长上下文（10 万字+） |
| 字节豆包 `doubao`     | Doubao 2.0        | 💰     | 国内备选             |
| 阿里通义 `qwen`       | Qwen 2.5          | 💰     | 国内备选             |
| 百度文心 `ernie`      | ERNIE 4.0         | 💰     | 国内备选             |
| OpenAI `openai`       | GPT-4o            | 💰💰💰 | 国际/英文            |

### 3.1 智谱 GLM-5（推荐）

1. 访问 [智谱开放平台](https://open.bigmodel.cn/)
2. 注册 → 实名认证 → 「API Keys」 → 创建新 Key
3. 复制到 Story Weaver 设置

### 3.2 Anthropic Claude 3.5

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 创建 API Key
3. 复制到 Story Weaver 设置

### 3.3 月之暗面 Kimi K2.5

1. 访问 [Moonshot AI 开放平台](https://platform.moonshot.cn/)
2. 创建 API Key
3. 复制到 Story Weaver 设置

---

## 四、图像生成 Provider

| Provider              | 模型         | 类型      | 备注                 |
| --------------------- | ------------ | --------- | -------------------- |
| 字节跳动 `seedream`   | Seedream 5.0 | 图像      | ⭐⭐⭐ 动画/插画首选 |
| 快手 `kling`          | Kling 1.6    | 图像+视频 | 视频生成             |
| 生数科技 `vidu`       | Vidu Q3      | 图像+视频 | 高一致性             |
| 字节跳动 `seedance`   | Seedance 2.0 | 视频      | 短运镜               |
| Stability `stability` | SDXL         | 图像      | 降级方案             |

### 4.1 字节 Seedream 5.0（推荐）

1. 访问 [火山引擎 - 视觉智能](https://www.volcengine.com/product/visual)
2. 开通「图像生成」服务 → 创建 API Key
3. 复制到 Story Weaver 设置

### 4.2 快手 Kling 1.6

1. 访问 [可灵 AI](https://klingai.com/)
2. 申请 API 权限 → 创建 Key
3. 复制到 Story Weaver 设置

---

## 五、语音合成 Provider

| Provider           | 价格    | 备注                                      |
| ------------------ | ------- | ----------------------------------------- |
| **Edge TTS**       | 🆓 免费 | **默认**，无需 Key（微软 Azure 公共服务） |
| 阿里 CosyVoice 2.0 | 💰 付费 | 高质量，支持情感                          |
| 百度 TTS           | 💰 付费 | 老牌中文 TTS                              |
| KAN-TTS            | 💰 付费 | 字节系                                    |

---

## 六、降级链策略

Story Weaver 内置**自动降级**——主选不可用时自动切换备选。

### 6.1 默认降级链

**文本**：

```
GLM-5 → Claude 3.5 → M2.5 → Kimi K2.5 → Doubao 2.0 → Qwen 2.5 → ERNIE 4.0
```

**图像**：

```
Seedream 5.0 → Kling 1.6 → Vidu Q3 → SDXL
```

**TTS**：

```
Edge TTS → CosyVoice 2.0 → 百度 TTS
```

### 6.2 自定义降级链

在「设置 → AI 模型 → 降级链」中**拖拽排序**——把最常用的放最前。

### 6.3 降级触发条件

| 场景             | 行为                                           |
| ---------------- | ---------------------------------------------- |
| HTTP 429（限流） | 等待 5s 后切换下一个                           |
| HTTP 500/502/503 | 立即切换下一个                                 |
| 网络超时（30s）  | 立即切换下一个                                 |
| API Key 失效     | 标记该 Provider 不可用，永久跳过（重启后重置） |

---

## 七、配置示例

### 7.1 最小配置（免费可用）

| 必填 | Provider            |
| ---- | ------------------- |
| 文本 | `ZHIPU_API_KEY`     |
| 图像 | `SEEDDREAM_API_KEY` |
| TTS  | （Edge TTS 默认）   |

**预估成本**：约 ¥0.1 / 分钟漫剧（短篇 ¥1-3 整剧）

### 7.2 高质量配置

| 必填 | Provider                     |
| ---- | ---------------------------- |
| 文本 | `ZHIPU` + `ANTHROPIC` 双备份 |
| 图像 | `SEEDDREAM` + `KLING` 双备份 |
| TTS  | `COSYVOICE`                  |

**预估成本**：约 ¥0.3 / 分钟漫剧（短篇 ¥3-9 整剧）

### 7.3 纯免费配置

| 必填 | Provider                            |
| ---- | ----------------------------------- |
| 文本 | （无 Key 时）→ 平台提示受限         |
| 图像 | （无 Key 时）→ 降级到 SDXL 免费额度 |
| TTS  | Edge TTS（始终免费）                |

> ⚠️ 完全免费模式仅支持基础效果，漫剧质量受限。

---

## 八、常见问题

### Q1: API Key 在哪里输入？

A: 桌面端「设置 → API Key」。**不要**写进代码或提交到 Git（`.env.local` 已加入 `.gitignore`）。

### Q2: 某个 Provider 报错怎么办？

A: Story Weaver 会**自动降级**到备选 Provider。失败信息会显示在「设置 → 状态 → Provider 列表」。

### Q3: API Key 会被泄露吗？

A: 桌面端使用 [Tauri Secure Storage](https://tauri.app/v1/api/js/storage) 加密存储（OS Keychain）。

> ⚠️ **注意**：Story Weaver 是开源应用，反编译可读取内存中的 Key。建议使用**子账户 + 限额**降低风险。

### Q4: 海外访问国内 API 慢？

A: 启用「网络代理」或在「设置 → 网络」中配置 HTTP 代理（支持 SOCKS5）。

### Q5: 多个 Key 想 A/B 测试？

A: 在「设置 → AI 模型 → 实验性」中开启 **A/B 路由**，可同时给 2 个 Provider 50% 流量。

### Q6: 怎么估算成本？

A: 「设置 → 成本」中可看到历史用量 + 按 Provider 拆分。运行新项目前会**预估成本**并提示确认。

---

## 九、相关文档

- [环境变量](../deployment/environment.md) — 开发模式 `.env.local` 完整配置
- [API 文档 - AI 服务](../api/ai-service.md) — ProviderRegistry API
- [API Key 安全最佳实践](../deployment/environment.md#六安全最佳实践)
- [用户指南 - Autonomous 模式](../user-guide/autonomous-mode.md) — 完整流水线
