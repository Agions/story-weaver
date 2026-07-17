/**
 * Pipeline 中间件（Logger + Metrics）
 */
import { logger } from '@/core/utils/logger';

import type { PipelineMiddleware } from './pipeline-engine-types';

/* eslint-disable @typescript-eslint/naming-convention */

/** 日志中间件 */
export const LoggerMiddleware: PipelineMiddleware = {
  name: 'logger',
  onStepStart: (stepId) => logger.info(`[Pipeline:Step] Starting: ${stepId}`),
  onStepComplete: (stepId) => logger.info(`[Pipeline:Step] Completed: ${stepId}`),
  onStepError: (stepId, error) => logger.error(`[Pipeline:Step] Error in ${stepId}:`, error),
  onPipelineStart: () => {
    resetMetrics();
    logger.info('[Pipeline] Pipeline started');
  },
  onPipelineComplete: () => logger.info('[Pipeline] Pipeline completed'),
  onPipelineError: (error) => logger.error('[Pipeline] Pipeline error:', error),
};

/** Pipeline 指标（模块级单例） */
interface FrameFabMetrics {
  steps: Record<string, { completedAt: number; success: boolean }>;
  completedAt?: number;
}

let pipelineMetrics: FrameFabMetrics = { steps: {} };

export const getMetrics = (): Readonly<FrameFabMetrics> => Object.freeze({ ...pipelineMetrics });
export const resetMetrics = (): void => {
  pipelineMetrics = { steps: {} };
};

/** 指标中间件 */
export const MetricsMiddleware: PipelineMiddleware = {
  name: 'metrics',
  onStepComplete: (stepId) => {
    pipelineMetrics.steps[stepId] = { completedAt: Date.now(), success: true };
  },
  onPipelineComplete: () => {
    pipelineMetrics.completedAt = Date.now();
  },
};

/* eslint-enable @typescript-eslint/naming-convention */