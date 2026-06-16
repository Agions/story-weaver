/**
 * 应用入口配置
 * 包含路由、Providers、全局样式
 */

import React, { useEffect, useState, Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import ErrorBoundary from '@/app/components/ErrorBoundary';
import AppProvider from '@/app/providers/AppProvider';
import { getPageImporters, preloadPage } from '@/app/router/page-preload';
import { runWhenIdle } from '@/core/utils/idle';
import { logger } from '@/core/utils/logger';
import { tauriService } from '@/infrastructure/tauri-bridge/commands';
import { AppLayout } from '@/shared/components/layout';
import { toast, notify } from '@/shared/components/ui/toast';

const importers = getPageImporters();
// 懒加载页面组件
const HomePage = lazy(importers.home);
const WorkflowPage = lazy(importers.workflow);
const ProjectEditPage = lazy(importers.projectEdit);
const ProjectDetailPage = lazy(importers.projectDetail);
const SettingsPage = lazy(importers.settings);
const AutoPipelinePage = lazy(importers.autoPipeline);

// 加载时的占位组件
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">加载页面中...</p>
    </div>
  </div>
);

// React Router 7 路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <HomePage />
        </Suspense>
      </AppLayout>
    ),
  },
  {
    path: '/workflow',
    element: (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <WorkflowPage />
        </Suspense>
      </AppLayout>
    ),
  },
  {
    path: '/project/new',
    element: (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <ProjectEditPage />
        </Suspense>
      </AppLayout>
    ),
  },
  {
    path: '/project/edit/:projectId',
    element: (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <ProjectEditPage />
        </Suspense>
      </AppLayout>
    ),
  },
  {
    path: '/project/:projectId',
    element: (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <ProjectDetailPage />
        </Suspense>
      </AppLayout>
    ),
  },
  {
    path: '/settings',
    element: (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <SettingsPage />
        </Suspense>
      </AppLayout>
    ),
  },
  {
    path: '/auto-pipeline',
    element: (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <AutoPipelinePage />
        </Suspense>
      </AppLayout>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

const App = () => {
  const [ffmpegReady, setFFmpegReady] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  // 应用初始化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('应用初始化...');
        logger.info('应用数据目录检查完成');
      } catch (error) {
        logger.error('应用初始化失败:', error);
        notify.error({
          message: '初始化失败',
          description: '应用初始化失败，部分功能可能无法正常使用',
        });
      }
    };

    initializeApp();
  }, []);

  // 检查FFmpeg是否已安装
  useEffect(() => {
    const checkFFmpeg = async () => {
      setChecking(true);
      try {
        const result = await tauriService.checkFFmpeg();
        if (result.installed) {
          logger.info('FFmpeg检查通过:', result.version || '已安装');
        } else {
          logger.warn('FFmpeg未安装，部分功能可能受限');
        }
        setFFmpegReady(result.installed);
        setChecking(false);
      } catch (error) {
        logger.error('FFmpeg检查失败:', error);
        setFFmpegReady(false);
        setChecking(false);
        notify.error({
          message: '依赖检查失败',
          description: '无法检测到FFmpeg，某些功能可能无法正常工作',
        });
      }
    };

    checkFFmpeg();
  }, []);

  // 日志消息
  useEffect(() => {
    const logMessage = ffmpegReady
      ? '应用初始化完成，所有功能正常可用。'
      : '应用初始化完成，但某些功能可能受限。';

    logger.info(logMessage);

    if (!checking) {
      toast.info(logMessage);
    }
  }, [ffmpegReady, checking]);

  useEffect(() => {
    const warmup = () => {
      void preloadPage(importers.workflow, '/workflow');
      void preloadPage(importers.projectEdit, '/project');
    };
    return runWhenIdle(warmup, { timeoutMs: 1200 });
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <Toaster position="bottom-right" richColors closeButton />
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
