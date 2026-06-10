/**
 * Tauri Service 类型定义集中
 * ===========================
 * 把分散在 tauri.service.ts 顶部的 12 个 interface 全部归类到这里。
 * 单一职责：类型声明，无运行时逻辑。
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

/** 视频预览后端命令选项 */
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
  transition?: string;
  transitionDuration?: number;
  volume?: number;
  addSubtitles?: boolean;
  exportId?: string;
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

/** 窗口状态 */
export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
}

/** 通知选项 */
export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
}

/** 托盘菜单项 */
export interface TrayMenuItem {
  id: string;
  label: string;
  enabled?: boolean;
  checked?: boolean;
  accelerator?: string;
}

/** 快捷键定义 */
export interface ShortcutDefinition {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: () => void;
}
