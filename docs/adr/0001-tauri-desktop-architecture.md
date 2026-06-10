---
title: ADR-0001 Tauri 2.1 桌面优先架构
description: 选择 Tauri 2.1 + Rust 作为桌面端容器，替代 Electron，30MB 包体积 + 冷启动 < 1s
category: adr
version: '>=2.4'
---

# ADR 0001: Tauri 2.1 桌面优先架构

- **状态**: Accepted
- **日期**: 2026-06-03
- **决策者**: frame-fab 架构组

## 背景

frame-fab 是一款 AI 漫剧创作工具,需要 FFmpeg 视频处理、文件 I/O、窗口管理、快捷键、配置持久化等系统级能力。早期版本选择 Web 应用 + Electron 壳,带来:

- 包体积大（150+ MB 起步）
- 启动慢（3-5s）
- FFmpeg 子进程性能受限（IPC 开销 + V8 桥接）
- 难以实现真正"系统级"集成（托盘、全局快捷键、原生菜单）

## 决策

采用 **Tauri 2.1** 作为桌面容器,核心原则:

1. **Rust 后端是第一公民**——所有系统级能力（FFmpeg、文件 I/O、窗口、快捷键、配置）由 Rust 实现,前端 JS/TS 仅做 UI 渲染。
2. **JS/TS 通过 `tauri::invoke()` 桥接 Rust Commands**,无 V8 重型桥接。
3. **FFmpeg 直接通过 `std::process::Command` 调用**,不走 `tauri-plugin-shell`（避免命令注入 + 性能损耗）。
4. **路径验证在 Rust 侧强制**(空字节 + 白名单目录)。

## 实施

### 目录结构

```
src-tauri/src/
├── commands/           # Tauri Commands 路由层（仅做参数校验 + invoke_handler 注册）
│   ├── video.rs       # FFmpeg 视频相关（analyze_video / cut_video / preview 等）
│   ├── app.rs         # 窗口/设置（show/hide/fullscreen/settings/path）
│   ├── file.rs        # 项目文件（list/save/delete/clean）
│   └── shortcuts.rs   # 全局快捷键管理（Mutex<Vec<ShortcutInfo>>）
├── services/          # 业务逻辑层
│   ├── ffmpeg/        # FFmpeg 统一封装（run_ffmpeg / split_args / is_installed）
│   ├── video/         # 视频元数据/转场/预览
│   └── config/        # AppSettings 读写
├── models/            # Rust 数据模型
├── utils/             # 路径验证、ID 生成、FFPS 解析
└── constants/         # 允许目录白名单
```

### 关键约束

- `lib.rs` ≤ 80 行：仅做模块声明 + `invoke_handler!` 注册 + `run()`
- `main.rs` ≤ 15 行：仅调用 `app_lib::run()`
- 所有 `#[tauri::command]` 函数返回 `Result<T, String>`
- 字符串错误使用 `.into()` 或 `format!()`,生产代码禁用 `unwrap()`

## 后果

### 正面

- **包体积 30MB 以内**（vs Electron 150MB+）
- **冷启动 < 1s**（vs Electron 3-5s）
- **FFmpeg 子进程零桥接开销**
- **Rust 类型系统保证**关键路径安全
- **统一跨平台行为**（macOS/Windows/Linux 一套代码）

### 负面

- **Rust 学习曲线**——前端开发者需要理解所有权、生命周期
- **生态相对小**——某些 npm 包没有 Rust 等价
- **移动端支持有限**——Tauri 2 移动端仍 preview（暂不投入）

### 中和

- 关键路径提取至纯函数，单元测试覆盖（path_validator / ffmpeg 工具函数）
- 复杂业务放在 `services/` 层,降低 `commands/` 层心智负担
- JS 侧 `tauri/commands.ts` 提供类型安全封装,IDE 提示完整

## 备选方案

### 备选 1: Electron

- **优点**: 生态成熟,前端开发者熟悉
- **缺点**: 体积大、启动慢、FFmpeg 子进程需要通过 `child_process` + IPC
- **结论**: 否决,体积与启动速度是产品核心体验

### 备选 2: 纯 Web (PWA)

- **优点**: 无需安装,跨平台
- **缺点**: 无法访问系统 API（全局快捷键、托盘、文件管理受限）
- **结论**: 否决,核心功能（FFmpeg 处理/系统集成）无法实现

### 备选 3: Wails (Go)

- **优点**: 比 Tauri 更轻量,Go 性能好
- **缺点**: 生态小,FFmpeg 库需 CGO 桥接,Rust 工具链更成熟
- **结论**: 否决,Rust 生态与 type safety 优势明显

## 参考

- [Tauri 2.1 官方文档](https://tauri.app/v2/)
- [FFmpeg 命令注入防护最佳实践](https://wiki.sei.cmu.edu/confluence/display/c/IDS04-J.+Restrict+file+names+passed+to+the+underlying+system)
- 项目内部文档: `docs/developer-guide/architecture.md`
