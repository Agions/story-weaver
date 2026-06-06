import { defineConfig } from 'vitepress'

/**
 * frame-fab v3.0 VitePress Config
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
      { text: '指南', link: '/getting-started/installation' },
      { text: '用户手册', link: '/user-guide/novel-to-video' },
      { text: '开发者', link: '/developer-guide/architecture' },
      { text: '架构决策', link: '/adr/' },
      { text: '性能基准', link: '/performance/benchmarks' },
      {
        text: '更多',
        items: [
          { text: 'GitHub', link: 'https://github.com/Agions/frame-fab' },
          { text: '下载桌面端', link: 'https://github.com/Agions/frame-fab/releases' },
          { text: '报告问题', link: 'https://github.com/Agions/frame-fab/issues/new' },
        ],
      },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: '快速开始',
          items: [
            { text: '安装', link: '/getting-started/installation' },
            { text: '5 分钟跑通', link: '/getting-started/quickstart' },
            { text: '配置', link: '/getting-started/configuration' },
          ],
        },
      ],
      '/user-guide/': [
        {
          text: '用户手册',
          items: [
            { text: '从小说到视频', link: '/user-guide/novel-to-video' },
            { text: 'Manual 模式', link: '/user-guide/manual-mode' },
            { text: 'Autonomous 模式', link: '/user-guide/autonomous-mode' },
            { text: '质量门禁', link: '/user-guide/quality-gate' },
            { text: '成本控制', link: '/user-guide/cost-control' },
          ],
        },
      ],
      '/developer-guide/': [
        {
          text: '开发者指南',
          items: [
            { text: '架构设计', link: '/developer-guide/architecture' },
            { text: '模块系统', link: '/developer-guide/module-system' },
            { text: 'Pipeline 引擎', link: '/developer-guide/pipeline-engine' },
            { text: 'AI Providers', link: '/developer-guide/ai-providers' },
            { text: '平台适配层', link: '/developer-guide/platform-layer' },
            { text: '贡献指南', link: '/developer-guide/contributing' },
          ],
        },
      ],
      '/adr/': [
        {
          text: '架构决策记录',
          items: [
            { text: 'ADR 索引', link: '/adr/' },
          ],
        },
      ],
      '/performance/': [
        {
          text: '性能基准',
          items: [
            { text: '基准报告', link: '/performance/benchmarks' },
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
