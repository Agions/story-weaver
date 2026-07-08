/**
 * Pipeline Service 门面
 *
 * 把原 508 行单文件拆为：
 *   - pipeline-runner.ts          PipelineRunner 类（状态机 + run 循环）
 *   - pipeline-step-factories.ts  7 个步骤工厂（用 createGenericStep 消除重复）
 *
 * 本文件作为对外门面：
 *   - 顶层 export PipelineService 类（CRUD over Map<string, PipelineRunner>）
 *   - 保留 7 个步骤工厂具名导出 + PIPELINE_STEP_IDS + createDefaultPipeline
 *     + getPipelineService + 类型 re-export
 *   - 完整保留原 API 表面
 *
 * 业务行为零变化：
 *   - 状态机转移条件（idle/running/paused/completed/error）1:1
 *   - 回调触发顺序与时机（onStepChange → onProgress → onComplete/onError）1:1
 *   - log level 映射（info/warn/error → logger.info/warn/error）1:1
 *   - 取消时 status 回到 idle（测试 expect ['idle','completed']）
 *   - 暂停/恢复通过 pauseResolve 解阻塞
 */

import { v4 as uuidv4 } from 'uuid';

import { PipelineRunner } from './pipeline-runner';
import {
  createImportStep,
  createAnalysisStep,
  createScriptStep,
  createStoryboardStep,
  createCharacterStep,
  createRenderStep,
  createExportStep,
  PIPELINE_STEP_IDS,
} from './pipeline-step-factories';
import type {
  PipelineCallbacks as PipelineRunCallbacks,
  PipelineResult,
  PipelineStep,
  PipelineStatus,
  PipelineConfig,
} from './pipeline.types';

// 顶层类型 re-export（保持外部 import 路径稳定）
export type {
  PipelineStepId,
  PipelineStatus,
  PipelineStep,
  PipelineContext,
  PipelineResult,
  PipelineStepResult,
  PipelineConfig,
} from './pipeline.types';

// 步骤工厂 + 默认 7 步 ID 一并 re-export（外部 import 路径不变）
export {
  createImportStep,
  createAnalysisStep,
  createScriptStep,
  createStoryboardStep,
  createCharacterStep,
  createRenderStep,
  createExportStep,
  PIPELINE_STEP_IDS,
};

/**
 * PipelineService — Map<workflowId, PipelineRunner> 管理
 *
 * 历史命名沿用：内部保存的是 PipelineRunner 实例，但对外仍以
 * "Pipeline" 类型呈现——避免破坏已有调用方 `service.getPipeline(id)`。
 */
export class PipelineService {
  private workflows: Map<string, PipelineRunner> = new Map();

  /** 创建新流程（workflowId 可由调用方提供，否则自动生成 uuid） */
  createPipeline(
    config: Omit<PipelineConfig, 'onStepChange' | 'onProgress' | 'onComplete' | 'onError'>
  ): string {
    const workflowId = config.workflowId || uuidv4();
    const pipeline = new PipelineRunner(workflowId, config);
    this.workflows.set(workflowId, pipeline);
    return workflowId;
  }

  /** 获取流程实例 */
  getPipeline(workflowId: string): PipelineRunner | undefined {
    return this.workflows.get(workflowId);
  }

  /** 启动流程 */
  async runPipeline(
    workflowId: string,
    initialInput: unknown,
    callbacks?: PipelineRunCallbacks
  ): Promise<PipelineResult> {
    const pipeline = this.workflows.get(workflowId);
    if (!pipeline) {
      throw new Error(`Pipeline ${workflowId} not found`);
    }
    return pipeline.run(initialInput, callbacks);
  }

  /** 暂停流程（不存在返回 false） */
  pausePipeline(workflowId: string): boolean {
    const pipeline = this.workflows.get(workflowId);
    if (pipeline) {
      pipeline.pause();
      return true;
    }
    return false;
  }

  /** 恢复流程 */
  resumePipeline(workflowId: string): boolean {
    const pipeline = this.workflows.get(workflowId);
    if (pipeline) {
      pipeline.resume();
      return true;
    }
    return false;
  }

  /** 取消流程 */
  cancelPipeline(workflowId: string): boolean {
    const pipeline = this.workflows.get(workflowId);
    if (pipeline) {
      pipeline.cancel();
      return true;
    }
    return false;
  }

  /** 获取流程当前状态 */
  getPipelineStatus(workflowId: string): PipelineStatus | undefined {
    return this.workflows.get(workflowId)?.status;
  }

  /** 删除流程 */
  deletePipeline(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  /** 获取所有流程 */
  getAllPipelines(): PipelineRunner[] {
    return Array.from(this.workflows.values());
  }
}

/**
 * 创建默认 7 步流水线（import → analysis → script → storyboard →
 * character → render → export）。7 个步骤工厂统一拼装。
 */
export function createDefaultPipeline(config?: {
  onStepChange?: (step: PipelineStep) => void;
  onProgress?: (stepId: string, progress: number, message?: string) => void;
}): PipelineStep[] {
  return [
    createImportStep({ onProgress: (p, m) => config?.onProgress?.('import', p, m) }),
    createAnalysisStep({ onProgress: (p, m) => config?.onProgress?.('analysis', p, m) }),
    createScriptStep({ onProgress: (p, m) => config?.onProgress?.('script', p, m) }),
    createStoryboardStep({ onProgress: (p, m) => config?.onProgress?.('storyboard', p, m) }),
    createCharacterStep({ onProgress: (p, m) => config?.onProgress?.('character', p, m) }),
    createRenderStep({ onProgress: (p, m) => config?.onProgress?.('render', p, m) }),
    createExportStep({ onProgress: (p, m) => config?.onProgress?.('export', p, m) }),
  ];
}

// ========== Singleton Export ==========

let pipelineServiceInstance: PipelineService | null = null;

export function getPipelineService(): PipelineService {
  if (!pipelineServiceInstance) {
    pipelineServiceInstance = new PipelineService();
  }
  return pipelineServiceInstance;
}

export default PipelineService;
