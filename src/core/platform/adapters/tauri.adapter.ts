/**
 * Tauri Platform Adapter
 *
 * 包装现有的 tauriService (src/infrastructure/tauri-bridge/commands.ts),
 * 实现 Platform 接口。这样:
 * 1. 业务代码使用 `platform` 统一接口
 * 2. 底层继续用 Tauri 实现, 不破坏现有调用
 * 3. Web 模式自动切换到降级实现
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

// 动态导入避免在 Web 模式下加载 Tauri 桥接
// (Tauri 模块在浏览器中会抛 "window.__TAURI_INTERNALS__ is undefined")
let _tauriService: any = null;

async function getTauriService() {
  if (_tauriService) return _tauriService;
  const mod = await import('@/infrastructure/tauri-bridge/commands');
  _tauriService = mod.default;
  return _tauriService;
}

class TauriFsAdapter implements FsAdapter {
  async readText(path: string): Promise<string> {
    const svc = await getTauriService();
    return svc.readText(path);
  }

  async writeText(path: string, contents: string): Promise<void> {
    const svc = await getTauriService();
    return svc.writeText(path, contents);
  }

  async fileExists(path: string): Promise<boolean> {
    const svc = await getTauriService();
    return svc.fileExists(path);
  }

  async createDir(path: string): Promise<void> {
    const svc = await getTauriService();
    return svc.createDir(path);
  }

  async remove(path: string): Promise<void> {
    const svc = await getTauriService();
    return svc.removePath(path);
  }

  async listDir(path: string): Promise<DirInfo[]> {
    const svc = await getTauriService();
    return svc.listDir(path);
  }
}

class TauriDialogAdapter implements DialogAdapter {
  async openFile(options?: OpenFileOptions): Promise<string | string[] | null> {
    const svc = await getTauriService();
    return svc.openFile(options);
  }

  async saveFile(options?: SaveFileOptions): Promise<string | null> {
    const svc = await getTauriService();
    return svc.saveFile(options);
  }

  async showMessage(message: string, title?: string): Promise<void> {
    const svc = await getTauriService();
    return svc.showMessage(message, title);
  }

  async showConfirm(message: string, title?: string): Promise<boolean> {
    const svc = await getTauriService();
    return svc.showConfirm(message, title);
  }

  async showAsk(message: string, title?: string): Promise<boolean> {
    const svc = await getTauriService();
    return svc.showAsk(message, title);
  }
}

class TauriNotificationAdapter implements NotificationAdapter {
  async send(title: string, body: string): Promise<void> {
    const svc = await getTauriService();
    return svc.notify(title, body);
  }
}

class TauriWindowAdapter implements WindowAdapter {
  async minimize(): Promise<void> {
    const svc = await getTauriService();
    return svc.minimize();
  }

  async toggleMaximize(): Promise<void> {
    const svc = await getTauriService();
    return svc.toggleMaximize();
  }

  async close(): Promise<void> {
    const svc = await getTauriService();
    return svc.close();
  }

  async setTitle(title: string): Promise<void> {
    const svc = await getTauriService();
    return svc.setTitle(title);
  }

  async setFullscreen(fullscreen: boolean): Promise<void> {
    const svc = await getTauriService();
    return svc.setFullscreen(fullscreen);
  }

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    const svc = await getTauriService();
    return svc.setAlwaysOnTop(alwaysOnTop);
  }

  async show(): Promise<void> {
    const svc = await getTauriService();
    return svc.showWindow();
  }

  async hide(): Promise<void> {
    const svc = await getTauriService();
    return svc.hideWindow();
  }
}

class TauriPathAdapter implements PathAdapter {
  async getAppDir(): Promise<string> {
    const svc = await getTauriService();
    return svc.getAppDir();
  }

  async getAppConfigDir(): Promise<string> {
    const svc = await getTauriService();
    return svc.getAppConfigDir();
  }

  async getAppDataDir(): Promise<string> {
    const svc = await getTauriService();
    return svc.getAppDataDir();
  }

  async getDocumentDir(): Promise<string | null> {
    const svc = await getTauriService();
    return svc.getDocumentDir();
  }

  async getVideoDir(): Promise<string | null> {
    const svc = await getTauriService();
    return svc.getVideoDir();
  }

  async getDownloadDir(): Promise<string | null> {
    const svc = await getTauriService();
    return svc.getDownloadDir();
  }
}

class TauriShellAdapter implements ShellAdapter {
  async registerGlobalShortcut(shortcut: string, handler: () => void): Promise<void> {
    const svc = await getTauriService();
    return svc.registerGlobalShortcut(shortcut, handler);
  }

  async unregisterGlobalShortcut(shortcut: string): Promise<void> {
    const svc = await getTauriService();
    return svc.unregisterGlobalShortcut(shortcut);
  }

  async isGlobalShortcutRegistered(shortcut: string): Promise<boolean> {
    const svc = await getTauriService();
    return svc.isGlobalShortcutRegistered(shortcut);
  }

  async checkFFmpeg(): Promise<{ installed: boolean; version?: string }> {
    const svc = await getTauriService();
    return svc.checkFFmpeg();
  }
}

export function createTauriPlatform(): Platform {
  return {
    runtime: 'tauri',
    fs: new TauriFsAdapter(),
    dialog: new TauriDialogAdapter(),
    notification: new TauriNotificationAdapter(),
    window: new TauriWindowAdapter(),
    path: new TauriPathAdapter(),
    shell: new TauriShellAdapter(),
  };
}
