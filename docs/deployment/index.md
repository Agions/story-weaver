---
title: 部署文档
description: Story Weaver 桌面端构建与发布：macOS / Windows / Linux 三端构建、自动更新、CI/CD、环境变量
category: deployment
version: '>=3.0'
---

# 部署文档

> Story Weaver v2.2.3 是 **Tauri 2.1 桌面应用**——**不是服务端**，**无需 K8s/PostgreSQL/Redis**。
> 本章节专注于**桌面端构建与发布**。

---

## 一、构建架构

```
┌────────────────────────────────────────────────────────┐
│                    Story Weaver 构建链                      │
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

---

## 二、构建命令

| 命令                                 | 说明                   |
| ------------------------------------ | ---------------------- |
| `pnpm tauri dev`                     | 开发模式（热重载）     |
| `pnpm tauri build`                   | 生产构建（生成安装包） |
| `pnpm tauri build --debug`           | 调试构建               |
| `pnpm tauri build --target <triple>` | 指定目标平台           |
| `pnpm tauri info`                    | 查看环境信息           |

---

## 三、平台支持

| 平台        | 目标             | 包格式               | 最低系统版本  | 包大小    |
| ----------- | ---------------- | -------------------- | ------------- | --------- |
| **macOS**   | aarch64 / x86_64 | `.dmg`               | macOS 10.15+  | ~26-28 MB |
| **Windows** | x86_64           | `.msi` / `.exe`      | Windows 10+   | ~28 MB    |
| **Linux**   | x86_64           | `.AppImage` / `.deb` | Ubuntu 20.04+ | ~24 MB    |

冷启动均 < 1.2s。

---

## 四、子文档

| 文档                           | 说明                                      |
| ------------------------------ | ----------------------------------------- |
| [构建与发布](./build.md)       | 详细构建命令 + 输出位置 + 自动更新 + 签名 |
| [环境变量](./environment.md)   | `.env` 与 VITE\_ 前缀变量                 |
| [Docker 开发环境](./docker.md) | 容器化开发环境（可选）                    |

---

## 五、CI/CD

Story Weaver 使用 **GitHub Actions** 自动化构建发布：

```yaml
# .github/workflows/release.yml (简化)
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
        target:
          - aarch64-apple-darwin
          - x86_64-apple-darwin
          - x86_64-pc-windows-msvc
          - x86_64-unknown-linux-gnu
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm tauri build --target ${{ matrix.target }}
      - uses: softprops/action-gh-release@v1
        with:
          files: src-tauri/target/release/bundle/**/*
```

详见 [发布流程](https://github.com/Agions/story-weaver/releases)。

---

## 六、性能预算

| 指标                  | 预算     | 实际 (v2.2.3) |
| --------------------- | -------- | ------------- |
| JS bundle gzip        | ≤ 350 KB | ~280 KB       |
| Tauri 二进制          | ≤ 30 MB  | ~26 MB        |
| 冷启动                | ≤ 1.5s   | ~0.9s         |
| 流水线 10 步（无 AI） | < 500ms  | 275ms         |

详见 [v2.2.3 性能基准](../performance/benchmark-2.2.3.md)。

---

## 七、相关文档

- [快速开始](../getting-started/installation.md) — 本地开发安装
- [配置 AI API Key](../getting-started/configuration.md) — `.env.local` 配置
- [架构设计](../developer-guide/architecture.md) — Tauri 架构
- [品牌设计指南](../BRAND_GUIDELINES.md) — 资产与品牌规范
