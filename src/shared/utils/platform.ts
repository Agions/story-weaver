/**
 * frame-fab Shared Utils - Platform Utilities
 */

export type Platform = 'web' | 'desktop';

const getPlatform = (): Platform => {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return 'desktop';
  }
  return 'web';
};

export const platform = getPlatform();
export const isWeb = platform === 'web';
export const isDesktop = platform === 'desktop';
export const isMobile = false;
export const isIOS = false;
export const isAndroid = false;

export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

class WebStorageAdapter implements StorageAdapter {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

export const getStorageAdapter = (): StorageAdapter => new WebStorageAdapter();

export const platformUtils = {
  platform,
  isWeb,
  isDesktop,
  isMobile,
  isIOS,
  isAndroid,
  storage: getStorageAdapter(),
};
