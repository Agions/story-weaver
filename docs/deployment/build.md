---
title: 构建与发布
description: Story Weaver Tauri 桌面应用构建命令、产物位置、自动更新配置
category: deployment
version: '>=3.0'
---

# 构建与发布

> Story Weaver v2.2.3 使用 **Tauri 2.1** 构建跨平台桌面应用。
> 本文档介绍：构建命令、产物位置、自动更新、签名配置、CI/CD。

## 一、构建命令

### 1.1 开发模式

```bash
# 启动开发服务器（带热重载）
pnpm tauri dev
```

### 1.2 生产构建

```bash
# 全平台（需在对应平台运行）
pnpm tauri build

# 指定平台
pnpm tauri build --target aarch64-apple-darwin
pnpm tauri build --target x86_64-pc-windows-msvc
pnpm tauri build --target x86_64-unknown-linux-gnu
```

### 1.3 调试构建

```bash
pnpm tauri build --debug
```

## 二、构建产物位置

| 平台          | 路径                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| **macOS**     | `src-tauri/target/release/bundle/macos/Story Weaver.app`                         |
| **macOS DMG** | `src-tauri/target/release/bundle/dmg/Story Weaver_<version>_<arch>.dmg`          |
| **Windows**   | `src-tauri/target/release/bundle/msi/Story Weaver_<version>_<arch>-setup.exe`    |
| **Linux**     | `src-tauri/target/release/bundle/appimage/Story Weaver_<version>_amd64.AppImage` |
| **Linux deb** | `src-tauri/target/release/bundle/deb/Story Weaver_<version>_amd64.deb`           |

## 三、产物大小基准

| 平台                  | 大小   | 冷启动 |
| --------------------- | ------ | ------ |
| macOS (Apple Silicon) | ~26 MB | < 0.9s |
| macOS (Intel)         | ~28 MB | < 1.0s |
| Windows x64           | ~28 MB | < 1.2s |
| Linux AppImage        | ~24 MB | < 0.8s |

## 四、自动更新

Story Weaver 使用 **Tauri Updater** 提供自动更新：

```json
// src-tauri/tauri.conf.json
{
  "updater": {
    "active": true,
    "dialog": true,
    "endpoints": ["https://github.com/Agions/story-weaver/releases/latest/download/latest.json"]
  }
}
```

发布新版本流程：

1. 在 GitHub Releases 创建新 release（tag: `vX.Y.Z`）
2. CI 自动构建三端产物 + `latest.json`
3. 用户启动应用时自动检测更新
4. 用户确认后下载并安装

## 五、签名配置

### 5.1 macOS

需要 Apple Developer 证书：

```bash
export APPLE_CERTIFICATE="..."
export APPLE_CERTIFICATE_PASSWORD="..."
export APPLE_SIGNING_IDENTITY="Developer ID Application: ..."
```

### 5.2 Windows

需要 EV 代码签名证书：

```bash
$env:TAURI_SIGNING_PRIVATE_KEY = "..."
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "..."
```

### 5.3 Linux

无需签名（AppImage 自带 SHA256 校验）。

## 六、CI/CD 集成

GitHub Actions 自动构建发布：

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm tauri build --target ${{ matrix.target }}
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/**/*
```

## 七、常见问题

### Q1: macOS 构建失败 `code signing required`？

A: 临时禁用签名：

```bash
pnpm tauri build --no-bundle
```

或配置有效的 `APPLE_SIGNING_IDENTITY`。

### Q2: Windows 构建提示缺 MSVC？

A: 安装 Visual Studio Build Tools 2022（含 C++ 桌面开发）。

### Q3: Linux 缺 webkit2gtk？

A: Ubuntu/Debian：

```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### Q4: 启动崩溃？

A: 查看日志：

- macOS: `~/Library/Logs/Story Weaver/`
- Windows: `%APPDATA%/Story Weaver/logs/`
- Linux: `~/.config/Story Weaver/logs/`

## 八、相关文档

- [部署文档](./index.md)
- [环境变量](./environment.md)
- [快速开始](../getting-started/installation.md)
