---
title: 安装指南
description: frame-fab 桌面端安装：macOS / Windows / Linux 三端 + 源码开发模式
category: getting-started
version: '>=3.0'
---

# 安装指南

> frame-fab 是 **Tauri 2.1 桌面应用**，**不支持 Docker / Web 部署**用于生产。
> 本文档介绍：① 桌面端安装 ② 源码开发模式。

## 一、桌面端安装（推荐）

### 1.1 系统要求

| 组件 | 最低 | 推荐 |
|------|------|------|
| **内存** | 8 GB | 16 GB+ |
| **存储** | 10 GB | 50 GB SSD |
| **网络** | 稳定 | 宽带（API 调用） |

### 1.2 下载

前往 [GitHub Releases](https://github.com/Agions/frame-fab/releases) 下载最新版本：

| 平台 | 文件 |
|------|------|
| **macOS (Apple Silicon)** | `frame-fab_x.x.x_aarch64.dmg` |
| **macOS (Intel)** | `frame-fab_x.x.x_x64.dmg` |
| **Windows** | `frame-fab_x.x.x_x64-setup.exe` |
| **Linux** | `frame-fab_x.x.x_amd64.AppImage` |

### 1.3 安装

#### macOS

1. 双击 `.dmg` 文件
2. 拖动 `frame-fab` 到 Applications
3. 启动时如提示"未识别开发者"：
   - 系统设置 → 隐私与安全性 → 仍要打开

#### Windows

1. 双击 `.msi` 文件
2. 按向导完成安装
3. 如有 SmartScreen 警告 → "更多信息" → "仍要运行"

#### Linux

```bash
chmod +x frame-fab_x.x.x_amd64.AppImage
./frame-fab_x.x.x_amd64.AppImage
```

或 `.deb`：

```bash
sudo dpkg -i frame-fab_x.x.x_amd64.deb
```

## 二、源码开发模式

### 2.1 前置要求

| 软件 | 版本 | 用途 |
|------|------|------|
| **Rust** | ≥ 1.80 | Tauri 后端编译 |
| **Node.js** | ≥ 18 LTS | 前端构建 |
| **pnpm** | ≥ 9.0 | 依赖管理 |
| **Git** | 最新 | 克隆代码 |

#### 平台特定工具

**macOS**：

```bash
xcode-select --install
```

**Windows**：

- 安装 [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- 勾选「C++ 桌面开发」

**Linux (Ubuntu/Debian)**：

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl wget file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### 2.2 克隆与安装

```bash
git clone https://github.com/Agions/frame-fab.git
cd frame-fab
pnpm install
```

### 2.3 启动开发模式

```bash
pnpm tauri dev
```

首次启动会下载 Rust 依赖（~5-10 分钟）。

### 2.4 验证

启动后应该看到：

```
VITE v6.x.x  ready in xxx ms
Tauri dev server running at http://localhost:1420
```

桌面窗口应自动弹出。

## 三、常见问题

### Q1: 启动崩溃/白屏？

A: 查看日志：
- macOS: `~/Library/Logs/frame-fab/`
- Windows: `%APPDATA%\frame-fab\logs\`
- Linux: `~/.config/frame-fab/logs/`

### Q2: macOS 提示"无法验证开发者"？

A: 首次启动时按住 `Control` 键点击应用图标 → "打开"。

### Q3: Windows Defender 误报？

A: 提交至 [issue](https://github.com/Agions/frame-fab/issues)，我们会做代码签名。

### Q4: Linux AppImage 无法启动？

A: 安装 fuse：
```bash
sudo apt install libfuse2
```

## 四、下一步

- [配置 AI API Key](./configuration.md)
- [3 步跑通](./quick-start.md)
- [构建与发布](../deployment/build.md)
