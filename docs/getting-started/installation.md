---
title: 安装指南
description: Story Weaver 桌面端安装：macOS / Windows / Linux 三端 + 源码开发模式
category: getting-started
version: '>=3.0'
---

# 安装指南

> Story Weaver 是 **Tauri 2.1 桌面应用**，**不支持 Docker / Web 部署**用于生产。
> 本文档介绍：① 桌面端安装 ② 源码开发模式。

---

## 一、桌面端安装（推荐）

### 1.1 系统要求

| 组件         | 最低                                    | 推荐                                  |
| ------------ | --------------------------------------- | ------------------------------------- |
| **操作系统** | macOS 10.15 / Windows 10 / Ubuntu 20.04 | macOS 13+ / Windows 11 / Ubuntu 22.04 |
| **内存**     | 8 GB                                    | 16 GB+                                |
| **存储**     | 10 GB                                   | 50 GB SSD                             |
| **网络**     | 稳定                                    | 宽带（API 调用）                      |
| **显卡**     | 集成显卡                                | 独显（视频渲染加速）                  |

### 1.2 下载

前往 [GitHub Releases](https://github.com/Agions/story-weaver/releases) 下载最新版本：

| 平台                      | 文件                                |
| ------------------------- | ----------------------------------- |
| **macOS (Apple Silicon)** | `Story Weaver_x.x.x_aarch64.dmg`    |
| **macOS (Intel)**         | `Story Weaver_x.x.x_x64.dmg`        |
| **Windows**               | `Story Weaver_x.x.x_x64-setup.exe`  |
| **Linux**                 | `Story Weaver_x.x.x_amd64.AppImage` |

### 1.3 安装步骤

#### macOS

1. 双击 `.dmg` 文件
2. 拖动 `Story Weaver` 到 Applications
3. 启动时如提示"无法验证开发者"：
   - 系统设置 → 隐私与安全性 → 仍要打开
   - 或按住 `Control` 键点击应用图标 → "打开"

#### Windows

1. 双击 `.msi` 或 `setup.exe` 文件
2. 按向导完成安装
3. 如有 SmartScreen 警告 → "更多信息" → "仍要运行"

#### Linux

**AppImage**（推荐，免安装）：

```bash
chmod +x Story Weaver_x.x.x_amd64.AppImage
./Story Weaver_x.x.x_amd64.AppImage
```

**`.deb`**（Debian/Ubuntu 深度集成）：

```bash
sudo dpkg -i Story Weaver_x.x.x_amd64.deb
sudo apt-get install -f   # 补齐依赖
```

---

## 二、源码开发模式

### 2.1 前置要求

| 软件        | 版本     | 用途           |
| ----------- | -------- | -------------- |
| **Rust**    | ≥ 1.80   | Tauri 后端编译 |
| **Node.js** | ≥ 18 LTS | 前端构建       |
| **pnpm**    | ≥ 9.0    | 依赖管理       |
| **Git**     | 最新     | 克隆代码       |

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
  librsvg2-dev \
  libfuse2        # AppImage 运行支持
```

### 2.2 克隆与安装

```bash
git clone https://github.com/Agions/story-weaver.git
cd Story Weaver
pnpm install
```

### 2.3 启动开发模式

```bash
pnpm tauri dev
```

> 首次启动会下载 Rust 依赖（~5-10 分钟），后续增量编译 < 30s。

### 2.4 验证

启动后应该看到：

```
VITE v6.x.x  ready in xxx ms
Tauri dev server running at http://localhost:1420
```

桌面窗口应自动弹出，访问 `http://localhost:1420` 可同时看到 Web UI。

---

## 三、常见问题

### Q1: 启动崩溃/白屏？

A: 查看日志：

- **macOS**: `~/Library/Logs/Story Weaver/`
- **Windows**: `%APPDATA%\Story Weaver\logs\`
- **Linux**: `~/.config/Story Weaver/logs/`

或运行 `pnpm tauri dev` 在控制台查看实时日志。

### Q2: macOS 提示"无法验证开发者"？

A: 首次启动时按住 `Control` 键点击应用图标 → "打开"。系统会记住你的选择。

### Q3: Windows Defender 误报？

A: 提交至 [issue](https://github.com/Agions/story-weaver/issues)，我们会做 EV 代码签名。

### Q4: Linux AppImage 无法启动？

A: 安装 fuse：

```bash
sudo apt install libfuse2
```

或换用 `.deb` 包（不需要 fuse）。

### Q5: pnpm install 报 ERESOLVE 错误？

A: 删除 `node_modules` 和 `pnpm-lock.yaml` 后重试：

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Q6: Tauri 编译报错（Rust 依赖）？

A: 拉取最新源码：

```bash
git pull origin main
pnpm install
cargo clean && pnpm tauri dev
```

---

## 四、下一步

- [配置 AI API Key](./configuration.md) — 准备至少 1 个文本 + 1 个图像模型
- [3 步跑通](./quick-start.md) — 5 分钟创建首个 AI 漫剧
- [构建与发布](../deployment/build.md) — 打包三端安装包
- [架构设计](../developer-guide/architecture.md) — 理解项目结构
