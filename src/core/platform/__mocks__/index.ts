/**
 * Platform Mock 工具
 *
 * 用于单元测试, 一行 mock 整个 platform 抽象层。
 *
 * @example
 * ```typescript
 * import { createMockPlatform } from '@/core/platform/__mocks__';
 * import { __setPlatformForTesting } from '@/core/platform';
 *
 * __setPlatformForTesting(createMockPlatform({
 *   fs: { readText: jest.fn().mockResolvedValue('hello') },
 * }));
 * ```
 */

import type {
  DirInfo,
  OpenFileOptions,
  SaveFileOptions,
} from '@/infrastructure/tauri-bridge/commands.types';

import type { Platform, PlatformRuntime } from '../index';

/**
 * Deep partial mock, 让测试只关心关心的方法
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (...args: any[]) => any
    ? ReturnType<T[P]> extends Promise<infer R>
      ? jest.Mock<Promise<R>, Parameters<T[P]>>
      : jest.Mock<ReturnType<T[P]>, Parameters<T[P]>>
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

export interface MockPlatformOptions {
  runtime?: PlatformRuntime;
  fs?: DeepPartial<Platform['fs']>;
  dialog?: DeepPartial<Platform['dialog']>;
  notification?: DeepPartial<Platform['notification']>;
  window?: DeepPartial<Platform['window']>;
  path?: DeepPartial<Platform['path']>;
  shell?: DeepPartial<Platform['shell']>;
}

const noopAsync = async () => {};
const noopFn = () => {};

export function createMockPlatform(opts: MockPlatformOptions = {}): Platform {
  return {
    runtime: opts.runtime ?? 'web',
    fs: {
      readText: opts.fs?.readText ?? jest.fn().mockResolvedValue(''),
      writeText: opts.fs?.writeText ?? jest.fn().mockResolvedValue(undefined),
      fileExists: opts.fs?.fileExists ?? jest.fn().mockResolvedValue(true),
      createDir: opts.fs?.createDir ?? jest.fn().mockResolvedValue(undefined),
      remove: opts.fs?.remove ?? jest.fn().mockResolvedValue(undefined),
      listDir: opts.fs?.listDir ?? jest.fn().mockResolvedValue([] as DirInfo[]),
    },
    dialog: {
      openFile: opts.dialog?.openFile ?? jest.fn().mockResolvedValue(null),
      saveFile: opts.dialog?.saveFile ?? jest.fn().mockResolvedValue(null),
      showMessage: opts.dialog?.showMessage ?? jest.fn().mockResolvedValue(undefined),
      showConfirm: opts.dialog?.showConfirm ?? jest.fn().mockResolvedValue(true),
      showAsk: opts.dialog?.showAsk ?? jest.fn().mockResolvedValue(true),
    },
    notification: {
      send: opts.notification?.send ?? jest.fn().mockResolvedValue(undefined),
    },
    window: {
      minimize: opts.window?.minimize ?? jest.fn().mockResolvedValue(undefined),
      toggleMaximize: opts.window?.toggleMaximize ?? jest.fn().mockResolvedValue(undefined),
      close: opts.window?.close ?? jest.fn().mockResolvedValue(undefined),
      setTitle: opts.window?.setTitle ?? jest.fn().mockResolvedValue(undefined),
      setFullscreen: opts.window?.setFullscreen ?? jest.fn().mockResolvedValue(undefined),
      setAlwaysOnTop: opts.window?.setAlwaysOnTop ?? jest.fn().mockResolvedValue(undefined),
      show: opts.window?.show ?? jest.fn().mockResolvedValue(undefined),
      hide: opts.window?.hide ?? jest.fn().mockResolvedValue(undefined),
    },
    path: {
      getAppDir: opts.path?.getAppDir ?? jest.fn().mockResolvedValue('/mock/app'),
      getAppConfigDir: opts.path?.getAppConfigDir ?? jest.fn().mockResolvedValue('/mock/config'),
      getAppDataDir: opts.path?.getAppDataDir ?? jest.fn().mockResolvedValue('/mock/data'),
      getDocumentDir: opts.path?.getDocumentDir ?? jest.fn().mockResolvedValue('/mock/docs'),
      getVideoDir: opts.path?.getVideoDir ?? jest.fn().mockResolvedValue('/mock/videos'),
      getDownloadDir: opts.path?.getDownloadDir ?? jest.fn().mockResolvedValue('/mock/downloads'),
    },
    shell: {
      registerGlobalShortcut:
        opts.shell?.registerGlobalShortcut ?? jest.fn().mockResolvedValue(undefined),
      unregisterGlobalShortcut:
        opts.shell?.unregisterGlobalShortcut ?? jest.fn().mockResolvedValue(undefined),
      isGlobalShortcutRegistered:
        opts.shell?.isGlobalShortcutRegistered ?? jest.fn().mockResolvedValue(false),
      checkFFmpeg:
        opts.shell?.checkFFmpeg ??
        jest.fn().mockResolvedValue({ installed: true, version: '6.0-mock' }),
    },
  } as Platform;
}

// 静默 unused 警告
void noopAsync;
void noopFn;
