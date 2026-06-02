/**
 * TemporaryFileManager — 临时文件管理器
 * 根本性修复：视频合成后临时文件未清理
 * 所有临时文件必须通过此管理器注册，函数退出时自动清理
 */

import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { glob } from 'glob';

import { logger } from '@/core/utils/logger';

interface TrackedFile {
  path: string;
  createdAt: number;
  size?: number;
}

// ============================================
// Temporary File Manager
// ============================================

class TemporaryFileManager {
  private static instance: TemporaryFileManager;
  private trackedFiles = new Map<string, TrackedFile>();
  private tempDir: string;
  private autoCleanupEnabled: boolean = true;
  /** 保留期（ms），默认 5 分钟 */
  private maxAge: number = 5 * 60 * 1000;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  private constructor(tempDir: string = '/tmp/frame-forge') {
    this.tempDir = tempDir;
    this.startAutoCleanup();
  }

  static getInstance(tempDir?: string): TemporaryFileManager {
    if (!TemporaryFileManager.instance) {
      TemporaryFileManager.instance = new TemporaryFileManager(tempDir);
    }
    return TemporaryFileManager.instance;
  }

  // ============================================
  // Registration
  // ============================================

  /**
   * 注册一个临时文件路径
   * 推荐做法：生成临时文件后立即注册，函数结束时调用 cleanup()
   */
  register(filePath: string, size?: number): string {
    this.trackedFiles.set(filePath, {
      path: filePath,
      createdAt: Date.now(),
      size,
    });
    logger.debug(`[TempFile] Registered: ${filePath}`);
    return filePath;
  }

  /**
   * 注册多个临时文件（批量操作）
   */
  registerMany(filePaths: string[]): void {
    for (const p of filePaths) this.register(p);
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * 清理单个临时文件（同步删除）
   * @returns true if deleted, false if not tracked or already gone
   */
  async cleanup(filePath: string): Promise<boolean> {
    if (!this.trackedFiles.has(filePath)) {
      // 未注册，尝试直接删除
      try {
        await unlink(filePath);
        logger.debug(`[TempFile] Unregistered file deleted: ${filePath}`);
        return true;
      } catch {
        return false;
      }
    }

    try {
      await unlink(filePath);
      this.trackedFiles.delete(filePath);
      logger.debug(`[TempFile] Cleaned up: ${filePath}`);
      return true;
    } catch (err) {
      logger.warn(`[TempFile] Failed to delete: ${filePath}`, err);
      return false;
    }
  }

  /**
   * 清理所有已注册的临时文件
   * 推荐在视频合成完成后调用
   */
  async cleanupAll(): Promise<{ cleaned: number; failed: number }> {
    let cleaned = 0;
    let failed = 0;

    const entries = Array.from(this.trackedFiles.entries());
    logger.info(`[TempFile] Cleaning up ${entries.length} tracked files`);

    await Promise.allSettled(
      entries.map(async ([path]) => {
        const ok = await this.cleanup(path);
        if (ok) {
          cleaned++;
        } else {
          failed++;
        }
      })
    );

    return { cleaned, failed };
  }

  /**
   * 清理超过 maxAge 的过期文件
   */
  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    const expired: string[] = [];

    for (const [path, info] of this.trackedFiles) {
      if (now - info.createdAt > this.maxAge) {
        expired.push(path);
      }
    }

    let cleaned = 0;
    await Promise.allSettled(
      expired.map(async (path) => {
        const ok = await this.cleanup(path);
        if (ok) cleaned++;
      })
    );

    return cleaned;
  }

  /**
   * 清理残留的临时文件（启动时调用，清理非正常退出遗留的文件）
   */
  async cleanupOrphans(): Promise<number> {
    try {
      const files = await glob(join(this.tempDir, '**/*'), {
        nodir: true,
      });

      let cleaned = 0;
      for (const file of files) {
        if (!this.trackedFiles.has(file)) {
          try {
            await unlink(file);
            cleaned++;
          } catch {
            // ignore
          }
        }
      }

      if (cleaned > 0) {
        logger.info(`[TempFile] Cleaned ${cleaned} orphan files`);
      }
      return cleaned;
    } catch {
      return 0;
    }
  }

  // ============================================
  // Auto Cleanup (background timer)
  // ============================================

  private startAutoCleanup(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired().catch(() => {});
    }, this.maxAge);
  }

  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // ============================================
  // Settings
  // ============================================

  setMaxAge(ms: number): void {
    this.maxAge = ms;
  }

  setEnabled(enabled: boolean): void {
    this.autoCleanupEnabled = enabled;
  }

  getStats(): { tracked: number; oldestAge: number | null } {
    let oldestAge: number | null = null;
    const now = Date.now();

    for (const info of this.trackedFiles.values()) {
      const age = now - info.createdAt;
      if (oldestAge === null || age > oldestAge) {
        oldestAge = age;
      }
    }

    return { tracked: this.trackedFiles.size, oldestAge };
  }
}

// 单例
export const tempFileManager = TemporaryFileManager.getInstance();
export { TemporaryFileManager };
export default tempFileManager;
