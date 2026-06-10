---
title: 快速开始
description: frame-fab 上手指南：3 步跑通（安装 → 配置 → 创建首个漫剧）
category: getting-started
version: '>=3.0'
---

# 快速开始

> 3 步跑通 frame-fab：**安装 → 配置 AI Key → 创建首个漫剧**。

## 一、5 分钟跑通

```mermaid
graph LR
  A[下载安装] --> B[配置 API Key]
  B --> C[导入小说]
  C --> D[点击开始]
  D --> E[下载成片]
```

| 步骤 | 时间 | 说明 |
|------|------|------|
| 1️⃣ 下载安装 | 3 min | macOS / Windows / Linux 三端 |
| 2️⃣ 配置 API Key | 1 min | 至少 1 个文本 + 1 个图像 |
| 3️⃣ 创建首个漫剧 | 5 min | 输入短篇，AI 自动成片 |

## 二、3 步详解

### 步骤 1：下载桌面端

- 前往 [Releases](https://github.com/Agions/frame-fab/releases) 下载对应平台安装包
- macOS: `.dmg`
- Windows: `.msi`
- Linux: `.AppImage`

详见 [安装指南](./installation.md)。

### 步骤 2：配置 AI API Key

1. 启动 frame-fab → **设置** → **API Key**
2. 至少配置：
   - **1 个文本模型**（推荐 `ZHIPU_API_KEY`）
   - **1 个图像模型**（推荐 `SEEDDREAM_API_KEY`）
3. TTS 默认使用**免费 Edge TTS**，无需配置

详见 [配置 AI API Key](./configuration.md)。

### 步骤 3：创建首个漫剧

1. 主界面 → **新建项目** → **Autonomous 模式**
2. 选择输入文件（`.txt` / `.md` / `.docx`）
3. 配置基础选项（质量/分辨率/风格）
4. 点击 **开始** → 等待完成（短篇 15-30 分钟）
5. **下载成片**（MP4）

## 三、文档导航

| 文档 | 适合 |
|------|------|
| [安装指南](./installation.md) | 第一次下载安装 |
| [3 步跑通](./quick-start.md) | 5 分钟上手 |
| [配置 API Key](./configuration.md) | 多模型 AI 配置 |

## 四、推荐阅读

- [用户指南 - 工作流概览](../user-guide/workflow-overview.md)
- [用户指南 - Autonomous 模式](../user-guide/autonomous-mode.md)
- [架构设计](../developer-guide/architecture.md)
