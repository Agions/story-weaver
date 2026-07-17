/**
 * Tauri 桥接层 - 类型定义
 * 类型统一在本文件自包含，不再反向依赖 features 层
 */

/** 文件打开对话框选项 */
export interface OpenFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  multiple?: boolean;
  directory?: boolean;
}

/** 文件保存对话框选项 */
export interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

/** 视频切片后端命令选项 */
export interface VideoClipOptions {
  [key: string]: unknown;
  inputPath: string;
  outputPath: string;
  segments: Array<{
    start: number;
    end: number;
    type: string;
    content?: string;
  }>;
  quality: 'low' | 'medium' | 'high';
  format: string;
  transition?: string;
  transitionDuration?: number;
  volume?: number;
  addSubtitles?: boolean;
}

/** 预览选项 */
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

/** 视频导出后端命令选项 */
export interface ExportOptions {
  inputPath: string;
  outputPath: string;
  segments: Array<{
    start: number;
    end: number;
    type: string;
    content?: string;
  }>;
  quality: 'low' | 'medium' | 'high';
  format: string;
  exportId?: string;
  transition?: string;
  transitionDuration?: number;
  volume?: number;
  addSubtitles?: boolean;
}

/** 导出进度事件 */
export interface ExportProgress {
  exportId: string;
  stage: 'preparing' | 'processing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

/** 导出进度回调 */
export type ExportProgressCallback = (progress: ExportProgress) => void;

/** 目录条目 */
export interface DirInfo {
  name: string;
  path: string;
  isDirectory: boolean;
}

/** analyzeVideo 参数 */
export type AnalyzeVideoOptions = {
  path: string;
};
