---
title: FrameForge - AI 漫剧创作平台
description: 基于 Tauri 2.1 桌面端 + 多模型 AI 编排的端到端 AI 漫剧创作工作台
layout: home
hero:
  name: "FrameForge"
  text: "AI 漫剧创作平台"
  tagline: "输入一本小说，AI 自动把它拍成一部漫剧——你只需要按『开始』"
  image:
    src: /logo.svg
    alt: FrameForge
  actions:
    - theme: brand
      text: 快速开始
      link: /getting-started/quick-start
    - theme: alt
      text: 架构设计
      link: /developer-guide/architecture
    - theme: alt
      text: GitHub
      link: https://github.com/Agions/frame-fab
    - theme: alt
      text: 下载桌面端
      link: https://github.com/Agions/frame-fab/releases
features:
  - title: 🎬 双模式工作流
    details: Manual 模式（七步半自动，逐步审批）+ Autonomous 模式（10 步全自主 + Self-Review Loop + Quality Gate），适配精细化与批量场景
  - title: 🧠 多模型 AI 编排
    details: 智谱 GLM-5 / MiniMax M2.5 / 月之暗面 Kimi K2.5 / 字节 Seedream 5.0 / 快手 Kling 1.6 / Edge TTS，完整 Fallback Chain
  - title: 🦀 Rust 高性能后端
    details: Tauri 2.1 桌面端 + FFmpeg 子进程，包体积 30MB 以内，冷启动 < 1s，macOS/Windows/Linux 三端一致
  - title: 🔄 断点续传 + 自审修复
    details: PipelineEngine 30s 自动 Checkpoint，SelfReviewLoop 自动修复不合格输出，质量门禁不通过可降级或回滚
  - title: 🏗️ 桌面优先架构
    details: 全局快捷键、系统托盘、原生菜单、文件 I/O；Rust 是第一公民承担系统级能力，JS/TS 仅做 UI 渲染
  - title: 📦 Monorepo + DDD 分层
    details: src + packages/core + packages/common 三层 Monorepo，领域驱动分层；零循环依赖，0 ts-prune 未使用导出
---

## ⚖️ Manual Mode vs Autonomous Mode

| 维度 | Manual Mode | Autonomous Mode |
|------|-------------|-----------------|
| 用户参与度 | 高（逐步审批） | 零（仅提供原材料） |
| 操作方式 | 工具型，逐步操作 | Agent 型，一键启动 |
| 适合场景 | 精细化调整、定制化 | 快速成片、批量生产 |
| 时间成本 | 较长 | 极短 |
| AI 自审 | 无 | 每步自审 + 自动修复 |
| 断点续传 | 不支持 | 支持（30s Checkpoint） |
| 质量门禁 | 可选 | 强制 |

## 🔄 七步工作流（Manual Mode）

```
📥 导入 ──▶ 🧠 AI 分析 ──▶ 📝 脚本生成 ──▶ 🎬 分镜设计
                                              │
                                              ▼
              🖼️ 批量渲染  ◀──  🎭 角色设计
                   │
                   ▼
              🎞️ 合成导出
```

## 🚀 10 步自主流水线（Autonomous Mode）

```
step-import → step-analysis → step-script → step-character → step-scene
                                                              │
                                                              ▼
              step-render ← step-storyboard ←────── step-video-editing
                  │
                  ▼
              step-composition (final export)
```

每步配备 **Self-Review Loop** + **Quality Gate** + **Checkpoint 自动保存**。

## 🤖 支持的 AI 模型

| 模态 | 模型 |
|------|------|
| 文字生成 | GLM-5（智谱）· M2.5（MiniMax）· Kimi K2.5（月之暗面）· Doubao 2.0（字节）· Qwen 2.5（阿里）· ERNIE 4.0（百度）|
| 图像生成 | Seedream 5.0（字节，推荐）· Kling 1.6（快手）· Vidu 2.0（生数）|
| 视频生成 | Seedance 2.0（字节）· Image-to-Video 工作流 |
| 语音合成 | Edge TTS（免费）· CosyVoice 2.0（阿里）· KAN-TTS（阿里）|

## 📖 文档导航

- [快速开始](./getting-started/quick-start) — 5 分钟启动
- [用户指南](./user-guide/) — 详细功能介绍
- [开发者指南](./developer-guide/) — 架构设计与 API 文档
- [架构决策记录](./adr/) — ADR 决策记录
- [性能基准](./performance/) — 性能基准报告

---

> **© 2024-2026 FrameForge · MIT License · 让创作更简单，让创意更自由**
