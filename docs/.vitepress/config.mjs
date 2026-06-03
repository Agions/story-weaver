import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'FrameForge',
  description: 'AI 驱动的视频创作工作室 — 将小说、剧本或提示词转化为专业级视频内容',
  srcDir: '.',
  srcExclude: ['plans/**', 'ui-redesign/**'],
  lang: 'zh-CN',
  appearance: 'light', // default to light theme; user can toggle to dark
  cleanUrls: true,
  ignoreDeadLinks: true,
  base: '/frame-fab/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0a0e27' }],
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'FrameForge - AI 驱动的视频创作工作室' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '基于 Tauri 2.1 桌面端 + 多模型 AI 编排的端到端视频创作工作台。',
      },
    ],
    ['meta', { property: 'og:image', content: '/logo.svg' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'FrameForge - AI 驱动的视频创作工作室' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content: '基于 Tauri 2.1 桌面端 + 多模型 AI 编排的端到端视频创作工作台。',
      },
    ],
    ['meta', { name: 'twitter:image', content: '/logo.svg' }],
  ],
  themeConfig: {
    siteTitle: 'FrameForge',
    logo: { src: '/logo-horizontal.svg', alt: 'FrameForge' },
    nav: [
      { text: '快速开始', link: '/getting-started/quick-start' },
      { text: '用户指南', link: '/user-guide/workflow-overview' },
      { text: '开发指南', link: '/developer-guide/architecture' },
      { text: 'API', link: '/api/overview' },
      { text: '架构决策', link: '/adr/0001-tauri-desktop-architecture' },
    ],
    sidebar: {
      '/getting-started/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/getting-started/quick-start' },
            { text: '安装', link: '/getting-started/installation' },
            { text: '配置', link: '/getting-started/configuration' },
          ],
        },
      ],
      '/user-guide/': [
        {
          text: '用户指南',
          items: [
            { text: '工作流程', link: '/user-guide/workflow-overview' },
            { text: '导入与分析', link: '/user-guide/import-analysis' },
            { text: '脚本生成', link: '/user-guide/script-generation' },
            { text: '分镜设计', link: '/user-guide/storyboard-design' },
            { text: '角色设计', link: '/user-guide/character-design' },
            { text: '渲染导出', link: '/user-guide/rendering-export' },
          ],
        },
      ],
      '/developer-guide/': [
        {
          text: '开发指南',
          items: [
            { text: '架构', link: '/developer-guide/architecture' },
            { text: '项目结构', link: '/developer-guide/project-structure' },
            { text: '服务', link: '/developer-guide/services' },
          ],
        },
      ],
      '/deployment/': [
        {
          text: '部署',
          items: [
            { text: '构建', link: '/deployment/build' },
            { text: '环境变量', link: '/deployment/environment' },
            { text: 'Docker', link: '/deployment/docker' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概述', link: '/api/overview' },
            { text: 'AI 服务', link: '/api/ai-service' },
            { text: '图像生成', link: '/api/image-generation' },
            { text: 'TTS 服务', link: '/api/tts-service' },
            { text: '流水线', link: '/api/pipeline-service' },
          ],
        },
      ],
      '/adr/': [
        {
          text: '架构决策记录 (ADR)',
          items: [
            { text: '0001 Tauri 桌面优先', link: '/adr/0001-tauri-desktop-architecture' },
            { text: '0002 Monorepo + DDD', link: '/adr/0002-frontend-monorepo-ddd' },
          ],
        },
      ],
      '/performance/': [
        {
          text: '性能基准',
          items: [
            { text: 'v2.2.0 基准报告', link: '/performance/benchmark-v2.2.0' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Agions/frame-fab' },
    ],
    footer: {
      message: 'MIT License © 2024-2026 Agions · FrameForge',
      copyright: '基于 Tauri 2.1 + React 18 + Rust 构建',
    },
    search: { provider: 'local' },
  },
})
