/**
 * Tauri 桥接层 - 类型定义
 * 拆出 types 以减小 commands.ts 体积
 */

// 文件选择选项
export interface OpenFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  multiple?: boolean;
  directory?: boolean;
}

// 保存文件选项
export interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

// 视频剪辑选项
export interface VideoClipOptions {
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
  [key: string]: unknown;
}

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

// 导出选项
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
  transition?: string;
  transitionDuration?: number;
  volume?: number;
  addSubtitles?: boolean;
  exportId?: string;
}

// 导出进度事件
export interface ExportProgress {
  exportId: string;
  stage: 'preparing' | 'processing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

// 导出进度回调
export type ExportProgressCallback = (progress: ExportProgress) => void;

export interface DirInfo {
  name: string;
  path: string;
  isDirectory: boolean;
}
