/**
 * autoPipelineService — 全自动流水线服务封装
 *
 * 封装 AutoPipelineEngine，提供更简洁的调用接口。
 */

import { createAutoPipelineEngine } from '@/core/autonomous/auto-pipeline-engine';
import type {
  AutoPipelineInput,
  AutoPipelineResult,
  PipelineEventHandler,
  StepConfig,
} from '@/core/autonomous/types/autonomous.types';

// ============================================================================
// Service
// ============================================================================

class AutoPipelineService {
  /**
   * 创建流水线引擎实例
   */
  createEngine(options?: {
    maxReviewRetries?: number;
    reviewModel?: string;
    steps?: StepConfig[];
  }) {
    return createAutoPipelineEngine(options as Parameters<typeof createAutoPipelineEngine>[0]);
  }

  /**
   * 一键启动全自动漫剧制作
   */
  async start(input: AutoPipelineInput): Promise<AutoPipelineResult> {
    const engine = this.createEngine();
    return engine.run(input);
  }

  /**
   * 注册全局事件处理器
   */
  onEvents(handler: PipelineEventHandler): void {
    // 全局事件处理器注册表（可选实现）
  }

  /**
   * 获取当前全局状态
   */
  getGlobalStatus(): {
    isRunning: boolean;
    activeCount: number;
  } {
    return {
      isRunning: false,
      activeCount: 0,
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export const autoPipelineService = new AutoPipelineService();
