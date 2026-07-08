---
layout: home
title: Story Weaver
titleTemplate: false

hero:
  name: 'Story Weaver'
  text: 'AI 漫剧创作平台'
  tagline: '输入一本小说，AI 自动把它拍成一部漫剧——你只需要按「开始」'
  image:
    src: /logo.svg
    alt: Story Weaver · AI 漫剧创作平台
  actions:
    - theme: brand
      text: 快速开始 →
      link: /getting-started/installation
    - theme: alt
      text: 架构设计
      link: /developer-guide/architecture
    - theme: alt
      text: GitHub ⭐
      link: https://github.com/Agions/story-weaver

features:
  - icon: 🎬
    title: 双模式工作流
    details: Manual 七步半自动（逐步审批）+ Autonomous 全自动 Pipeline（Self-Review + Quality Gate）
  - icon: 🧠
    title: 多模型 AI 编排
    details: 智谱 GLM-5 / MiniMax M2.5 / Kimi K2.5 / Seedream 5.0 / Kling 1.6 / Edge TTS，完整 Fallback Chain
  - icon: 🦀
    title: Rust 高性能后端
    details: Tauri 2.1 + FFmpeg 子进程，30 MB 包体积，冷启动 < 1s
  - icon: 🔄
    title: 断点续传 + 自修复
    details: 30s 自动 Checkpoint，Self-Review Loop 自动修复不合格输出
  - icon: 🎙️
    title: 一站式音视频
    details: Edge TTS 配音、字幕嵌入、FFmpeg 合成，MP4 / WebM / MOV 多格式输出
  - icon: 🏗️
    title: 桌面原生
    details: 全局快捷键、系统托盘、原生菜单，macOS / Windows / Linux 三端一致
---

<!-- 简要对比 -->

::: tip 为什么选择 Story Weaver？

市面上唯一的**开源桌面端** AI 漫剧创作平台。数据完全本地、MIT 协议、无云端锁定。
:::

<!-- 快速导航 -->

## 文档导航

| 入口                                      | 内容                           |
| ----------------------------------------- | ------------------------------ |
| [快速开始](/getting-started/installation) | 安装 → 配置 → 首个项目         |
| [用户手册](/user-guide/)                  | 工作流 · 双模式 · 全流程指南   |
| [API 参考](/api/overview)                 | 7 大核心服务 · 类型完备        |
| [架构设计](/developer-guide/architecture) | 整体架构 · DDD 分层 · Pipeline |
| [构建部署](/deployment/)                  | Tauri 三端构建 · 自动更新      |
