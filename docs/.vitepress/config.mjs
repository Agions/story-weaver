import { defineConfig } from 'vitepress'

/**
 * frame-fab v2.2.3 VitePress Config
 *
 * Default appearance: light. Dark theme is opt-in via nav toggle.
 * Base path: /frame-fab/ (GitHub Pages repo, not user/org site).
 */
export default defineConfig({
  title: 'frame-fab',
  description: 'AI 漫剧创作平台 — 输入一本小说，AI 自动把它拍成一部漫剧',
  srcDir: '.',
  srcExclude: ['plans/**', 'ui-redesign/**', '**/node_modules/**'],
  lang: 'zh-CN',
  appearance: 'light',
  cleanUrls: true,
  ignoreDeadLinks: true,
  base: '/frame-fab/',

  // v3.1: Markdown-it options for better link handling
  markdown: {
    lineNumbers: true,        // Enable line numbers in code blocks (Shiki)
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    // NOTE: markdown-it-anchor 4.x 用 permalink: false 关闭自动 anchor link,
    //       v2.2.3 已不需要 permalinkSymbol (旧 API)
    anchor: false,
    toc: {
      level: [2, 3, 4],       // Include h4 in TOC
      permalink: false,
    },
  },

  head: [
    // Favicon (multi-size for cross-platform)
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon-256x256.png' }],

    // Theme color (mobile browser chrome)
    ['meta', { name: 'theme-color', content: '#0B0E2C' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],

    // Open Graph (Facebook, LinkedIn, Discord, Slack)
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'frame-fab - AI 漫剧创作平台' }],
    ['meta', { property: 'og:description', content: '基于 Tauri 2.1 桌面端 + 多模型 AI 编排的端到端 AI 漫剧创作工作台' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { property: 'og:image:width', content: '1280' }],
    ['meta', { property: 'og:image:height', content: '640' }],
    ['meta', { property: 'og:image:alt', content: 'frame-fab — AI 漫剧创作平台' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:site_name', content: 'frame-fab' }],

    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'frame-fab - AI 漫剧创作平台' }],
    ['meta', { name: 'twitter:description', content: '输入一本小说，AI 自动把它拍成一部漫剧。基于 Tauri 2.1 桌面端 + 多模型 AI 编排。' }],
    ['meta', { name: 'twitter:image', content: '/og-image.png' }],
    ['meta', { name: 'twitter:creator', content: '@Agions' }],

    // SEO
    ['meta', { name: 'description', content: 'frame-fab - AI 漫剧创作平台。基于 Tauri 2.1 桌面端，集成多模型 AI 实现从小说/剧本到成片的端到端自动化。' }],
    ['meta', { name: 'keywords', content: 'frame-fab, AI漫剧, 漫剧创作, Tauri, 桌面应用, 多模型AI, 分镜设计, 角色一致性, TTS, FFmpeg' }],
    ['meta', { name: 'author', content: 'Agions' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'frame-fab' },
    siteTitle: 'frame-fab',

    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/getting-started/installation' },
      { text: '用户手册', link: '/user-guide/' },
      { text: 'API 文档', link: '/api/overview' },
      { text: '开发者', link: '/developer-guide/architecture' },
      {
        text: '更多',
        items: [
          { text: 'GitHub', link: 'https://github.com/Agions/frame-fab' },
          { text: '下载桌面端', link: 'https://github.com/Agions/frame-fab/releases' },
          { text: '报告问题', link: 'https://github.com/Agions/frame-fab/issues/new' },
          { text: '品牌资产', link: '/BRAND_GUIDELINES' },
        ],
      },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: '快速开始',
          items: [
            { text: '总览', link: '/getting-started/' },
            { text: '安装指南', link: '/getting-started/installation' },
            { text: '3 步跑通', link: '/getting-started/quick-start' },
            { text: '配置 API Key', link: '/getting-started/configuration' },
          ],
        },
      ],
      '/user-guide/': [
        {
          text: '用户指南',
          items: [
            { text: '总览', link: '/user-guide/' },
            { text: '工作流概览', link: '/user-guide/workflow-overview' },
            { text: 'Autonomous 模式', link: '/user-guide/autonomous-mode' },
            { text: 'Manual 模式', link: '/user-guide/manual-mode' },
            { text: '导入与分析', link: '/user-guide/import-analysis' },
            { text: '脚本生成', link: '/user-guide/script-generation' },
            { text: '角色设计', link: '/user-guide/character-design' },
            { text: '分镜设计', link: '/user-guide/storyboard-design' },
            { text: '渲染与导出', link: '/user-guide/rendering-export' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 文档',
          items: [
            { text: '总览', link: '/api/' },
            { text: 'API 概述', link: '/api/overview' },
            { text: 'AI 服务', link: '/api/ai-service' },
            { text: '图像生成', link: '/api/image-generation' },
            { text: 'TTS 服务', link: '/api/tts-service' },
            { text: '流水线', link: '/api/pipeline-service' },
            { text: '字幕服务', link: '/api/subtitle-service' },
          ],
        },
      ],
      '/developer-guide/': [
        {
          text: '开发者指南',
          items: [
            { text: '总览', link: '/developer-guide/' },
            { text: '架构设计', link: '/developer-guide/architecture' },
            { text: '项目结构', link: '/developer-guide/project-structure' },
            { text: '模块系统', link: '/developer-guide/module-system' },
            { text: '服务清单', link: '/developer-guide/services' },
            { text: 'Pipeline 引擎', link: '/developer-guide/pipeline-api' },
            { text: 'AI Providers', link: '/developer-guide/ai-providers' },
            { text: '平台适配层', link: '/developer-guide/platform-layer' },
            { text: 'Autonomous API', link: '/developer-guide/autonomous-api' },
          ],
        },
      ],
      '/deployment/': [
        {
          text: '部署文档',
          items: [
            { text: '总览', link: '/deployment/' },
            { text: '构建与发布', link: '/deployment/build' },
            { text: '环境变量', link: '/deployment/environment' },
            { text: 'Docker 开发环境', link: '/deployment/docker' },
          ],
        },
      ],
      '/performance/': [
        {
          text: '性能基准',
          items: [
            { text: 'v2.2.3 基准报告', link: '/performance/benchmark-v2.2.3' },
            { text: 'v2.2.0 历史报告', link: '/performance/benchmark-v2.2.0' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Agions/frame-fab' },
    ],

    footer: {
      message: '基于 MIT 协议开源 · 由 Agions & 社区维护',
      copyright: `© 2024-${new Date().getFullYear()} frame-fab`,
    },

    outline: {
      level: [2, 3],
      label: '本页大纲',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    editLink: {
      pattern: 'https://github.com/Agions/frame-fab/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    lastUpdatedText: '最后更新',
  },
})
