/**
 * 渲染队列日志
 * @module core/services/project/render-queue-logger
 *
 * 提取自原 RenderQueueService.addLog + 内部 logs 数组前缀插入。
 * 集中处理"日志生成 + 去重 id + 限长"。
 */

import { MAX_LOG_COUNT, type RenderLog, type RenderLogLevel } from './render-queue-types';

/** 生成日志 id（与原 `log_${Date.now()}_${...}` 字节级一致） */
export function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/** 构造一条日志 */
export function createLog(
  level: RenderLogLevel,
  message: string,
  jobId?: string
): RenderLog {
  return {
    id: generateLogId(),
    jobId,
    level,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 把新日志插入到现有日志数组头部，并按 MAX_LOG_COUNT 截断
 *
 * 行为与原 `[log, ...this.state.logs].slice(0, 500)` 字节级一致。
 */
export function pushLog(logs: RenderLog[], log: RenderLog): RenderLog[] {
  return [log, ...logs].slice(0, MAX_LOG_COUNT);
}
