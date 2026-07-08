---
title: 快速开始
description: Story Weaver 上手指南：3 步跑通（安装 → 配置 → 创建首个漫剧）
category: getting-started
version: '>=3.0'
---

# 快速开始

> **3 步跑通 Story Weaver**：安装 → 配置 AI Key → 创建首个漫剧。短篇 15-30 分钟即可成片。

---

## 一、5 分钟跑通流程

```mermaid
graph LR
  A[下载安装] --> B[配置 API Key]
  B --> C[导入小说]
  C --> D[点击开始]
  D --> E[下载成片]
```

| 步骤            | 时间  | 说明                         |
| --------------- | ----- | ---------------------------- |
| 1️⃣ 下载安装     | 3 min | macOS / Windows / Linux 三端 |
| 2️⃣ 配置 API Key | 1 min | 至少 1 个文本 + 1 个图像     |
| 3️⃣ 创建首个漫剧 | 5 min | 输入短篇，AI 自动成片        |

---

## 二、3 步详解

### 步骤 1：下载桌面端

前往 [Releases](https://github.com/Agions/story-weaver/releases) 下载对应平台安装包：

- **macOS**: `.dmg`（分 Apple Silicon / Intel 两个版本）
- **Windows**: `.msi` 或 `setup.exe`
- **Linux**: `.AppImage` 或 `.deb`

详见 [安装指南](./installation.md)。

### 步骤 2：配置 AI API Key

1. 启动 Story Weaver → **设置** → **API Key**
2. 至少配置：
   - **1 个文本模型**（推荐 `ZHIPU_API_KEY` = 智谱 GLM-5）
   - **1 个图像模型**（推荐 `SEEDDREAM_API_KEY` = 字节 Seedream 5.0）
3. TTS 默认使用**免费 Edge TTS**，无需配置

详见 [配置 AI API Key](./configuration.md)。

### 步骤 3：创建首个漫剧

1. 主界面 → **新建项目** → **Autonomous 模式**
2. 选择输入文件（`.txt` / `.md` / `.docx` / `.pdf` 或粘贴文本）
3. 配置基础选项（质量 / 分辨率 / 风格）
4. 点击 **开始** → 等待完成（短篇 15-30 分钟）
5. **下载成片**（MP4 / WebM / MOV 多格式可选）

---

## 三、文档导航

| 文档                               | 适合           |
| ---------------------------------- | -------------- |
| [安装指南](./installation.md)      | 第一次下载安装 |
| [3 步跑通](./quick-start.md)       | 5 分钟上手     |
| [配置 API Key](./configuration.md) | 多模型 AI 配置 |

---

## 四、推荐阅读

- [用户指南 - 工作流概览](../user-guide/workflow-overview.md) — 完整 10 步流水线
- [用户指南 - Autonomous 模式](../user-guide/autonomous-mode.md) — 零参与一键成片
- [架构设计](../developer-guide/architecture.md) — 系统整体架构
- [品牌设计指南](../BRAND_GUIDELINES.md) — Logo / 配色 / 字体规范
