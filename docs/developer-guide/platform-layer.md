---
title: 平台适配层
description: frame-fab 如何让业务代码在 Tauri 桌面端和 Web 浏览器之间无缝切换
---

# 平台适配层 (Platform Adapter)

frame-fab 是一个**桌面优先**的应用,但开发时常常需要在 Web 浏览器中调试。本章解释 Platform Adapter 是如何解耦业务代码与运行时环境的。

## 问题背景

在 v2.x 之前,业务代码常常这样写:

```typescript
// ❌ 紧耦合:无法在 Web 模式下运行
import { invoke } from '@tauri-apps/api/core';

export async function readProject(path: string) {
  return await invoke('plugin:fs|read_file', { path });
}
```

问题:

- **Web dev 模式崩溃** — `invoke` 在浏览器中不存在,会抛 `not a function`
- **测试困难** — 必须 mock 整个 Tauri runtime
- **单平台锁定** — 想做 Cloud 部署或 VSCode 扩展时,需要重写一遍

## Platform Adapter 设计

从 v3.0 开始,所有与运行时的交互都经过 `core/platform/` 抽象层:

```
┌─────────────────────────────────────┐
│  业务代码 (features/*, pages/*)     │  ← 调用 platform.xxx
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  core/platform/ (统一接口)          │  ← interface Platform
│  ├─ fs     │ dialog  │ notification│
│  ├─ window │ shell   │ event       │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
┌──────────┐    ┌──────────┐
│ Tauri    │    │ Web      │
│ Adapter  │    │ Adapter  │  ← 浏览器降级实现
└──────────┘    └──────────┘
```

## 核心接口

```typescript
// src/core/platform/index.ts

export interface Platform {
  /** 文件系统 */
  fs: FsAdapter;

  /** 操作系统对话框 */
  dialog: DialogAdapter;

  /** 桌面通知 */
  notification: NotificationAdapter;

  /** 窗口控制 */
  window: WindowAdapter;

  /** 外部进程 / URL 打开 */
  shell: ShellAdapter;

  /** 事件总线 */
  event: EventAdapter;

  /** 当前平台标识 */
  readonly runtime: 'tauri' | 'web' | 'unknown';
}

export const platform: Platform = isTauri() ? createTauriPlatform() : createWebPlatform();
```

## 各适配器职责

### FsAdapter

```typescript
export interface FsAdapter {
  read(path: string, options?: ReadOptions): Promise<Uint8Array>;
  write(path: string, data: Uint8Array | string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  remove(path: string, options?: RemoveOptions): Promise<void>;
  readDir(path: string): Promise<DirEntry[]>;
  watch(path: string, callback: WatchCallback): Promise<UnwatchFn>;
}
```

| 方法     | Tauri                | Web (降级)           |
| -------- | -------------------- | -------------------- |
| `read`   | `tauri.fs.readFile`  | `fetch()` (沙箱 URL) |
| `write`  | `tauri.fs.writeFile` | 内存 Map / IndexedDB |
| `exists` | `tauri.fs.exists`    | 内存 Map             |
| `watch`  | `tauri.fs.watch`     | `MutationObserver`   |

### DialogAdapter

| 方法      | Tauri              | Web (降级)              |
| --------- | ------------------ | ----------------------- |
| `open`    | 系统原生文件选择器 | `<input type="file">`   |
| `save`    | 系统保存对话框     | 触发下载                |
| `message` | 系统消息框         | `alert()` + `confirm()` |

### WindowAdapter

Tauri 完整支持;Web 用 `window.opener` / `window.postMessage` 模拟。

## 检测当前平台

```typescript
import { platform } from '@/core/platform';

if (platform.runtime === 'tauri') {
  // 仅 Tauri 桌面端功能
  await platform.notification.send({ title: '导出完成' });
}
```

## 在业务代码中使用

```typescript
// src/features/script/services/script-import.service.ts

import { platform } from '@/core/platform';

export class ScriptImportService {
  async importFile(path: string): Promise<Script> {
    // ✅ 不再直接调用 Tauri API
    const data = await platform.fs.read(path, { encoding: 'utf-8' });
    return this.parseScript(data as string);
  }

  async pickAndImport(): Promise<Script | null> {
    // ✅ 跨平台: Tauri = 原生对话框, Web = <input>
    const picked = await platform.dialog.open({
      multiple: false,
      filters: [{ name: 'Text', extensions: ['txt', 'md'] }],
    });
    if (!picked) return null;
    return this.importFile(picked.path);
  }
}
```

## 测试 Mock

测试 Platform 行为从未如此简单:

```typescript
// src/__tests__/features/script/script-import.service.test.ts

import { createMockPlatform } from '@/core/platform/__mocks__';
import { ScriptImportService } from '@/features/script/services/script-import.service';

describe('ScriptImportService', () => {
  it('imports a text file', async () => {
    const mockPlatform = createMockPlatform({
      fs: { read: jest.fn().mockResolvedValue('hello world') },
    });

    const service = new ScriptImportService(mockPlatform);
    const script = await service.importFile('/mock/path.txt');

    expect(script.content).toBe('hello world');
  });
});
```

## 跨平台兼容性矩阵

| 能力       | Tauri (桌面) | Web (浏览器)        | 备注                       |
| ---------- | ------------ | ------------------- | -------------------------- |
| 文件读取   | ✅ 原生      | ⚠️ 沙箱 URL / 拖拽  | Web 仅限用户主动选择的文件 |
| 文件写入   | ✅ 原生      | ⚠️ IndexedDB / 下载 | 持久化能力有限             |
| 系统通知   | ✅ 原生      | ⚠️ Notification API | 需用户授权                 |
| 全局快捷键 | ✅ 原生      | ❌ 不支持           | 仅桌面                     |
| 系统托盘   | ✅ 原生      | ❌ 不支持           | 仅桌面                     |
| 窗口控制   | ✅ 完整      | ⚠️ 标签页           | Web 仅开新标签             |

## 迁移指南

### 步骤 1: 识别 Tauri 调用

```bash
# 找出所有直接使用 Tauri API 的文件
rg "from '@tauri-apps" src/
```

### 步骤 2: 替换为 Platform 调用

```diff
- import { invoke } from '@tauri-apps/api/core';
- import { open } from '@tauri-apps/plugin-dialog';
+ import { platform } from '@/core/platform';

- const file = await open({ multiple: false });
+ const file = await platform.dialog.open({ multiple: false });
```

### 步骤 3: 业务代码不动

业务代码已经通过 Service 层封装,只需 Service 内部使用 Platform。组件层不变。

## 未来扩展

Platform Adapter 让 frame-fab 拥有了"一次实现,多端运行"的能力:

- **🖥️ Tauri 桌面** — 主力平台,完整功能
- **🌐 Web Demo** — 在线试用版,可在 Vercel 部署
- **📱 移动端 (Tauri Mobile)** — iOS/Android 实验中
- **🧩 VSCode 扩展** — 复用 web adapter

## 相关资源

- [Tauri API 文档](https://tauri.app/v1/api/js/)
- [ADR-0003: Platform Adapter 决策](/adr/0003-platform-adapter.md)
- [架构概览](/developer-guide/architecture)
