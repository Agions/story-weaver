/**
 * Platform Adapter 单元测试
 */

import {
  isTauri,
  getPlatform,
  __resetPlatformForTesting,
  __setPlatformForTesting,
} from '@/core/platform';
import { createMockPlatform } from '@/core/platform/__mocks__';

describe('Platform Adapter', () => {
  beforeEach(() => {
    __resetPlatformForTesting();
  });

  describe('isTauri', () => {
    it('returns false in jsdom (no window.__TAURI__)', () => {
      expect(isTauri()).toBe(false);
    });

    it('returns true when window.__TAURI__ is present', () => {
      (window as any).__TAURI__ = { invoke: jest.fn() };
      try {
        expect(isTauri()).toBe(true);
      } finally {
        delete (window as any).__TAURI__;
      }
    });

    it('returns true when window.__TAURI_INTERNALS__ is present (Tauri 2.x)', () => {
      (window as any).__TAURI_INTERNALS__ = {};
      try {
        expect(isTauri()).toBe(true);
      } finally {
        delete (window as any).__TAURI_INTERNALS__;
      }
    });
  });

  describe('getPlatform', () => {
    it('returns web platform in browser mode (default)', () => {
      const p = getPlatform();
      expect(p.runtime).toBe('web');
      expect(p.fs).toBeDefined();
      expect(p.dialog).toBeDefined();
      expect(p.notification).toBeDefined();
      expect(p.window).toBeDefined();
      expect(p.path).toBeDefined();
      expect(p.shell).toBeDefined();
    });

    it('returns same instance (singleton)', () => {
      const a = getPlatform();
      const b = getPlatform();
      expect(a).toBe(b);
    });

    it('returns tauri platform when __TAURI__ is present', () => {
      // 这个测试需要先注入 flag
      (window as any).__TAURI_INTERNALS__ = {};
      __resetPlatformForTesting();
      try {
        const p = getPlatform();
        expect(p.runtime).toBe('tauri');
      } finally {
        delete (window as any).__TAURI_INTERNALS__;
        __resetPlatformForTesting();
      }
    });
  });

  describe('createMockPlatform', () => {
    it('creates a platform with all methods', () => {
      const mock = createMockPlatform();
      expect(mock.runtime).toBe('web');
      expect(typeof mock.fs.readText).toBe('function');
      expect(typeof mock.dialog.openFile).toBe('function');
      expect(typeof mock.notification.send).toBe('function');
    });

    it('allows overriding specific methods', async () => {
      const mock = createMockPlatform({
        fs: { readText: jest.fn().mockResolvedValue('mocked content') },
      });
      const content = await mock.fs.readText('/anywhere');
      expect(content).toBe('mocked content');
    });

    it('respects custom runtime', () => {
      const mock = createMockPlatform({ runtime: 'tauri' });
      expect(mock.runtime).toBe('tauri');
    });
  });

  describe('__setPlatformForTesting', () => {
    it('replaces the platform instance', async () => {
      const mock = createMockPlatform({
        fs: { readText: jest.fn().mockResolvedValue('injected') },
      });
      __setPlatformForTesting(mock);

      const { platform } = await import('@/core/platform');
      const content = await platform.fs.readText('/x');
      expect(content).toBe('injected');
    });
  });

  describe('Web Platform fs', () => {
    it('stores and reads files in memory', async () => {
      __setPlatformForTesting(
        createMockPlatform({
          fs: {
            writeText: jest.fn(async (path: string, c: string) => {
              // 简单内存实现
              (globalThis as any).__memFs = (globalThis as any).__memFs ?? new Map();
              (globalThis as any).__memFs.set(path, c);
            }),
            readText: jest.fn(async (path: string) => {
              (globalThis as any).__memFs = (globalThis as any).__memFs ?? new Map();
              return (globalThis as any).__memFs.get(path) ?? '';
            }),
            fileExists: jest.fn(async (path: string) => {
              (globalThis as any).__memFs = (globalThis as any).__memFs ?? new Map();
              return (globalThis as any).__memFs.has(path);
            }),
          },
        })
      );

      const { platform } = await import('@/core/platform');
      await platform.fs.writeText('/test.txt', 'hello world');
      expect(await platform.fs.fileExists('/test.txt')).toBe(true);
      expect(await platform.fs.readText('/test.txt')).toBe('hello world');
    });
  });
});
