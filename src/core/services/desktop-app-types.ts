/**
 * Desktop App Service 类型定义
 *
 * 从 desktop-app-service.ts 提取的 4 个 interface：
 *   - ShortcutDefinition    快捷键定义
 *   - TrayMenuItem          托盘菜单项（保留备用，类内未实例化）
 *   - NotificationOptions   通知选项
 *   - WindowState           窗口状态快照
 */

export interface ShortcutDefinition {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description?: string;
}

export interface TrayMenuItem {
  id: string;
  label: string;
  enabled?: boolean;
  visible?: boolean;
  action?: () => void;
}

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  sound?: string;
}

export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  isAlwaysOnTop: boolean;
  isFocused: boolean;
  title: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
}

/** 平台类型（用于 getPlatform 返回值） */
export type Platform = 'windows' | 'macos' | 'linux' | 'unknown';
