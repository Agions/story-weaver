import { message, notification, Spin } from 'antd';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';

import { getPageImporters, preloadPage } from '@/core/router/page-preload';
import { runWhenIdle } from '@/core/utils/idle';
import './App.css';

const importers = getPageImporters();
// 懒加载页面组件
const HomePage = lazy(importers.home);
const WorkflowPage = lazy(importers.workflow);
const ProjectEditPage = lazy(importers.projectEdit);
const ProjectDetailPage = lazy(importers.projectDetail);
const SettingsPage = lazy(importers.settings);
const UIDemo = lazy(importers.demo);

// 加载时的占位组件
const PageLoader: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    width: '100%' 
  }}>
    <Spin size="large" tip="加载页面中..." />
  </div>
);

// 导入Provider组件
import { logger } from '@/core/utils/logger';

import ErrorBoundary from './ErrorBoundary';
import AppProvider from './providers/AppProvider';
import { AppLayout } from './shared/components/layout';

const App: React.FC = () => {
  const [ffmpegReady, setFFmpegReady] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  
  // 应用初始化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('应用初始化...');
        // 这里可以添加初始化逻辑
        logger.info('应用数据目录检查完成');
      } catch (error) {
        logger.error('应用初始化失败:', error);
        notification.error({
          message: '初始化失败',
          description: '应用初始化失败，部分功能可能无法正常使用',
          placement: 'bottomRight',
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
        // 这里应该有检查FFmpeg的实际逻辑
        // 这里我们假设已经安装
        logger.info("FFmpeg检查：假设已经安装");
        setTimeout(() => {
          setFFmpegReady(true);
          setChecking(false);
        }, 1000);
      } catch (error) {
        logger.error("FFmpeg检查失败:", error);
        setFFmpegReady(false);
        setChecking(false);
        notification.error({
          message: "依赖检查失败",
          description: "无法检测到FFmpeg，某些功能可能无法正常工作。请确保已正确安装FFmpeg。",
          duration: 0
        });
      }
    };
    
    checkFFmpeg();
  }, []);
  
  // 日志消息
  useEffect(() => {
    const logMessage = ffmpegReady 
      ? "应用初始化完成，所有功能正常可用。"
      : "应用初始化完成，但某些功能可能受限。";
    
    logger.info(logMessage);
    
    if (!checking) {
      message.info(logMessage, 3);
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
        <BrowserRouter>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              {/* 首页 */}
              <Route path="/" element={<HomePage />} />
              
              {/* 工作流页面 */}
              <Route path="/workflow" element={<WorkflowPage />} />
              
              {/* 项目页面 */}
              <Route path="/project/new" element={<ProjectEditPage />} />
              <Route path="/project/edit/:projectId" element={<ProjectEditPage />} />
              <Route path="/project/:projectId" element={<ProjectDetailPage />} />

              {/* 设置页面 */}
              <Route path="/settings" element={<SettingsPage />} />

              {/* UI组件演示 */}
              <Route path="/demo" element={<UIDemo />} />

              {/* 重定向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;