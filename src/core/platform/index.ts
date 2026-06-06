/**
 * Platform Adapter - 统一运行时抽象层
 *
 * 业务代码应优先使用 `platform` 而不是直接调用 Tauri API。
 * 这样可以:
 * 1. Web 模式下开发不崩溃 (Tauri API 在浏览器中不存在)
 * 2. 测试时方便 mock
 * 3. 未来扩展 (Mobile / VSCode / Cloud) 零成本
 *
 * ## 用法
 *
 * ```typescript
 * import { platform } from '@/core/platform';
 *
 * // ✅ 跨平台
 * const text = await platform.fs.readText('/path/to/file');
 *
 * // ✅ 运行时判断
 * if (platform.runtime === 'tauri') {
 *   // 仅 Tauri 功能
 * }
 * ```
 *
 * ## 渐进迁移
 *
 * v3.0 阶段保留 `tauriService` 作为底层实现, `platform` 包装它。
 * 业务代码继续用 tauriService 也行, 新代码建议用 platform。
 * 后续 Phase 会逐个 service 替换。
 *
 * @see docs/developer-guide/platform-layer.md
 * @see docs/adr/0003-platform-adapter.md
 */

export type PlatformRuntime = 'tauri' | 'web' | 'unknown';

export interface FsAdapter {
  /** 读取文本文件 */
  readText(path: string): Promise<string>;

  /** 写入文本文件 */
  writeText(path: string, contents: string): Promise<void>;

  /** 检查文件/目录是否存在 */
  fileExists(path: string): Promise<boolean>;

  /** 创建目录 */
  createDir(path: string): Promise<void>;

  /** 删除文件/目录 */
  remove(path: string): Promise<void>;

  /** 列出目录内容 */
  listDir(path: string): Promise<DirInfo[]>;
}

export interface DialogAdapter {
  /** 打开文件选择对话框 */
  openFile(options?: OpenFileOptions): Promise<string | string[] | null>;

  /** 打开保存对话框 */
  saveFile(options?: SaveFileOptions): Promise<string | null>;

  /** 显示消息框 */
  showMessage(message: string, title?: string): Promise<void>;

  /** 显示确认框 (确定/取消) */
  showConfirm(message: string, title?: string): Promise<boolean>;

  /** 显示询问框 (是/否) */
  showAsk(message: string, title?: string): Promise<boolean>;
}

export interface NotificationAdapter {
  /** 发送桌面通知 */
  send(title: string, body: string): Promise<void>;
}

export interface WindowAdapter {
  /** 最小化窗口 */
  minimize(): Promise<void>;

  /** 最大化/还原 */
  toggleMaximize(): Promise<void>;

  /** 关闭窗口 */
  close(): Promise<void>;

  /** 设置标题 */
  setTitle(title: string): Promise<void>;

  /** 设置全屏 */
  setFullscreen(fullscreen: boolean): Promise<void>;

  /** 设置置顶 */
  setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;

  /** 显示窗口 */
  show(): Promise<void>;

  /** 隐藏窗口 */
  hide(): Promise<void>;
}

export interface PathAdapter {
  /** 应用根目录 */
  getAppDir(): Promise<string>;

  /** 应用配置目录 */
  getAppConfigDir(): Promise<string>;

  /** 应用数据目录 */
  getAppDataDir(): Promise<string>;

  /** 文档目录 */
  getDocumentDir(): Promise<string | null>;

  /** 视频目录 */
  getVideoDir(): Promise<string | null>;

  /** 下载目录 */
  getDownloadDir(): Promise<string | null>;
}

export interface ShellAdapter {
  /** 注册全局快捷键 */
  registerGlobalShortcut(shortcut: string, handler: () => void): Promise<void>;

  /** 注销全局快捷键 */
  unregisterGlobalShortcut(shortcut: string): Promise<void>;

  /** 检查快捷键是否已注册 */
  isGlobalShortcutRegistered(shortcut: string): Promise<boolean>;

  /** 检查 FFmpeg 是否已安装 */
  checkFFmpeg(): Promise<{ installed: boolean; version?: string }>;
}

export interface Platform {
  /** 当前运行时 */
  readonly runtime: PlatformRuntime;

  /** 文件系统 */
  readonly fs: FsAdapter;

  /** 对话框 */
  readonly dialog: DialogAdapter;

  /** 通知 */
  readonly notification: NotificationAdapter;

  /** 窗口控制 */
  readonly window: WindowAdapter;

  /** 路径获取 */
  readonly path: PathAdapter;

  /** Shell / 快捷键 */
  readonly shell: ShellAdapter;
}

// ============ Re-export types from tauri-bridge for consumers ============
import type {
  OpenFileOptions,
  SaveFileOptions,
  DirInfo,
} from '@/infrastructure/tauri-bridge/commands.types';
export type { OpenFileOptions, SaveFileOptions, DirInfo };

// ============ 工厂函数 ============

/**
 * 检测当前是否在 Tauri 环境中
 * 通过 window.__TAURI__ 或 window.__TAURI_INTERNALS__ 判断
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  // Tauri 2.x 注入的全局对象 (__TAURI__ 或 __TAURI_INTERNALS__)
  const w = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown };
  return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__);
}

/**
 * 平台实例 (单例)
 * - 在 Tauri 桌面端: 包装 tauriService
 * - 在 Web 浏览器中: 降级实现 (内存/IndexedDB)
 */
let _platformInstance: Platform | null = null;

// `require` 在 ESM 中需要此 workaround 来绕过 @typescript-eslint/no-require-imports
// 我们必须在运行时动态加载, 不能用静态 import, 否则 Web 模式会触发 Tauri 模块导入
// (Tauri 模块在浏览器中会抛 "window.__TAURI_INTERNALS__ is undefined")

const dynamicRequire = (mod: string): unknown => eval('require')(mod);

function loadPlatform(): Platform {
  if (_platformInstance) return _platformInstance;

  let platform: Platform;
  if (isTauri()) {
    const { createTauriPlatform } = dynamicRequire(
      './adapters/tauri.adapter'
    ) as typeof import('./adapters/tauri.adapter');
    platform = createTauriPlatform();
  } else {
    const { createWebPlatform } = dynamicRequire(
      './adapters/web.adapter'
    ) as typeof import('./adapters/web.adapter');
    platform = createWebPlatform();
  }
  _platformInstance = platform;
  return platform;
}

export function getPlatform(): Platform {
  return loadPlatform();
}

/**
 * 便捷访问: 等价于 getPlatform() 但更短
 *
 * ```typescript
 * import { platform } from '@/core/platform';
 * await platform.fs.readText('/path');
 * ```
 */
export const platform: Platform = new Proxy({} as Platform, {
  get(_target, prop) {
    return Reflect.get(loadPlatform(), prop);
  },
});

// ============ 测试辅助 ============

/**
 * 重置单例 (仅供测试使用)
 * @internal
 */
export function __resetPlatformForTesting(): void {
  _platformInstance = null;
}

/**
 * 注入 mock platform (仅供测试使用)
 * @internal
 */
export function __setPlatformForTesting(mock: Platform): void {
  _platformInstance = mock;
}
