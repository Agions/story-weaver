---
title: 部署文档
description: frame-fab 桌面端构建与发布：macOS / Windows / Linux 三端构建、自动更新、CI/CD
category: deployment
version: '>=3.0'
---

# 部署文档

> frame-fab 是 **Tauri 2.1 桌面应用**——不是服务端，**无需 K8s/PostgreSQL/Redis**。
> 本章节专注于**桌面端构建与发布**。

## 一、构建架构

```
┌────────────────────────────────────────────────────────┐
│                    frame-fab 构建链                      │
└────────────────────────────────────────────────────────┘

   源代码 (TypeScript + Rust)
         │
         ├─── 前端 (Vite 6) ────────┐
         │                            │
         │                            ▼
         │                  ┌─────────────────────┐
         │                  │  静态资源 (.html)    │
         │                  │  JS/CSS bundle      │
         │                  └──────────┬──────────┘
         │                             │
         └─── Tauri (Rust) ────────────┤
                                       │
                                       ▼
                            ┌────────────────────┐
                            │  原生桌面应用        │
                            │  (.app/.exe/.AppImage)│
                            └────────────────────┘
                                       │
                            ┌──────────┴──────────┐
                            ▼                     ▼
                        macOS                  Windows
                       (DMG)                   (MSI)
                            │                     │
                            └──────────┬──────────┘
                                       ▼
                                    Linux
                                  (AppImage)
```

## 二、构建命令

| 命令 | 说明 |
|------|------|
| `pnpm tauri dev` | 开发模式（热重载） |
| `pnpm tauri build` | 生产构建（生成安装包） |
| `pnpm tauri build --debug` | 调试构建 |
| `pnpm tauri info` | 查看环境信息 |

## 三、平台支持

| 平台 | 目标 | 包格式 | 最低系统版本 |
|------|------|--------|------------|
| **macOS** | aarch64 / x86_64 | `.dmg` | macOS 10.15+ |
| **Windows** | x86_64 | `.msi` / `.exe` | Windows 10+ |
| **Linux** | x86_64 | `.AppImage` / `.deb` | Ubuntu 20.04+ |

## 四、子文档

| 文档 | 说明 |
|------|------|
| [构建与发布](./build.md) | 详细构建命令 + 输出位置 |
| [环境变量](./environment.md) | `.env` 与 VITE_ 前缀变量 |
| [Docker 开发环境](./docker.md) | 容器化开发环境（可选） |

## 五、CI/CD

frame-fab 使用 **GitHub Actions** 自动化构建发布：

```yaml
# .github/workflows/release.yml
- macos-latest    # 构建 macOS DMG
- windows-latest  # 构建 Windows MSI
- ubuntu-latest   # 构建 Linux AppImage
```

详见 [发布流程](https://github.com/Agions/frame-fab/releases)。

## 六、相关文档

- [快速开始](../getting-started/installation.md) — 本地开发安装
- [配置 AI API Key](../getting-started/configuration.md) — `.env.local` 配置
- [架构设计](../developer-guide/architecture.md) — Tauri 架构
