/**
 * Tauri Service 类型定义
 * 单一来源：@/infrastructure/tauri-bridge/commands-types
 * 本文件保留 re-export 以维持向后兼容
 */

export type {
  OpenFileOptions,
  SaveFileOptions,
  VideoClipOptions,
  PreviewOptions,
  ExportOptions,
  ExportProgress,
  ExportProgressCallback,
  DirInfo,
} from '@/infrastructure/tauri-bridge/commands-types';

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
