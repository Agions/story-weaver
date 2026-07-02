---
title: Docker 开发环境
description: frame-fab Docker 开发环境（可选）：容器化前端 + 跨平台编译
category: deployment
version: '>=3.0'
---

# Docker 开发环境

> ⚠️ **注意**：frame-fab v2.2.3 是 **Tauri 桌面应用**，**生产部署不需要 Docker**。
> 本文档仅介绍**开发环境容器化**（可选）。

## 一、典型用例

| 场景 | 是否用 Docker |
|------|--------------|
| **生产发布** | ❌ 直接打 `.dmg`/`.msi`/`.AppImage` |
| **本地开发** | ⚠️ 可选，统一环境 |
| **CI 编译** | ✅ 推荐，避免本地工具链污染 |
| **跨平台编译** | ✅ 从 macOS 编 Windows/Linux |

## 二、devcontainer

`.devcontainer/devcontainer.json` 已包含：

```json
{
  "name": "frame-fab",
  "image": "mcr.microsoft.com/devcontainers/rust:2-bookworm",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" }
  },
  "postCreateCommand": "pnpm install"
}
```

在 VS Code 中：**Reopen in Container** 即可。

## 三、Docker 镜像（开发用）

```bash
docker build -t frame-fab-dev -f Dockerfile.dev .
docker run -it --rm -v $(pwd):/app -p 5173:5173 frame-fab-dev
```

## 四、跨平台编译

### 4.1 从 macOS 编译 Windows

```bash
docker run --rm -v $(pwd):/app \
  rust-cross/rust-cross:x86_64-pc-windows-gnu \
  bash -c "cd /app && pnpm install && pnpm tauri build --target x86_64-pc-windows-gnu"
```

### 4.2 从 macOS 编译 Linux

```bash
docker run --rm -v $(pwd):/app \
  rust-cross/rust-cross:x86_64-unknown-linux-gnu \
  bash -c "cd /app && pnpm install && pnpm tauri build --target x86_64-unknown-linux-gnu"
```

## 五、为什么不推荐生产用 Docker？

| 原因 | 说明 |
|------|------|
| **Tauri 桌面应用** | 需要 macOS/Windows/Linux 原生运行时 |
| **无服务端** | 没有需要容器化的后端 |
| **包体积优化** | 桌面应用直接运行比容器快 3-5 倍 |
| **FFmpeg 原生** | 容器内 FFmpeg 性能受限 |

## 六、相关文档

- [构建与发布](./build.md) — 推荐的发布方式
- [环境变量](./environment.md)
- [快速开始](../getting-started/installation.md)
