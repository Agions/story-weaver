/**
 * 渲染任务队列服务 - Render Queue Service（facade）
 *
 * 历史背景：本文件原为 260 行单类，承担 4 类型 / 状态 / 订阅 / CRUD / 运行循环 /
 * 失败兜底 / 进度点 7 类职责。第 22 轮重构拆为 6 个子模块（types / fallback /
 * logger / subscriber / runner / service），本 facade 保留所有对外公开 API 签名
 * （renderQueueService 单例 + RenderQueueService 类 + 8 个公共方法）以保证
 * 1 个测试文件 + 1 个外部 UI 组件零改动。
 *
 * 拆分思路：
 * 1. 类型 / 常量集中在 types（MAX_LOG_COUNT / TICK_INTERVAL_MS / TICK_PROGRESS_POINTS / JOB_START_PROGRESS / createInitialState）
 * 2. 占位 SVG 图剥离到 fallback（sanitizeForSvg + buildFallbackImage）
 * 3. 日志剥离到 logger（createLog + pushLog 限长）
 * 4. 订阅器剥离到 subscriber（Set + subscribe + notify）
 * 5. 运行循环 / 单任务 / 进度点剥离到 runner（重试 + 失败回退主流程）
 * 6. 类主流程只剩"状态管理 + 路由"——CRUD 改 state + 触发 notify
 */

import { createLog, pushLog } from './render-queue-logger';
import { processRenderJob, runRenderLoop } from './render-queue-runner';
import {
  createInitialState,
  type FrameRenderJob,
  type RenderLogLevel,
  type RenderQueueState,
  type StateListener,
} from './render-queue-types';

// 重导出公共类型，保持 `@/core/services/project/render-queue-service` 一站式导入
export type {
  FrameRenderJob,
  RenderJobStatus,
  RenderLog,
  RenderLogLevel,
  RenderQueueState,
  StateListener,
} from './render-queue-types';

/** 任务 id 生成器（与原 `render_job_${Date.now()}_${index}_${rand}` 字节级一致） */
function generateJobId(index: number): string {
  return `render_job_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 渲染任务队列服务
 *
 * 内部维护：
 *   - state: 完整状态（jobs / logs / isRunning / isPaused）
 *   - listeners: 订阅者集合（新订阅立即用当前 state 触发一次回调）
 */
export class RenderQueueService {
  private state: RenderQueueState = createInitialState();
  private listeners = new Set<StateListener>();

  /** 读取当前完整状态 */
  getState(): RenderQueueState {
    return this.state;
  }

  /**
   * 订阅状态变更
   *
   * 行为与原 `subscribe` 字节级一致：立即用当前 state 触发一次回调。
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 加入渲染任务
   *
   * 行为与原 `enqueue` 字节级一致：每个 job 分配 id + status=pending + progress=0 + retries=0。
   */
  enqueue(
    jobs: Omit<FrameRenderJob, 'id' | 'status' | 'progress' | 'retries' | 'createdAt'>[]
  ): FrameRenderJob[] {
    const now = new Date().toISOString();
    const created = jobs.map((job, index) => ({
      ...job,
      id: generateJobId(index),
      status: 'pending' as const,
      progress: 0,
      retries: 0,
      createdAt: now,
    }));

    this.updateState({ jobs: [...this.state.jobs, ...created] });
    this.appendLog('info', `已加入 ${created.length} 个渲染任务`);
    return created;
  }

  /** 暂停队列 */
  pause(): void {
    this.updateState({ isPaused: true });
    this.appendLog('warning', '队列已暂停，当前任务完成后停止继续处理。');
  }

  /** 恢复队列（若未在跑则启动） */
  resume(): void {
    this.updateState({ isPaused: false });
    this.appendLog('info', '队列已恢复。');
    if (!this.state.isRunning) {
      void this.run();
    }
  }

  /** 清理已完成任务（保留 pending / running / failed） */
  clearCompleted(): void {
    const pendingJobs = this.state.jobs.filter((job) => job.status !== 'completed');
    this.updateState({ jobs: pendingJobs });
  }

  /**
   * 重试任务
   *
   * 行为与原 `retry` 字节级一致：把 job 状态重置为 pending + progress=0 + 清错。
   */
  retry(jobId: string): void {
    const jobs = this.state.jobs.map((job) => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        status: 'pending' as const,
        progress: 0,
        error: undefined,
      };
    });

    this.updateState({ jobs });
    this.appendLog('info', `任务 ${jobId} 已重试`);

    if (!this.state.isRunning && !this.state.isPaused) {
      void this.run();
    }
  }

  /** 启动运行循环（幂等） */
  async run(): Promise<void> {
    if (this.state.isRunning) return;
    this.updateState({ isRunning: true });
    try {
      await runRenderLoop(
        () => this.state,
        (job) => this.processJob(job.id)
      );
    } finally {
      this.updateState({ isRunning: false });
    }
  }

  // ========== 内部 ==========

  /** 内部：单任务处理包装（注入 state 读取 / 写入闭包） */
  private async processJob(jobId: string): Promise<void> {
    const job = this.state.jobs.find((item) => item.id === jobId);
    if (!job) return;
    await processRenderJob(this.state, job, {
      patchJob: (id, patch) => this.patchJob(id, patch),
      isPaused: () => this.state.isPaused,
      updateState: (patch) => this.updateState(patch),
    });
  }

  /** 内部：partial 合并单 job */
  private patchJob(jobId: string, patch: Partial<FrameRenderJob>): void {
    const jobs = this.state.jobs.map((job) => (job.id === jobId ? { ...job, ...patch } : job));
    this.updateState({ jobs });
  }

  /** 内部：追加一条日志（应用 pushLog 限长） */
  private appendLog(level: RenderLogLevel, message: string, jobId?: string): void {
    const log = createLog(level, message, jobId);
    this.updateState({ logs: pushLog(this.state.logs, log) });
  }

  /** 内部：更新 state + 通知订阅者 */
  private updateState(patch: Partial<RenderQueueState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }
}

// 单例 + 默认导出（与原行为一致）
export const renderQueueService = new RenderQueueService();
export default RenderQueueService;
