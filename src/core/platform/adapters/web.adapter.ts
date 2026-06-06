/**
 * Web Platform Adapter
 *
 * 浏览器环境的降级实现。仅用于开发/调试。
 * 生产部署必须使用 Tauri 桌面端以获得完整体验。
 *
 * 降级策略:
 * - 文件系统: 内存 Map (不持久化) / IndexedDB (持久化)
 * - 对话框: 浏览器原生 (input[type=file] / confirm / alert)
 * - 通知: Notification API (需用户授权)
 * - 窗口: 浏览器窗口控制 (受限)
 * - 路径: 返回 '/' 兜底
 * - Shell: no-op + console.warn
 */

import type {
  OpenFileOptions,
  SaveFileOptions,
  DirInfo,
} from '@/infrastructure/tauri-bridge/commands.types';

import type {
  Platform,
  FsAdapter,
  DialogAdapter,
  NotificationAdapter,
  WindowAdapter,
  PathAdapter,
  ShellAdapter,
} from '../index';

// 内存文件系统 (开发模式不持久化)
const memFs = new Map<string, string>();

class WebFsAdapter implements FsAdapter {
  async readText(path: string): Promise<string> {
    const data = memFs.get(path);
    if (data === undefined) {
      throw new Error(`[Web Platform] File not found: ${path}`);
    }
    return data;
  }

  async writeText(path: string, contents: string): Promise<void> {
    memFs.set(path, contents);
  }

  async fileExists(path: string): Promise<boolean> {
    return memFs.has(path);
  }

  async createDir(_path: string): Promise<void> {
    // no-op in web mode
  }

  async remove(path: string): Promise<void> {
    memFs.delete(path);
  }

  async listDir(path: string): Promise<DirInfo[]> {
    const prefix = path.endsWith('/') ? path : `${path}/`;
    const entries = new Set<string>();
    for (const key of memFs.keys()) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        const name = rest.split('/')[0];
        if (name) entries.add(name);
      }
    }
    return Array.from(entries).map((name) => ({
      name,
      path: `${prefix}${name}`,
      isDirectory: false,
      isFile: true,
    }));
  }
}

class WebDialogAdapter implements DialogAdapter {
  async openFile(options?: OpenFileOptions): Promise<string | string[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (options?.filters) {
        const accepts = options.filters.flatMap((f) => f.extensions.map((e) => `.${e}`));
        input.accept = accepts.join(',');
      }
      input.multiple = options?.multiple ?? false;
      input.onchange = () => {
        if (!input.files) {
          resolve(null);
          return;
        }
        if (options?.multiple) {
          resolve(Array.from(input.files).map((f) => f.name));
        } else {
          resolve(input.files[0]?.name ?? null);
        }
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  async saveFile(_options?: SaveFileOptions): Promise<string | null> {
    // 浏览器无原生 save 对话框,降级到下载
    console.warn('[Web Platform] saveFile: 浏览器环境无原生保存对话框,使用下载代替');
    return null;
  }

  async showMessage(message: string, title?: string): Promise<void> {
    alert(`${title ? `${title}\n\n` : ''}${message}`);
  }

  async showConfirm(message: string, title?: string): Promise<boolean> {
    return window.confirm(`${title ? `${title}\n\n` : ''}${message}`);
  }

  async showAsk(message: string, title?: string): Promise<boolean> {
    return window.confirm(`${title ? `${title}\n\n` : ''}${message}`);
  }
}

class WebNotificationAdapter implements NotificationAdapter {
  async send(title: string, body: string): Promise<void> {
    if (typeof Notification === 'undefined') {
      console.warn('[Web Platform] Notification API not available');
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    }
  }
}

class WebWindowAdapter implements WindowAdapter {
  async minimize(): Promise<void> {
    // 浏览器标签页无法最小化
    console.warn('[Web Platform] minimize: not supported in browser');
  }

  async toggleMaximize(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }

  async close(): Promise<void> {
    window.close();
  }

  async setTitle(title: string): Promise<void> {
    document.title = title;
  }

  async setFullscreen(fullscreen: boolean): Promise<void> {
    if (fullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else if (!fullscreen && document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }

  async setAlwaysOnTop(_alwaysOnTop: boolean): Promise<void> {
    console.warn('[Web Platform] setAlwaysOnTop: not supported in browser');
  }

  async show(): Promise<void> {
    if (document.hidden) {
      window.focus();
    }
  }

  async hide(): Promise<void> {
    console.warn('[Web Platform] hide: not supported in browser (use minimize tab manually)');
  }
}

class WebPathAdapter implements PathAdapter {
  async getAppDir(): Promise<string> {
    return '/';
  }

  async getAppConfigDir(): Promise<string> {
    return '/';
  }

  async getAppDataDir(): Promise<string> {
    return '/';
  }

  async getDocumentDir(): Promise<string | null> {
    return null;
  }

  async getVideoDir(): Promise<string | null> {
    return null;
  }

  async getDownloadDir(): Promise<string | null> {
    return null;
  }
}

class WebShellAdapter implements ShellAdapter {
  async registerGlobalShortcut(_shortcut: string, _handler: () => void): Promise<void> {
    console.warn('[Web Platform] registerGlobalShortcut: not supported in browser');
  }

  async unregisterGlobalShortcut(_shortcut: string): Promise<void> {
    console.warn('[Web Platform] unregisterGlobalShortcut: not supported in browser');
  }

  async isGlobalShortcutRegistered(_shortcut: string): Promise<boolean> {
    return false;
  }

  async checkFFmpeg(): Promise<{ installed: boolean; version?: string }> {
    return { installed: false };
  }
}

export function createWebPlatform(): Platform {
  console.info('[Web Platform] 浏览器降级模式 — 仅用于开发调试。生产请使用 Tauri 桌面端。');
  return {
    runtime: 'web',
    fs: new WebFsAdapter(),
    dialog: new WebDialogAdapter(),
    notification: new WebNotificationAdapter(),
    window: new WebWindowAdapter(),
    path: new WebPathAdapter(),
    shell: new WebShellAdapter(),
  };
}
