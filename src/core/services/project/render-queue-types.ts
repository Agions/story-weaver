/**
 * 渲染队列共享类型与常量
 * @module core/services/project/render-queue-types
 */

export type RenderJobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type RenderLogLevel = 'info' | 'warning' | 'error';

/** 单帧渲染任务 */
export interface FrameRenderJob {
  id: string;
  frameId: string;
  frameTitle: string;
  prompt: string;
  model: 'seedream-5.0' | 'kling-1.6' | 'vidu-2.0';
  status: RenderJobStatus;
  progress: number;
  retries: number;
  maxRetries: number;
  projectId?: string;
  imageUrl?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

/** 渲染日志 */
export interface RenderLog {
  id: string;
  jobId?: string;
  level: RenderLogLevel;
  message: string;
  timestamp: string;
}

/** 队列完整状态（与原 file-private RenderQueueState 字节级一致） */
export interface RenderQueueState {
  jobs: FrameRenderJob[];
  logs: RenderLog[];
  isRunning: boolean;
  isPaused: boolean;
}

/** 状态订阅回调签名 */
export type StateListener = (state: RenderQueueState) => void;

/** 日志最大保留条数（与原 `.slice(0, 500)` 字节级一致） */
export const MAX_LOG_COUNT = 500;

/** 进度点间隔 ms（与原 `await sleep(120)` 字节级一致） */
export const TICK_INTERVAL_MS = 120;

/** 进度点位（与原 `[20, 45, 70]` 字节级一致） */
export const TICK_PROGRESS_POINTS = [20, 45, 70] as const;

/** 进度点位起始（与原 `progress: 5` 字节级一致） */
export const JOB_START_PROGRESS = 5;

/** 占位图默认尺寸（与原 SVG width/height 字节级一致） */
export const FALLBACK_IMAGE_SIZE = 1024;

/** 占位图字号 */
export const FALLBACK_IMAGE_FONT_SIZE = 46;

/** 创建初始空状态（与原构造默认 state 字节级一致） */
export function createInitialState(): RenderQueueState {
  return {
    jobs: [],
    logs: [],
    isRunning: false,
    isPaused: false,
  };
}
