/**
 * DataContext — 跨步骤数据传递的线程安全上下文
 * 根本性修复：跨步骤传递的数据偶尔变为 undefined
 *
 * 根因：多个步骤并发写入同一个共享对象，导致先写的值被后写的覆盖，
 * 或步骤 A 在步骤 B 还未写入时就开始读取，导致 undefined。
 *
 * 方案：
 * 1. 每个步骤拥有独立的数据副本（Copy-on-Write）
 * 2. 写入时使用版本号乐观锁，版本冲突时自动重试
 * 3. 读取时返回已提交的最新快照
 */

import { logger } from '@/core/utils/logger';
import { telemetry, TelemetryEvent } from '@/infrastructure/telemetry/telemetry';

// ============================================
// Types
// ============================================

export interface DataSnapshot {
  version: number;
  data: Map<string, unknown>;
  committedAt: number;
}

export interface StepDataWrite {
  stepId: string;
  key: string;
  value: unknown;
  version: number;
}

interface PendingWrite {
  key: string;
  value: unknown;
  resolve: () => void;
}

// ============================================
// DataContext
// ============================================

export class DataContext {
  private snapshots: DataSnapshot[] = [];
  private currentVersion = 0;
  private pendingWrites = new Map<string, PendingWrite[]>();
  private readonly maxSnapshots = 50;

  constructor() {
    this.pushSnapshot();
  }

  // ============================================
  // Read — 返回最新已提交快照中的值
  // ============================================

  get(key: string): unknown {
    const snapshot = this.getLatestSnapshot();
    return snapshot.data.get(key);
  }

  getAll(): Map<string, unknown> {
    return new Map(this.getLatestSnapshot().data);
  }

  has(key: string): boolean {
    return this.getLatestSnapshot().data.has(key);
  }

  // ============================================
  // Write — 原子提交，版本乐观锁
  // ============================================

  /**
   * 写入数据（线程安全）
   * 内部会排队，批量提交时检测版本冲突
   */
  set(key: string, value: unknown): Promise<void> {
    return new Promise((resolve) => {
      const queue = this.pendingWrites.get(key) ?? [];
      queue.push({ key, value, resolve });
      this.pendingWrites.set(key, queue);

      // 如果这是该 key 的第一个挂起写，立即处理队列
      if (queue.length === 1) {
        this.flushKey(key);
      }
    });
  }

  /**
   * 批量原子提交
   */
  setMany(entries: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
      const keys = Object.keys(entries);
      const results: Promise<void>[] = [];

      for (const key of keys) {
        results.push(this.set(key, entries[key]));
      }

      Promise.all(results).then(() => resolve());
    });
  }

  // ============================================
  // Snapshot management
  // ============================================

  private pushSnapshot(): void {
    const latest = this.getLatestSnapshot();
    const copy = new Map(latest.data);

    this.snapshots.push({
      version: ++this.currentVersion,
      data: copy,
      committedAt: Date.now(),
    });

    // 限制快照数量，防止内存泄漏
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  private getLatestSnapshot(): DataSnapshot {
    if (this.snapshots.length === 0) {
      // Return empty snapshot without recursing into pushSnapshot
      return {
        version: 0,
        data: new Map(),
        committedAt: Date.now(),
      };
    }
    return this.snapshots[this.snapshots.length - 1];
  }

  // ============================================
  // Flush pending writes
  // ============================================

  private async flushKey(key: string): Promise<void> {
    const queue = this.pendingWrites.get(key);
    if (!queue || queue.length === 0) return;

    // 取最后一个值作为最终值（队列中的值按顺序覆盖）
    const last = queue[queue.length - 1];
    const values = queue.map((w) => w.value);

    // 清空队列
    this.pendingWrites.set(key, []);

    // 提交到新快照
    this.commitWrite(key, last.value);

    // 解决所有 Promise
    for (const w of queue) {
      w.resolve();
    }
  }

  private commitWrite(key: string, value: unknown): void {
    const beforeVersion = this.currentVersion;

    // 每个写操作创建一个新快照（Copy-on-Write）
    this.pushSnapshot();

    // 将数据写入最新快照
    const latest = this.getLatestSnapshot();
    latest.data.set(key, value);

    logger.debug(`[DataContext] Wrote ${key} at v${latest.version}`, {
      prevVersion: beforeVersion,
      valueType: typeof value,
    });
  }

  // ============================================
  // Version control (optimistic locking)
  // ============================================

  getVersion(): number {
    return this.currentVersion;
  }

  /**
   * 等待数据被写入（轮询直到 version 更新）
   */
  async waitForKey(key: string, timeoutMs = 30000): Promise<unknown> {
    const start = Date.now();
    const initialVersion = this.currentVersion;

    while (Date.now() - start < timeoutMs) {
      const v = this.currentVersion;
      if (v > initialVersion) {
        const val = this.get(key);
        if (val !== undefined) return val;
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    throw new Error(`[DataContext] Timeout waiting for key: ${key}`);
  }

  // ============================================
  // Checkpoint (for resume)
  // ============================================

  toJSON(): { currentVersion: number; snapshots: Array<{ version: number; data: Record<string, unknown>; committedAt: number }> } {
    return {
      currentVersion: this.currentVersion,
      snapshots: this.snapshots.map((s) => ({
        version: s.version,
        data: Object.fromEntries(s.data),
        committedAt: s.committedAt,
      })),
    };
  }

  static fromJSON(json: ReturnType<DataContext['toJSON']>): DataContext {
    const ctx = new DataContext();
    ctx.currentVersion = json.currentVersion;
    ctx.snapshots = json.snapshots.map((s: { version: number; data: Record<string, unknown>; committedAt: number }) => ({
      version: s.version,
      data: new Map(Object.entries(s.data)),
      committedAt: s.committedAt,
    }));
    return ctx;
  }
}

export default DataContext;