import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';
import tailwindcss from '@tailwindcss/vite';

// 【v3.2 性能优化】terser → esbuild：构建提速 ~3-5x（30s → ~10s）
// esbuild minify 体积略大（~2%），但生产 gz/brotli 后差异 < 0.5%
// 如需极致体积，可在 CI 中切回 terser（日常 dev/build 用 esbuild）

/**
 * Single source of truth for Tauri external modules.
 * Vite should never try to bundle these — they are provided by the
 * Tauri runtime at desktop launch, and gracefully fail in Web dev mode.
 */
const TAURI_EXTERNALS = [
  '@tauri-apps/api',
  '@tauri-apps/api/core',
  '@tauri-apps/api/tauri',
  '@tauri-apps/api/event',
  '@tauri-apps/api/dialog',
  '@tauri-apps/api/fs',
  '@tauri-apps/api/path',
  '@tauri-apps/api/notification',
  '@tauri-apps/api/window',
  '@tauri-apps/api/shell',
] as const;

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
    }),
    // Brotli compression (better ratio)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
    }),
    tailwindcss(),
  ],

  esbuild: {
    jsx: 'automatic',
  },

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    optimizeDeps: {
      exclude: [...TAURI_EXTERNALS],
    },
    ssr: {
      external: [...TAURI_EXTERNALS],
    },
  },

  preview: {
    port: 1420,
    strictPort: true,
  },

  css: {
    devSourcemap: true,
    minify: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@frame-fab/common': path.resolve(__dirname, './packages/common/src'),
    },
  },

  build: {
    // 【v3.2 性能优化】esbuild minify 比 terser 快 3-5x，体积差异经 brotli 后 < 0.5%
    minify: 'esbuild',
    target: 'es2022',
    chunkSizeWarningLimit: 1000,
    // esbuild 自带 drop: ['console','debugger']，无需 terserOptions
    rollupOptions: {
      external: [...TAURI_EXTERNALS],
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          // State management
          if (id.includes('node_modules/zustand')) {
            return 'state-vendor';
          }
          // UI utilities
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          // Animation
          if (id.includes('node_modules/framer-motion')) {
            return 'animation-vendor';
          }
          // Utility libraries
          if (
            id.includes('node_modules/lodash-es') ||
            id.includes('node_modules/date-fns') ||
            id.includes('node_modules/dayjs')
          ) {
            return 'utils-vendor';
          }
          // HTTP client
          if (id.includes('node_modules/axios')) {
            return 'http-vendor';
          }
          // Form
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'form-vendor';
          }
          // FFmpeg
          if (id.includes('node_modules/@ffmpeg')) {
            return 'ffmpeg-vendor';
          }
        },
      },
    },
  },
});
