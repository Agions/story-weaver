import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [
    react(),
    // Gzip 压缩
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
    }),
    // Brotli 压缩（更好的压缩率）
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
    }),
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
      exclude: [
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
      ],
    },
    ssr: {
      external: [
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
      ],
    },
  },

  preview: {
    port: 1420,
    strictPort: true,
  },

  css: {
    devSourcemap: true,
    minify: true,
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#1890ff',
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@frame-forge/common': path.resolve(__dirname, './packages/common/src'),
    },
  },

  build: {
    minify: 'terser',
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      external: [
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
      ],
      output: {
        manualChunks: (id) => {
          // React 核心库
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // 路由库
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          // 状态管理
          if (id.includes('node_modules/zustand')) {
            return 'state-vendor';
          }
          // UI 工具库
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          // 动画库
          if (id.includes('node_modules/framer-motion')) {
            return 'animation-vendor';
          }
          // 工具库
          if (
            id.includes('node_modules/lodash') ||
            id.includes('node_modules/date-fns') ||
            id.includes('node_modules/dayjs')
          ) {
            return 'utils-vendor';
          }
          // HTTP 客户端
          if (id.includes('node_modules/axios')) {
            return 'http-vendor';
          }
          // 表单库
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
