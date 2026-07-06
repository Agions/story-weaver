/**
 * Tauri 桥接层 - 类型定义
 * 拆出 types 以减小 commands.ts 体积
 */

// 文件选择选项 (re-export from features/video-export/services/tauri-types)
export type { OpenFileOptions } from '@/features/video-export/services/tauri-types';

// 保存文件选项 (re-export from features/video-export/services/tauri-types)
export type { SaveFileOptions } from '@/features/video-export/services/tauri-types';

// 视频剪辑选项 (re-export from features/video-export/services/tauri-types)
export type { VideoClipOptions } from '@/features/video-export/services/tauri-types';

// 预览选项
export interface PreviewOptions {
  inputPath: string;
  segment: {
    start: number;
    end: number;
    type: string;
  };
  transition?: string;
  transitionDuration?: number;
  volume?: number;
  addSubtitles?: boolean;
  [key: string]: unknown;
}

// 导出选项 (re-export from features/video-export/services/tauri-types)
export type { ExportOptions } from '@/features/video-export/services/tauri-types';

// 导出进度事件
export interface ExportProgress {
  exportId: string;
  stage: 'preparing' | 'processing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

// 导出进度回调 (re-export from features/video-export/services/tauri-types)
export type { ExportProgressCallback } from '@/features/video-export/services/tauri-types';

// 目录条目 (re-export from features/video-export/services/tauri-types)
export type { DirInfo } from '@/features/video-export/services/tauri-types';

// analyzeVideo 参数
export type AnalyzeVideoOptions = {
  path: string;
};
