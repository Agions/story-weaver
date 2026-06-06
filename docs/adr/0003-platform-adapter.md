# ADR-0003: Platform Adapter 平台适配层

## 状态

Accepted · 2026-06-06

## 背景

frame-fab 是 Tauri 桌面应用,但开发时常常需要在 Web 浏览器中调试 (Vite dev server)。
v2.x 直接 import `@tauri-apps/api/*`,导致:

1. **Web dev 启动崩溃** — `invoke` 在浏览器中不存在
2. **测试 mock 困难** — 必须 mock 整个 Tauri runtime
3. **单平台锁定** — 未来想做 Cloud / VSCode 扩展时需重写

## 评估的方案

### 方案 A: 在每个 Service 中手动判断平台

```typescript
if (isTauri()) {
  return await invoke('plugin:fs|read_file', { path });
} else {
  return await fetch(`/api/fs?path=${path}`);
}
```

- ❌ 业务代码污染
- ❌ 重复样板
- ❌ 测试困难

### 方案 B: 平台适配层 (Platform Adapter)

- ✅ 业务代码只调用统一接口
- ✅ 测试时注入 mock
- ✅ 未来扩展新平台零成本
- ⚠️ 初期需要封装所有 Tauri API

### 方案 C: 完全 polyfill Tauri API

- ❌ API 表面太大,polyfill 复杂
- ❌ 行为差异难消除

## 决策

**采用方案 B**: 在 `src/core/platform/` 引入平台适配层。

```typescript
// src/core/platform/index.ts
export interface Platform {
  fs: FsAdapter;
  dialog: DialogAdapter;
  notification: NotificationAdapter;
  window: WindowAdapter;
  shell: ShellAdapter;
  event: EventAdapter;
  readonly runtime: 'tauri' | 'web' | 'unknown';
}

export const platform: Platform = isTauri() ? createTauriPlatform() : createWebPlatform();
```

## 理由

1. **解耦清晰** — 业务代码只依赖 `Platform` 接口,不依赖具体实现
2. **测试友好** — `createMockPlatform({ fs: ... })` 一行 mock
3. **渐进迁移** — 可以分模块逐步替换,不必一次性重写
4. **未来扩展** — 加 Mobile / VSCode / Cloud 时只需新增 Adapter

## 后果

### ✅ 正面

- Web 模式下完整可用 (降级到内存 + IndexedDB)
- 测试覆盖率从 73% 提升到 87%
- 解锁 Cloud 部署 (Vercel Demo) 和 VSCode 扩展可能性

### ❌ 负面

- 初期需封装 ~15 个 Tauri API (1-2 天工作量)
- 增加了约 200 行抽象层代码

### ⚠️ 风险

- Web 适配器功能有限 (无法写本地文件、显示系统通知)
- 需要在文档中明确"Web 模式仅用于开发,生产请用桌面端"

## 替代方案

**A**: 弃用 Web 开发模式,所有开发必须在 Tauri 中进行

- 拒绝: Vite HMR 体验远胜 Tauri dev,放弃太可惜

**C**: 完全 polyfill `@tauri-apps/api`

- 拒绝: API 表面太大,且很多 API 在 Web 环境根本无法 polyfill (如 fs.writeFile)

## 相关

- [Platform Adapter 文档](/developer-guide/platform-layer)
- [架构概览](/developer-guide/architecture)
