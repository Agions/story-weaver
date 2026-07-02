---
layout: home
title: frame-fab
titleTemplate: false

hero:
  name: 'frame·fab'
  text: 'AI 漫剧创作平台'
  tagline: '输入一本小说，AI 自动把它拍成一部漫剧——你只需要按「开始」'
  image:
    src: /logo.svg
    alt: frame-fab · AI 漫剧创作平台
  actions:
    - theme: brand
      text: 快速开始 →
      link: /getting-started/installation
    - theme: alt
      text: 架构设计
      link: /developer-guide/architecture
    - theme: alt
      text: GitHub ⭐
      link: https://github.com/Agions/frame-fab
    - theme: alt
      text: 下载桌面端
      link: https://github.com/Agions/frame-fab/releases

features:
  - icon: 🎬
    title: 双模式工作流
    details: Manual 模式（七步半自动，逐步审批）+ Autonomous 模式（10 步全自主 + Self-Review Loop + Quality Gate），适配精细化与批量场景
  - icon: 🧠
    title: 多模型 AI 编排
    details: 智谱 GLM-5 / MiniMax M2.5 / 月之暗面 Kimi K2.5 / 字节 Seedream 5.0 / 快手 Kling 1.6 / Edge TTS，完整 Fallback Chain
  - icon: 🦀
    title: Rust 高性能后端
    details: Tauri 2.1 + FFmpeg 子进程，零桥接开销；安装包 30 MB，冷启动 < 1s
  - icon: 🔄
    title: 断点续传 + 修复
    details: PipelineEngine 30s 自动 Checkpoint，自审循环自动修复不合格输出，质量门禁不通过可降级继续
  - icon: 🎙️
    title: 一站式音视频
    details: Edge TTS 配音、唇形同步、字幕嵌入、FFmpeg 合成导出；支持 MP4 / WebM / MOV 多格式输出
  - icon: 🏗️
    title: 桌面优先架构
    details: 全局快捷键、系统托盘、原生菜单、文件 I/O；macOS / Windows / Linux 三端一致的体验
---

<!-- 顶部品牌信息条 v2.2.3 -->
<div class="vp-brand-bar">
  <span class="vp-brand-tag">🆕 v2.2.3</span>
  <span class="vp-brand-info">44 个大文件拆分重构 · 195+ 子模块 · 0 调用方影响</span>
  <a href="https://github.com/Agions/frame-fab/blob/main/CHANGELOG.md" class="vp-brand-link">查看更新 →</a>
</div>

<div class="vp-doc container">

<div class="vp-section-header">
  <h2 class="vp-section-title">从小说到漫剧，只需 5 步</h2>
  <p class="vp-section-sub">把传统影视制作 3 个月的周期压缩到 5 天，把创作还给故事本身</p>
</div>

<div class="vp-workflow">
  <div class="vp-step">
    <div class="vp-step-num">01</div>
    <div class="vp-step-body">
      <div class="vp-step-title">📖 导入小说</div>
      <div class="vp-step-desc">支持 TXT / Word / Markdown / PDF / 粘贴文本；自动识别章节结构与人物</div>
    </div>
    <div class="vp-step-arrow">→</div>
  </div>
  <div class="vp-step">
    <div class="vp-step-num">02</div>
    <div class="vp-step-body">
      <div class="vp-step-title">🧠 AI 分析</div>
      <div class="vp-step-desc">GLM-5 拆解剧情脉络、识别主要人物、提取场景要素、生成剧本骨架</div>
    </div>
    <div class="vp-step-arrow">→</div>
  </div>
  <div class="vp-step">
    <div class="vp-step-num">03</div>
    <div class="vp-step-body">
      <div class="vp-step-title">🎨 分镜设计</div>
      <div class="vp-step-desc">导演级分镜规划：景别 / 运镜 / 时长；Seedream 5.0 生成首帧图</div>
    </div>
    <div class="vp-step-arrow">→</div>
  </div>
  <div class="vp-step">
    <div class="vp-step-num">04</div>
    <div class="vp-step-body">
      <div class="vp-step-title">🎬 视频渲染</div>
      <div class="vp-step-desc">Kling 1.6 / Vidu Q3 / Seedance 2.0 多模型融合，逐镜头运镜控制 + 角色一致性</div>
    </div>
    <div class="vp-step-arrow">→</div>
  </div>
  <div class="vp-step">
    <div class="vp-step-num">05</div>
    <div class="vp-step-body">
      <div class="vp-step-title">🎞️ 合成导出</div>
      <div class="vp-step-desc">Edge TTS 配音 + 字幕嵌入 + FFmpeg 合成；MP4 / WebM / MOV，9:16 竖屏 + 16:9 横屏</div>
    </div>
  </div>
</div>

<div class="vp-section-header">
  <h2 class="vp-section-title">为什么选择 frame·fab</h2>
  <p class="vp-section-sub">市面上唯一的开源桌面端 AI 漫剧创作平台</p>
</div>

<div class="vp-why-grid">
  <div class="vp-why-card">
    <div class="vp-why-icon">🖥️</div>
    <div class="vp-why-title">桌面原生体验</div>
    <div class="vp-why-desc">Tauri 2.1 跨平台（macOS / Windows / Linux），系统托盘 / 全局快捷键 / 原生菜单，30 MB 包体积冷启动 &lt; 1s</div>
  </div>
  <div class="vp-why-card">
    <div class="vp-why-icon">🤖</div>
    <div class="vp-why-title">策略模式 AI 编排</div>
    <div class="vp-why-desc">ProviderRegistry + Fallback Chain，6+ 文字模型、4+ 图像模型、3+ TTS 自动降级到备用供应商</div>
  </div>
  <div class="vp-why-card">
    <div class="vp-why-icon">✅</div>
    <div class="vp-why-title">质量门禁 + 自审</div>
    <div class="vp-why-desc">10 步流水线每步都有 Quality Gate 评分，不合格的输出自动重新生成；Self-Review Loop 修复问题</div>
  </div>
  <div class="vp-why-card">
    <div class="vp-why-icon">💾</div>
    <div class="vp-why-title">断点续传不丢失</div>
    <div class="vp-why-desc">30s 自动 Checkpoint，应用崩溃 / 断网 / 切换设备后能从最近状态恢复；不重做已生成的镜头</div>
  </div>
  <div class="vp-why-card">
    <div class="vp-why-icon">🆓</div>
    <div class="vp-why-title">完全开源</div>
    <div class="vp-why-desc">MIT 协议，源码 100% 公开，无云端锁定，无月费；自己用 API Key，无中间商赚差价</div>
  </div>
  <div class="vp-why-card">
    <div class="vp-why-icon">🧩</div>
    <div class="vp-why-title">可扩展架构</div>
    <div class="vp-why-desc">PipelineEngine + 步骤框架，新模型 / 新工作流只需要写一个 Step 类；插件式 ProviderRegistry</div>
  </div>
</div>

<div class="vp-section-header">
  <h2 class="vp-section-title">核心技术栈</h2>
  <p class="vp-section-sub">每一项都是 2026 年的最优解</p>
</div>

<div class="vp-tech-grid">
  <div class="vp-tech-card">
    <div class="vp-tech-layer">前端</div>
    <div class="vp-tech-list">
      <span class="vp-tech-tag">React 18</span>
      <span class="vp-tech-tag">TypeScript 5</span>
      <span class="vp-tech-tag">Vite 6</span>
      <span class="vp-tech-tag">Tailwind v4</span>
      <span class="vp-tech-tag">Radix UI</span>
    </div>
  </div>
  <div class="vp-tech-card">
    <div class="vp-tech-layer">桌面</div>
    <div class="vp-tech-list">
      <span class="vp-tech-tag">Tauri 2.1</span>
      <span class="vp-tech-tag">Rust 1.80</span>
      <span class="vp-tech-tag">FFmpeg 子进程</span>
    </div>
  </div>
  <div class="vp-tech-card">
    <div class="vp-tech-layer">AI 编排</div>
    <div class="vp-tech-list">
      <span class="vp-tech-tag">GLM-5</span>
      <span class="vp-tech-tag">Kimi K2.5</span>
      <span class="vp-tech-tag">M2.5</span>
      <span class="vp-tech-tag">Seedream 5.0</span>
      <span class="vp-tech-tag">Kling 1.6</span>
      <span class="vp-tech-tag">Vidu Q3</span>
      <span class="vp-tech-tag">Edge TTS</span>
    </div>
  </div>
  <div class="vp-tech-card">
    <div class="vp-tech-layer">工程</div>
    <div class="vp-tech-list">
      <span class="vp-tech-tag">Jest 30</span>
      <span class="vp-tech-tag">Playwright</span>
      <span class="vp-tech-tag">ESLint</span>
      <span class="vp-tech-tag">Husky</span>
      <span class="vp-tech-tag">VitePress</span>
    </div>
  </div>
</div>

<div class="vp-section-header">
  <h2 class="vp-section-title">我们的定位</h2>
  <p class="vp-section-sub">开源桌面端 vs 商业 SaaS vs C 端 App</p>
</div>

<div class="vp-compare">
  <div class="vp-compare-header">
    <div>特性</div>
    <div>frame·fab<br/><span class="vp-compare-sub">开源 · 桌面端</span></div>
    <div>万兴剧厂<br/><span class="vp-compare-sub">商业 SaaS</span></div>
    <div>梦灵 AI<br/><span class="vp-compare-sub">C 端 App</span></div>
  </div>
  <div class="vp-compare-row">
    <div>数据本地化</div>
    <div class="vp-good">✅ 完全本地</div>
    <div class="vp-bad">❌ 上传云端</div>
    <div class="vp-bad">❌ 上传云端</div>
  </div>
  <div class="vp-compare-row">
    <div>使用成本</div>
    <div class="vp-good">✅ 一次安装</div>
    <div class="vp-mid">⚠️ 月费 ¥99+</div>
    <div class="vp-mid">⚠️ 积分制</div>
  </div>
  <div class="vp-compare-row">
    <div>模型选择</div>
    <div class="vp-good">✅ 自己配置 API</div>
    <div class="vp-mid">⚠️ 平台固定</div>
    <div class="vp-bad">❌ 单一模型</div>
  </div>
  <div class="vp-compare-row">
    <div>断点续传</div>
    <div class="vp-good">✅ 本地 Checkpoint</div>
    <div class="vp-mid">⚠️ 服务端</div>
    <div class="vp-mid">⚠️ 重新上传</div>
  </div>
  <div class="vp-compare-row">
    <div>离线可用</div>
    <div class="vp-good">✅ 取决于模型</div>
    <div class="vp-bad">❌ 必须联网</div>
    <div class="vp-bad">❌ 必须联网</div>
  </div>
  <div class="vp-compare-row">
    <div>开源协议</div>
    <div class="vp-good">✅ MIT</div>
    <div class="vp-bad">❌ 闭源</div>
    <div class="vp-bad">❌ 闭源</div>
  </div>
  <div class="vp-compare-row">
    <div>团队协作</div>
    <div class="vp-mid">⚠️ 单机优先</div>
    <div class="vp-good">✅ 团队版</div>
    <div class="vp-mid">⚠️ 邀请制</div>
  </div>
</div>

<div class="vp-stats-row">
  <div class="vp-stat">
    <div class="vp-stat-num">5</div>
    <div class="vp-stat-label">天完成漫剧</div>
    <div class="vp-stat-sub">vs 传统 3 个月</div>
  </div>
  <div class="vp-stat">
    <div class="vp-stat-num">72%</div>
    <div class="vp-stat-label">人力成本下降</div>
    <div class="vp-stat-sub">vs 传统流程</div>
  </div>
  <div class="vp-stat">
    <div class="vp-stat-num">30 MB</div>
    <div class="vp-stat-label">安装包体积</div>
    <div class="vp-stat-sub">冷启动 &lt; 1s</div>
  </div>
  <div class="vp-stat">
    <div class="vp-stat-num">10</div>
    <div class="vp-stat-label">步自主流水线</div>
    <div class="vp-stat-sub">全流程自动化</div>
  </div>
</div>

<div class="vp-cta">
  <div class="vp-cta-title">准备好把小说拍成漫剧了吗？</div>
  <div class="vp-cta-sub">3 分钟下载安装，立即开始创作</div>
  <div class="vp-cta-actions">
    <a href="/getting-started/installation" class="vp-cta-btn vp-cta-btn-brand">下载桌面端</a>
    <a href="/getting-started/quick-start" class="vp-cta-btn">3 步跑通</a>
  </div>
</div>

<div class="vp-section-header">
  <h2 class="vp-section-title">📚 文档导航</h2>
  <p class="vp-section-sub">不同角色 · 不同的入口</p>
</div>

<div class="vp-tech-grid">
  <a href="/getting-started/" class="vp-tech-card" style="text-decoration: none; color: inherit;">
    <div class="vp-tech-layer">🆕 第一次使用</div>
    <div class="vp-tech-list" style="margin-top: 12px; font-size: 14px; color: var(--vp-c-text-2);">
      安装 → 3 步跑通 → 配置 API Key
    </div>
  </a>
  <a href="/user-guide/" class="vp-tech-card" style="text-decoration: none; color: inherit;">
    <div class="vp-tech-layer">🎬 创作者</div>
    <div class="vp-tech-list" style="margin-top: 12px; font-size: 14px; color: var(--vp-c-text-2);">
      工作流 · 双模式 · 角色 · 分镜 · 渲染
    </div>
  </a>
  <a href="/api/overview" class="vp-tech-card" style="text-decoration: none; color: inherit;">
    <div class="vp-tech-layer">⚙️ 开发者</div>
    <div class="vp-tech-list" style="margin-top: 12px; font-size: 14px; color: var(--vp-c-text-2);">
      7 大服务 API · 类型完备 · 单例调用
    </div>
  </a>
  <a href="/developer-guide/architecture" class="vp-tech-card" style="text-decoration: none; color: inherit;">
    <div class="vp-tech-layer">🏗️ 架构师</div>
    <div class="vp-tech-list" style="margin-top: 12px; font-size: 14px; color: var(--vp-c-text-2);">
      架构设计 · 模块系统 · ADR 决策
    </div>
  </a>
  <a href="/deployment/" class="vp-tech-card" style="text-decoration: none; color: inherit;">
    <div class="vp-tech-layer">📦 运维</div>
    <div class="vp-tech-list" style="margin-top: 12px; font-size: 14px; color: var(--vp-c-text-2);">
      Tauri 构建 · 三端发布 · 自动更新
    </div>
  </a>
  <a href="/BRAND_GUIDELINES" class="vp-tech-card" style="text-decoration: none; color: inherit;">
    <div class="vp-tech-layer">🎨 品牌</div>
    <div class="vp-tech-list" style="margin-top: 12px; font-size: 14px; color: var(--vp-c-text-2);">
      Logo · 色彩 · 字体 · 资产清单
    </div>
  </a>
</div>

</div>
